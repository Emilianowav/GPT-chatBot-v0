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
  sector?: string;
  modoAtencion?: 'turnos_programados' | 'turnos_libres' | 'mixto';
  disponibilidad?: Disponibilidad[];
  duracionTurnoPorDefecto?: number;
  bufferEntreturnos?: number;
  capacidadSimultanea?: number;
  maximoTurnosPorDia?: number;
  activo?: boolean;
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
    disponibilidad: data.disponibilidad || [],
    activo: data.activo !== undefined ? data.activo : true,
    modoAtencion: data.modoAtencion || 'turnos_programados',
    duracionTurnoPorDefecto: data.duracionTurnoPorDefecto || 30,
    bufferEntreturnos: data.bufferEntreturnos || 5,
    capacidadSimultanea: data.capacidadSimultanea || 1
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
    // Validar formato HH:MM
    if (!disp.horaInicio || !disp.horaFin) {
      throw new Error('Horario incompleto: debe especificar hora de inicio y fin');
    }

    const [horaIni, minIni] = disp.horaInicio.split(':').map(Number);
    const [horaFin, minFin] = disp.horaFin.split(':').map(Number);

    // Validar que sean números válidos
    if (isNaN(horaIni) || isNaN(minIni) || isNaN(horaFin) || isNaN(minFin)) {
      throw new Error(`Formato de hora inválido: ${disp.horaInicio} - ${disp.horaFin}`);
    }

    const inicioMinutos = horaIni * 60 + minIni;
    const finMinutos = horaFin * 60 + minFin;

    console.log(`🕐 Validando horario: ${disp.horaInicio} (${inicioMinutos} min) - ${disp.horaFin} (${finMinutos} min)`);

    // La hora de fin debe ser posterior a la de inicio
    if (finMinutos <= inicioMinutos) {
      throw new Error(`La hora de fin (${disp.horaFin}) debe ser posterior a la hora de inicio (${disp.horaInicio}). Recibido: ${inicioMinutos} min -> ${finMinutos} min`);
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
