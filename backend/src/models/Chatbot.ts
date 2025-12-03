// 🤖 Modelo de Chatbot - Cada empresa puede tener múltiples chatbots
import mongoose, { Schema, Document } from 'mongoose';

export interface IChatbot extends Document {
  empresaId: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  
  // Credenciales WhatsApp Business API
  whatsapp: {
    phoneNumberId: string;      // ID del número de teléfono en Meta
    businessAccountId: string;  // ID de la cuenta de negocio
    accessToken: string;         // Token de acceso (encriptado)
    webhookVerifyToken: string;  // Token de verificación del webhook
    numeroTelefono: string;      // Número de teléfono formateado (ej: +5493794044145)
  };
  
  // Configuración del bot
  configuracion: {
    modelo: string;              // gpt-3.5-turbo, gpt-4, etc.
    prompt: string;              // Prompt del sistema
    temperatura?: number;        // 0-1 para creatividad
    maxTokens?: number;
    timeoutMinutos: number;      // Timeout de conversación
    
    // Mensajes predefinidos
    mensajeBienvenida?: string;
    mensajeDespedida?: string;
    mensajeError?: string;
    mensajeFueraHorario?: string;
    
    // Horarios de atención
    horariosAtencion?: {
      activo: boolean;
      inicio: string;            // HH:mm
      fin: string;               // HH:mm
      diasSemana: number[];      // 0=Domingo, 1=Lunes, ..., 6=Sábado
      zonaHoraria: string;       // America/Argentina/Buenos_Aires
    };
  };
  
  // Derivación y contactos
  derivacion?: {
    habilitado: boolean;
    numerosDerivacion: string[]; // Números a los que derivar
    palabrasClave?: string[];    // Keywords que activan derivación
  };
  
  // Estadísticas
  estadisticas: {
    conversacionesTotales: number;
    conversacionesActivas: number;
    mensajesEnviados: number;
    mensajesRecibidos: number;
    ultimaActividad?: Date;
  };
  
  // Metadatos
  createdAt: Date;
  updatedAt: Date;
}

const ChatbotSchema = new Schema<IChatbot>({
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
  descripcion: {
    type: String,
    trim: true
  },
  activo: {
    type: Boolean,
    default: true
  },
  
  whatsapp: {
    phoneNumberId: {
      type: String,
      required: true
    },
    businessAccountId: {
      type: String,
      required: true
    },
    accessToken: {
      type: String,
      required: true
    },
    webhookVerifyToken: {
      type: String,
      required: true
    },
    numeroTelefono: {
      type: String,
      required: true
    }
  },
  
  configuracion: {
    modelo: {
      type: String,
      default: 'gpt-3.5-turbo'
    },
    prompt: {
      type: String,
      required: true
    },
    temperatura: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 1
    },
    maxTokens: {
      type: Number,
      default: 500
    },
    timeoutMinutos: {
      type: Number,
      default: 10
    },
    mensajeBienvenida: String,
    mensajeDespedida: String,
    mensajeError: String,
    mensajeFueraHorario: String,
    horariosAtencion: {
      activo: {
        type: Boolean,
        default: false
      },
      inicio: String,
      fin: String,
      diasSemana: [Number],
      zonaHoraria: {
        type: String,
        default: 'America/Argentina/Buenos_Aires'
      }
    }
  },
  
  derivacion: {
    habilitado: {
      type: Boolean,
      default: false
    },
    numerosDerivacion: [String],
    palabrasClave: [String]
  },
  
  estadisticas: {
    conversacionesTotales: {
      type: Number,
      default: 0
    },
    conversacionesActivas: {
      type: Number,
      default: 0
    },
    mensajesEnviados: {
      type: Number,
      default: 0
    },
    mensajesRecibidos: {
      type: Number,
      default: 0
    },
    ultimaActividad: Date
  }
}, {
  timestamps: true
});

// Índices
ChatbotSchema.index({ empresaId: 1, activo: 1 });
ChatbotSchema.index({ 'whatsapp.phoneNumberId': 1 }, { unique: true });
ChatbotSchema.index({ 'whatsapp.numeroTelefono': 1 });

export const ChatbotModel = mongoose.model<IChatbot>('Chatbot', ChatbotSchema);
