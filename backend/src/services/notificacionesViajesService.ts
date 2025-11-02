// 🚗 Servicio de Notificaciones de Viajes - SIMPLIFICADO
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { ClienteModel } from '../models/Cliente.js';
import { EmpresaModel } from '../models/Empresa.js';
import { enviarMensajeWhatsAppTexto } from './metaService.js';
import { buscarEmpresaPorTelefono } from '../utils/empresaUtilsMongo.js';
import { iniciarFlujoNotificacionViajes } from './flowIntegrationService.js';
import { normalizarTelefono } from '../utils/telefonoUtils.js';

interface ViajeInfo {
  _id: string;
  origen: string;
  destino: string;
  horario: string;
}

/**
 * Enviar notificación de confirmación de viajes del día siguiente
 * @param clienteTelefono Teléfono del cliente
 * @param empresaTelefono Teléfono de la empresa
 * @param modoPrueba Si es true, busca turnos en los próximos 7 días
 */
export async function enviarNotificacionConfirmacionViajes(
  clienteTelefono: string,
  empresaTelefono: string,
  modoPrueba: boolean = false
): Promise<void> {
  console.log('📅 Enviando notificación de confirmación de viajes...');
  console.log(`   Cliente: ${clienteTelefono}`);
  console.log(`   Empresa: ${empresaTelefono}`);

  // 1. Buscar empresa en MongoDB (documento completo con _id)
  console.log('🔍 Buscando empresa en MongoDB por teléfono:', empresaTelefono);
  const empresaDoc = await EmpresaModel.findOne({ 
    telefono: new RegExp(empresaTelefono.replace(/\D/g, '')) 
  });
  
  if (!empresaDoc) {
    console.error('❌ Empresa no encontrada en MongoDB');
    throw new Error('Empresa no encontrada');
  }
  
  console.log('✅ Empresa encontrada:', empresaDoc.nombre);
  
  const phoneNumberId = empresaDoc.phoneNumberId;
  if (!phoneNumberId) {
    console.error('❌ phoneNumberId no configurado para la empresa');
    throw new Error('phoneNumberId no configurado');
  }

  // 2. Buscar cliente por teléfono y empresaId
  console.log('🔍 Buscando cliente por teléfono:', clienteTelefono);
  const cliente = await ClienteModel.findOne({
    empresaId: empresaDoc.nombre, // Los clientes usan el nombre de la empresa
    telefono: clienteTelefono
  });

  if (!cliente) {
    console.error('❌ Cliente no encontrado');
    throw new Error(`Cliente no encontrado con teléfono ${clienteTelefono}`);
  }
  
  console.log('✅ Cliente encontrado:', cliente.nombre, cliente.apellido);
  console.log('   Cliente ID:', cliente._id.toString());

  // 3. Definir rango de fechas
  let fechaInicio: Date;
  let fechaFin: Date;
  
  if (modoPrueba) {
    // Modo prueba: buscar turnos en los próximos 7 días
    console.log('🧪 Modo prueba: buscando turnos en los próximos 7 días');
    fechaInicio = new Date();
    fechaInicio.setHours(0, 0, 0, 0);
    
    fechaFin = new Date();
    fechaFin.setDate(fechaFin.getDate() + 7);
    fechaFin.setHours(23, 59, 59, 999);
  } else {
    // Modo normal: solo mañana
    fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() + 1);
    fechaInicio.setHours(0, 0, 0, 0);
    
    fechaFin = new Date(fechaInicio);
    fechaFin.setHours(23, 59, 59, 999);
  }

  console.log('📅 Rango de búsqueda:');
  console.log('   Desde:', fechaInicio.toISOString());
  console.log('   Hasta:', fechaFin.toISOString());

  // 4. Buscar turnos del cliente
  const query = {
    empresaId: empresaDoc.nombre, // Los turnos usan el nombre de la empresa
    clienteId: cliente._id.toString(), // Usar el _id del cliente
    fechaInicio: {
      $gte: fechaInicio,
      $lte: fechaFin
    },
    estado: { $in: ['pendiente', 'confirmado'] }
  };
  
  console.log('🔍 Query de búsqueda de turnos:', JSON.stringify(query, null, 2));
  
  const turnos = await TurnoModel.find(query)
    .sort({ fechaInicio: 1 })
    .limit(10);

  if (turnos.length === 0) {
    const mensaje = modoPrueba 
      ? 'ℹ️ No hay viajes programados en los próximos 7 días'
      : 'ℹ️ No hay viajes programados para mañana';
    console.log(mensaje);
    throw new Error(mensaje);
  }
  
  console.log(`✅ Encontrados ${turnos.length} turnos`);
  turnos.forEach((turno, i) => {
    console.log(`   ${i + 1}. ${new Date(turno.fechaInicio).toLocaleString('es-AR')}`);
  });

  // Construir información de viajes
  const viajes: ViajeInfo[] = turnos.map((turno) => {
    const horario = new Date(turno.fechaInicio).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const origen = turno.datos?.origin || 'Origen no especificado';
    const destino = turno.datos?.destination || 'Destino no especificado';

    return {
      _id: turno._id.toString(),
      origen,
      destino,
      horario
    };
  });

  // Construir mensaje con formato mejorado
  let mensaje = `Recordatorio de viajes para mañana\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━\n`;

  viajes.forEach((viaje, index) => {
    mensaje += `Viaje ${index + 1}\n\n`;
    mensaje += `📍 Origen: ${viaje.origen}\n`;
    mensaje += `📍 Destino: ${viaje.destino}\n`;
    mensaje += `🕐 Hora: ${viaje.horario}\n`;
    mensaje += `👥 Pasajeros: 1\n\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━\n`;
  });

  mensaje += `\n¿Qué deseas hacer?\n\n`;
  mensaje += `1️⃣ Confirmar todos los viajes\n`;
  mensaje += `2️⃣ Editar un viaje específico\n\n`;
  mensaje += `Responde con el número de la opción.`;

  // ⚠️ CRÍTICO: Normalizar teléfono (sin +, espacios, guiones)
  // Debe coincidir con el formato usado en whatsappController
  const telefonoNormalizado = normalizarTelefono(clienteTelefono);
  
  console.log('📞 Teléfono normalizado:', {
    original: clienteTelefono,
    normalizado: telefonoNormalizado
  });

  // Enviar mensaje
  await enviarMensajeWhatsAppTexto(
    clienteTelefono,  // Meta API acepta con o sin +
    mensaje,
    phoneNumberId
  );

  // Iniciar flujo de notificaciones
  // IMPORTANTE: 
  // 1. Usar el NOMBRE de la empresa, no el ObjectId
  // 2. Usar teléfono NORMALIZADO (sin +)
  await iniciarFlujoNotificacionViajes(
    telefonoNormalizado,  // ✅ Sin + para coincidir con webhook
    empresaDoc.nombre,    // ✅ Usar nombre, no _id
    viajes
  );

  console.log('✅ Notificación enviada y flujo iniciado exitosamente');
}
