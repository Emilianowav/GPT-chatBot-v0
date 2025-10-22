// ⚙️ Modelo de Configuración del Calendario
import mongoose, { Schema, Document } from 'mongoose';

export interface IConfiguracionCalendario extends Document {
  empresaId: string;
  
  duracionTurnoPorDefecto: number;
  bufferEntreturnos: number;
  anticipacionMinima: number;
  anticipacionMaxima: number;
  
  horaAperturaGlobal: string;
  horaCierreGlobal: string;
  
  requiereConfirmacionAgente: boolean;
  tiempoLimiteConfirmacion: number;
  
  recordatorio24h: boolean;
  recordatorio1h: boolean;
  mensajeRecordatorio24h?: string;
  mensajeRecordatorio1h?: string;
  
  permiteCancelacion: boolean;
  tiempoLimiteCancelacion: number;
  
  notificarAgenteNuevoTurno: boolean;
  notificarAgenteCancelacion: boolean;
  emailNotificaciones?: string;
  whatsappNotificaciones?: string;
  
  mensajeTurnoConfirmado?: string;
  mensajeTurnoCancelado?: string;
  mensajeTurnoReprogramado?: string;
  
  creadoEn: Date;
  actualizadoEn: Date;
}

const ConfiguracionCalendarioSchema = new Schema<IConfiguracionCalendario>(
  {
    empresaId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    
    duracionTurnoPorDefecto: {
      type: Number,
      default: 30
    },
    bufferEntreturnos: {
      type: Number,
      default: 5
    },
    anticipacionMinima: {
      type: Number,
      default: 2
    },
    anticipacionMaxima: {
      type: Number,
      default: 30
    },
    
    horaAperturaGlobal: {
      type: String,
      default: '08:00',
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    horaCierreGlobal: {
      type: String,
      default: '20:00',
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    
    requiereConfirmacionAgente: {
      type: Boolean,
      default: false
    },
    tiempoLimiteConfirmacion: {
      type: Number,
      default: 60
    },
    
    recordatorio24h: {
      type: Boolean,
      default: true
    },
    recordatorio1h: {
      type: Boolean,
      default: true
    },
    mensajeRecordatorio24h: String,
    mensajeRecordatorio1h: String,
    
    permiteCancelacion: {
      type: Boolean,
      default: true
    },
    tiempoLimiteCancelacion: {
      type: Number,
      default: 24
    },
    
    notificarAgenteNuevoTurno: {
      type: Boolean,
      default: true
    },
    notificarAgenteCancelacion: {
      type: Boolean,
      default: true
    },
    emailNotificaciones: String,
    whatsappNotificaciones: String,
    
    mensajeTurnoConfirmado: String,
    mensajeTurnoCancelado: String,
    mensajeTurnoReprogramado: String
  },
  {
    timestamps: {
      createdAt: 'creadoEn',
      updatedAt: 'actualizadoEn'
    },
    collection: 'configuracion_calendario'
  }
);

export const ConfiguracionCalendarioModel = mongoose.model<IConfiguracionCalendario>(
  'ConfiguracionCalendario',
  ConfiguracionCalendarioSchema
);
