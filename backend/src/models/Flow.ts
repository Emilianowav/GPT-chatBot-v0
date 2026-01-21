// 🌊 Modelo de Flujo Unificado (Conversacional + Pasos)
import mongoose, { Schema, Document } from 'mongoose';

// Tipos de bot soportados
export type BotType = 'conversacional' | 'pasos' | 'visual';
export type PasosSubType = 'api' | 'crm';

// Configuración de API para bots de pasos
export interface IApiConfig {
  apiConfigurationId?: mongoose.Types.ObjectId; // Referencia a api_configurations
  workflowId?: string; // ID del workflow dentro de la API
  baseUrl?: string;
  endpoints?: Array<{
    id: string;
    nombre: string;
    metodo: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
  }>;
}

export interface IFlow extends Document {
  empresaId: string;
  id: string;
  nombre: string;
  descripcion?: string;
  categoria: 'ventas' | 'soporte' | 'reservas' | 'informacion' | 'otro';
  
  // NUEVO: Tipo de bot
  botType: BotType;
  pasosSubType?: PasosSubType; // Solo si botType === 'pasos'
  
  startNode: string;
  variables: Record<string, any>;
  triggers: {
    keywords?: string[];
    patterns?: string[];
    priority?: number;
    conditions?: any[];
    primeraRespuesta?: boolean; // Para workflows que se activan al primer mensaje
  };
  
  // NUEVO: Configuración de API (solo para botType === 'pasos' && pasosSubType === 'api')
  apiConfig?: IApiConfig;
  
  // FLOW BUILDER VISUAL: Nodos y edges (solo para botType === 'visual')
  nodes?: Array<{
    id: string;
    type: string;
    category?: string; // ← CRÍTICO: trigger, processor, action
    position: { x: number; y: number };
    data: any;
  }>;
  edges?: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    data?: any;
  }>;
  
  settings: {
    timeout?: number;
    maxRetries?: number;
    fallbackNode?: string;
    enableGPT?: boolean;
    saveHistory?: boolean;
    permitirAbandonar?: boolean;
    timeoutMinutos?: number;
  };
  
  activo: boolean;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApiEndpointSchema = new Schema({
  id: { type: String, required: true },
  nombre: { type: String, required: true },
  metodo: { 
    type: String, 
    enum: ['GET', 'POST', 'PUT', 'DELETE'],
    required: true 
  },
  path: { type: String, required: true }
}, { _id: false });

const ApiConfigSchema = new Schema({
  apiConfigurationId: { type: Schema.Types.ObjectId, ref: 'ApiConfiguration' },
  workflowId: String,
  baseUrl: String,
  endpoints: [ApiEndpointSchema]
}, { _id: false });

const FlowSchema = new Schema<IFlow>(
  {
    empresaId: { type: String, required: true, index: true },
    id: { type: String, required: false }, // Opcional para flujos visuales
    nombre: { type: String, required: true },
    descripcion: String,
    categoria: {
      type: String,
      enum: ['ventas', 'soporte', 'reservas', 'informacion', 'otro'],
      default: 'otro'
    },
    
    // Tipo de bot
    botType: {
      type: String,
      enum: ['conversacional', 'pasos', 'visual'],
      required: true,
      default: 'conversacional'
    },
    pasosSubType: {
      type: String,
      enum: ['api', 'crm'],
      required: function() { return this.botType === 'pasos'; }
    },
    
    startNode: { type: String, required: true },
    variables: {
      type: Schema.Types.Mixed,
      default: {}
    },
    triggers: {
      keywords: [String],
      patterns: [String],
      priority: { type: Number, default: 0 },
      conditions: [Schema.Types.Mixed],
      primeraRespuesta: { type: Boolean, default: false }
    },
    
    // Configuración de API
    apiConfig: ApiConfigSchema,
    
    // Flow Builder Visual: Nodos y edges (solo para botType === 'visual')
    // CRÍTICO: Usar Mixed para que Mongoose NO modifique la estructura
    nodes: { type: Schema.Types.Mixed, default: [] },
    edges: { type: Schema.Types.Mixed, default: [] },
    
    settings: {
      timeout: { type: Number, default: 300 },
      maxRetries: { type: Number, default: 3 },
      fallbackNode: String,
      enableGPT: { type: Boolean, default: false },
      saveHistory: { type: Boolean, default: true },
      permitirAbandonar: { type: Boolean, default: true },
      timeoutMinutos: { type: Number, default: 30 }
    },
    activo: { type: Boolean, default: true },
    version: { type: Number, default: 1 },
    createdBy: { type: String, required: true }
  },
  {
    timestamps: true,
    collection: 'flows'
  }
);

FlowSchema.index({ empresaId: 1, id: 1 }, { unique: true });
FlowSchema.index({ empresaId: 1, activo: 1, 'triggers.priority': -1 });
FlowSchema.index({ empresaId: 1, botType: 1, activo: 1 });
FlowSchema.index({ 'apiConfig.apiConfigurationId': 1 });

export const FlowModel = mongoose.model<IFlow>('Flow', FlowSchema);
