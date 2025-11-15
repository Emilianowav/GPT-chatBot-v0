// 🔗 Modelo de Configuración de Integraciones Nativas
import mongoose, { Schema, Document } from 'mongoose';
import type {
  IntegrationType,
  IntegrationEstado,
  IIntegrationCredenciales,
  IIntegrationConfig,
  IIntegrationEstadisticas
} from '../types/api.types.js';

export interface IIntegrationConfiguration extends Document {
  empresaId: mongoose.Types.ObjectId;
  tipo: IntegrationType;
  nombre: string;
  descripcion?: string;
  estado: IntegrationEstado;
  credenciales: IIntegrationCredenciales;
  configuracion: IIntegrationConfig;
  webhooks?: Array<{
    evento: string;
    url: string;
    metodo: 'POST' | 'PUT';
    headers?: Record<string, string>;
    activo: boolean;
  }>;
  estadisticas: IIntegrationEstadisticas;
  creadoPor: mongoose.Types.ObjectId;
  actualizadoPor?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos
  isTokenExpired(): boolean;
  actualizarEstadisticas(exito: boolean): void;
}

const IntegrationCredencialesSchema = new Schema(
  {
    accessToken: String,
    refreshToken: String,
    expiresAt: Date,
    scope: [String],
    apiKey: String,
    apiSecret: String,
    metadata: Schema.Types.Mixed
  },
  { _id: false }
);

const IntegrationConfigSchema = new Schema(
  {
    // Google Calendar
    calendarId: String,
    timeZone: String,
    
    // Outlook Calendar
    mailboxId: String,
    
    // Google Sheets
    spreadsheetId: String,
    sheetName: String,
    
    // Zapier/Make
    webhookUrl: String,
    
    // General
    syncDirection: { 
      type: String, 
      enum: ['bidirectional', 'to_external', 'from_external'] 
    },
    autoSync: { type: Boolean, default: false },
    syncInterval: { type: Number, default: 15 },
    ultimoSync: Date,
    camposMapeados: Schema.Types.Mixed,
    metadata: Schema.Types.Mixed
  },
  { _id: false }
);

const IntegrationEstadisticasSchema = new Schema(
  {
    totalSyncs: { type: Number, default: 0 },
    syncsExitosos: { type: Number, default: 0 },
    syncsFallidos: { type: Number, default: 0 },
    ultimoSync: Date,
    ultimoError: {
      fecha: Date,
      mensaje: String
    }
  },
  { _id: false }
);

const IntegrationConfigurationSchema = new Schema<IIntegrationConfiguration>(
  {
    empresaId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Empresa',
      required: true,
      index: true 
    },
    tipo: { 
      type: String, 
      enum: [
        'google_calendar', 
        'outlook_calendar', 
        'google_sheets', 
        'zapier', 
        'make', 
        'hubspot', 
        'salesforce',
        'custom'
      ],
      required: true 
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
    estado: { 
      type: String, 
      enum: ['activo', 'inactivo', 'error', 'configurando'],
      default: 'configurando',
      required: true 
    },
    credenciales: { 
      type: IntegrationCredencialesSchema,
      required: true 
    },
    configuracion: { 
      type: IntegrationConfigSchema,
      default: () => ({
        autoSync: false,
        syncInterval: 15
      })
    },
    webhooks: [{
      evento: { type: String, required: true },
      url: { type: String, required: true },
      metodo: { 
        type: String, 
        enum: ['POST', 'PUT'],
        default: 'POST' 
      },
      headers: Schema.Types.Mixed,
      activo: { type: Boolean, default: true }
    }],
    estadisticas: { 
      type: IntegrationEstadisticasSchema,
      default: () => ({
        totalSyncs: 0,
        syncsExitosos: 0,
        syncsFallidos: 0
      })
    },
    creadoPor: { 
      type: Schema.Types.ObjectId, 
      ref: 'Usuario',
      required: true 
    },
    actualizadoPor: { 
      type: Schema.Types.ObjectId, 
      ref: 'Usuario' 
    }
  },
  {
    timestamps: true,
    collection: 'integration_configurations'
  }
);

// Índices
IntegrationConfigurationSchema.index({ empresaId: 1, tipo: 1 });
IntegrationConfigurationSchema.index({ empresaId: 1, estado: 1 });

// Método para verificar si el token está expirado
IntegrationConfigurationSchema.methods.isTokenExpired = function(): boolean {
  if (!this.credenciales.expiresAt) return false;
  return new Date() >= this.credenciales.expiresAt;
};

// Método para actualizar estadísticas
IntegrationConfigurationSchema.methods.actualizarEstadisticas = function(exito: boolean) {
  this.estadisticas.totalSyncs++;
  if (exito) {
    this.estadisticas.syncsExitosos++;
    this.estadisticas.ultimoSync = new Date();
  } else {
    this.estadisticas.syncsFallidos++;
  }
};

export const IntegrationConfigurationModel = mongoose.model<IIntegrationConfiguration>(
  'IntegrationConfiguration', 
  IntegrationConfigurationSchema
);
