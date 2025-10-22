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

export interface NotificacionTurno {
  tipo: 'recordatorio' | 'confirmacion';
  programadaPara: Date;
  enviada: boolean;
  enviadaEn?: Date;
  plantilla: string;
  respuesta?: string;
  respondidoEn?: Date;
}

export interface ITurno extends Document {
  empresaId: string;
  
  // Agente/Recurso (ahora opcionales)
  agenteId?: mongoose.Types.ObjectId;
  recursoId?: mongoose.Types.ObjectId;
  
  clienteId: string;
  
  fechaInicio: Date;
  fechaFin: Date;
  duracion: number;
  
  estado: EstadoTurno;
  
  // Tipo de turno/reserva
  tipoReserva?: string; // 'viaje', 'consulta', 'evento', etc.
  categoria?: string;
  
  // CAMPOS DINÁMICOS - Datos específicos del negocio
  datos: {
    // Viajes
    origen?: string;
    destino?: string;
    pasajeros?: number;
    vehiculo?: string;
    
    // Consultas
    servicio?: string;
    especialidad?: string;
    
    // Restaurante
    mesa?: string;
    comensales?: number;
    
    // Cualquier campo personalizado
    [key: string]: any;
  };
  
  notas?: string;
  notasInternas?: string;
  precio?: number;
  
  // Sistema de notificaciones flexible
  notificaciones: NotificacionTurno[];
  
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
      required: false,
      index: true
    },
    recursoId: {
      type: Schema.Types.ObjectId,
      ref: 'Recurso',
      required: false,
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
    
    tipoReserva: String,
    categoria: String,
    
    // Datos dinámicos del turno
    datos: {
      type: Schema.Types.Mixed,
      default: {}
    },
    
    notas: String,
    notasInternas: String,
    precio: Number,
    
    // Sistema de notificaciones flexible
    notificaciones: [{
      tipo: {
        type: String,
        enum: ['recordatorio', 'confirmacion'],
        required: true
      },
      programadaPara: {
        type: Date,
        required: true
      },
      enviada: {
        type: Boolean,
        default: false
      },
      enviadaEn: Date,
      plantilla: String,
      respuesta: String,
      respondidoEn: Date
    }],
    
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
