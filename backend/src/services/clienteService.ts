// 👤 Servicio de Clientes (MIGRADO A ContactoEmpresa)
import { ContactoEmpresaModel, IContactoEmpresa } from '../models/ContactoEmpresa.js';
import { normalizarTelefono } from '../utils/telefonoUtils.js';

export interface CrearClienteData {
  empresaId: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  fechaNacimiento?: Date;
  dni?: string;
  notas?: string;
  origen?: 'chatbot' | 'manual';
  chatbotUserId?: string;
}

/**
 * Crear un nuevo cliente
 */
export async function crearCliente(data: CrearClienteData): Promise<IContactoEmpresa> {
  // Normalizar teléfono
  const telefonoNormalizado = normalizarTelefono(data.telefono);
  
  // Verificar que no exista un cliente con el mismo teléfono en la empresa
  const clienteExistente = await ContactoEmpresaModel.findOne({
    empresaId: data.empresaId,
    telefono: telefonoNormalizado
  });

  if (clienteExistente) {
    throw new Error('Ya existe un cliente con ese teléfono');
  }

  // Si tiene email, verificar que no exista
  if (data.email) {
    const clienteConEmail = await ContactoEmpresaModel.findOne({
      empresaId: data.empresaId,
      email: data.email
    });

    if (clienteConEmail) {
      throw new Error('Ya existe un cliente con ese email');
    }
  }

  const cliente = new ContactoEmpresaModel({
    empresaId: data.empresaId,
    telefono: telefonoNormalizado,
    nombre: data.nombre,
    apellido: data.apellido,
    email: data.email,
    direccion: data.direccion,
    ciudad: data.ciudad,
    provincia: data.provincia,
    codigoPostal: data.codigoPostal,
    fechaNacimiento: data.fechaNacimiento,
    dni: data.dni,
    notas: data.notas,
    origen: data.origen || 'manual',
    activo: true,
    preferencias: {
      aceptaWhatsApp: true,
      aceptaSMS: false,
      aceptaEmail: true,
      recordatorioTurnos: true,
      diasAnticipacionRecordatorio: 1,
      horaRecordatorio: '10:00',
      notificacionesPromocion: false,
      notificacionesDisponibilidad: false
    },
    conversaciones: {
      historial: [],
      ultimaConversacion: new Date(),
      saludado: false,
      despedido: false,
      mensaje_ids: [],
      ultimo_status: '',
      contactoInformado: false
    },
    metricas: {
      interacciones: 0,
      mensajesEnviados: 0,
      mensajesRecibidos: 0,
      mediaRecibidos: 0,
      tokensConsumidos: 0,
      turnosRealizados: 0,
      turnosCancelados: 0,
      ultimaInteraccion: new Date()
    }
  });

  await cliente.save();
  return cliente;
}

/**
 * Obtener todos los clientes de una empresa
 */
export async function obtenerClientes(
  empresaId: string,
  soloActivos: boolean = false
): Promise<IContactoEmpresa[]> {
  const query: any = { empresaId };
  if (soloActivos) query.activo = true;

  return await ContactoEmpresaModel.find(query).sort({ creadoEn: -1 });
}

/**
 * Obtener un cliente por ID
 */
export async function obtenerClientePorId(
  clienteId: string,
  empresaId: string
): Promise<IContactoEmpresa | null> {
  return await ContactoEmpresaModel.findOne({ _id: clienteId, empresaId });
}

/**
 * Obtener cliente por teléfono (útil para chatbot)
 */
export async function obtenerClientePorTelefono(
  telefono: string,
  empresaId: string
): Promise<IContactoEmpresa | null> {
  return await ContactoEmpresaModel.findOne({ telefono, empresaId });
}

/**
 * Obtener cliente por chatbotUserId
 */
export async function obtenerClientePorChatbotUserId(
  chatbotUserId: string,
  empresaId: string
): Promise<IContactoEmpresa | null> {
  return await ContactoEmpresaModel.findOne({ chatbotUserId, empresaId });
}

/**
 * Actualizar un cliente
 */
export async function actualizarCliente(
  clienteId: string,
  empresaId: string,
  datos: Partial<CrearClienteData>
): Promise<IContactoEmpresa> {
  const cliente = await ContactoEmpresaModel.findOne({ _id: clienteId, empresaId });
  if (!cliente) throw new Error('Cliente no encontrado');

  // Nota: Se permite que múltiples clientes tengan el mismo teléfono
  // (ej: hermanos usando el teléfono del padre)

  // Si se está actualizando el email, verificar que no exista otro cliente con ese email
  if (datos.email && datos.email !== cliente.email) {
    const clienteConEmail = await ContactoEmpresaModel.findOne({
      empresaId,
      email: datos.email,
      _id: { $ne: clienteId }
    });

    if (clienteConEmail) {
      throw new Error('Ya existe un cliente con ese email');
    }
  }

  Object.assign(cliente, datos);
  await cliente.save();

  return cliente;
}

/**
 * Eliminar permanentemente un cliente
 */
export async function eliminarCliente(
  clienteId: string,
  empresaId: string
): Promise<void> {
  const cliente = await ContactoEmpresaModel.findOne({ _id: clienteId, empresaId });
  if (!cliente) throw new Error('Cliente no encontrado');

  // Eliminación física del registro
  await ContactoEmpresaModel.deleteOne({ _id: clienteId, empresaId });
}

/**
 * Buscar clientes por nombre, apellido, teléfono o email
 */
export async function buscarClientes(
  empresaId: string,
  termino: string
): Promise<IContactoEmpresa[]> {
  const regex = new RegExp(termino, 'i');
  
  return await ContactoEmpresaModel.find({
    empresaId,
    activo: true,
    $or: [
      { nombre: regex },
      { apellido: regex },
      { telefono: regex },
      { email: regex }
    ]
  }).limit(20).sort({ creadoEn: -1 });
}

/**
 * Agregar un agente a un cliente
 */
export async function agregarAgente(
  clienteId: string,
  empresaId: string,
  agenteId: string
): Promise<IContactoEmpresa> {
  const cliente = await ContactoEmpresaModel.findOne({ _id: clienteId, empresaId });
  if (!cliente) throw new Error('Cliente no encontrado');

  // Verificar si el agente ya está asignado
  if (cliente.agentesAsignados.some(id => id.toString() === agenteId)) {
    throw new Error('El agente ya está asignado a este cliente');
  }

  cliente.agentesAsignados.push(agenteId as any);
  await cliente.save();

  return cliente;
}

/**
 * Remover un agente de un cliente
 */
export async function removerAgente(
  clienteId: string,
  empresaId: string,
  agenteId: string
): Promise<IContactoEmpresa> {
  const cliente = await ContactoEmpresaModel.findOne({ _id: clienteId, empresaId });
  if (!cliente) throw new Error('Cliente no encontrado');

  cliente.agentesAsignados = cliente.agentesAsignados.filter(
    id => id.toString() !== agenteId
  ) as any;
  await cliente.save();

  return cliente;
}

/**
 * Reemplazar todos los agentes de un cliente
 */
export async function reemplazarAgentes(
  clienteId: string,
  empresaId: string,
  agentesIds: string[]
): Promise<IContactoEmpresa> {
  const cliente = await ContactoEmpresaModel.findOne({ _id: clienteId, empresaId });
  if (!cliente) throw new Error('Cliente no encontrado');

  cliente.agentesAsignados = agentesIds as any;
  await cliente.save();

  return cliente;
}

/**
 * Obtener clientes por agente asignado
 */
export async function obtenerClientesPorAgente(
  empresaId: string,
  agenteId: string
): Promise<IContactoEmpresa[]> {
  return await ContactoEmpresaModel.find({
    empresaId,
    agentesAsignados: agenteId,
    activo: true
  }).sort({ creadoEn: -1 });
}

/**
 * Obtener clientes sin agente asignado
 */
export async function obtenerClientesSinAgente(
  empresaId: string
): Promise<IContactoEmpresa[]> {
  return await ContactoEmpresaModel.find({
    empresaId,
    $or: [
      { agentesAsignados: { $size: 0 } },
      { agentesAsignados: { $exists: false } }
    ],
    activo: true
  }).sort({ creadoEn: -1 });
}
