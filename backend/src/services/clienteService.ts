// 👤 Servicio de Clientes
import { ClienteModel, ICliente } from '../models/Cliente.js';

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
export async function crearCliente(data: CrearClienteData): Promise<ICliente> {
  // Verificar que no exista un cliente con el mismo teléfono en la empresa
  const clienteExistente = await ClienteModel.findOne({
    empresaId: data.empresaId,
    telefono: data.telefono
  });

  if (clienteExistente) {
    throw new Error('Ya existe un cliente con ese teléfono');
  }

  // Si tiene email, verificar que no exista
  if (data.email) {
    const clienteConEmail = await ClienteModel.findOne({
      empresaId: data.empresaId,
      email: data.email
    });

    if (clienteConEmail) {
      throw new Error('Ya existe un cliente con ese email');
    }
  }

  const cliente = new ClienteModel({
    ...data,
    origen: data.origen || 'manual',
    activo: true
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
): Promise<ICliente[]> {
  const query: any = { empresaId };
  if (soloActivos) query.activo = true;

  return await ClienteModel.find(query).sort({ apellido: 1, nombre: 1 });
}

/**
 * Obtener un cliente por ID
 */
export async function obtenerClientePorId(
  clienteId: string,
  empresaId: string
): Promise<ICliente | null> {
  return await ClienteModel.findOne({ _id: clienteId, empresaId });
}

/**
 * Obtener cliente por teléfono (útil para chatbot)
 */
export async function obtenerClientePorTelefono(
  telefono: string,
  empresaId: string
): Promise<ICliente | null> {
  return await ClienteModel.findOne({ telefono, empresaId });
}

/**
 * Obtener cliente por chatbotUserId
 */
export async function obtenerClientePorChatbotUserId(
  chatbotUserId: string,
  empresaId: string
): Promise<ICliente | null> {
  return await ClienteModel.findOne({ chatbotUserId, empresaId });
}

/**
 * Actualizar un cliente
 */
export async function actualizarCliente(
  clienteId: string,
  empresaId: string,
  datos: Partial<CrearClienteData>
): Promise<ICliente> {
  const cliente = await ClienteModel.findOne({ _id: clienteId, empresaId });
  if (!cliente) throw new Error('Cliente no encontrado');

  // Si se está actualizando el teléfono, verificar que no exista otro cliente con ese teléfono
  if (datos.telefono && datos.telefono !== cliente.telefono) {
    const clienteConTelefono = await ClienteModel.findOne({
      empresaId,
      telefono: datos.telefono,
      _id: { $ne: clienteId }
    });

    if (clienteConTelefono) {
      throw new Error('Ya existe un cliente con ese teléfono');
    }
  }

  // Si se está actualizando el email, verificar que no exista otro cliente con ese email
  if (datos.email && datos.email !== cliente.email) {
    const clienteConEmail = await ClienteModel.findOne({
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
  const cliente = await ClienteModel.findOne({ _id: clienteId, empresaId });
  if (!cliente) throw new Error('Cliente no encontrado');

  // Eliminación física del registro
  await ClienteModel.deleteOne({ _id: clienteId, empresaId });
}

/**
 * Buscar clientes por nombre, apellido, teléfono o email
 */
export async function buscarClientes(
  empresaId: string,
  termino: string
): Promise<ICliente[]> {
  const regex = new RegExp(termino, 'i');
  
  return await ClienteModel.find({
    empresaId,
    activo: true,
    $or: [
      { nombre: regex },
      { apellido: regex },
      { telefono: regex },
      { email: regex }
    ]
  }).limit(20).sort({ apellido: 1, nombre: 1 });
}
