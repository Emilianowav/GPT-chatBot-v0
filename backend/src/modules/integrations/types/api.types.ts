// 🔧 Tipos para el módulo de Integraciones
import { ObjectId } from 'mongoose';

// ============================================
// TIPOS PARA APIs CONFIGURABLES
// ============================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ApiType = 'rest' | 'graphql' | 'soap';
export type ApiEstado = 'activo' | 'inactivo' | 'error';
export type AuthType = 'bearer' | 'api_key' | 'oauth2' | 'basic' | 'custom' | 'none';
export type ParameterType = 'string' | 'number' | 'boolean' | 'array' | 'object';
export type BodyType = 'json' | 'form-data' | 'xml' | 'text';
export type ApiKeyLocation = 'header' | 'query' | 'body';

export interface IAuthConfiguration {
  tipo: AuthType;
  configuracion: {
    // Bearer Token
    token?: string;
    headerName?: string;
    
    // API Key
    apiKey?: string;
    apiKeyLocation?: ApiKeyLocation;
    apiKeyName?: string;
    
    // OAuth2
    clientId?: string;
    clientSecret?: string;
    authUrl?: string;
    tokenUrl?: string;
    refreshToken?: string;
    accessToken?: string;
    expiresAt?: Date;
    scope?: string[];
    
    // Basic Auth
    username?: string;
    password?: string;
    
    // Custom headers
    customHeaders?: Record<string, string>;
  };
}

export interface IParameterDefinition {
  nombre: string;
  tipo: ParameterType;
  requerido: boolean;
  descripcion?: string;
  valorPorDefecto?: any;
  validacion?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

export interface IBodyDefinition {
  tipo: BodyType;
  schema?: Record<string, any>;
  ejemplo?: any;
  descripcion?: string;
}

export interface IEndpointParametros {
  path?: IParameterDefinition[];
  query?: IParameterDefinition[];
  body?: IBodyDefinition;
  headers?: Record<string, string>;
}

export interface IRateLimiting {
  habilitado: boolean;
  maxRequests: number;
  ventanaTiempo: number; // En segundos
}

export interface ICache {
  habilitado: boolean;
  ttl: number; // En segundos
  estrategia?: 'simple' | 'lru' | 'lfu';
}

export interface IEndpoint {
  id: string;
  nombre: string;
  descripcion?: string;
  metodo: HttpMethod;
  path: string;
  parametros: IEndpointParametros;
  respuesta?: {
    schema?: Record<string, any>;
    ejemploExito?: any;
    ejemploError?: any;
  };
  mapeo?: {
    entrada?: Record<string, string>;
    salida?: Record<string, string>;
  };
  rateLimiting?: IRateLimiting;
  cache?: ICache;
  timeout?: number;
  activo: boolean;
}

export interface IApiConfiguracion {
  timeout: number;
  reintentos: number;
  reintentarEn: number[];
  rateLimiting?: IRateLimiting;
  webhooks?: Array<{
    evento: 'success' | 'error' | 'timeout';
    url: string;
    metodo: 'POST' | 'PUT';
    headers?: Record<string, string>;
  }>;
}

export interface IApiEstadisticas {
  totalLlamadas: number;
  llamadasExitosas: number;
  llamadasFallidas: number;
  ultimaLlamada?: Date;
  ultimoError?: {
    fecha: Date;
    mensaje: string;
    codigo?: string;
  };
  tiempoPromedioRespuesta: number;
}

// ============================================
// TIPOS PARA INTEGRACIÓN CON CHATBOT
// ============================================

export interface IParametroExtraccion {
  nombre: string;                    // Nombre del parámetro del endpoint
  extraerDe: 'mensaje' | 'fijo';     // De dónde extraer el valor
  valorFijo?: string;                // Valor fijo si extraerDe='fijo'
  regex?: string;                    // Regex para extraer del mensaje
  descripcion?: string;              // Descripción para el usuario
}

export interface IKeywordConfig {
  palabra: string;                   // Palabra clave que activa el endpoint
  endpointId: string;                // ID del endpoint a ejecutar
  descripcion?: string;              // Descripción de qué hace
  extraerParametros: boolean;        // Si debe extraer parámetros del mensaje
  parametrosConfig: IParametroExtraccion[];
  respuestaTemplate: string;         // Template para formatear respuesta
  ejemplos?: string[];               // Ejemplos de uso
}

export interface IChatbotIntegration {
  habilitado: boolean;
  chatbotId: string;                 // ID del chatbot vinculado
  keywords: IKeywordConfig[];
  mensajeAyuda?: string;             // Mensaje de ayuda sobre comandos disponibles
}

// ============================================
// TIPOS PARA LOGS
// ============================================

export type RequestEstado = 'success' | 'error' | 'timeout';

export interface IRequestData {
  metodo: string;
  url: string;
  headers: Record<string, string>;
  parametros?: any;
  body?: any;
  timestamp: Date;
}

export interface IResponseData {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  tiempoRespuesta: number;
  timestamp: Date;
}

export interface IErrorData {
  mensaje: string;
  codigo?: string;
  stack?: string;
}

export interface IRequestContext {
  usuarioId?: ObjectId;
  clienteId?: ObjectId;
  conversacionId?: ObjectId;
  flujoId?: string;
  metadata?: Record<string, any>;
}

// ============================================
// TIPOS PARA INTEGRACIONES NATIVAS
// ============================================

export type IntegrationType = 
  | 'google_calendar' 
  | 'outlook_calendar' 
  | 'google_sheets' 
  | 'zapier' 
  | 'make' 
  | 'hubspot' 
  | 'salesforce'
  | 'custom';

export type IntegrationEstado = 'activo' | 'inactivo' | 'error' | 'configurando';
export type SyncDirection = 'bidirectional' | 'to_external' | 'from_external';

export interface IIntegrationCredenciales {
  // OAuth2
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string[];
  
  // API Keys
  apiKey?: string;
  apiSecret?: string;
  
  // Metadata adicional
  metadata?: Record<string, any>;
}

export interface IIntegrationConfig {
  // Google Calendar
  calendarId?: string;
  timeZone?: string;
  
  // Outlook Calendar
  mailboxId?: string;
  
  // Google Sheets
  spreadsheetId?: string;
  sheetName?: string;
  
  // Zapier/Make
  webhookUrl?: string;
  
  // Configuración general
  syncDirection?: SyncDirection;
  autoSync?: boolean;
  syncInterval?: number;
  ultimoSync?: Date;
  camposMapeados?: Record<string, string>;
  
  // Configuración adicional
  metadata?: Record<string, any>;
}

export interface IIntegrationEstadisticas {
  totalSyncs: number;
  syncsExitosos: number;
  syncsFallidos: number;
  ultimoSync?: Date;
  ultimoError?: {
    fecha: Date;
    mensaje: string;
  };
}

// ============================================
// TIPOS PARA WEBHOOKS
// ============================================

export type WebhookSeguridad = 'none' | 'secret' | 'signature' | 'ip_whitelist';
export type WebhookProcesamiento = 'inmediato' | 'cola' | 'programado';
export type WebhookAccion = 'guardar' | 'ejecutar_flujo' | 'llamar_api' | 'custom';
export type SignatureAlgorithm = 'sha256' | 'sha1' | 'md5';

export interface IWebhookSeguridad {
  tipo: WebhookSeguridad;
  secret?: string;
  signatureHeader?: string;
  signatureAlgorithm?: SignatureAlgorithm;
  ipWhitelist?: string[];
}

export interface IWebhookProcesamiento {
  tipo: WebhookProcesamiento;
  accion: WebhookAccion;
  flujoId?: string;
  apiConfigId?: ObjectId;
  endpointId?: string;
  customHandler?: string;
}

export interface IWebhookTransformacion {
  mapeo: Record<string, string>;
  script?: string;
}

export interface IWebhookRespuesta {
  statusCode: number;
  body: any;
  headers?: Record<string, string>;
}

export interface IWebhookConfiguracion {
  metodosPermitidos: HttpMethod[];
  procesamiento: IWebhookProcesamiento;
  transformacion?: IWebhookTransformacion;
  respuestaPersonalizada?: IWebhookRespuesta;
}

export interface IWebhookEstadisticas {
  totalLlamadas: number;
  llamadasExitosas: number;
  llamadasFallidas: number;
  ultimaLlamada?: Date;
}

// ============================================
// TIPOS PARA SYNC LOGS
// ============================================

export type SyncOperacion = 'sync' | 'create' | 'update' | 'delete';
export type SyncDireccion = 'to_external' | 'from_external' | 'bidirectional';
export type SyncEstado = 'success' | 'partial' | 'error';

export interface ISyncDetalle {
  id: string;
  tipo: string;
  estado: 'success' | 'error';
  mensaje?: string;
}

export interface ISyncDatos {
  registrosProcesados: number;
  registrosExitosos: number;
  registrosFallidos: number;
  detalles?: ISyncDetalle[];
}

// ============================================
// TIPOS PARA EJECUCIÓN DE APIs
// ============================================

export interface IApiExecutionParams {
  path?: Record<string, any>;
  query?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
}

export interface IApiExecutionResult {
  success: boolean;
  data?: any;
  error?: {
    mensaje: string;
    codigo?: string;
    statusCode?: number;
  };
  metadata: {
    tiempoRespuesta: number;
    timestamp: Date;
    cached: boolean;
  };
}
