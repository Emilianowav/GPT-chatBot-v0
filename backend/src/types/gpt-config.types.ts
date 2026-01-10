/**
 * TIPOS PARA CONFIGURACIÓN DE GPT CONVERSACIONAL
 * Sistema de 3 bloques + acciones dinámicas
 */

// BLOQUE 2: Tópico de información estática
export interface ITopico {
  id: string;
  titulo: string;
  contenido: string;
  keywords?: string[]; // Palabras clave para ayudar al GPT a encontrar el tópico
}

// BLOQUE 3: Variable a recopilar
export interface IVariableRecopilar {
  nombre: string;
  descripcion: string;
  obligatorio: boolean;
  tipo: 'texto' | 'numero' | 'fecha' | 'email' | 'telefono';
  validacion?: {
    min?: number;
    max?: number;
    regex?: string;
    opciones?: string[]; // Para tipo select/radio
  };
  ejemplos?: string[]; // Ejemplos para mostrar al usuario
}

// CONFIGURACIÓN PARA GPT FORMATEADOR/TRANSFORM
export interface IConfiguracionExtraccion {
  // Qué buscar en el historial
  instruccionesExtraccion: string; // Ej: "Extrae el título del libro, editorial y edición que el usuario mencionó"
  
  // Qué parte del historial analizar
  fuenteDatos: 'historial_completo' | 'ultimo_mensaje' | 'ultimos_n_mensajes';
  cantidadMensajes?: number; // Si fuenteDatos = 'ultimos_n_mensajes'
  
  // Formato de salida esperado
  formatoSalida: {
    tipo: 'json' | 'texto' | 'lista';
    estructura?: string; // JSON schema o ejemplo de estructura esperada
    ejemplo?: string; // Ejemplo de salida esperada
  };
  
  // Variables a extraer (más específico que variablesRecopilar)
  camposEsperados: {
    nombre: string;
    descripcion: string;
    tipoDato: 'string' | 'number' | 'boolean' | 'array' | 'object';
    requerido: boolean;
    valorPorDefecto?: any;
  }[];
}

// BLOQUE 4: Acciones post-recopilación
export interface IAccionCompletado {
  tipo: 'mensaje' | 'guardar_variables_globales' | 'marcar_completado' | 'ejecutar_api';
  contenido?: string; // Para tipo 'mensaje'
  variables?: string[]; // Para tipo 'guardar_variables_globales'
  token?: string; // Para tipo 'marcar_completado' (ej: "[INFO_COMPLETA]")
  apiEndpoint?: string; // Para tipo 'ejecutar_api'
}

// CONFIGURACIÓN COMPLETA DEL GPT CONVERSACIONAL
export interface IGPTConversacionalConfig {
  // Configuración base (ya existente)
  tipo: 'conversacional' | 'transform' | 'formateador' | 'procesador';
  module: string;
  modelo: string;
  temperatura: number;
  maxTokens: number;
  
  // BLOQUE 1: PERSONALIDAD (solo para conversacional)
  personalidad?: string;
  
  // BLOQUE 2: INFORMACIÓN ESTÁTICA (Tópicos) (solo para conversacional)
  topicos?: ITopico[];
  
  // BLOQUE 3: RECOPILACIÓN DE DATOS (solo para conversacional)
  variablesRecopilar?: IVariableRecopilar[];
  
  // BLOQUE 4: ACCIONES POST-RECOPILACIÓN (solo para conversacional)
  accionesCompletado?: IAccionCompletado[];
  
  // CONFIGURACIÓN PARA FORMATEADOR/TRANSFORM (LEGACY)
  configuracionExtraccion?: IConfiguracionExtraccion;
  
  // CONFIGURACIÓN PARA FORMATEADOR (NUEVO - desde frontend)
  extractionConfig?: {
    enabled: boolean;
    method?: 'simple' | 'advanced';
    contextSource?: 'historial_completo' | 'ultimo_mensaje' | 'ultimos_n_mensajes';
    systemPrompt: string; // Prompt del frontend (sin agregar nada)
    variables?: {
      nombre: string;
      tipo: string;
      requerido: boolean;
      descripcion: string;
    }[];
  };
  
  // Variables de entrada/salida (ya existente)
  variablesEntrada?: string[];
  variablesSalida?: string[];
  globalVariablesOutput?: string[];
  outputFormat?: 'text' | 'json';
  jsonSchema?: any;
  
  // LEGACY: systemPrompt (se genera automáticamente desde los 3 bloques)
  systemPrompt?: string;
}

// CONFIGURACIÓN DE NODO GPT (para node.data.config)
export interface IGPTNodeConfig extends IGPTConversacionalConfig {
  // Campos adicionales específicos del nodo
  nodeId?: string;
  label?: string;
}
