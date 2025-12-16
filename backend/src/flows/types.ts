// 🔄 Tipos para el sistema de flujos dinámicos

export interface FlowContext {
  telefono: string;
  empresaId: string;
  mensaje: string;
  respuestaInteractiva?: string;
  phoneNumberId: string;
  profileName?: string;
  data?: Record<string, any>;
}

export interface FlowResult {
  success: boolean;
  nextState?: string;
  data?: Record<string, any>;
  end?: boolean;
  error?: string;
  shouldContinue?: boolean; // Si debe continuar con otros flujos
  response?: string; // Respuesta enviada al usuario (para guardar en historial)
}

export interface FlowStep {
  name: string;
  handler: (context: FlowContext, state: string, data: Record<string, any>) => Promise<FlowResult>;
}

export interface Flow {
  name: string;
  priority: 'urgente' | 'normal' | 'baja';
  version: string;
  
  // Detectar si este flujo debe activarse
  shouldActivate: (context: FlowContext) => Promise<boolean>;
  
  // Iniciar el flujo
  start: (context: FlowContext) => Promise<FlowResult>;
  
  // Procesar input del usuario
  onInput: (context: FlowContext, state: string, data: Record<string, any>) => Promise<FlowResult>;
  
  // Limpiar recursos al finalizar
  onEnd?: (context: FlowContext, data: Record<string, any>) => Promise<void>;
}

export interface FlowRegistry {
  [key: string]: Flow;
}

export type FlowPriority = 'urgente' | 'normal' | 'baja';

export interface FlowMessage {
  texto: string;
  tipo?: 'texto' | 'interactivo' | 'lista';
  botones?: Array<{ id: string; titulo: string }>;
  opciones?: Array<{ id: string; titulo: string; descripcion?: string }>;
}
