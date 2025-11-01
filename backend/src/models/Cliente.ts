// 👤 Modelo de Cliente
import mongoose, { Schema, Document } from 'mongoose';

export interface PreferenciasComunicacion {
  aceptaWhatsApp: boolean;
  aceptaSMS: boolean;
  aceptaEmail: boolean;
  recordatorioTurnos: boolean; // Recibir recordatorios de turnos
  diasAnticipacionRecordatorio: number; // Días de anticipación (ej: 1 = un día antes)
  horaRecordatorio: string; // Hora preferida para recordatorios (HH:mm)
  notificacionesPromocion: boolean; // Recibir ofertas/promociones
  notificacionesDisponibilidad: boolean; // Recibir cuando hay turnos disponibles
}

export interface ICliente extends Document {
  empresaId: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  fechaNacimiento?: Date;
  dni?: string;
  notas?: string;
  sector?: string; // Sector al que está asignado el cliente
  origen: 'chatbot' | 'manual';
  chatbotUserId?: string; // ID del usuario en el chatbot si viene de ahí
  profileName?: string; // Nombre del perfil de WhatsApp
  preferencias: PreferenciasComunicacion;
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}

const ClienteSchema = new Schema<ICliente>({
  empresaId: {
    type: String,
    required: true,
    index: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  telefono: {
    type: String,
    required: true,
    trim: true
  },
  direccion: {
    type: String,
    trim: true
  },
  ciudad: {
    type: String,
    trim: true
  },
  provincia: {
    type: String,
    trim: true
  },
  codigoPostal: {
    type: String,
    trim: true
  },
  fechaNacimiento: {
    type: Date
  },
  dni: {
    type: String,
    trim: true
  },
  notas: {
    type: String
  },
  sector: {
    type: String,
    trim: true
  },
  origen: {
    type: String,
    enum: ['chatbot', 'manual'],
    required: true,
    default: 'manual'
  },
  chatbotUserId: {
    type: String,
    index: true
  },
  profileName: {
    type: String,
    trim: true
  },
  preferencias: {
    type: {
      aceptaWhatsApp: { type: Boolean, default: true },
      aceptaSMS: { type: Boolean, default: false },
      aceptaEmail: { type: Boolean, default: true },
      recordatorioTurnos: { type: Boolean, default: true },
      diasAnticipacionRecordatorio: { type: Number, default: 1 },
      horaRecordatorio: { type: String, default: '10:00' },
      notificacionesPromocion: { type: Boolean, default: false },
      notificacionesDisponibilidad: { type: Boolean, default: false }
    },
    default: () => ({
      aceptaWhatsApp: true,
      aceptaSMS: false,
      aceptaEmail: true,
      recordatorioTurnos: true,
      diasAnticipacionRecordatorio: 1,
      horaRecordatorio: '10:00',
      notificacionesPromocion: false,
      notificacionesDisponibilidad: false
    })
  },
  activo: {
    type: Boolean,
    default: true
  },
  creadoEn: {
    type: Date,
    default: Date.now
  },
  actualizadoEn: {
    type: Date,
    default: Date.now
  }
});

// Índice compuesto para búsquedas eficientes
ClienteSchema.index({ empresaId: 1, telefono: 1 });
ClienteSchema.index({ empresaId: 1, email: 1 });
ClienteSchema.index({ empresaId: 1, activo: 1 });

// Middleware para actualizar fecha de modificación
ClienteSchema.pre('save', function(next) {
  this.actualizadoEn = new Date();
  next();
});

export const ClienteModel = mongoose.model<ICliente>('Cliente', ClienteSchema);
