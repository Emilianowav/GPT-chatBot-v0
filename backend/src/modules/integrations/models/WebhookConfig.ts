// 🪝 Modelo de Configuración de Webhooks
import mongoose, { Schema, Document } from 'mongoose';
import type {
  HttpMethod,
  IWebhookSeguridad,
  IWebhookConfiguracion,
  IWebhookEstadisticas
} from '../types/api.types.js';

export interface IWebhookConfiguration extends Document {
  empresaId: mongoose.Types.ObjectId;
  nombre: string;
  descripcion?: string;
  webhookUrl: string;
  webhookId: string;
  seguridad: IWebhookSeguridad;
  configuracion: IWebhookConfiguracion;
  estadisticas: IWebhookEstadisticas;
  estado: 'activo' | 'inactivo';
  creadoPor: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos
  actualizarEstadisticas(exito: boolean): void;
}

const WebhookSeguridadSchema = new Schema(
  {
    tipo: { 
      type: String, 
      enum: ['none', 'secret', 'signature', 'ip_whitelist'],
      default: 'none',
      required: true 
    },
    secret: String,
    signatureHeader: String,
    signatureAlgorithm: { 
      type: String, 
      enum: ['sha256', 'sha1', 'md5'] 
    },
    ipWhitelist: [String]
  },
  { _id: false }
);

const WebhookProcesamientoSchema = new Schema(
  {
    tipo: { 
      type: String, 
      enum: ['inmediato', 'cola', 'programado'],
      default: 'inmediato',
      required: true 
    },
    accion: { 
      type: String, 
      enum: ['guardar', 'ejecutar_flujo', 'llamar_api', 'custom'],
      required: true 
    },
    flujoId: String,
    apiConfigId: { type: Schema.Types.ObjectId, ref: 'ApiConfiguration' },
    endpointId: String,
    customHandler: String
  },
  { _id: false }
);

const WebhookTransformacionSchema = new Schema(
  {
    mapeo: { type: Schema.Types.Mixed, required: true },
    script: String
  },
  { _id: false }
);

const WebhookRespuestaSchema = new Schema(
  {
    statusCode: { type: Number, default: 200 },
    body: Schema.Types.Mixed,
    headers: Schema.Types.Mixed
  },
  { _id: false }
);

const WebhookConfiguracionSchema = new Schema(
  {
    metodosPermitidos: { 
      type: [String], 
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      default: ['POST'],
      required: true 
    },
    procesamiento: { 
      type: WebhookProcesamientoSchema,
      required: true 
    },
    transformacion: WebhookTransformacionSchema,
    respuestaPersonalizada: WebhookRespuestaSchema
  },
  { _id: false }
);

const WebhookEstadisticasSchema = new Schema(
  {
    totalLlamadas: { type: Number, default: 0 },
    llamadasExitosas: { type: Number, default: 0 },
    llamadasFallidas: { type: Number, default: 0 },
    ultimaLlamada: Date
  },
  { _id: false }
);

const WebhookConfigurationSchema = new Schema<IWebhookConfiguration>(
  {
    empresaId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Empresa',
      required: true,
      index: true 
    },
    nombre: { 
      type: String, 
      required: true,
      trim: true 
    },
    descripcion: { 
      type: String,
      trim: true 
    },
    webhookUrl: { 
      type: String, 
      required: true,
      unique: true,
      index: true 
    },
    webhookId: { 
      type: String, 
      required: true,
      unique: true,
      index: true 
    },
    seguridad: { 
      type: WebhookSeguridadSchema,
      default: () => ({ tipo: 'none' })
    },
    configuracion: { 
      type: WebhookConfiguracionSchema,
      required: true 
    },
    estadisticas: { 
      type: WebhookEstadisticasSchema,
      default: () => ({
        totalLlamadas: 0,
        llamadasExitosas: 0,
        llamadasFallidas: 0
      })
    },
    estado: { 
      type: String, 
      enum: ['activo', 'inactivo'],
      default: 'activo',
      required: true 
    },
    creadoPor: { 
      type: Schema.Types.ObjectId, 
      ref: 'Usuario',
      required: true 
    }
  },
  {
    timestamps: true,
    collection: 'webhook_configurations'
  }
);

// Índices
WebhookConfigurationSchema.index({ empresaId: 1, estado: 1 });
WebhookConfigurationSchema.index({ webhookId: 1 }, { unique: true });

// Método para actualizar estadísticas
WebhookConfigurationSchema.methods.actualizarEstadisticas = function(exito: boolean) {
  this.estadisticas.totalLlamadas++;
  if (exito) {
    this.estadisticas.llamadasExitosas++;
  } else {
    this.estadisticas.llamadasFallidas++;
  }
  this.estadisticas.ultimaLlamada = new Date();
};

export const WebhookConfigurationModel = mongoose.model<IWebhookConfiguration>(
  'WebhookConfiguration', 
  WebhookConfigurationSchema
);
