// 📋 Servicio de Turnos
import { TurnoModel, ITurno, EstadoTurno } from '../models/Turno.js';
import { AgenteModel, ModoAtencion } from '../models/Agente.js';
import { ConfiguracionCalendarioModel } from '../models/ConfiguracionCalendario.js';
import { ConfiguracionModuloModel } from '../models/ConfiguracionModulo.js';
import { ClienteModel } from '../../../models/Cliente.js';
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

  // 2. Obtener configuraciones
  const config = await ConfiguracionCalendarioModel.findOne({ 
    empresaId: data.empresaId 
  });
  
  const configModulo = await ConfiguracionModuloModel.findOne({
    empresaId: data.empresaId,
    activo: true
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

  // 7. Programar notificaciones basadas en la configuración del módulo
  const notificacionesProgramadas: any[] = [];
  
  if (configModulo?.notificaciones && configModulo.notificaciones.length > 0) {
    for (const notifConfig of configModulo.notificaciones) {
      if (!notifConfig.activa || notifConfig.ejecucion === 'manual') continue;
      
      // Calcular cuándo debe enviarse
      let fechaProgramada: Date | null = null;
      
      if (notifConfig.momento === 'horas_antes_turno' && notifConfig.horasAntesTurno) {
        fechaProgramada = new Date(data.fechaInicio.getTime() - notifConfig.horasAntesTurno * 60 * 60 * 1000);
      } else if (notifConfig.momento === 'dia_antes_turno' && notifConfig.diasAntes && notifConfig.horaEnvioDiaAntes) {
        const [hora, minutos] = notifConfig.horaEnvioDiaAntes.split(':').map(Number);
        fechaProgramada = new Date(data.fechaInicio);
        fechaProgramada.setDate(fechaProgramada.getDate() - notifConfig.diasAntes);
        fechaProgramada.setHours(hora, minutos, 0, 0);
      }
      
      if (fechaProgramada && fechaProgramada > new Date()) {
        notificacionesProgramadas.push({
          tipo: notifConfig.tipo,
          programadaPara: fechaProgramada,
          enviada: false,
          plantilla: notifConfig.plantillaMensaje
        });
      }
    }
  }

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
    datos: data.datos || {}, // Campos dinámicos
    notas: data.notas,
    creadoPor: data.creadoPor,
    confirmado: !config?.requiereConfirmacionAgente,
    notificaciones: notificacionesProgramadas
  });

  await turno.save();
  
  console.log(`✅ Turno creado con ${notificacionesProgramadas.length} notificaciones programadas`);

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

  // Buscar información de clientes manualmente (ya que clienteId es String)
  const turnosConClientes = await Promise.all(
    turnos.map(async (turno) => {
      const turnoObj = turno.toObject();
      try {
        const cliente = await ClienteModel.findOne({ 
          _id: turno.clienteId,
          empresaId: filtros.empresaId
        }).select('nombre apellido telefono email dni');
        
        return {
          ...turnoObj,
          clienteInfo: cliente ? {
            _id: cliente._id,
            nombre: cliente.nombre,
            apellido: cliente.apellido,
            telefono: cliente.telefono,
            email: cliente.email,
            documento: cliente.dni
          } : null
        };
      } catch (error) {
        return turnoObj;
      }
    })
  );

  return { turnos: turnosConClientes, total };
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
 * Actualizar turno completo
 */
export async function actualizarTurno(
  turnoId: string,
  empresaId: string,
  datosActualizacion: Partial<ITurno>
): Promise<ITurno> {
  const turno = await TurnoModel.findOne({ _id: turnoId, empresaId });
  if (!turno) throw new Error('Turno no encontrado');

  // Actualizar campos permitidos
  if (datosActualizacion.fechaInicio) {
    turno.fechaInicio = new Date(datosActualizacion.fechaInicio);
    
    // Recalcular fechaFin si cambió la duración o fecha
    const duracion = datosActualizacion.duracion || turno.duracion;
    turno.fechaFin = new Date(turno.fechaInicio.getTime() + duracion * 60000);
  }
  
  if (datosActualizacion.duracion) {
    turno.duracion = datosActualizacion.duracion;
    turno.fechaFin = new Date(turno.fechaInicio.getTime() + datosActualizacion.duracion * 60000);
  }
  
  if (datosActualizacion.agenteId) turno.agenteId = datosActualizacion.agenteId as any;
  if (datosActualizacion.clienteId) turno.clienteId = datosActualizacion.clienteId as any;
  if (datosActualizacion.estado) turno.estado = datosActualizacion.estado;
  if (datosActualizacion.notas !== undefined) turno.notas = datosActualizacion.notas;
  if (datosActualizacion.datos) turno.datos = datosActualizacion.datos;

  await turno.save();

  return turno;
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
