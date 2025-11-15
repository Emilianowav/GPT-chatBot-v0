// 🔧 Modelo de Configuración de API
import mongoose, { Schema, Document } from 'mongoose';
import type {
  ApiType,
  ApiEstado,
  IAuthConfiguration,
  IEndpoint,
  IApiConfiguracion,
  IApiEstadisticas,
  IChatbotIntegration
} from '../types/api.types.js';

export interface IApiConfiguration extends Document {
  empresaId: mongoose.Types.ObjectId;
  nombre: string;
  descripcion?: string;
  tipo: ApiType;
  estado: ApiEstado;
  baseUrl: string;
  version?: string;
  autenticacion: IAuthConfiguration;
  endpoints: IEndpoint[];
  configuracion: IApiConfiguracion;
  estadisticas: IApiEstadisticas;
  chatbotIntegration?: IChatbotIntegration;
  creadoPor: mongoose.Types.ObjectId;
  actualizadoPor?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos
  findEndpoint(endpointId: string): IEndpoint | undefined;
  actualizarEstadisticas(exito: boolean, tiempoRespuesta: number): void;
}

const ParameterDefinitionSchema = new Schema(
  {
    nombre: { type: String, required: true },
    tipo: { 
      type: String, 
      enum: ['string', 'number', 'boolean', 'array', 'object'],
      required: true 
    },
    requerido: { type: Boolean, default: false },
    descripcion: String,
    valorPorDefecto: Schema.Types.Mixed,
    validacion: {
      min: Number,
      max: Number,
      pattern: String,
      enum: [Schema.Types.Mixed]
    }
  },
  { _id: false }
);

const BodyDefinitionSchema = new Schema(
  {
    tipo: { 
      type: String, 
      enum: ['json', 'form-data', 'xml', 'text'],
      required: true 
    },
    schema: Schema.Types.Mixed,
    ejemplo: Schema.Types.Mixed,
    descripcion: String
  },
  { _id: false }
);

const EndpointParametrosSchema = new Schema(
  {
    path: [ParameterDefinitionSchema],
    query: [ParameterDefinitionSchema],
    body: BodyDefinitionSchema,
    headers: Schema.Types.Mixed
  },
  { _id: false }
);

const RateLimitingSchema = new Schema(
  {
    habilitado: { type: Boolean, default: false },
    maxRequests: { type: Number, default: 100 },
    ventanaTiempo: { type: Number, default: 60 }
  },
  { _id: false }
);

const CacheSchema = new Schema(
  {
    habilitado: { type: Boolean, default: false },
    ttl: { type: Number, default: 300 },
    estrategia: { 
      type: String, 
      enum: ['simple', 'lru', 'lfu'],
      default: 'simple'
    }
  },
  { _id: false }
);

const EndpointSchema = new Schema(
  {
    id: { type: String, required: true },
    nombre: { type: String, required: true },
    descripcion: String,
    metodo: { 
      type: String, 
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      required: true 
    },
    path: { type: String, required: true },
    parametros: EndpointParametrosSchema,
    respuesta: {
      schema: Schema.Types.Mixed,
      ejemploExito: Schema.Types.Mixed,
      ejemploError: Schema.Types.Mixed
    },
    mapeo: {
      entrada: Schema.Types.Mixed,
      salida: Schema.Types.Mixed
    },
    rateLimiting: RateLimitingSchema,
    cache: CacheSchema,
    timeout: Number,
    activo: { type: Boolean, default: true }
  },
  { _id: false }
);

const AuthConfigurationSchema = new Schema(
  {
    tipo: { 
      type: String, 
      enum: ['bearer', 'api_key', 'oauth2', 'basic', 'custom', 'none'],
      required: true 
    },
    configuracion: {
      token: String,
      headerName: String,
      apiKey: String,
      apiKeyLocation: { 
        type: String, 
        enum: ['header', 'query', 'body'] 
      },
      apiKeyName: String,
      clientId: String,
      clientSecret: String,
      authUrl: String,
      tokenUrl: String,
      refreshToken: String,
      accessToken: String,
      expiresAt: Date,
      scope: [String],
      username: String,
      password: String,
      customHeaders: Schema.Types.Mixed
    }
  },
  { _id: false }
);

const ApiConfiguracionSchema = new Schema(
  {
    timeout: { type: Number, default: 30000 },
    reintentos: { type: Number, default: 3 },
    reintentarEn: { type: [Number], default: [1000, 2000, 4000] },
    rateLimiting: RateLimitingSchema,
    webhooks: [{
      evento: { 
        type: String, 
        enum: ['success', 'error', 'timeout'],
        required: true 
      },
      url: { type: String, required: true },
      metodo: { 
        type: String, 
        enum: ['POST', 'PUT'],
        default: 'POST' 
      },
      headers: Schema.Types.Mixed
    }]
  },
  { _id: false }
);

const ApiEstadisticasSchema = new Schema(
  {
    totalLlamadas: { type: Number, default: 0 },
    llamadasExitosas: { type: Number, default: 0 },
    llamadasFallidas: { type: Number, default: 0 },
    ultimaLlamada: Date,
    ultimoError: {
      fecha: Date,
      mensaje: String,
      codigo: String
    },
    tiempoPromedioRespuesta: { type: Number, default: 0 }
  },
  { _id: false }
);

const ParametroExtraccionSchema = new Schema(
  {
    nombre: { type: String, required: true },
    extraerDe: { 
      type: String, 
      enum: ['mensaje', 'fijo'],
      required: true 
    },
    valorFijo: String,
    regex: String,
    descripcion: String
  },
  { _id: false }
);

const KeywordConfigSchema = new Schema(
  {
    palabra: { type: String, required: true },
    endpointId: { type: String, required: true },
    descripcion: String,
    extraerParametros: { type: Boolean, default: false },
    parametrosConfig: [ParametroExtraccionSchema],
    respuestaTemplate: { type: String, required: true },
    ejemplos: [String]
  },
  { _id: false }
);

const ChatbotIntegrationSchema = new Schema(
  {
    habilitado: { type: Boolean, default: false },
    chatbotId: { type: String, required: true },
    keywords: [KeywordConfigSchema],
    mensajeAyuda: String
  },
  { _id: false }
);

const ApiConfigurationSchema = new Schema<IApiConfiguration>(
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
    tipo: { 
      type: String, 
      enum: ['rest', 'graphql', 'soap'],
      default: 'rest',
      required: true 
    },
    estado: { 
      type: String, 
      enum: ['activo', 'inactivo', 'error'],
      default: 'activo',
      required: true 
    },
    baseUrl: { 
      type: String, 
      required: true,
      trim: true 
    },
    version: { 
      type: String,
      trim: true 
    },
    autenticacion: { 
      type: AuthConfigurationSchema,
      required: true 
    },
    endpoints: [EndpointSchema],
    configuracion: { 
      type: ApiConfiguracionSchema,
      default: () => ({
        timeout: 30000,
        reintentos: 3,
        reintentarEn: [1000, 2000, 4000]
      })
    },
    estadisticas: { 
      type: ApiEstadisticasSchema,
      default: () => ({
        totalLlamadas: 0,
        llamadasExitosas: 0,
        llamadasFallidas: 0,
        tiempoPromedioRespuesta: 0
      })
    },
    chatbotIntegration: ChatbotIntegrationSchema,
    creadoPor: { 
      type: Schema.Types.ObjectId, 
      ref: 'Usuario',
      required: false // Opcional para permitir creación sin autenticación
    },
    actualizadoPor: { 
      type: Schema.Types.ObjectId, 
      ref: 'Usuario' 
    }
  },
  {
    timestamps: true,
    collection: 'api_configurations'
  }
);

// Índices compuestos para optimización
ApiConfigurationSchema.index({ empresaId: 1, estado: 1 });
ApiConfigurationSchema.index({ empresaId: 1, nombre: 1 });
ApiConfigurationSchema.index({ 'endpoints.id': 1 });

// Método para encontrar endpoint por ID
ApiConfigurationSchema.methods.findEndpoint = function(endpointId: string) {
  return this.endpoints.find((ep: IEndpoint) => ep.id === endpointId);
};

// Método para actualizar estadísticas
ApiConfigurationSchema.methods.actualizarEstadisticas = function(
  exito: boolean, 
  tiempoRespuesta: number
) {
  this.estadisticas.totalLlamadas++;
  if (exito) {
    this.estadisticas.llamadasExitosas++;
  } else {
    this.estadisticas.llamadasFallidas++;
  }
  this.estadisticas.ultimaLlamada = new Date();
  
  // Calcular tiempo promedio
  const total = this.estadisticas.totalLlamadas;
  const promedioActual = this.estadisticas.tiempoPromedioRespuesta || 0;
  this.estadisticas.tiempoPromedioRespuesta = 
    (promedioActual * (total - 1) + tiempoRespuesta) / total;
};

export const ApiConfigurationModel = mongoose.model<IApiConfiguration>(
  'ApiConfiguration', 
  ApiConfigurationSchema
);
