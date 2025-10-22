// 👤 Modelo de Cliente
import mongoose, { Schema, Document } from 'mongoose';

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
  origen: 'chatbot' | 'manual';
  chatbotUserId?: string; // ID del usuario en el chatbot si viene de ahí
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
