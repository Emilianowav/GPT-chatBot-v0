// 🏢 Modelo de Empresa para MongoDB
import mongoose, { Schema, Document } from 'mongoose';
import type { EmpresaConfig, EmpresaUbicacion } from '../types/Types.js';

export interface IEmpresa extends Omit<EmpresaConfig, 'ubicaciones'>, Document {
  _id: mongoose.Types.ObjectId;
  ubicaciones?: EmpresaUbicacion[];
  toEmpresaConfig(): EmpresaConfig;
}

const UbicacionSchema = new Schema<EmpresaUbicacion>(
  {
    nombre: String,
    ciudad: String,
    direccion: String,
    derivarA: [String]
  },
  { _id: false }
);

// Schema para módulos
const ModuloSchema = new Schema(
  {
    id: { type: String, required: true },
    nombre: { type: String, required: true },
    descripcion: String,
    version: String,
    categoria: String,
    icono: String,
    activo: { type: Boolean, default: true },
    fechaActivacion: Date,
    fechaExpiracion: Date,
    precio: Number,
    planMinimo: String,
    dependencias: [String],
    permisos: [String],
    configuracion: Schema.Types.Mixed,
    autor: String,
    documentacion: String,
    soporte: String
  },
  { _id: false }
);

const EmpresaSchema = new Schema<IEmpresa>(
  {
    nombre: { 
      type: String, 
      required: true,
      unique: true,
      index: true 
    },
    categoria: { 
      type: String, 
      required: true 
    },
    telefono: { 
      type: String, 
      required: true,
      unique: true,
      index: true 
    },
    email: String,
    derivarA: [String],
    prompt: { 
      type: String, 
      required: true 
    },
    saludos: [String],
    catalogoPath: { 
      type: String, 
      required: true 
    },
    linkCatalogo: String,
    modelo: { 
      type: String, 
      enum: ['gpt-3.5-turbo', 'gpt-4'],
      default: 'gpt-3.5-turbo' 
    },
    ubicaciones: [UbicacionSchema],
    phoneNumberId: String,
    
    // Sistema de módulos
    plan: {
      type: String,
      enum: ['basico', 'standard', 'premium', 'enterprise'],
      default: 'basico'
    },
    modulos: [ModuloSchema],
    
    // Límites según plan
    limites: {
      mensajesMensuales: { type: Number, default: 1000 },
      usuariosActivos: { type: Number, default: 100 },
      almacenamiento: { type: Number, default: 250 },
      integraciones: { type: Number, default: 1 },
      exportacionesMensuales: { type: Number, default: 0 },
      agentesSimultaneos: { type: Number, default: 0 }
    },
    
    // Uso actual
    uso: {
      mensajesEsteMes: { type: Number, default: 0 },
      usuariosActivos: { type: Number, default: 0 },
      almacenamientoUsado: { type: Number, default: 0 },
      exportacionesEsteMes: { type: Number, default: 0 },
      ultimaActualizacion: { type: Date, default: Date.now }
    },
    
    // Facturación
    facturacion: {
      metodoPago: String,
      ultimoPago: Date,
      proximoPago: Date,
      estado: {
        type: String,
        enum: ['activo', 'suspendido', 'prueba'],
        default: 'activo'
      }
    }
  },
  {
    timestamps: true,
    collection: 'empresas'
  }
);

// Método para convertir a formato EmpresaConfig
EmpresaSchema.methods.toEmpresaConfig = function(): EmpresaConfig {
  const obj = this.toObject();
  return {
    nombre: obj.nombre,
    categoria: obj.categoria,
    telefono: obj.telefono,
    prompt: obj.prompt,
    modelo: obj.modelo,
    derivarA: obj.derivarA,
    ubicaciones: obj.ubicaciones,
    catalogoPath: obj.catalogoPath,
    linkCatalogo: obj.linkCatalogo,
    saludos: obj.saludos,
    email: obj.email,
    phoneNumberId: obj.phoneNumberId,
    plan: obj.plan,
    modulos: obj.modulos,
    limites: obj.limites,
    uso: obj.uso,
    facturacion: obj.facturacion
  };
};

export const EmpresaModel = mongoose.model<IEmpresa>('Empresa', EmpresaSchema);
