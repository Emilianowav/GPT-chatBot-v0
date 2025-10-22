// 💬 Modelo de Conversación del Bot (Estado de la conversación)
import mongoose, { Schema, Document } from 'mongoose';

/**
 * Estado de una conversación activa con el bot
 */
export interface IConversacionBot extends Document {
  empresaId: string;
  clienteTelefono: string;
  clienteId?: string;
  
  // Estado actual
  flujoActivo: 'menu_principal' | 'crear_turno' | 'consultar_turnos' | 'cancelar_turno';
  pasoActual: string;
  
  // Datos capturados durante la conversación
  datosCapturados: {
    fecha?: string;
    hora?: string;
    duracion?: number;
    agenteId?: string;
    [key: string]: any; // Campos dinámicos
  };
  
  // Historial de mensajes
  historial: {
    tipo: 'bot' | 'usuario';
    mensaje: string;
    timestamp: Date;
  }[];
  
  // Control de tiempo
  ultimaInteraccion: Date;
  iniciadaEn: Date;
  finalizadaEn?: Date;
  
  // Estado
  activa: boolean;
  completada: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const ConversacionBotSchema = new Schema<IConversacionBot>({
  empresaId: {
    type: String,
    required: true,
    index: true
  },
  
  clienteTelefono: {
    type: String,
    required: true,
    index: true
  },
  
  clienteId: {
    type: String,
    index: true
  },
  
  flujoActivo: {
    type: String,
    enum: ['menu_principal', 'crear_turno', 'consultar_turnos', 'cancelar_turno'],
    default: 'menu_principal'
  },
  
  pasoActual: {
    type: String,
    required: true,
    default: 'inicio'
  },
  
  datosCapturados: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },
  
  historial: [{
    tipo: {
      type: String,
      enum: ['bot', 'usuario'],
      required: true
    },
    mensaje: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  ultimaInteraccion: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  iniciadaEn: {
    type: Date,
    default: Date.now
  },
  
  finalizadaEn: {
    type: Date
  },
  
  activa: {
    type: Boolean,
    default: true,
    index: true
  },
  
  completada: {
    type: Boolean,
    default: false
  }
  
}, {
  timestamps: true
});

// Índices compuestos
ConversacionBotSchema.index({ empresaId: 1, clienteTelefono: 1, activa: 1 });
ConversacionBotSchema.index({ ultimaInteraccion: 1, activa: 1 });

// Método para agregar mensaje al historial
ConversacionBotSchema.methods.agregarMensaje = function(tipo: 'bot' | 'usuario', mensaje: string) {
  this.historial.push({
    tipo,
    mensaje,
    timestamp: new Date()
  });
  this.ultimaInteraccion = new Date();
};

// Método para actualizar datos capturados
ConversacionBotSchema.methods.actualizarDatos = function(clave: string, valor: any) {
  this.datosCapturados.set(clave, valor);
  this.markModified('datosCapturados');
};

// Método para finalizar conversación
ConversacionBotSchema.methods.finalizar = function(completada: boolean = true) {
  this.activa = false;
  this.completada = completada;
  this.finalizadaEn = new Date();
};

export const ConversacionBotModel = mongoose.model<IConversacionBot>(
  'ConversacionBot',
  ConversacionBotSchema
);
