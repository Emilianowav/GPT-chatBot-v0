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
    phoneNumberId: String
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
    phoneNumberId: obj.phoneNumberId
  };
};

export const EmpresaModel = mongoose.model<IEmpresa>('Empresa', EmpresaSchema);
