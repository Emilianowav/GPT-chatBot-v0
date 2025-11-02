// 🔄 Modelo de Flujos Dinámicos del Chatbot
import mongoose, { Schema, Document } from 'mongoose';

export enum TipoFlujo {
  CONFIRMACION_TURNOS = 'confirmacion_turnos',
  BOT_TURNOS = 'bot_turnos',
  OPENAI_GENERAL = 'openai_general',
  PERSONALIZADO = 'personalizado'
}

export enum TipoDisparador {
  SESION_ACTIVA = 'sesion_activa',          // Tiene sesión activa en este flujo
  PALABRA_CLAVE = 'palabra_clave',          // Mensaje contiene palabra clave
  PATRON_REGEX = 'patron_regex',            // Mensaje coincide con regex
  TURNOS_PENDIENTES = 'turnos_pendientes',  // Cliente tiene turnos pendientes
  HORARIO = 'horario',                      // Dentro de horario específico
  SIEMPRE = 'siempre',                      // Siempre se ejecuta (fallback)
  NUNCA = 'nunca'                           // Desactivado
}

export interface IDisparador {
  tipo: TipoDisparador;
  valor?: string | string[];  // Palabra clave, regex, etc.
  config?: any;               // Configuración adicional
}

export interface IFlujo extends Document {
  empresaId: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoFlujo;
  
  // Sistema de prioridades (1 = máxima prioridad)
  prioridad: number;
  
  // Disparadores que activan este flujo
  disparadores: IDisparador[];
  
  // Configuración específica del flujo
  configuracion: {
    // Para confirmación de turnos
    camposEditables?: string[];
    mensajeInicial?: string;
    
    // Para bot de turnos
    mensajeBienvenida?: string;
    opcionesMenu?: string[];
    
    // Para OpenAI
    systemPrompt?: string;
    temperatura?: number;
    
    // Personalizado
    handlerFunction?: string;  // Nombre de la función handler
    [key: string]: any;
  };
  
  // Control
  activo: boolean;
  
  // Metadata
  creadoEn: Date;
  actualizadoEn: Date;
  creadoPor: string;
}

const FlujoSchema = new Schema<IFlujo>(
  {
    empresaId: {
      type: String,
      required: true,
      index: true
    },
    nombre: {
      type: String,
      required: true
    },
    descripcion: {
      type: String
    },
    tipo: {
      type: String,
      enum: Object.values(TipoFlujo),
      required: true
    },
    prioridad: {
      type: Number,
      required: true,
      default: 100
    },
    disparadores: [{
      tipo: {
        type: String,
        enum: Object.values(TipoDisparador),
        required: true
      },
      valor: {
        type: Schema.Types.Mixed
      },
      config: {
        type: Schema.Types.Mixed
      }
    }],
    configuracion: {
      type: Schema.Types.Mixed,
      default: {}
    },
    activo: {
      type: Boolean,
      default: true
    },
    creadoPor: {
      type: String,
      default: 'sistema'
    }
  },
  {
    timestamps: {
      createdAt: 'creadoEn',
      updatedAt: 'actualizadoEn'
    }
  }
);

// Índices
FlujoSchema.index({ empresaId: 1, prioridad: 1 });
FlujoSchema.index({ empresaId: 1, activo: 1, prioridad: 1 });

export const FlujoModel = mongoose.model<IFlujo>('Flujo', FlujoSchema);
