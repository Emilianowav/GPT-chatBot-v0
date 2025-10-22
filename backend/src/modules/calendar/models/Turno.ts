// 📅 Modelo de Turno/Reserva
import mongoose, { Schema, Document } from 'mongoose';

export enum EstadoTurno {
  PENDIENTE = 'pendiente',
  CONFIRMADO = 'confirmado',
  EN_CURSO = 'en_curso',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
  NO_ASISTIO = 'no_asistio'
}

export interface ITurno extends Document {
  empresaId: string;
  agenteId: mongoose.Types.ObjectId;
  clienteId: string;
  
  fechaInicio: Date;
  fechaFin: Date;
  duracion: number;
  
  estado: EstadoTurno;
  
  servicio?: string;
  notas?: string;
  notasInternas?: string;
  precio?: number;
  
  recordatorio24h: boolean;
  recordatorio1h: boolean;
  recordatorio24hEnviado?: Date;
  recordatorio1hEnviado?: Date;
  
  creadoPor: 'bot' | 'admin' | 'agente' | 'cliente';
  creadoEn: Date;
  actualizadoEn: Date;
  canceladoEn?: Date;
  motivoCancelacion?: string;
  
  confirmado: boolean;
  confirmadoEn?: Date;
  confirmadoPor?: string;
}

const TurnoSchema = new Schema<ITurno>(
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
    clienteId: {
      type: String,
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
    duracion: {
      type: Number,
      required: true
    },
    
    estado: {
      type: String,
      enum: Object.values(EstadoTurno),
      default: EstadoTurno.PENDIENTE,
      index: true
    },
    
    servicio: String,
    notas: String,
    notasInternas: String,
    precio: Number,
    
    recordatorio24h: {
      type: Boolean,
      default: false
    },
    recordatorio1h: {
      type: Boolean,
      default: false
    },
    recordatorio24hEnviado: Date,
    recordatorio1hEnviado: Date,
    
    creadoPor: {
      type: String,
      enum: ['bot', 'admin', 'agente', 'cliente'],
      required: true
    },
    canceladoEn: Date,
    motivoCancelacion: String,
    
    confirmado: {
      type: Boolean,
      default: false
    },
    confirmadoEn: Date,
    confirmadoPor: String
  },
  {
    timestamps: {
      createdAt: 'creadoEn',
      updatedAt: 'actualizadoEn'
    },
    collection: 'turnos'
  }
);

// Índices compuestos para optimizar queries
TurnoSchema.index({ empresaId: 1, fechaInicio: 1 });
TurnoSchema.index({ empresaId: 1, agenteId: 1, fechaInicio: 1 });
TurnoSchema.index({ empresaId: 1, clienteId: 1, fechaInicio: 1 });
TurnoSchema.index({ empresaId: 1, estado: 1, fechaInicio: 1 });

export const TurnoModel = mongoose.model<ITurno>('Turno', TurnoSchema);
