// 🤖 Servicio de Creación Automática de Clientes desde WhatsApp
import { ClienteModel, type ICliente } from '../models/Cliente.js';
import { normalizarTelefono } from '../utils/telefonoUtils.js';

interface DatosWhatsApp {
  telefono: string;
  profileName?: string;
  empresaId: string;
  chatbotUserId?: string;
}

/**
 * Busca o crea un cliente automáticamente desde WhatsApp
 * @param datos Datos del cliente desde WhatsApp
 * @returns Cliente encontrado o creado
 */
export async function buscarOCrearClienteDesdeWhatsApp(
  datos: DatosWhatsApp
): Promise<ICliente> {
  const { telefono, profileName, empresaId, chatbotUserId } = datos;

  // ⚠️ CRÍTICO: Normalizar teléfono (sin +, espacios, guiones)
  const telefonoNormalizado = normalizarTelefono(telefono);

  // 1. Buscar cliente existente por teléfono (normalizado)
  let cliente = await ClienteModel.findOne({
    empresaId,
    telefono: telefonoNormalizado
  });

  if (cliente) {
    console.log('✅ Cliente existente encontrado:', {
      id: cliente._id,
      nombre: cliente.nombre,
      telefono: cliente.telefono
    });

    // Actualizar profileName si cambió
    if (profileName && cliente.profileName !== profileName) {
      cliente.profileName = profileName;
      await cliente.save();
      console.log('📝 ProfileName actualizado:', profileName);
    }

    return cliente;
  }

  // 2. Cliente no existe, crear uno nuevo
  console.log('🆕 Creando nuevo cliente desde WhatsApp:', {
    telefonoOriginal: telefono,
    telefonoNormalizado,
    profileName,
    empresaId
  });

  // Extraer nombre y apellido del profileName
  let nombre = 'Cliente';
  let apellido = 'WhatsApp';

  if (profileName) {
    const partes = profileName.trim().split(' ');
    if (partes.length === 1) {
      nombre = partes[0];
      apellido = '';
    } else if (partes.length >= 2) {
      nombre = partes[0];
      apellido = partes.slice(1).join(' ');
    }
  }

  // Crear cliente con teléfono normalizado
  cliente = new ClienteModel({
    empresaId,
    nombre,
    apellido: apellido || 'Sin Apellido',
    telefono: telefonoNormalizado,  // ✅ Guardar normalizado
    profileName,
    origen: 'chatbot',
    chatbotUserId,
    activo: true,
    notas: `Cliente creado automáticamente desde WhatsApp el ${new Date().toLocaleString('es-AR')}`,
    preferencias: {
      aceptaWhatsApp: true,
      aceptaSMS: false,
      aceptaEmail: true,
      recordatorioTurnos: true,
      diasAnticipacionRecordatorio: 1,
      horaRecordatorio: '10:00',
      notificacionesPromocion: false,
      notificacionesDisponibilidad: false
    }
  });

  await cliente.save();

  console.log('✅ Cliente creado exitosamente:', {
    id: cliente._id,
    nombre: cliente.nombre,
    apellido: cliente.apellido,
    telefono: cliente.telefono,
    origen: cliente.origen
  });

  return cliente;
}

/**
 * Actualiza el sector de un cliente
 * @param clienteId ID del cliente
 * @param sector Nuevo sector
 */
export async function actualizarSectorCliente(
  clienteId: string,
  sector: string
): Promise<ICliente | null> {
  const cliente = await ClienteModel.findByIdAndUpdate(
    clienteId,
    { sector },
    { new: true }
  );

  if (cliente) {
    console.log('✅ Sector actualizado:', {
      clienteId,
      sector,
      nombre: cliente.nombre
    });
  }

  return cliente;
}

/**
 * Obtiene todos los clientes de un sector
 * @param empresaId ID de la empresa
 * @param sector Sector a filtrar
 */
export async function obtenerClientesPorSector(
  empresaId: string,
  sector: string
): Promise<ICliente[]> {
  return await ClienteModel.find({
    empresaId,
    sector,
    activo: true
  }).sort({ nombre: 1, apellido: 1 });
}
