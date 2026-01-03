// 🧩 Modelo de Nodos de Flujo Configurables
import mongoose, { Schema, Document } from 'mongoose';

export type NodeType = 'menu' | 'input' | 'message' | 'condition' | 'action' | 'api_call' | 'gpt';

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
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'regex';
  pattern?: string;
  min?: number;
  max?: number;
  required?: boolean;
  errorMessage?: string;
}

export interface INodeAction {
  type: 'create_payment_link' | 'send_email' | 'save_data' | 'api_call' | 'webhook' | 'assign_agent';
  config: any;
  onSuccess?: string;
  onError?: string;
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
  metadata?: {
    position?: { x: number; y: number };
    description?: string;
    tags?: string[];
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
    enum: ['text', 'number', 'email', 'phone', 'date', 'regex'],
    required: true
  },
  pattern: String,
  min: Number,
  max: Number,
  required: { type: Boolean, default: true },
  errorMessage: String
}, { _id: false });

const NodeActionSchema = new Schema({
  type: {
    type: String,
    enum: ['create_payment_link', 'send_email', 'save_data', 'api_call', 'webhook', 'assign_agent'],
    required: true
  },
  config: Schema.Types.Mixed,
  onSuccess: String,
  onError: String
}, { _id: false });

const FlowNodeSchema = new Schema<IFlowNode>(
  {
    empresaId: { type: String, required: true, index: true },
    flowId: { type: String, required: true, index: true },
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['menu', 'input', 'message', 'condition', 'action', 'api_call', 'gpt'],
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
    metadata: {
      position: {
        x: Number,
        y: Number
      },
      description: String,
      tags: [String]
    },
    activo: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    collection: 'flow_nodes'
  }
);

FlowNodeSchema.index({ empresaId: 1, flowId: 1, id: 1 }, { unique: true });
FlowNodeSchema.index({ empresaId: 1, activo: 1 });

export const FlowNodeModel = mongoose.model<IFlowNode>('FlowNode', FlowNodeSchema);
