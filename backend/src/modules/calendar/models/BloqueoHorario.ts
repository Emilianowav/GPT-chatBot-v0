// 🚫 Modelo de Bloqueo de Horario
import mongoose, { Schema, Document } from 'mongoose';

export interface IBloqueoHorario extends Document {
  empresaId: string;
  agenteId: mongoose.Types.ObjectId;
  
  fechaInicio: Date;
  fechaFin: Date;
  todoElDia: boolean;
  
  motivo: string;
  descripcion?: string;
  
  creadoPor: string;
  creadoEn: Date;
}

const BloqueoHorarioSchema = new Schema<IBloqueoHorario>(
  {
    empresaId: {
      type: String,
      required: true,
      index: true
    },
    agenteId: {
      type: Schema.Types.ObjectId,
      ref: 'Agente',
      required: true,
      index: true
    },
    
    fechaInicio: {
      type: Date,
      required: true,
      index: true
    },
    fechaFin: {
      type: Date,
      required: true
    },
    todoElDia: {
      type: Boolean,
      default: false
    },
    
    motivo: {
      type: String,
      required: true
    },
    descripcion: String,
    
    creadoPor: {
      type: String,
      required: true
    }
  },
  {
    timestamps: {
      createdAt: 'creadoEn',
      updatedAt: false
    },
    collection: 'bloqueos_horario'
  }
);

// Índices compuestos
BloqueoHorarioSchema.index({ empresaId: 1, agenteId: 1, fechaInicio: 1 });

export const BloqueoHorarioModel = mongoose.model<IBloqueoHorario>(
  'BloqueoHorario',
  BloqueoHorarioSchema
);
