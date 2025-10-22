// 📋 Servicio de Turnos
import { TurnoModel, ITurno, EstadoTurno } from '../models/Turno.js';
import { AgenteModel, ModoAtencion } from '../models/Agente.js';
import { ConfiguracionCalendarioModel } from '../models/ConfiguracionCalendario.js';
import { verificarDisponibilidad } from './disponibilidadService.js';

export interface CrearTurnoData {
  empresaId: string;
  agenteId?: string;
  clienteId: string;
  fechaInicio: Date;
  duracion: number;
  servicio?: string;
  notas?: string;
  datos?: Record<string, any>; // Campos dinámicos
  creadoPor: 'bot' | 'admin' | 'agente' | 'cliente';
}

/**
 * Crea un nuevo turno
 */
export async function crearTurno(data: CrearTurnoData): Promise<ITurno> {
  // 1. Obtener agente para verificar modo de atención
  const agente = await AgenteModel.findById(data.agenteId);
  if (!agente) {
    throw new Error('Agente no encontrado');
  }

  // 2. Obtener configuración
  const config = await ConfiguracionCalendarioModel.findOne({ 
    empresaId: data.empresaId 
  });

  // 3. Validar anticipación mínima
  const ahora = new Date();
  const horasAnticipacion = (data.fechaInicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);
  
  if (config && horasAnticipacion < config.anticipacionMinima) {
    throw new Error(
      `Debe reservar con al menos ${config.anticipacionMinima} horas de anticipación`
    );
  }

  // 4. Validar anticipación máxima
  if (config) {
    const diasAnticipacion = horasAnticipacion / 24;
    if (diasAnticipacion > config.anticipacionMaxima) {
      throw new Error(
        `Solo puede reservar hasta ${config.anticipacionMaxima} días de anticipación`
      );
    }
  }

  // 5. Validar según modo de atención
  if (agente.modoAtencion === ModoAtencion.TURNOS_PROGRAMADOS) {
    // Validar disponibilidad de horarios específicos
    const validacion = await verificarDisponibilidad(
      data.empresaId,
      data.agenteId,
      data.fechaInicio,
      data.duracion
    );

    if (!validacion.disponible) {
      throw new Error(validacion.motivo || 'Horario no disponible');
    }
  } else if (agente.modoAtencion === ModoAtencion.TURNOS_LIBRES) {
    // Para turnos libres, solo validar que no exceda capacidad del día
    if (agente.maximoTurnosPorDia) {
      const inicioDelDia = new Date(data.fechaInicio);
      inicioDelDia.setHours(0, 0, 0, 0);
      
      const finDelDia = new Date(data.fechaInicio);
      finDelDia.setHours(23, 59, 59, 999);
      
      const turnosDelDia = await TurnoModel.countDocuments({
        agenteId: data.agenteId,
        fechaInicio: { $gte: inicioDelDia, $lte: finDelDia },
        estado: { $in: [EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO, EstadoTurno.EN_CURSO] }
      });
      
      if (turnosDelDia >= agente.maximoTurnosPorDia) {
        throw new Error(`El agente ya alcanzó el máximo de ${agente.maximoTurnosPorDia} turnos para este día`);
      }
    }
    
    // Validar capacidad simultánea
    if (agente.capacidadSimultanea) {
      const turnosSimultaneos = await TurnoModel.countDocuments({
        agenteId: data.agenteId,
        fechaInicio: data.fechaInicio,
        estado: { $in: [EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO, EstadoTurno.EN_CURSO] }
      });
      
      if (turnosSimultaneos >= agente.capacidadSimultanea) {
        throw new Error('No hay capacidad disponible en este momento');
      }
    }
  } else if (agente.modoAtencion === ModoAtencion.MIXTO) {
    // En modo mixto, intentar validar disponibilidad pero no fallar si no hay slots
    const validacion = await verificarDisponibilidad(
      data.empresaId,
      data.agenteId,
      data.fechaInicio,
      data.duracion
    );
    
    // Solo advertir, no bloquear
    if (!validacion.disponible) {
      console.log(`⚠️ Turno creado fuera de horario programado (modo mixto): ${validacion.motivo}`);
    }
  }

  // 6. Crear turno
  const fechaFin = new Date(data.fechaInicio.getTime() + data.duracion * 60000);

  const turno = new TurnoModel({
    empresaId: data.empresaId,
    agenteId: data.agenteId,
    clienteId: data.clienteId,
    fechaInicio: data.fechaInicio,
    fechaFin,
    duracion: data.duracion,
    estado: config?.requiereConfirmacionAgente 
      ? EstadoTurno.PENDIENTE 
      : EstadoTurno.CONFIRMADO,
    servicio: data.servicio,
    notas: data.notas,
    creadoPor: data.creadoPor,
    confirmado: !config?.requiereConfirmacionAgente,
    recordatorio24h: false,
    recordatorio1h: false
  });

  await turno.save();

  // TODO: Notificar al agente si está configurado
  // TODO: Programar recordatorios

  return turno;
}

/**
 * Obtener turnos con filtros
 */
export async function obtenerTurnos(filtros: {
  empresaId: string;
  agenteId?: string;
  clienteId?: string;
  estado?: EstadoTurno;
  fechaDesde?: Date;
  fechaHasta?: Date;
  limit?: number;
  skip?: number;
}) {
  const query: any = { empresaId: filtros.empresaId };

  if (filtros.agenteId) query.agenteId = filtros.agenteId;
  if (filtros.clienteId) query.clienteId = filtros.clienteId;
  if (filtros.estado) query.estado = filtros.estado;

  if (filtros.fechaDesde || filtros.fechaHasta) {
    query.fechaInicio = {};
    if (filtros.fechaDesde) query.fechaInicio.$gte = filtros.fechaDesde;
    if (filtros.fechaHasta) query.fechaInicio.$lte = filtros.fechaHasta;
  }

  const turnos = await TurnoModel.find(query)
    .populate('agenteId', 'nombre apellido especialidad')
    .sort({ fechaInicio: 1 })
    .limit(filtros.limit || 100)
    .skip(filtros.skip || 0);

  const total = await TurnoModel.countDocuments(query);

  return { turnos, total };
}

/**
 * Obtener un turno por ID
 */
export async function obtenerTurnoPorId(
  turnoId: string,
  empresaId: string
): Promise<ITurno | null> {
  return await TurnoModel.findOne({ _id: turnoId, empresaId })
    .populate('agenteId', 'nombre apellido especialidad email telefono');
}

/**
 * Actualizar estado de un turno
 */
export async function actualizarEstadoTurno(
  turnoId: string,
  empresaId: string,
  nuevoEstado: EstadoTurno,
  motivoCancelacion?: string
): Promise<ITurno> {
  const turno = await TurnoModel.findOne({ _id: turnoId, empresaId });
  if (!turno) throw new Error('Turno no encontrado');

  turno.estado = nuevoEstado;

  if (nuevoEstado === EstadoTurno.CANCELADO) {
    turno.canceladoEn = new Date();
    turno.motivoCancelacion = motivoCancelacion;
  }

  if (nuevoEstado === EstadoTurno.CONFIRMADO) {
    turno.confirmado = true;
    turno.confirmadoEn = new Date();
  }

  await turno.save();

  // TODO: Notificar cambio de estado

  return turno;
}

/**
 * Cancelar un turno
 */
export async function cancelarTurno(
  turnoId: string,
  empresaId: string,
  motivo: string
): Promise<ITurno> {
  const config = await ConfiguracionCalendarioModel.findOne({ empresaId });
  const turno = await TurnoModel.findOne({ _id: turnoId, empresaId });
  
  if (!turno) throw new Error('Turno no encontrado');

  // Validar si se puede cancelar
  if (config && config.permiteCancelacion) {
    const horasHastaTurno = (turno.fechaInicio.getTime() - Date.now()) / (1000 * 60 * 60);
    
    if (horasHastaTurno < config.tiempoLimiteCancelacion) {
      throw new Error(
        `No se puede cancelar con menos de ${config.tiempoLimiteCancelacion} horas de anticipación`
      );
    }
  }

  return await actualizarEstadoTurno(turnoId, empresaId, EstadoTurno.CANCELADO, motivo);
}

/**
 * Obtener turnos del día para un agente
 */
export async function obtenerTurnosDelDia(
  empresaId: string,
  agenteId?: string
): Promise<ITurno[]> {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  const query: any = {
    empresaId,
    fechaInicio: {
      $gte: hoy,
      $lt: manana
    },
    estado: { $in: [EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO, EstadoTurno.EN_CURSO] }
  };

  if (agenteId) query.agenteId = agenteId;

  return await TurnoModel.find(query)
    .populate('agenteId', 'nombre apellido especialidad')
    .sort({ fechaInicio: 1 });
}

/**
 * Obtener estadísticas de turnos
 */
export async function obtenerEstadisticas(
  empresaId: string,
  fechaDesde?: Date,
  fechaHasta?: Date
) {
  const query: any = { empresaId };

  if (fechaDesde || fechaHasta) {
    query.fechaInicio = {};
    if (fechaDesde) query.fechaInicio.$gte = fechaDesde;
    if (fechaHasta) query.fechaInicio.$lte = fechaHasta;
  }

  const [
    totalTurnos,
    turnosPendientes,
    turnosConfirmados,
    turnosCompletados,
    turnosCancelados,
    turnosNoAsistio
  ] = await Promise.all([
    TurnoModel.countDocuments(query),
    TurnoModel.countDocuments({ ...query, estado: EstadoTurno.PENDIENTE }),
    TurnoModel.countDocuments({ ...query, estado: EstadoTurno.CONFIRMADO }),
    TurnoModel.countDocuments({ ...query, estado: EstadoTurno.COMPLETADO }),
    TurnoModel.countDocuments({ ...query, estado: EstadoTurno.CANCELADO }),
    TurnoModel.countDocuments({ ...query, estado: EstadoTurno.NO_ASISTIO })
  ]);

  return {
    totalTurnos,
    turnosPendientes,
    turnosConfirmados,
    turnosCompletados,
    turnosCancelados,
    turnosNoAsistio,
    tasaAsistencia: totalTurnos > 0 
      ? ((turnosCompletados / (turnosCompletados + turnosNoAsistio)) * 100).toFixed(2)
      : 0,
    tasaCancelacion: totalTurnos > 0
      ? ((turnosCancelados / totalTurnos) * 100).toFixed(2)
      : 0
  };
}
