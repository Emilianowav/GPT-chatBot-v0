// 👨‍⚕️ Servicio de Agentes
import { AgenteModel, IAgente, Disponibilidad } from '../models/Agente.js';

export interface CrearAgenteData {
  empresaId: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  especialidad?: string;
  descripcion?: string;
  titulo?: string;
  duracionTurnoPorDefecto?: number;
  bufferEntreturnos?: number;
  maximoTurnosPorDia?: number;
}

/**
 * Crear un nuevo agente
 */
export async function crearAgente(data: CrearAgenteData): Promise<IAgente> {
  // Verificar que no exista un agente con el mismo email en la empresa
  const agenteExistente = await AgenteModel.findOne({
    empresaId: data.empresaId,
    email: data.email
  });

  if (agenteExistente) {
    throw new Error('Ya existe un agente con ese email');
  }

  const agente = new AgenteModel({
    ...data,
    disponibilidad: [],
    activo: true
  });

  await agente.save();
  return agente;
}

/**
 * Obtener todos los agentes de una empresa
 */
export async function obtenerAgentes(
  empresaId: string,
  soloActivos: boolean = false
): Promise<IAgente[]> {
  const query: any = { empresaId };
  if (soloActivos) query.activo = true;

  return await AgenteModel.find(query).sort({ nombre: 1, apellido: 1 });
}

/**
 * Obtener un agente por ID
 */
export async function obtenerAgentePorId(
  agenteId: string,
  empresaId: string
): Promise<IAgente | null> {
  return await AgenteModel.findOne({ _id: agenteId, empresaId });
}

/**
 * Actualizar un agente
 */
export async function actualizarAgente(
  agenteId: string,
  empresaId: string,
  datos: Partial<CrearAgenteData>
): Promise<IAgente> {
  const agente = await AgenteModel.findOne({ _id: agenteId, empresaId });
  if (!agente) throw new Error('Agente no encontrado');

  // Si se está actualizando el email, verificar que no exista otro agente con ese email
  if (datos.email && datos.email !== agente.email) {
    const agenteConEmail = await AgenteModel.findOne({
      empresaId,
      email: datos.email,
      _id: { $ne: agenteId }
    });

    if (agenteConEmail) {
      throw new Error('Ya existe un agente con ese email');
    }
  }

  Object.assign(agente, datos);
  await agente.save();

  return agente;
}

/**
 * Eliminar permanentemente un agente
 */
export async function eliminarAgente(
  agenteId: string,
  empresaId: string
): Promise<void> {
  const agente = await AgenteModel.findOne({ _id: agenteId, empresaId });
  if (!agente) throw new Error('Agente no encontrado');

  // Eliminación física del registro
  await AgenteModel.deleteOne({ _id: agenteId, empresaId });
}

/**
 * Configurar disponibilidad de un agente
 */
export async function configurarDisponibilidad(
  agenteId: string,
  empresaId: string,
  disponibilidad: Disponibilidad[]
): Promise<IAgente> {
  const agente = await AgenteModel.findOne({ _id: agenteId, empresaId });
  if (!agente) throw new Error('Agente no encontrado');

  // Validar formato de horarios
  for (const disp of disponibilidad) {
    const [horaIni, minIni] = disp.horaInicio.split(':').map(Number);
    const [horaFin, minFin] = disp.horaFin.split(':').map(Number);

    const inicioMinutos = horaIni * 60 + minIni;
    const finMinutos = horaFin * 60 + minFin;

    if (finMinutos <= inicioMinutos) {
      throw new Error('La hora de fin debe ser posterior a la hora de inicio');
    }
  }

  agente.disponibilidad = disponibilidad;
  await agente.save();

  return agente;
}

/**
 * Obtener agentes disponibles en una fecha/hora específica
 */
export async function obtenerAgentesDisponibles(
  empresaId: string,
  fecha: Date
): Promise<IAgente[]> {
  const diaSemana = fecha.getDay();
  
  const agentes = await AgenteModel.find({
    empresaId,
    activo: true,
    'disponibilidad.diaSemana': diaSemana,
    'disponibilidad.activo': true
  });

  return agentes;
}
