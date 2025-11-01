// 🤖 Modelo de Configuración del Bot de Turnos
import mongoose, { Schema, Document } from 'mongoose';

/**
 * Paso del flujo del bot
 */
export interface PasoBot {
  id: string;
  orden: number; // Orden de ejecución
  activo: boolean; // Si está activo o no
  tipo: 'menu' | 'input' | 'confirmacion' | 'finalizar';
  etiqueta: string; // Nombre descriptivo del paso (ej: "Solicitar Fecha")
  mensaje: string; // Mensaje que muestra el bot
  
  // Para tipo 'input'
  campoACapturar?: string; // Nombre del campo (ej: "fecha", "hora", "nombre")
  guardarEn?: 'datos' | 'turno'; // Dónde guardar: datos del turno o datos adicionales
  claveGuardado?: string; // Clave específica para guardar (ej: "datos.origen")
  
  // Validación
  validacion?: {
    tipo: 'fecha' | 'hora' | 'numero' | 'texto' | 'email' | 'telefono';
    requerido: boolean;
    min?: number;
    max?: number;
    formato?: string; // Para regex personalizado
    mensajeError?: string;
  };
  
  // Para tipo 'menu'
  opciones?: {
    numero: number;
    texto: string;
    siguientePaso?: string; // ID del siguiente paso
    finalizarFlujo?: boolean; // Si esta opción termina el flujo
  }[];
  
  // Navegación
  siguientePaso?: string; // ID del siguiente paso (para input)
  finalizarFlujo?: boolean; // Si este paso termina el flujo
  
  // Acciones especiales
  accion?: 'crear_turno' | 'consultar_turnos' | 'cancelar_turno' | 'ninguna';
}

/**
 * Flujo completo del bot
 */
export interface FlujoBot {
  nombre: string;
  descripcion: string;
  pasoInicial: string;
  pasos: PasoBot[];
}

/**
 * Configuración del Bot
 */
export interface IConfiguracionBot extends Document {
  empresaId: string;
  activo: boolean;
  
  // Configuración general
  mensajeBienvenida: string;
  mensajeDespedida: string;
  mensajeError: string;
  timeoutMinutos: number; // Tiempo de inactividad antes de reiniciar
  
  // Flujos disponibles
  flujos: {
    crearTurno: FlujoBot;
    consultarTurnos: FlujoBot;
    cancelarTurno: FlujoBot;
  };
  
  // Configuración de horarios
  horariosAtencion?: {
    activo: boolean;
    inicio: string; // "09:00"
    fin: string; // "18:00"
    diasSemana: number[]; // 0-6 (domingo-sábado)
    mensajeFueraHorario: string;
  };
  
  // Opciones avanzadas
  requiereConfirmacion: boolean;
  permiteCancelacion: boolean;
  notificarAdmin: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const ConfiguracionBotSchema = new Schema<IConfiguracionBot>({
  empresaId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  activo: {
    type: Boolean,
    default: false
  },
  
  mensajeBienvenida: {
    type: String,
    default: '¡Hola! 👋 Soy tu asistente virtual.\n\n¿En qué puedo ayudarte?\n\n1️⃣ Agendar turno\n2️⃣ Consultar mis turnos\n3️⃣ Cancelar turno\n\nEscribe el número de la opción.'
  },
  
  mensajeDespedida: {
    type: String,
    default: '¡Hasta pronto! 👋 Si necesitas algo más, escríbeme.'
  },
  
  mensajeError: {
    type: String,
    default: '❌ No entendí tu respuesta. Por favor, elige una opción válida.'
  },
  
  timeoutMinutos: {
    type: Number,
    default: 10
  },
  
  flujos: {
    type: {
      crearTurno: {
        nombre: String,
        descripcion: String,
        pasoInicial: String,
        pasos: [{
          id: String,
          orden: Number,
          activo: { type: Boolean, default: true },
          tipo: {
            type: String,
            enum: ['menu', 'input', 'confirmacion', 'finalizar']
          },
          etiqueta: String,
          mensaje: String,
          campoACapturar: String,
          guardarEn: {
            type: String,
            enum: ['datos', 'turno']
          },
          claveGuardado: String,
          validacion: {
            tipo: {
              type: String,
              enum: ['fecha', 'hora', 'numero', 'texto', 'email', 'telefono']
            },
            requerido: Boolean,
            min: Number,
            max: Number,
            formato: String,
            mensajeError: String
          },
          opciones: [{
            numero: Number,
            texto: String,
            siguientePaso: String,
            finalizarFlujo: Boolean
          }],
          siguientePaso: String,
          finalizarFlujo: Boolean,
          accion: {
            type: String,
            enum: ['crear_turno', 'consultar_turnos', 'cancelar_turno', 'ninguna']
          }
        }]
      },
      consultarTurnos: {
        nombre: String,
        descripcion: String,
        pasoInicial: String,
        pasos: [{
          id: String,
          tipo: String,
          mensaje: String,
          opciones: [{
            numero: Number,
            texto: String,
            siguientePaso: String,
            accion: String
          }],
          siguientePaso: String
        }]
      },
      cancelarTurno: {
        nombre: String,
        descripcion: String,
        pasoInicial: String,
        pasos: [{
          id: String,
          tipo: String,
          mensaje: String,
          opciones: [{
            numero: Number,
            texto: String,
            siguientePaso: String,
            accion: String
          }],
          campoACapturar: String,
          siguientePaso: String
        }]
      }
    },
    default: {
      crearTurno: {
        nombre: 'Crear Turno',
        descripcion: 'Flujo para agendar un nuevo turno',
        pasoInicial: 'seleccionar_fecha',
        pasos: []
      },
      consultarTurnos: {
        nombre: 'Consultar Turnos',
        descripcion: 'Flujo para ver turnos agendados',
        pasoInicial: 'mostrar_turnos',
        pasos: []
      },
      cancelarTurno: {
        nombre: 'Cancelar Turno',
        descripcion: 'Flujo para cancelar un turno',
        pasoInicial: 'listar_turnos',
        pasos: []
      }
    }
  },
  
  horariosAtencion: {
    type: {
      activo: Boolean,
      inicio: String,
      fin: String,
      diasSemana: [Number],
      mensajeFueraHorario: String
    },
    default: {
      activo: false, // Desactivado por defecto para funcionamiento 24/7
      inicio: '00:00',
      fin: '23:59',
      diasSemana: [0, 1, 2, 3, 4, 5, 6], // Todos los días
      mensajeFueraHorario: '⏰ Nuestro horario de atención es de {inicio} a {fin}.'
    }
  },
  
  requiereConfirmacion: {
    type: Boolean,
    default: true
  },
  
  permiteCancelacion: {
    type: Boolean,
    default: true
  },
  
  notificarAdmin: {
    type: Boolean,
    default: true
  }
  
}, {
  timestamps: true
});

// Índices
ConfiguracionBotSchema.index({ empresaId: 1 });

export const ConfiguracionBotModel = mongoose.model<IConfiguracionBot>(
  'ConfiguracionBot',
  ConfiguracionBotSchema
);
