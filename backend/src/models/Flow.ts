// 🌊 Modelo de Flujo (contenedor de nodos)
import mongoose, { Schema, Document } from 'mongoose';

export interface IFlow extends Document {
  empresaId: string;
  id: string;
  nombre: string;
  descripcion?: string;
  categoria: 'ventas' | 'soporte' | 'reservas' | 'informacion' | 'otro';
  startNode: string;
  variables: Record<string, any>;
  triggers: {
    keywords?: string[];
    patterns?: string[];
    priority?: number;
    conditions?: any[];
  };
  settings: {
    timeout?: number;
    maxRetries?: number;
    fallbackNode?: string;
    enableGPT?: boolean;
    saveHistory?: boolean;
  };
  activo: boolean;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const FlowSchema = new Schema<IFlow>(
  {
    empresaId: { type: String, required: true, index: true },
    id: { type: String, required: true },
    nombre: { type: String, required: true },
    descripcion: String,
    categoria: {
      type: String,
      enum: ['ventas', 'soporte', 'reservas', 'informacion', 'otro'],
      default: 'otro'
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
      conditions: [Schema.Types.Mixed]
    },
    settings: {
      timeout: { type: Number, default: 300 },
      maxRetries: { type: Number, default: 3 },
      fallbackNode: String,
      enableGPT: { type: Boolean, default: false },
      saveHistory: { type: Boolean, default: true }
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

export const FlowModel = mongoose.model<IFlow>('Flow', FlowSchema);
