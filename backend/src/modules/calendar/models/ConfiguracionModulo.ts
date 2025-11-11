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
  
  // 📋 NUEVO: Plantilla de Meta para primer mensaje
  usarPlantillaMeta?: boolean;
  plantillaMeta?: {
    nombre: string;                // Nombre de la plantilla en Meta: "recordatorios_sanjose"
    idioma: string;                // Código de idioma: "es"
    activa: boolean;
    componentes?: {
      header?: {
        tipo: 'text' | 'image' | 'video' | 'document';
        parametros?: Array<{
          tipo: string;
          variable: string;        // Variable del sistema: {cliente}, {fecha}, etc.
          valor?: string;          // Valor por defecto si la variable no existe
        }>;
      };
      body?: {
        parametros: Array<{
          tipo: 'text';
          variable: string;        // Variable del sistema
        }>;
      };
      buttons?: Array<{
        tipo: 'url' | 'quick_reply';
        subTipo?: string;
        index: number;
        parametros?: Array<{
          tipo: 'text';
          variable: string;
        }>;
      }>;
    };
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
  
  // Control de última ejecución (para evitar envíos duplicados)
  ultimoEnvio?: Date;
  
  // 📋 NUEVO: Plantilla de Meta para primer mensaje
  usarPlantillaMeta?: boolean;
  plantillaMeta?: {
    nombre: string;                // Nombre de la plantilla en Meta: "choferes_sanjose"
    idioma: string;                // Código de idioma: "es"
    activa: boolean;
    
    // ✅ SISTEMA ESCALABLE: URL y Payload completo de Meta
    metaApiUrl?: string;           // URL de Meta API con variables: "https://graph.facebook.com/v22.0/{{phoneNumberId}}/messages"
    metaPayload?: any;             // Payload completo para Meta con variables {{variable}}
    
    // ⚠️ SISTEMA ANTIGUO: Componentes (fallback)
    componentes?: {
      header?: {
        tipo: 'text' | 'image' | 'video' | 'document';
        parametros?: Array<{
          tipo: string;
          variable: string;        // Variable del sistema: {agente}, {fecha}, etc.
          valor?: string;          // Valor por defecto si la variable no existe
        }>;
      };
      body?: {
        parametros: Array<{
          tipo: 'text';
          variable: string;        // Variable del sistema
        }>;
      };
      buttons?: Array<{
        tipo: 'url' | 'quick_reply';
        subTipo?: string;
        index: number;
        parametros?: Array<{
          tipo: 'text';
          variable: string;
        }>;
      }>;
    };
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

// ✨ NUEVO: Interfaces para mensajes de flujos configurables
export interface IMensajeFlujo {
  mensaje: string;
  botones?: Array<{
    id: string;
    texto: string;
  }>;
}

export interface IMensajeFlujoConOpciones extends IMensajeFlujo {
  opciones?: Array<{
    id: string;
    texto: string;
    descripcion: string;
  }>;
}

export interface IFlujoConfirmacion {
  esperando_confirmacion?: IMensajeFlujo;
  confirmado?: IMensajeFlujo;
  cancelado?: IMensajeFlujo;
  modificado?: IMensajeFlujo;
  error?: IMensajeFlujo;
}

export interface IFlujoMenu {
  bienvenida?: IMensajeFlujoConOpciones;
  opcion_invalida?: IMensajeFlujo;
}

export interface IFlujoNotificacion {
  esperando_opcion_inicial?: IMensajeFlujo;
  confirmado?: IMensajeFlujo;
  cancelado?: IMensajeFlujo;
}

// ✨ NUEVO: Variables dinámicas por empresa
export interface IVariablesDinamicas {
  nombre_empresa: string;
  nomenclatura_turno: string;
  nomenclatura_turnos: string;
  nomenclatura_agente: string;
  nomenclatura_agentes: string;
  zona_horaria: string;
  moneda: string;
  idioma: string;
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
  
  // ✅ NUEVA ESTRUCTURA: Configuración de turnos
  turnos?: {
    usaAgentes: boolean;
    agenteRequerido: boolean;
    usaRecursos: boolean;
    recursoRequerido: boolean;
    duracionPorDefecto: number;
    permiteDuracionVariable: boolean;
  };
  
  // ⚠️ CAMPOS OBSOLETOS (mantener para compatibilidad temporal)
  usaAgentes?: boolean;
  agenteRequerido?: boolean;
  usaRecursos?: boolean;
  recursoRequerido?: boolean;
  usaHorariosDisponibilidad?: boolean;
  duracionPorDefecto?: number;
  permiteDuracionVariable?: boolean;
  notificaciones?: NotificacionAutomatica[];
  notificacionDiariaAgentes?: NotificacionDiariaAgentes;
  
  // ✅ SISTEMA FLEXIBLE DE NOTIFICACIONES (para INICIAR conversaciones)
  plantillasMeta?: {
    // Notificación diaria para agentes (choferes, médicos, etc.)
    notificacionDiariaAgentes?: {
      activa: boolean;
      tipo: 'plantilla_meta' | 'texto_directo';  // ✅ Tipo de notificación
      
      // Si tipo === 'plantilla_meta'
      nombre?: string;                   // Nombre de la plantilla en Meta: "chofer_sanjose"
      idioma?: string;                   // Código de idioma: "es"
      parametros?: Array<{               // ✅ Parámetros de la plantilla
        orden: number;                   // 1, 2, 3... (orden en {{1}}, {{2}}, {{3}})
        variable: string;                // 'nombre', 'lista_turnos'
        valor: string;                   // '{{nombre}}', '{{lista_turnos}}'
      }>;
      
      // Si tipo === 'texto_directo'
      mensajeDirecto?: string;           // Texto con variables: "Hola {{nombre}}, tus turnos: {{lista_turnos}}"
      
      programacion?: {
        metodoVerificacion: 'hora_fija' | 'inicio_jornada_agente';
        horaEnvio?: string;
        minutosAntes?: number;
        frecuencia: string;
        rangoHorario: string;
        filtroEstado: string[];
        incluirDetalles?: {
          origen?: boolean;
          destino?: boolean;
          nombreCliente?: boolean;
          telefonoCliente?: boolean;
          horaReserva?: boolean;
          notasInternas?: boolean;
        };
      };
      ultimoEnvio?: Date;
    };
    
    // Confirmación de turnos para clientes
    confirmacionTurnos?: {
      activa: boolean;
      tipo: 'plantilla_meta' | 'texto_directo';  // ✅ Tipo de notificación
      
      // Si tipo === 'plantilla_meta'
      nombre?: string;                   // Nombre de la plantilla en Meta: "clientes_sanjose"
      idioma?: string;                   // Código de idioma: "es"
      parametros?: Array<{               // ✅ Parámetros de la plantilla
        orden: number;                   // 1, 2, 3...
        variable: string;                // 'nombre', 'turnos'
        valor: string;                   // '{{nombre}}', '{{turnos}}'
      }>;
      
      // Si tipo === 'texto_directo'
      mensajeDirecto?: string;           // Texto con variables: "Hola {{nombre}}, tus turnos: {{turnos}}"
      
      programacion?: {
        metodoVerificacion: 'hora_fija' | 'horas_antes_turno';
        momento?: string;
        horaEnvio?: string;
        horasAntes?: number;
        diasAntes?: number;
        filtroEstado: string[];
        incluirDetalles?: {
          origen?: boolean;
          destino?: boolean;
        };
      };
      ultimoEnvio?: Date;
    };
  };
  
  // ✨ NUEVO: Mensajes de flujos (para DENTRO de conversaciones)
  mensajesFlujo?: {
    confirmacion_turnos?: IFlujoConfirmacion;
    menu_principal?: IFlujoMenu;
    notificacion_viajes?: IFlujoNotificacion;
  };
  
  // ✨ NUEVO: Variables dinámicas por empresa
  variablesDinamicas?: IVariablesDinamicas;
  
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
    agentesEspecificos: [String],
    ultimoEnvio: { type: Date }
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

// ✨ NUEVO: Schemas para mensajes de flujo
const MensajeFlujoSchema = new Schema(
  {
    mensaje: { type: String, required: true },
    botones: [{
      id: String,
      texto: String
    }]
  },
  { _id: false }
);

const MensajeFlujoConOpcionesSchema = new Schema(
  {
    mensaje: { type: String, required: true },
    botones: [{
      id: String,
      texto: String
    }],
    opciones: [{
      id: String,
      texto: String,
      descripcion: String
    }]
  },
  { _id: false }
);

const MensajesFlujosSchema = new Schema(
  {
    confirmacion_turnos: {
      esperando_confirmacion: MensajeFlujoSchema,
      confirmado: MensajeFlujoSchema,
      cancelado: MensajeFlujoSchema,
      modificado: MensajeFlujoSchema,
      error: MensajeFlujoSchema
    },
    menu_principal: {
      bienvenida: MensajeFlujoConOpcionesSchema,
      opcion_invalida: MensajeFlujoSchema
    },
    notificacion_viajes: {
      esperando_opcion_inicial: MensajeFlujoSchema,
      confirmado: MensajeFlujoSchema,
      cancelado: MensajeFlujoSchema
    }
  },
  { _id: false }
);

const VariablesDinamicasSchema = new Schema(
  {
    nombre_empresa: { type: String, required: true },
    nomenclatura_turno: { type: String, required: true },
    nomenclatura_turnos: { type: String, required: true },
    nomenclatura_agente: { type: String, required: true },
    nomenclatura_agentes: { type: String, required: true },
    zona_horaria: { type: String, required: true },
    moneda: { type: String, required: true },
    idioma: { type: String, required: true }
  },
  { _id: false }
);

// Schema para plantillasMeta (Sistema Flexible)
const PlantillasMetaSchema = new Schema(
  {
    notificacionDiariaAgentes: {
      activa: { type: Boolean, default: false },
      tipo: {
        type: String,
        enum: ['plantilla_meta', 'texto_directo'],
        default: 'plantilla_meta'
      },
      // Para plantilla_meta
      nombre: String,
      idioma: String,
      parametros: [{
        orden: Number,
        variable: String,
        valor: String
      }],
      // Para texto_directo
      mensajeDirecto: String,
      programacion: {
        metodoVerificacion: {
          type: String,
          enum: ['hora_fija', 'inicio_jornada_agente'],
          default: 'hora_fija'
        },
        horaEnvio: String,
        minutosAntes: Number,
        frecuencia: String,
        rangoHorario: String,
        filtroEstado: [String],
        incluirDetalles: {
          origen: Boolean,
          destino: Boolean,
          nombreCliente: Boolean,
          telefonoCliente: Boolean,
          horaReserva: Boolean,
          notasInternas: Boolean
        }
      },
      ultimoEnvio: Date
    },
    confirmacionTurnos: {
      activa: { type: Boolean, default: false },
      tipo: {
        type: String,
        enum: ['plantilla_meta', 'texto_directo'],
        default: 'plantilla_meta'
      },
      // Para plantilla_meta
      nombre: String,
      idioma: String,
      parametros: [{
        orden: Number,
        variable: String,
        valor: String
      }],
      // Para texto_directo
      mensajeDirecto: String,
      programacion: {
        metodoVerificacion: {
          type: String,
          enum: ['hora_fija', 'horas_antes_turno'],
          default: 'hora_fija'
        },
        momento: String,
        horaEnvio: String,
        horasAntes: Number,
        diasAntes: Number,
        filtroEstado: [String]
      },
      ultimoEnvio: Date
    }
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
    
    // ✅ NUEVA ESTRUCTURA: Plantillas de Meta
    plantillasMeta: {
      type: PlantillasMetaSchema,
      default: undefined
    },
    
    // ✨ NUEVO: Mensajes de flujos configurables
    mensajesFlujo: {
      type: MensajesFlujosSchema,
      default: undefined
    },
    
    // ✨ NUEVO: Variables dinámicas por empresa
    variablesDinamicas: {
      type: VariablesDinamicasSchema,
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
