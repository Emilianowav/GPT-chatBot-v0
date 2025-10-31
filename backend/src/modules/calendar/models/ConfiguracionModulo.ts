// ⚙️ Configuración del Módulo de Calendario/Reservas por Empresa
import mongoose, { Schema, Document } from 'mongoose';

export enum TipoNegocio {
  VIAJES = 'viajes',
  CONSULTORIO = 'consultorio',
  RESTAURANTE = 'restaurante',
  PELUQUERIA = 'peluqueria',
  EVENTOS = 'eventos',
  GIMNASIO = 'gimnasio',
  PERSONALIZADO = 'personalizado'
}

export enum TipoCampo {
  TEXTO = 'texto',
  NUMERO = 'numero',
  FECHA = 'fecha',
  HORA = 'hora',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  BOOLEAN = 'boolean',
  TEXTAREA = 'textarea'
}

export interface CampoPersonalizado {
  clave: string;              // 'origen', 'destino', 'pasajeros'
  etiqueta: string;           // 'Origen', 'Destino', 'Cantidad de pasajeros'
  tipo: TipoCampo;
  requerido: boolean;
  opciones?: string[];        // Para select/multiselect
  placeholder?: string;
  valorPorDefecto?: any;
  orden: number;
  mostrarEnLista: boolean;    // Mostrar en tabla de turnos
  mostrarEnCalendario: boolean; // Mostrar en vista de calendario
  usarEnNotificacion: boolean; // Incluir en mensajes automáticos
  validacion?: {
    min?: number;
    max?: number;
    regex?: string;
    mensaje?: string;
  };
}

export interface NotificacionAutomatica {
  activa: boolean;
  tipo: 'recordatorio' | 'confirmacion';
  destinatario: 'cliente' | 'agente' | 'clientes_especificos' | 'agentes_especificos';
  momento: 'noche_anterior' | 'mismo_dia' | 'horas_antes' | 'personalizado' | 'inmediata' | 'hora_exacta';
  horaEnvio?: string;         // "22:00" para envío nocturno o hora exacta
  horasAntes?: number;        // Para 'horas_antes': 24, 1, etc.
  diasAntes?: number;         // 0 = mismo día, 1 = día anterior
  plantillaMensaje: string;   // Plantilla con variables: {origen}, {destino}, {hora}, etc.
  requiereConfirmacion: boolean;
  mensajeConfirmacion?: string;
  mensajeCancelacion?: string;
  
  // Destinatarios específicos (IDs)
  clientesEspecificos?: string[];  // Array de IDs de clientes
  agentesEspecificos?: string[];   // Array de IDs de agentes
}

// Notificaciones diarias para agentes (resumen de turnos del día)
export interface NotificacionDiariaAgentes {
  activa: boolean;
  horaEnvio: string;          // "06:00" - hora del resumen diario
  enviarATodos: boolean;      // true = todos los agentes, false = solo agentes con turnos
  plantillaMensaje: string;   // Plantilla del mensaje de resumen
  incluirDetalles: {
    origen: boolean;
    destino: boolean;
    nombreCliente: boolean;
    telefonoCliente: boolean;
    horaReserva: boolean;
    notasInternas: boolean;
  };
}

export interface Nomenclatura {
  turno: string;              // "Turno", "Viaje", "Reserva", "Cita"
  turnos: string;             // "Turnos", "Viajes", "Reservas", "Citas"
  agente: string;             // "Médico", "Chofer", "Estilista", "Instructor"
  agentes: string;            // "Médicos", "Choferes", "Estilistas", "Instructores"
  cliente: string;            // "Paciente", "Pasajero", "Cliente", "Alumno"
  clientes: string;           // "Pacientes", "Pasajeros", "Clientes", "Alumnos"
  recurso?: string;           // "Vehículo", "Sala", "Mesa", "Cancha"
  recursos?: string;          // "Vehículos", "Salas", "Mesas", "Canchas"
}

export interface IConfiguracionModulo extends Document {
  empresaId: string;
  
  // Tipo de negocio
  tipoNegocio: TipoNegocio;
  nombreNegocio?: string;     // Nombre personalizado si es 'personalizado'
  
  // Nomenclatura personalizada
  nomenclatura: Nomenclatura;
  
  // Campos personalizados para los turnos
  camposPersonalizados: CampoPersonalizado[];
  
  // Configuración de agentes/recursos
  usaAgentes: boolean;
  agenteRequerido: boolean;
  usaRecursos: boolean;
  recursoRequerido: boolean;
  
  // Configuración de horarios
  usaHorariosDisponibilidad: boolean; // Si false, permite cualquier horario
  duracionPorDefecto: number;         // Duración en minutos
  permiteDuracionVariable: boolean;
  
  // Notificaciones automáticas
  notificaciones: NotificacionAutomatica[];
  
  // Notificación diaria para agentes
  notificacionDiariaAgentes?: NotificacionDiariaAgentes;
  
  // Confirmación de turnos
  requiereConfirmacion: boolean;
  tiempoLimiteConfirmacion?: number;  // Horas antes del turno
  
  // Integración con chatbot
  chatbotActivo: boolean;
  chatbotPuedeCrear: boolean;
  chatbotPuedeModificar: boolean;
  chatbotPuedeCancelar: boolean;
  
  // Configuración de estados personalizados
  estadosPersonalizados?: Array<{
    clave: string;
    etiqueta: string;
    color: string;
    esEstadoFinal: boolean;
  }>;
  
  // Metadatos adicionales
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}

const CampoPersonalizadoSchema = new Schema<CampoPersonalizado>(
  {
    clave: {
      type: String,
      required: true
    },
    etiqueta: {
      type: String,
      required: true
    },
    tipo: {
      type: String,
      enum: Object.values(TipoCampo),
      required: true
    },
    requerido: {
      type: Boolean,
      default: false
    },
    opciones: [String],
    placeholder: String,
    valorPorDefecto: Schema.Types.Mixed,
    orden: {
      type: Number,
      required: true
    },
    mostrarEnLista: {
      type: Boolean,
      default: true
    },
    mostrarEnCalendario: {
      type: Boolean,
      default: false
    },
    usarEnNotificacion: {
      type: Boolean,
      default: true
    },
    validacion: {
      min: Number,
      max: Number,
      regex: String,
      mensaje: String
    }
  },
  { _id: false }
);

const NotificacionAutomaticaSchema = new Schema<NotificacionAutomatica>(
  {
    activa: {
      type: Boolean,
      default: true
    },
    tipo: {
      type: String,
      enum: ['recordatorio', 'confirmacion'],
      required: true
    },
    destinatario: {
      type: String,
      enum: ['cliente', 'agente', 'clientes_especificos', 'agentes_especificos'],
      default: 'cliente'
    },
    momento: {
      type: String,
      enum: ['noche_anterior', 'mismo_dia', 'horas_antes', 'personalizado', 'inmediata', 'hora_exacta'],
      required: true
    },
    horaEnvio: String,
    horasAntes: Number,
    diasAntes: Number,
    plantillaMensaje: {
      type: String,
      required: true
    },
    requiereConfirmacion: {
      type: Boolean,
      default: false
    },
    mensajeConfirmacion: String,
    mensajeCancelacion: String,
    clientesEspecificos: [String],
    agentesEspecificos: [String]
  },
  { _id: false }
);

const NotificacionDiariaAgentesSchema = new Schema<NotificacionDiariaAgentes>(
  {
    activa: {
      type: Boolean,
      default: false
    },
    horaEnvio: {
      type: String,
      default: '06:00'
    },
    enviarATodos: {
      type: Boolean,
      default: false
    },
    plantillaMensaje: {
      type: String,
      default: 'Buenos días! Estos son tus {turnos} de hoy:'
    },
    incluirDetalles: {
      origen: { type: Boolean, default: true },
      destino: { type: Boolean, default: true },
      nombreCliente: { type: Boolean, default: true },
      telefonoCliente: { type: Boolean, default: false },
      horaReserva: { type: Boolean, default: true },
      notasInternas: { type: Boolean, default: false }
    }
  },
  { _id: false }
);

const NomenclaturaSchema = new Schema<Nomenclatura>(
  {
    turno: { type: String, required: true },
    turnos: { type: String, required: true },
    agente: { type: String, required: true },
    agentes: { type: String, required: true },
    cliente: { type: String, required: true },
    clientes: { type: String, required: true },
    recurso: String,
    recursos: String
  },
  { _id: false }
);

const ConfiguracionModuloSchema = new Schema<IConfiguracionModulo>(
  {
    empresaId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    
    tipoNegocio: {
      type: String,
      enum: Object.values(TipoNegocio),
      required: true
    },
    nombreNegocio: String,
    
    nomenclatura: {
      type: NomenclaturaSchema,
      required: true
    },
    
    camposPersonalizados: {
      type: [CampoPersonalizadoSchema],
      default: []
    },
    
    usaAgentes: {
      type: Boolean,
      default: true
    },
    agenteRequerido: {
      type: Boolean,
      default: true
    },
    usaRecursos: {
      type: Boolean,
      default: false
    },
    recursoRequerido: {
      type: Boolean,
      default: false
    },
    
    usaHorariosDisponibilidad: {
      type: Boolean,
      default: true
    },
    duracionPorDefecto: {
      type: Number,
      default: 30
    },
    permiteDuracionVariable: {
      type: Boolean,
      default: true
    },
    
    notificaciones: {
      type: [NotificacionAutomaticaSchema],
      default: []
    },
    
    notificacionDiariaAgentes: {
      type: NotificacionDiariaAgentesSchema,
      default: undefined
    },
    
    requiereConfirmacion: {
      type: Boolean,
      default: false
    },
    tiempoLimiteConfirmacion: Number,
    
    chatbotActivo: {
      type: Boolean,
      default: true
    },
    chatbotPuedeCrear: {
      type: Boolean,
      default: true
    },
    chatbotPuedeModificar: {
      type: Boolean,
      default: true
    },
    chatbotPuedeCancelar: {
      type: Boolean,
      default: true
    },
    
    estadosPersonalizados: [{
      clave: String,
      etiqueta: String,
      color: String,
      esEstadoFinal: Boolean
    }],
    
    activo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: {
      createdAt: 'creadoEn',
      updatedAt: 'actualizadoEn'
    },
    collection: 'configuraciones_modulo'
  }
);

export const ConfiguracionModuloModel = mongoose.model<IConfiguracionModulo>(
  'ConfiguracionModulo',
  ConfiguracionModuloSchema
);
