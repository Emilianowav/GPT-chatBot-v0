/**
 * Transforma la configuración de nodos del formato frontend al formato backend
 * antes de guardar en la base de datos.
 */

export interface FrontendGPTConfig {
  tipo?: string;
  modelo?: string;
  temperatura?: number;
  maxTokens?: number;
  systemPrompt?: string;
  personalidad?: string;
  topicos?: any[];
  variablesRecopilar?: any[];
  configuracionExtraccion?: {
    instruccionesExtraccion: string;
    fuenteDatos: 'historial_completo' | 'ultimo_mensaje' | 'ultimos_n_mensajes';
    cantidadMensajes?: number;
    formatoSalida: {
      tipo: 'json' | 'texto' | 'lista';
      estructura?: string;
      ejemplo?: string;
    };
    camposEsperados: Array<{
      nombre: string;
      descripcion: string;
      tipoDato: 'string' | 'number' | 'boolean' | 'array' | 'object';
      requerido: boolean;
      valorPorDefecto?: any;
    }>;
  };
  globalVariablesOutput?: string[];
  outputVariable?: string;
  outputFormat?: string;
  jsonSchema?: any;
}

export interface BackendGPTConfig extends FrontendGPTConfig {
  // Campos adicionales que el backend necesita
  model?: string;
  temperature?: number;
  response_format?: string;
  extractionConfig?: {
    enabled: boolean;
    method: 'advanced';
    contextSource: 'historial_completo' | 'mensaje_actual' | 'ultimos_n_mensajes';
    systemPrompt: string;
    variables: Array<{
      nombre: string;
      tipo: string;
      descripcion: string;
      requerido: boolean;
    }>;
  };
}

/**
 * Transforma la configuración de un nodo GPT del formato frontend al formato backend
 */
export function transformGPTConfigForBackend(config: FrontendGPTConfig): BackendGPTConfig {
  const backendConfig: BackendGPTConfig = { ...config };

  // 1. Agregar campos backend basados en campos frontend
  if (config.modelo) {
    backendConfig.model = config.modelo;
  }
  
  if (config.temperatura !== undefined) {
    backendConfig.temperature = config.temperatura;
  }

  // 2. Determinar response_format
  if (config.configuracionExtraccion?.formatoSalida?.tipo === 'json') {
    backendConfig.response_format = 'json_object';
  } else if (config.outputFormat === 'json') {
    backendConfig.response_format = 'json_object';
  }

  // 3. CRÍTICO: Convertir configuracionExtraccion a extractionConfig
  if (config.configuracionExtraccion) {
    const ce = config.configuracionExtraccion;
    
    backendConfig.extractionConfig = {
      enabled: true,
      method: 'advanced',
      contextSource: ce.fuenteDatos,
      systemPrompt: ce.instruccionesExtraccion,
      variables: ce.camposEsperados.map(campo => ({
        nombre: campo.nombre,
        tipo: campo.tipoDato,
        descripcion: campo.descripcion,
        requerido: campo.requerido
      }))
    };

    console.log('✅ [TRANSFORM] Convertido configuracionExtraccion → extractionConfig');
    console.log(`   Variables: ${backendConfig.extractionConfig.variables.length}`);
    console.log(`   ContextSource: ${backendConfig.extractionConfig.contextSource}`);
  }

  return backendConfig;
}

/**
 * Transforma todos los nodos de un flujo antes de guardar
 */
export function transformNodesForBackend(nodes: any[]): any[] {
  return nodes.map(node => {
    // Solo transformar nodos GPT
    if (node.type === 'gpt' && node.data?.config) {
      return {
        ...node,
        data: {
          ...node.data,
          config: transformGPTConfigForBackend(node.data.config)
        }
      };
    }
    return node;
  });
}

/**
 * Transforma la configuración de un nodo del backend al formato frontend
 * (para cuando se carga un flujo desde la BD)
 */
export function transformGPTConfigFromBackend(config: BackendGPTConfig): FrontendGPTConfig {
  const frontendConfig: FrontendGPTConfig = { ...config };

  // Si tiene extractionConfig pero no configuracionExtraccion, crear configuracionExtraccion
  if (config.extractionConfig && !config.configuracionExtraccion) {
    const ec = config.extractionConfig;
    
    frontendConfig.configuracionExtraccion = {
      instruccionesExtraccion: ec.systemPrompt,
      fuenteDatos: ec.contextSource as any,
      formatoSalida: {
        tipo: 'json',
        estructura: '',
        ejemplo: ''
      },
      camposEsperados: ec.variables.map(variable => ({
        nombre: variable.nombre,
        descripcion: variable.descripcion,
        tipoDato: variable.tipo as any,
        requerido: variable.requerido,
        valorPorDefecto: undefined
      }))
    };

    console.log('✅ [TRANSFORM] Convertido extractionConfig → configuracionExtraccion');
    console.log(`   Campos: ${frontendConfig.configuracionExtraccion.camposEsperados.length}`);
  }

  // Convertir campos backend a frontend
  if (config.model && !config.modelo) {
    frontendConfig.modelo = config.model;
  }
  
  if (config.temperature !== undefined && config.temperatura === undefined) {
    frontendConfig.temperatura = config.temperature;
  }

  return frontendConfig;
}

/**
 * Transforma todos los nodos de un flujo después de cargar desde BD
 */
export function transformNodesFromBackend(nodes: any[]): any[] {
  return nodes.map(node => {
    // Solo transformar nodos GPT
    if (node.type === 'gpt' && node.data?.config) {
      return {
        ...node,
        data: {
          ...node.data,
          config: transformGPTConfigFromBackend(node.data.config)
        }
      };
    }
    return node;
  });
}
