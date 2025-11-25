// 👤 Modelo Unificado de Contacto/Cliente/Usuario
// UNIFICA: Usuario.ts + Cliente.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface PreferenciasComunicacion {
  aceptaWhatsApp: boolean;
  aceptaSMS: boolean;
  aceptaEmail: boolean;
  recordatorioTurnos: boolean;
  diasAnticipacionRecordatorio: number;
  horaRecordatorio: string;
  notificacionesPromocion: boolean;
  notificacionesDisponibilidad: boolean;
}

export interface ConversacionesGPT {
  historial: string[];           // Historial de mensajes con GPT
  ultimaConversacion: Date;
  saludado: boolean;
  despedido: boolean;
  ultima_saludo?: string;
  resumen?: string;
  mensaje_ids: string[];
  ultimo_status: string;
  contactoInformado: boolean;
}

export interface MetricasContacto {
  interacciones: number;
  mensajesEnviados: number;
  mensajesRecibidos: number;
  mediaRecibidos: number;
  tokensConsumidos: number;
  turnosRealizados: number;
  turnosCancelados: number;
  ultimaInteraccion: Date;
}

export interface WorkflowState {
  workflowId: string;
  apiId: string;
  pasoActual: number;
  datosRecopilados: Record<string, any>;
  datosEjecutados?: Record<string, any>;
  intentosFallidos: number;
  iniciadoEn: Date;
  ultimaActividad: Date;
}

export interface IContactoEmpresa extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Identificación
  empresaId: string;              // Nombre de la empresa (NO ObjectId)
  telefono: string;               // NORMALIZADO (sin +, espacios, guiones)
  
  // Datos personales
  nombre: string;
  apellido: string;
  email?: string;
  profileName?: string;           // Nombre de WhatsApp
  
  // Datos adicionales (CRM)
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  fechaNacimiento?: Date;
  dni?: string;
  sector?: string;                // Sector asignado
  notas?: string;
  
  // Origen y tracking
  origen: 'chatbot' | 'manual' | 'importacion';
  
  // Preferencias de comunicación
  preferencias: PreferenciasComunicacion;
  
  // Historial de conversaciones (GPT)
  conversaciones: ConversacionesGPT;
  
  // Métricas
  metricas: MetricasContacto;
  
  // Estado de workflow activo
  workflowState?: WorkflowState;
  
  // Estado
  activo: boolean;
  
  // Timestamps
  creadoEn: Date;
  actualizadoEn: Date;
}

const ContactoEmpresaSchema = new Schema<IContactoEmpresa>({
  empresaId: {
    type: String,
    required: true,
    index: true
  },
  telefono: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Datos personales
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
  profileName: {
    type: String,
    trim: true
  },
  
  // Datos adicionales
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
  sector: {
    type: String,
    trim: true
  },
  notas: {
    type: String
  },
  
  // Origen
  origen: {
    type: String,
    enum: ['chatbot', 'manual', 'importacion'],
    required: true,
    default: 'chatbot'
  },
  
  // Preferencias
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
  
  // Conversaciones GPT
  conversaciones: {
    type: {
      historial: { type: [String], default: [] },
      ultimaConversacion: { type: Date, default: Date.now },
      saludado: { type: Boolean, default: false },
      despedido: { type: Boolean, default: false },
      ultima_saludo: String,
      resumen: String,
      mensaje_ids: { type: [String], default: [] },
      ultimo_status: { type: String, default: '' },
      contactoInformado: { type: Boolean, default: false }
    },
    default: () => ({
      historial: [],
      ultimaConversacion: new Date(),
      saludado: false,
      despedido: false,
      mensaje_ids: [],
      ultimo_status: '',
      contactoInformado: false
    })
  },
  
  // Métricas
  metricas: {
    type: {
      interacciones: { type: Number, default: 0 },
      mensajesEnviados: { type: Number, default: 0 },
      mensajesRecibidos: { type: Number, default: 0 },
      mediaRecibidos: { type: Number, default: 0 },
      tokensConsumidos: { type: Number, default: 0 },
      turnosRealizados: { type: Number, default: 0 },
      turnosCancelados: { type: Number, default: 0 },
      ultimaInteraccion: { type: Date, default: Date.now }
    },
    default: () => ({
      interacciones: 0,
      mensajesEnviados: 0,
      mensajesRecibidos: 0,
      mediaRecibidos: 0,
      tokensConsumidos: 0,
      turnosRealizados: 0,
      turnosCancelados: 0,
      ultimaInteraccion: new Date()
    })
  },
  
  // Estado de workflow activo
  workflowState: {
    type: {
      workflowId: String,
      apiId: String,
      pasoActual: Number,
      datosRecopilados: Schema.Types.Mixed,
      intentosFallidos: Number,
      iniciadoEn: Date,
      ultimaActividad: Date
    },
    required: false
  },
  
  // Estado
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: {
    createdAt: 'creadoEn',
    updatedAt: 'actualizadoEn'
  },
  collection: 'contactos_empresa'
});

// Índices compuestos
ContactoEmpresaSchema.index({ empresaId: 1, telefono: 1 }, { unique: true });
ContactoEmpresaSchema.index({ empresaId: 1, email: 1 });
ContactoEmpresaSchema.index({ empresaId: 1, activo: 1 });
ContactoEmpresaSchema.index({ empresaId: 1, sector: 1 });
ContactoEmpresaSchema.index({ 'metricas.ultimaInteraccion': 1 });

// Middleware para actualizar fecha de modificación
ContactoEmpresaSchema.pre('save', function(next) {
  this.actualizadoEn = new Date();
  next();
});

export const ContactoEmpresaModel = mongoose.model<IContactoEmpresa>(
  'ContactoEmpresa',
  ContactoEmpresaSchema
);
