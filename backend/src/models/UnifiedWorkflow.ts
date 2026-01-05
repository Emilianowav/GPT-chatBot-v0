// 📦 MODELO: Workflow Unificado

import mongoose, { Schema, Document } from 'mongoose';
import type { Workflow, WorkflowNode, NodeConnection } from '../types/NodeTypes.js';

export interface IUnifiedWorkflow extends Omit<Workflow, '_id' | 'id'>, Document {
  id: string;
}

const NodeConnectionSchema = new Schema<NodeConnection>({
  targetNodeId: { type: String, required: true },
  filter: { type: Schema.Types.Mixed },
  label: { type: String }
}, { _id: false });

const WorkflowNodeSchema = new Schema<WorkflowNode>({
  id: { type: String, required: true },
  type: { type: String, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  config: { type: Schema.Types.Mixed, required: true },
  connections: [NodeConnectionSchema]
}, { _id: false });

const UnifiedWorkflowSchema = new Schema<IUnifiedWorkflow>({
  id: { type: String, required: true, unique: true },
  empresaId: { type: String, required: true, index: true },
  nombre: { type: String, required: true },
  descripcion: { type: String },
  activo: { type: Boolean, default: true, index: true },
  trigger: { type: Schema.Types.Mixed, required: true },
  nodes: [WorkflowNodeSchema],
  metadata: {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 }
  }
}, {
  timestamps: true,
  collection: 'unified_workflows'
});

// Índices compuestos
UnifiedWorkflowSchema.index({ empresaId: 1, activo: 1 });
UnifiedWorkflowSchema.index({ id: 1, empresaId: 1 });

// Middleware para actualizar updatedAt
UnifiedWorkflowSchema.pre('save', function(next) {
  this.metadata.updatedAt = new Date();
  next();
});

export const UnifiedWorkflowModel = mongoose.model<IUnifiedWorkflow>('UnifiedWorkflow', UnifiedWorkflowSchema);
