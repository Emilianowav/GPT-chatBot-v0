import mongoose, { Schema, Document } from 'mongoose';

export interface IFlow extends Document {
  nombre: string;
  descripcion?: string;
  empresaId: string;
  activo: boolean;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: any;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    data?: any;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const FlowSchema: Schema = new Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String },
  empresaId: { type: String, required: true, index: true },
  activo: { type: Boolean, default: true },
  nodes: [{
    id: { type: String, required: true },
    type: { type: String, required: true },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true }
    },
    data: { type: Schema.Types.Mixed, required: true }
  }],
  edges: [{
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    type: { type: String, required: true },
    data: { type: Schema.Types.Mixed }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

FlowSchema.index({ empresaId: 1, activo: 1 });
FlowSchema.index({ empresaId: 1, createdAt: -1 });

export const Flow = mongoose.model<IFlow>('Flow', FlowSchema);
