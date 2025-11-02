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
  momento: 'noche_anterior' | 'mismo_dia' | 'horas_antes_turno' | 'dia_antes_turno' | 'hora_exacta' | 'personalizado';
  horaEnvio?: string;         // "22:00" para envío nocturno o hora exacta
  horasAntesTurno?: number;   // Para 'horas_antes_turno': 24, 2, 1, etc. (basado en hora del turno)
  diasAntes?: number;         // Para 'dia_antes_turno': 1, 2, 3 días antes
  horaEnvioDiaAntes?: string; // Para 'dia_antes_turno': hora específica "22:00"
  plantillaMensaje: string;   // Plantilla con variables: {origen}, {destino}, {hora}, etc.
  requiereConfirmacion: boolean;
  mensajeConfirmacion?: string;
  mensajeCancelacion?: string;
  
  // Destinatarios específicos (IDs)
  clientesEspecificos?: string[];  // Array de IDs de clientes
  agentesEspecificos?: string[];   // Array de IDs de agentes
  
  // Opciones especiales para agentes
  esAgendaAgente?: boolean;        // Indica si es una notificación de agenda para agentes
  enviarTodosTurnosDia?: boolean;  // Enviar todos los turnos del día automáticamente
  
  // Recurrencia
  esRecurrente?: boolean;          // Si la notificación es recurrente
  recurrencia?: {
    tipo: 'semanal' | 'mensual';
    intervalo: number;             // Cada cuántas semanas/meses
    horaEnvio: string;             // Hora de envío
    diasSemana?: number[];         // [0-6] para semanal
    diaMes?: number;               // 1-31 o -1 (último día) para mensual
    fechaInicio?: Date;            // Fecha de inicio (opcional)
    fechaFin?: Date;               // Fecha de fin (opcional)
  };
  
  // Tipo de ejecución
  ejecucion?: 'automatica' | 'manual';  // Manual = solo con "Enviar Prueba"
  
  // Filtros avanzados (solo para ejecución automática)
  filtros?: {
    estados?: string[];            // Estados a incluir: ['no_confirmado', 'pendiente']
    horaMinima?: string;           // Hora mínima del turno: "08:00"
    horaMaxima?: string;           // Hora máxima del turno: "20:00"
    agenteIds?: string[];          // IDs de agentes específicos
    tipoReserva?: string[];        // Tipos de reserva: ['viaje', 'traslado']
    limite?: number;               // Máximo de turnos a enviar
    soloSinNotificar?: boolean;    // Solo turnos que no han recibido notificación
  };
}

// Notificaciones diarias para agentes (resumen de turnos del día)
export interface NotificacionDiariaAgentes {
  activa: boolean;
  horaEnvio: string;          // "06:00" - hora del resumen diario
  enviarATodos: boolean;      // true = todos los agentes, false = solo agentes con turnos
  plantillaMensaje: string;   // Plantilla del mensaje de resumen
  
  // Configuración de ciclo/frecuencia
  frecuencia: {
    tipo: 'diaria' | 'semanal' | 'mensual' | 'personalizada';
    diasSemana?: number[];    // [0,1,2,3,4,5,6] = Dom, Lun, Mar, Mie, Jue, Vie, Sab
    diaMes?: number;          // 1-31 para mensual
    horasIntervalo?: number;  // Para personalizada: cada X horas
  };
  
  // Filtros de rango horario
  rangoHorario: {
    activo: boolean;
    tipo: 'hoy' | 'manana' | 'proximos_dias' | 'personalizado';
    diasAdelante?: number;    // Para 'proximos_dias': 1, 2, 7, etc.
    fechaInicio?: string;     // Para 'personalizado': "2024-11-15"
    fechaFin?: string;        // Para 'personalizado': "2024-11-20"
  };
  
  // Filtros de horario del día (para filtrar turnos)
  filtroHorario: {
    activo: boolean;
    tipo: 'manana' | 'tarde' | 'noche' | 'personalizado' | 'todo_el_dia';
    horaInicio?: string;      // "08:00" para personalizado
    horaFin?: string;         // "12:00" para personalizado
  };
  
  // Filtros por estado de turno
  filtroEstado: {
    activo: boolean;
    estados: ('pendiente' | 'confirmado' | 'en_curso')[];
  };
  
  // Filtros por tipo/categoría de turno
  filtroTipo: {
    activo: boolean;
    tipos: string[];          // ['viaje', 'traslado', etc.]
  };
  
  incluirDetalles: {
    origen: boolean;
    destino: boolean;
    nombreCliente: boolean;
    telefonoCliente: boolean;
    horaReserva: boolean;
    notasInternas: boolean;
  };
  
  // Agentes específicos (si no se envía a todos)
  agentesEspecificos?: string[];
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
      enum: ['noche_anterior', 'mismo_dia', 'horas_antes_turno', 'dia_antes_turno', 'hora_exacta', 'personalizado'],
      required: true
    },
    horaEnvio: String,
    horasAntesTurno: Number,
    diasAntes: Number,
    horaEnvioDiaAntes: String,
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
    agentesEspecificos: [String],
    esAgendaAgente: {
      type: Boolean,
      default: false
    },
    enviarTodosTurnosDia: {
      type: Boolean,
      default: false
    },
    esRecurrente: {
      type: Boolean,
      default: false
    },
    recurrencia: {
      tipo: {
        type: String,
        enum: ['semanal', 'mensual']
      },
      intervalo: Number,
      horaEnvio: String,
      diasSemana: [Number],
      diaMes: Number,
      fechaInicio: Date,
      fechaFin: Date
    },
    ejecucion: {
      type: String,
      enum: ['automatica', 'manual'],
      default: 'automatica'
    },
    filtros: {
      estados: [String],
      horaMinima: String,
      horaMaxima: String,
      agenteIds: [String],
      tipoReserva: [String],
      limite: Number,
      soloSinNotificar: Boolean
    }
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
    frecuencia: {
      tipo: {
        type: String,
        enum: ['diaria', 'semanal', 'mensual', 'personalizada'],
        default: 'diaria'
      },
      diasSemana: [Number],
      diaMes: Number,
      horasIntervalo: Number
    },
    rangoHorario: {
      activo: { type: Boolean, default: false },
      tipo: { 
        type: String, 
        enum: ['hoy', 'manana', 'proximos_dias', 'personalizado'],
        default: 'hoy'
      },
      diasAdelante: Number,
      fechaInicio: String,
      fechaFin: String
    },
    filtroHorario: {
      activo: { type: Boolean, default: false },
      tipo: {
        type: String,
        enum: ['manana', 'tarde', 'noche', 'personalizado', 'todo_el_dia'],
        default: 'todo_el_dia'
      },
      horaInicio: String,
      horaFin: String
    },
    filtroEstado: {
      activo: { type: Boolean, default: false },
      estados: {
        type: [String],
        default: ['pendiente', 'confirmado']
      }
    },
    filtroTipo: {
      activo: { type: Boolean, default: false },
      tipos: [String]
    },
    incluirDetalles: {
      origen: { type: Boolean, default: true },
      destino: { type: Boolean, default: true },
      nombreCliente: { type: Boolean, default: true },
      telefonoCliente: { type: Boolean, default: false },
      horaReserva: { type: Boolean, default: true },
      notasInternas: { type: Boolean, default: false }
    },
    agentesEspecificos: [String]
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
