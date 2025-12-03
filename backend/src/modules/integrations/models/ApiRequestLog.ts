// 📝 Modelo de Log de Peticiones API
import mongoose, { Schema, Document } from 'mongoose';
import type {
  RequestEstado,
  IRequestData,
  IResponseData,
  IErrorData,
  IRequestContext
} from '../types/api.types.js';

export interface IApiRequestLog extends Document {
  empresaId: mongoose.Types.ObjectId;
  apiConfigId: mongoose.Types.ObjectId;
  endpointId: string;
  request: IRequestData;
  response?: IResponseData;
  error?: IErrorData;
  contexto?: IRequestContext;
  estado: RequestEstado;
  createdAt: Date;
}

const RequestDataSchema = new Schema(
  {
    metodo: { type: String, required: true },
    url: { type: String, required: true },
    headers: { type: Schema.Types.Mixed, default: {} },
    parametros: Schema.Types.Mixed,
    body: Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const ResponseDataSchema = new Schema(
  {
    statusCode: { type: Number, required: true },
    headers: { type: Schema.Types.Mixed, default: {} },
    body: Schema.Types.Mixed,
    tiempoRespuesta: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const ErrorDataSchema = new Schema(
  {
    mensaje: { type: String, required: true },
    codigo: String,
    stack: String
  },
  { _id: false }
);

const RequestContextSchema = new Schema(
  {
    usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    clienteId: { type: Schema.Types.ObjectId, ref: 'Cliente' },
    conversacionId: Schema.Types.ObjectId,
    flujoId: String,
    metadata: Schema.Types.Mixed
  },
  { _id: false }
);

const ApiRequestLogSchema = new Schema<IApiRequestLog>(
  {
    empresaId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Empresa',
      required: true,
      index: true 
    },
    apiConfigId: { 
      type: Schema.Types.ObjectId, 
      ref: 'ApiConfiguration',
      required: true,
      index: true 
    },
    endpointId: { 
      type: String, 
      required: true,
      index: true 
    },
    request: { 
      type: RequestDataSchema,
      required: true 
    },
    response: ResponseDataSchema,
    error: ErrorDataSchema,
    contexto: RequestContextSchema,
    estado: { 
      type: String, 
      enum: ['success', 'error', 'timeout'],
      required: true,
      index: true 
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'api_request_logs'
  }
);

// Índices compuestos para consultas eficientes
ApiRequestLogSchema.index({ empresaId: 1, createdAt: -1 });
ApiRequestLogSchema.index({ apiConfigId: 1, createdAt: -1 });
ApiRequestLogSchema.index({ apiConfigId: 1, endpointId: 1, createdAt: -1 });
ApiRequestLogSchema.index({ estado: 1, createdAt: -1 });

// TTL Index: Eliminar logs después de 30 días
ApiRequestLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export const ApiRequestLogModel = mongoose.model<IApiRequestLog>(
  'ApiRequestLog', 
  ApiRequestLogSchema
);
