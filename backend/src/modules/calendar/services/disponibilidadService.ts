// 📅 Servicio de Disponibilidad
import { AgenteModel, IAgente } from '../models/Agente.js';
import { TurnoModel, EstadoTurno } from '../models/Turno.js';
import { BloqueoHorarioModel } from '../models/BloqueoHorario.js';

export interface Slot {
  fecha: Date;
  disponible: boolean;
  agenteId: string;
  duracion: number;
}

/**
 * Genera slots de tiempo disponibles para un agente en una fecha
 */
export async function generarSlotsDisponibles(
  agenteId: string,
  fecha: Date,
  duracion?: number
): Promise<Slot[]> {
  const agente = await AgenteModel.findById(agenteId);
  if (!agente) throw new Error('Agente no encontrado');

  const duracionSlot = duracion || agente.duracionTurnoPorDefecto;
  
  // 1. Obtener disponibilidad del agente para ese día
  const diaSemana = fecha.getDay();
  const disponibilidad = agente.disponibilidad.find(
    d => d.diaSemana === diaSemana && d.activo
  );
  
  if (!disponibilidad) return []; // No trabaja ese día

  // 2. Generar slots según horario
  const slots: Slot[] = [];
  const [horaInicio, minInicio] = disponibilidad.horaInicio.split(':').map(Number);
  const [horaFin, minFin] = disponibilidad.horaFin.split(':').map(Number);
  
  let horaActual = new Date(fecha);
  horaActual.setHours(horaInicio, minInicio, 0, 0);
  
  const horaLimite = new Date(fecha);
  horaLimite.setHours(horaFin, minFin, 0, 0);
  
  while (horaActual < horaLimite) {
    const finSlot = new Date(horaActual.getTime() + duracionSlot * 60000);
    
    if (finSlot <= horaLimite) {
      slots.push({
        fecha: new Date(horaActual),
        disponible: true,
        agenteId: (agente._id as any).toString(),
        duracion: duracionSlot
      });
    }
    
    // Avanzar por duración + buffer
    horaActual = new Date(
      horaActual.getTime() + (duracionSlot + agente.bufferEntreturnos) * 60000
    );
  }

  // 3. Marcar slots ocupados por turnos existentes
  const inicioDelDia = new Date(fecha);
  inicioDelDia.setHours(0, 0, 0, 0);
  
  const finDelDia = new Date(fecha);
  finDelDia.setHours(23, 59, 59, 999);
  
  const turnosExistentes = await TurnoModel.find({
    agenteId: (agente._id as any),
    fechaInicio: {
      $gte: inicioDelDia,
      $lt: finDelDia
    },
    estado: { $in: [EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO, EstadoTurno.EN_CURSO] }
  });

  for (const slot of slots) {
    for (const turno of turnosExistentes) {
      if (hayConflicto(slot.fecha, duracionSlot, turno.fechaInicio, turno.fechaFin)) {
        slot.disponible = false;
        break;
      }
    }
  }

  // 4. Verificar bloqueos
  const bloqueos = await BloqueoHorarioModel.find({
    agenteId: (agente._id as any),
    fechaInicio: { $lte: finDelDia },
    fechaFin: { $gte: inicioDelDia }
  });

  for (const slot of slots) {
    const finSlot = new Date(slot.fecha.getTime() + duracionSlot * 60000);
    
    for (const bloqueo of bloqueos) {
      if (slot.fecha >= bloqueo.fechaInicio && finSlot <= bloqueo.fechaFin) {
        slot.disponible = false;
        break;
      }
    }
  }

  return slots.filter(s => s.disponible);
}

/**
 * Verifica si hay conflicto entre dos rangos de tiempo
 */
function hayConflicto(
  inicio1: Date,
  duracion1: number,
  inicio2: Date,
  fin2: Date
): boolean {
  const fin1 = new Date(inicio1.getTime() + duracion1 * 60000);
  
  return (
    (inicio1 >= inicio2 && inicio1 < fin2) ||
    (fin1 > inicio2 && fin1 <= fin2) ||
    (inicio1 <= inicio2 && fin1 >= fin2)
  );
}

/**
 * Verifica si un horario está disponible para reservar
 */
export async function verificarDisponibilidad(
  empresaId: string,
  agenteId: string,
  fechaInicio: Date,
  duracion: number
): Promise<{ disponible: boolean; motivo?: string }> {
  const agente = await AgenteModel.findOne({ _id: agenteId, empresaId });
  if (!agente) {
    return { disponible: false, motivo: 'Agente no encontrado' };
  }

  if (!agente.activo) {
    return { disponible: false, motivo: 'Agente no activo' };
  }

  // Verificar que no haya conflictos con turnos existentes
  const fechaFin = new Date(fechaInicio.getTime() + duracion * 60000);
  
  const turnoConflicto = await TurnoModel.findOne({
    agenteId: (agente._id as any),
    empresaId,
    estado: { $in: [EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO, EstadoTurno.EN_CURSO] },
    $or: [
      {
        fechaInicio: { $lt: fechaFin },
        fechaFin: { $gt: fechaInicio }
      }
    ]
  });

  if (turnoConflicto) {
    return { disponible: false, motivo: 'El horario ya está ocupado' };
  }

  // Verificar bloqueos
  const bloqueo = await BloqueoHorarioModel.findOne({
    agenteId: (agente._id as any),
    empresaId,
    fechaInicio: { $lte: fechaFin },
    fechaFin: { $gte: fechaInicio }
  });

  if (bloqueo) {
    return { disponible: false, motivo: `Horario bloqueado: ${bloqueo.motivo}` };
  }

  return { disponible: true };
}
