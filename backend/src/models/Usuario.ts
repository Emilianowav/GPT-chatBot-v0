// 👤 Modelo de Usuario para MongoDB
import mongoose, { Schema, Document } from 'mongoose';
import type { Usuario as UsuarioType } from '../types/Types.js';

export interface IUsuario extends Omit<UsuarioType, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
  toUsuarioType(): UsuarioType;
}

const UsuarioSchema = new Schema<IUsuario>(
  {
    numero: { 
      type: String, 
      required: true,
      index: true 
    },
    nombre: { 
      type: String, 
      default: '' 
    },
    empresaId: { 
      type: String, 
      required: true,
      index: true 
    },
    empresaTelefono: { 
      type: String, 
      required: true 
    },
    historial: { 
      type: [String], 
      default: [] 
    },
    interacciones: { 
      type: Number, 
      default: 0 
    },
    ultimaInteraccion: { 
      type: String, 
      default: () => new Date().toISOString() 
    },
    ultima_actualizacion: { 
      type: String, 
      default: () => new Date().toISOString() 
    },
    saludado: { 
      type: Boolean, 
      default: false 
    },
    despedido: { 
      type: Boolean, 
      default: false 
    },
    ultima_saludo: { 
      type: String 
    },
    resumen: { 
      type: String 
    },
    num_mensajes_enviados: { 
      type: Number, 
      default: 0 
    },
    num_mensajes_recibidos: { 
      type: Number, 
      default: 0 
    },
    num_media_recibidos: { 
      type: Number, 
      default: 0 
    },
    mensaje_ids: { 
      type: [String], 
      default: [] 
    },
    ultimo_status: { 
      type: String, 
      default: '' 
    },
    tokens_consumidos: { 
      type: Number, 
      default: 0 
    },
    contactoInformado: { 
      type: Boolean, 
      default: false 
    }
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    collection: 'usuarios'
  }
);

// Índice compuesto para búsquedas rápidas por número y empresa
UsuarioSchema.index({ numero: 1, empresaId: 1 }, { unique: true });

// Método para convertir a formato legacy (con id en lugar de _id)
UsuarioSchema.methods.toUsuarioType = function(): UsuarioType {
  const obj = this.toObject();
  return {
    id: obj.numero, // Usamos el número como ID para mantener compatibilidad
    numero: obj.numero,
    nombre: obj.nombre,
    empresaId: obj.empresaId,
    empresaTelefono: obj.empresaTelefono,
    historial: obj.historial,
    interacciones: obj.interacciones,
    ultimaInteraccion: obj.ultimaInteraccion,
    ultima_actualizacion: obj.ultima_actualizacion,
    saludado: obj.saludado,
    despedido: obj.despedido,
    ultima_saludo: obj.ultima_saludo,
    resumen: obj.resumen,
    num_mensajes_enviados: obj.num_mensajes_enviados,
    num_mensajes_recibidos: obj.num_mensajes_recibidos,
    num_media_recibidos: obj.num_media_recibidos,
    mensaje_ids: obj.mensaje_ids,
    ultimo_status: obj.ultimo_status,
    tokens_consumidos: obj.tokens_consumidos,
    contactoInformado: obj.contactoInformado
  };
};

export const UsuarioModel = mongoose.model<IUsuario>('Usuario', UsuarioSchema);
