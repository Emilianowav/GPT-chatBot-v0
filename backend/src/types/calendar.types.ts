/**
 * Tipos para el módulo de Calendario
 * Reemplaza el uso de 'any' con tipos específicos
 */

import { ObjectId } from 'mongodb';

// ============= AGENTE =============
export interface DisponibilidadDia {
  diaSemana: number; // 0-6 (Domingo-Sábado)
  horaInicio: string; // "HH:mm"
  horaFin: string; // "HH:mm"
  activo: boolean;
}

export interface Agente {
  _id?: ObjectId;
  empresaId: string;
  nombre: string;
  email?: string;
  telefono?: string;
  especialidad?: string;
  disponibilidad: DisponibilidadDia[];
  duracionTurnoMinutos: number;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============= TURNO =============
export interface Turno {
  _id?: ObjectId;
  empresaId: string;
  agenteId: string;
  clienteId?: string;
  clienteNombre?: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  fecha: Date;
  horaInicio: string; // "HH:mm"
  horaFin: string; // "HH:mm"
  duracionMinutos: number;
  estado: 'pendiente' | 'confirmado' | 'cancelado' | 'completado' | 'libre';
  tipo: 'reservado' | 'libre';
  notas?: string;
  motivoCancelacion?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============= CONFIGURACIÓN =============
export interface ConfiguracionNotificacion {
  activo: boolean;
  tipo_envio: 'hora_fija' | 'horas_antes_turno' | 'inicio_jornada_agente';
  hora_fija?: string; // "HH:mm"
  horas_antes?: number;
  plantilla_meta?: string;
  mensaje_personalizado?: string;
}

export interface ConfiguracionCalendario {
  _id?: ObjectId;
  empresaId: string;
  notificacion_confirmacion?: ConfiguracionNotificacion;
  notificacion_diaria_agentes?: ConfiguracionNotificacion;
  duracion_turno_default?: number;
  anticipacion_minima_horas?: number;
  cancelacion_permitida?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============= BOT =============
export interface PasoBot {
  orden: number;
  tipo: 'mensaje' | 'pregunta' | 'seleccion' | 'confirmacion';
  contenido: string;
  opciones?: string[];
  variable?: string;
  validacion?: string;
}

export interface ConfiguracionBot {
  _id?: ObjectId;
  empresaId: string;
  flujo: 'reserva_turnos' | 'consulta_disponibilidad' | 'cancelacion' | 'personalizado';
  activo: boolean;
  pasos: PasoBot[];
  mensaje_bienvenida?: string;
  mensaje_despedida?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============= DISPONIBILIDAD =============
export interface HorarioDisponible {
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
  turnoId?: string;
}

export interface DisponibilidadDia {
  fecha: Date;
  diaSemana: number;
  horarios: HorarioDisponible[];
}

export interface DisponibilidadAgente {
  agenteId: string;
  agente: Agente;
  dias: DisponibilidadDia[];
}

// ============= FILTROS Y QUERIES =============
export interface FiltrosTurnos {
  empresaId: string;
  agenteId?: string;
  clienteId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: Turno['estado'];
  tipo?: Turno['tipo'];
}

export interface FiltrosAgentes {
  empresaId: string;
  activo?: boolean;
  especialidad?: string;
}

// ============= RESPUESTAS API =============
export interface RespuestaAPI<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface RespuestaTurnos extends RespuestaAPI {
  data?: {
    turnos: Turno[];
    total: number;
    pagina?: number;
    porPagina?: number;
  };
}

export interface RespuestaAgentes extends RespuestaAPI {
  data?: {
    agentes: Agente[];
    total: number;
  };
}

// ============= NOTIFICACIONES =============
export interface NotificacionPendiente {
  _id?: ObjectId;
  empresaId: string;
  tipo: 'confirmacion' | 'recordatorio' | 'diaria_agentes';
  destinatario: string; // teléfono
  turnoId?: string;
  agenteId?: string;
  mensaje: string;
  plantilla_meta?: string;
  parametros?: Record<string, string>;
  estado: 'pendiente' | 'enviada' | 'fallida';
  intentos: number;
  fechaEnvio?: Date;
  fechaProgramada: Date;
  error?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============= FLUJOS =============
export interface FlujoActivo {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'confirmacion' | 'diaria_agentes' | 'recordatorio';
  activo: boolean;
  configuracion: ConfiguracionNotificacion;
  ultimaEjecucion?: Date;
  proximaEjecucion?: Date;
}

export interface EstadisticasFlujo {
  flujoId: string;
  totalEnviados: number;
  totalExitosos: number;
  totalFallidos: number;
  tasaExito: number;
  ultimaEjecucion?: Date;
}
