// 🎯 TIPOS DE NODOS GENÉRICOS PARA WORKFLOWS

/**
 * Tipos de nodos disponibles
 */
export enum NodeType {
  CONVERSATIONAL_COLLECT = 'conversational_collect',
  GPT_TRANSFORM = 'gpt_transform',
  FILTER = 'filter',
  API_CALL = 'api_call',
  CONVERSATIONAL_RESPONSE = 'conversational_response',
  MERCADOPAGO_PAYMENT = 'mercadopago_payment',
  ROUTER = 'router',
  WEBHOOK = 'webhook'
}

/**
 * Operadores para filtros
 */
export enum FilterOperator {
  EQUAL = 'equal',
  NOT_EQUAL = 'not_equal',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_OR_EQUAL = 'greater_or_equal',
  LESS_OR_EQUAL = 'less_or_equal',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IS_EMPTY = 'is_empty',
  NOT_EMPTY = 'not_empty',
  REGEX = 'regex'
}

/**
 * Configuración base de un nodo
 */
export interface BaseNodeConfig {
  id: string;
  name: string;
  description?: string;
}

/**
 * Nodo 1: Recopilar información conversacional
 */
export interface ConversationalCollectConfig extends BaseNodeConfig {
  type: NodeType.CONVERSATIONAL_COLLECT;
  pregunta: string;
  variable: string;
  validacion?: {
    tipo: 'texto' | 'numero' | 'email' | 'telefono' | 'fecha' | 'regex';
    regex?: string;
    mensajeError?: string;
  };
  opciones?: string[]; // Para preguntas de opción múltiple
  esperarRespuesta: boolean;
}

/**
 * Nodo 2: Transformar datos con GPT
 */
export interface GPTTransformConfig extends BaseNodeConfig {
  type: NodeType.GPT_TRANSFORM;
  prompt: string; // Puede incluir variables: {{variable}}
  modelo: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';
  outputVariable: string; // Nombre de la variable donde guardar el resultado
  parseJSON: boolean; // Si debe parsear la respuesta como JSON
  temperature?: number;
  maxTokens?: number;
}

/**
 * Nodo 3: Filtro/Condición
 */
export interface FilterConfig extends BaseNodeConfig {
  type: NodeType.FILTER;
  conditions: Array<{
    field: string; // Puede ser variable: {{variable}}
    operator: FilterOperator;
    value?: any;
  }>;
  logic: 'AND' | 'OR';
  label?: string; // Label para mostrar en la conexión
}

/**
 * Nodo 4: Llamada a API externa
 */
export interface APICallConfig extends BaseNodeConfig {
  type: NodeType.API_CALL;
  endpointId: string; // ID del endpoint configurado
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  params?: Record<string, any>; // Puede incluir variables: {{variable}}
  body?: Record<string, any>;
  headers?: Record<string, string>;
  outputVariable: string;
  arrayPath?: string; // Ruta para extraer array de la respuesta (ej: "data.items")
  timeout?: number;
}

/**
 * Nodo 5: Respuesta conversacional
 */
export interface ConversationalResponseConfig extends BaseNodeConfig {
  type: NodeType.CONVERSATIONAL_RESPONSE;
  mensaje: string; // Puede incluir variables: {{variable}}
  esperarRespuesta: boolean;
  siguienteVariable?: string; // Si espera respuesta, en qué variable guardarla
  formatearLista?: {
    variable: string; // Variable que contiene el array
    template: string; // Template para cada item: "{{index}}. {{nombre}} - ${{precio}}"
  };
}

/**
 * Nodo 6: Generar pago MercadoPago
 */
export interface MercadoPagoPaymentConfig extends BaseNodeConfig {
  type: NodeType.MERCADOPAGO_PAYMENT;
  title: string; // Puede incluir variables: {{variable}}
  amount: string | number; // Puede ser variable: {{precio}} o expresión: {{precio * cantidad}}
  description?: string;
  outputVariable: string; // Variable donde guardar la URL del pago
}

/**
 * Nodo Router: Múltiples salidas
 */
export interface RouterConfig extends BaseNodeConfig {
  type: NodeType.ROUTER;
  // No tiene configuración especial, solo permite múltiples conexiones
}

/**
 * Nodo Webhook: Punto de entrada
 */
export interface WebhookConfig extends BaseNodeConfig {
  type: NodeType.WEBHOOK;
  trigger: 'message' | 'keyword' | 'always';
  keyword?: string; // Si trigger es 'keyword'
}

/**
 * Unión de todos los tipos de configuración
 */
export type NodeConfig =
  | ConversationalCollectConfig
  | GPTTransformConfig
  | FilterConfig
  | APICallConfig
  | ConversationalResponseConfig
  | MercadoPagoPaymentConfig
  | RouterConfig
  | WebhookConfig;

/**
 * Conexión entre nodos
 */
export interface NodeConnection {
  targetNodeId: string;
  filter?: FilterConfig; // Filtro opcional en la conexión
  label?: string;
}

/**
 * Definición completa de un nodo en el workflow
 */
export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  config: NodeConfig;
  connections: NodeConnection[];
}

/**
 * Workflow completo
 */
export interface Workflow {
  _id?: any;
  id: string;
  empresaId: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  trigger: WebhookConfig;
  nodes: WorkflowNode[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: number;
  };
}

/**
 * Sesión de ejecución de workflow
 */
export interface WorkflowSession {
  workflowId: string;
  contactoId: string;
  empresaId: string;
  currentNodeId: string;
  variables: Record<string, any>; // Variables recopiladas durante la ejecución
  startedAt: Date;
  lastActivity: Date;
  completed: boolean;
}

/**
 * Resultado de ejecución de un nodo
 */
export interface NodeExecutionResult {
  success: boolean;
  nextNodeId?: string; // Siguiente nodo a ejecutar
  response?: string; // Respuesta para enviar al usuario (si aplica)
  variables?: Record<string, any>; // Variables actualizadas
  error?: string;
  waitingForInput?: boolean; // Si está esperando input del usuario
}
