// ⚙️ API de Configuración del Módulo
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

// ========== TIPOS ==========

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
  clave: string;
  etiqueta: string;
  tipo: TipoCampo;
  requerido: boolean;
  opciones?: string[];
  placeholder?: string;
  valorPorDefecto?: any;
  orden: number;
  mostrarEnLista: boolean;
  mostrarEnCalendario: boolean;
  usarEnNotificacion: boolean;
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
  horaEnvio?: string;
  horasAntesTurno?: number;      // Para 'horas_antes_turno': 24, 2, 1, etc.
  diasAntes?: number;            // Para 'dia_antes_turno': 1, 2, 3 días antes
  horaEnvioDiaAntes?: string;    // Para 'dia_antes_turno': hora específica "22:00"
  plantillaMensaje: string;
  requiereConfirmacion: boolean;
  mensajeConfirmacion?: string;
  mensajeCancelacion?: string;
  clientesEspecificos?: string[];
  agentesEspecificos?: string[];
  esAgendaAgente?: boolean; // Indica si es una notificación de agenda para agentes
  enviarTodosTurnosDia?: boolean; // Enviar todos los turnos del día al agente (sin necesidad de seleccionar)
  // Recurrencia
  esRecurrente?: boolean; // Si la notificación se repite
  recurrencia?: {
    tipo: 'semanal' | 'mensual'; // Tipo de recurrencia
    intervalo: number; // Cada cuántas semanas/meses
    diasSemana?: number[]; // Para semanal: 0=Domingo, 1=Lunes, etc.
    diaMes?: number; // Para mensual: día del mes (1-31, -1=último día)
    horaEnvio: string; // Hora específica de envío (HH:mm)
    fechaInicio?: Date; // Fecha de inicio de la recurrencia
    fechaFin?: Date; // Fecha de fin (opcional)
  };
  // Tipo de ejecución
  ejecucion?: 'automatica' | 'manual'; // Manual = solo con "Enviar Prueba"
  // Filtros avanzados
  filtros?: {
    estados?: string[]; // Estados a incluir: ['no_confirmado', 'pendiente']
    horaMinima?: string; // Hora mínima del turno: "08:00"
    horaMaxima?: string; // Hora máxima del turno: "20:00"
    agenteIds?: string[]; // IDs de agentes específicos
    tipoReserva?: string[]; // Tipos de reserva: ['viaje', 'traslado']
    limite?: number; // Máximo de turnos a enviar
    soloSinNotificar?: boolean; // Solo turnos que no han recibido notificación
  };
}

export interface NotificacionDiariaAgentes {
  activa: boolean;
  horaEnvio: string;
  enviarATodos: boolean;
  plantillaMensaje: string;
  rangoHorario: {
    activo: boolean;
    tipo: 'hoy' | 'manana' | 'proximos_dias' | 'personalizado';
    diasAdelante?: number;
    fechaInicio?: string;
    fechaFin?: string;
  };
  incluirDetalles: {
    origen: boolean;
    destino: boolean;
    nombreCliente: boolean;
    telefonoCliente: boolean;
    horaReserva: boolean;
    notasInternas: boolean;
  };
  agentesEspecificos?: string[];
}

export interface Nomenclatura {
  turno: string;
  turnos: string;
  agente: string;
  agentes: string;
  cliente: string;
  clientes: string;
  recurso?: string;
  recursos?: string;
}

export interface ConfiguracionModulo {
  _id?: string;
  empresaId: string;
  tipoNegocio: TipoNegocio;
  nombreNegocio?: string;
  nomenclatura: Nomenclatura;
  camposPersonalizados: CampoPersonalizado[];
  usaAgentes: boolean;
  agenteRequerido: boolean;
  usaRecursos: boolean;
  recursoRequerido: boolean;
  usaHorariosDisponibilidad: boolean;
  duracionPorDefecto: number;
  permiteDuracionVariable: boolean;
  notificaciones: NotificacionAutomatica[];
  notificacionDiariaAgentes?: NotificacionDiariaAgentes;
  requiereConfirmacion: boolean;
  tiempoLimiteConfirmacion?: number;
  chatbotActivo: boolean;
  chatbotPuedeCrear: boolean;
  chatbotPuedeModificar: boolean;
  chatbotPuedeCancelar: boolean;
  estadosPersonalizados?: Array<{
    clave: string;
    etiqueta: string;
    color: string;
    esEstadoFinal: boolean;
  }>;
  activo: boolean;
  creadoEn?: Date;
  actualizadoEn?: Date;
}

export interface PlantillaConfiguracion {
  tipoNegocio: TipoNegocio;
  nomenclatura: Nomenclatura;
  camposPersonalizados: CampoPersonalizado[];
  usaAgentes: boolean;
  agenteRequerido: boolean;
  usaRecursos: boolean;
  recursoRequerido: boolean;
  usaHorariosDisponibilidad: boolean;
  duracionPorDefecto: number;
  permiteDuracionVariable: boolean;
  notificaciones: NotificacionAutomatica[];
  requiereConfirmacion: boolean;
  tiempoLimiteConfirmacion?: number;
  chatbotActivo: boolean;
  chatbotPuedeCrear: boolean;
  chatbotPuedeModificar: boolean;
  chatbotPuedeCancelar: boolean;
}

// ========== FUNCIONES API ==========

/**
 * Obtener configuración del módulo para una empresa
 */
export async function obtenerConfiguracion(empresaId: string): Promise<ConfiguracionModulo> {
  const response = await fetch(`${API_BASE_URL}/api/modules/calendar/configuracion/${empresaId}`, {
    method: 'GET',
    headers: getHeaders()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener configuración');
  }

  const data = await response.json();
  return data.configuracion;
}

/**
 * Guardar configuración del módulo
 */
export async function guardarConfiguracion(
  empresaId: string,
  configuracion: Partial<ConfiguracionModulo>
): Promise<ConfiguracionModulo> {
  const response = await fetch(`${API_BASE_URL}/api/modules/calendar/configuracion/${empresaId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(configuracion)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al guardar configuración');
  }

  const data = await response.json();
  return data.configuracion;
}

/**
 * Obtener plantillas predefinidas
 */
export async function obtenerPlantillas(): Promise<Record<string, PlantillaConfiguracion>> {
  const response = await fetch(`${API_BASE_URL}/api/modules/calendar/configuracion/plantillas`, {
    method: 'GET',
    headers: getHeaders()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener plantillas');
  }

  const data = await response.json();
  return data.plantillas;
}
