// 🧩 Modelo de Nodos de Flujo Configurables (Conversacional + Pasos)
import mongoose, { Schema, Document } from 'mongoose';

export type NodeType = 'menu' | 'input' | 'message' | 'condition' | 'action' | 'api_call' | 'gpt' | 'recopilar' | 'consulta_filtrada' | 'confirmacion';

export interface INodeOption {
  text: string;
  value?: string;
  next?: string;
  url?: string;
  action?: string;
}

export interface INodeCondition {
  if?: string;
  else?: string;
  next: string;
  operator?: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'exists';
  value?: any;
}

export interface INodeValidation {
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'regex' | 'texto' | 'numero' | 'opcion';
  pattern?: string;
  min?: number;
  max?: number;
  required?: boolean;
  errorMessage?: string;
  opciones?: string[]; // Para validación tipo 'opcion'
  mensajeError?: string;
}

// Configuración de respuesta de endpoint para nodos de API
export interface IEndpointResponseConfig {
  arrayPath: string; // Ruta al array de resultados (ej: 'data', 'results')
  idField: string; // Campo que contiene el ID
  displayField: string; // Campo a mostrar al usuario
  priceField?: string; // Campo de precio (opcional)
  stockField?: string; // Campo de stock (opcional)
  imageField?: string; // Campo de imagen (opcional)
}

// Mapeo de parámetros para llamadas a API
export interface IParameterMapping {
  [key: string]: {
    source: 'variable' | 'fixed'; // De dónde viene el valor
    variableName?: string; // Nombre de la variable si source === 'variable'
    fixedValue?: any; // Valor fijo si source === 'fixed'
  };
}

export interface INodeAction {
  type: 'create_payment_link' | 'send_email' | 'save_data' | 'api_call' | 'webhook' | 'assign_agent';
  config: any;
  onSuccess?: string;
  onError?: string;
  
  // Para nodos tipo api_call o consulta_filtrada
  endpointId?: string;
  parameterMapping?: IParameterMapping;
  responseConfig?: IEndpointResponseConfig;
}

export interface IFlowNode extends Document {
  empresaId: string;
  flowId: string;
  id: string;
  type: NodeType;
  name: string;
  message?: string;
  options?: INodeOption[];
  validation?: INodeValidation;
  conditions?: INodeCondition[];
  action?: INodeAction;
  next?: string;
  variables?: Record<string, any>;
  
  // Para nodos de tipo workflow (recopilar, consulta_filtrada)
  nombreVariable?: string; // Variable donde se guarda el dato recopilado
  endpointId?: string; // ID del endpoint a llamar
  endpointResponseConfig?: IEndpointResponseConfig;
  plantillaOpciones?: string; // Template para mostrar opciones
  mensajeSinResultados?: string;
  permitirVolverAlMenu?: boolean;
  mensajeVolverAlMenu?: string;
  
  metadata?: {
    position?: { x: number; y: number };
    description?: string;
    tags?: string[];
    orden?: number; // Orden del paso en el workflow
  };
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NodeOptionSchema = new Schema({
  text: { type: String, required: true },
  value: String,
  next: String,
  url: String,
  action: String
}, { _id: false });

const NodeConditionSchema = new Schema({
  if: String,
  else: String,
  next: String,
  operator: {
    type: String,
    enum: ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'contains', 'exists'],
    default: 'eq'
  },
  value: Schema.Types.Mixed
}, { _id: false });

const NodeValidationSchema = new Schema({
  type: {
    type: String,
    enum: ['text', 'number', 'email', 'phone', 'date', 'regex', 'texto', 'numero', 'opcion'],
    required: true
  },
  pattern: String,
  min: Number,
  max: Number,
  required: { type: Boolean, default: true },
  errorMessage: String,
  opciones: [String],
  mensajeError: String
}, { _id: false });

const EndpointResponseConfigSchema = new Schema({
  arrayPath: { type: String, required: true, default: 'data' },
  idField: { type: String, required: true, default: 'id' },
  displayField: { type: String, required: true, default: 'name' },
  priceField: String,
  stockField: String,
  imageField: String
}, { _id: false });

const ParameterMappingSchema = new Schema({
  source: { type: String, enum: ['variable', 'fixed'], required: true },
  variableName: String,
  fixedValue: Schema.Types.Mixed
}, { _id: false });

const NodeActionSchema = new Schema({
  type: {
    type: String,
    enum: ['create_payment_link', 'send_email', 'save_data', 'api_call', 'webhook', 'assign_agent'],
    required: true
  },
  config: Schema.Types.Mixed,
  onSuccess: String,
  onError: String,
  endpointId: String,
  parameterMapping: { type: Map, of: ParameterMappingSchema },
  responseConfig: EndpointResponseConfigSchema
}, { _id: false });

const FlowNodeSchema = new Schema<IFlowNode>(
  {
    empresaId: { type: String, required: true, index: true },
    flowId: { type: String, required: true, index: true },
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['menu', 'input', 'message', 'condition', 'action', 'api_call', 'gpt', 'recopilar', 'consulta_filtrada', 'confirmacion'],
      required: true
    },
    name: { type: String, required: true },
    message: String,
    options: [NodeOptionSchema],
    validation: NodeValidationSchema,
    conditions: [NodeConditionSchema],
    action: NodeActionSchema,
    next: String,
    variables: Schema.Types.Mixed,
    
    // Campos para workflow de pasos
    nombreVariable: String,
    endpointId: String,
    endpointResponseConfig: EndpointResponseConfigSchema,
    plantillaOpciones: String,
    mensajeSinResultados: String,
    permitirVolverAlMenu: { type: Boolean, default: false },
    mensajeVolverAlMenu: String,
    
    metadata: {
      position: {
        x: Number,
        y: Number
      },
      description: String,
      tags: [String],
      orden: Number
    },
    activo: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    collection: 'flownodes'
  }
);

FlowNodeSchema.index({ empresaId: 1, flowId: 1, id: 1 }, { unique: true });
FlowNodeSchema.index({ empresaId: 1, activo: 1 });
FlowNodeSchema.index({ empresaId: 1, flowId: 1, 'metadata.orden': 1 });

export const FlowNodeModel = mongoose.model<IFlowNode>('FlowNode', FlowNodeSchema);
