// 🔄 Modelo de Estado de Conversación para gestión de flujos
import mongoose, { Schema, Document } from 'mongoose';

export interface IConversationState extends Document {
  telefono: string;
  empresaId: string;
  flujo_activo: string | null;
  estado_actual: string | null;
  data: Record<string, any>;
  flujos_pendientes: string[];
  prioridad: 'normal' | 'urgente' | 'baja';
  ultima_interaccion: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationStateSchema = new Schema<IConversationState>(
  {
    telefono: {
      type: String,
      required: true,
      index: true
    },
    empresaId: {
      type: String,
      required: true,
      index: true
    },
    flujo_activo: {
      type: String,
      default: null
    },
    estado_actual: {
      type: String,
      default: null
    },
    data: {
      type: Schema.Types.Mixed,
      default: {}
    },
    flujos_pendientes: {
      type: [String],
      default: []
    },
    prioridad: {
      type: String,
      enum: ['normal', 'urgente', 'baja'],
      default: 'normal'
    },
    ultima_interaccion: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: 'conversation_states'
  }
);

// Índice compuesto para búsquedas rápidas
ConversationStateSchema.index({ telefono: 1, empresaId: 1 }, { unique: true });

// Índice para limpiar estados antiguos
ConversationStateSchema.index({ ultima_interaccion: 1 });

export const ConversationStateModel = mongoose.model<IConversationState>(
  'ConversationState',
  ConversationStateSchema
);
