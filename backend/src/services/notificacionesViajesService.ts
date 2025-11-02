// 🚗 Servicio de Notificaciones de Viajes - SIMPLIFICADO
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { enviarMensajeWhatsAppTexto } from './metaService.js';
import { buscarEmpresaPorTelefono } from '../utils/empresaUtilsMongo.js';
import { iniciarFlujoNotificacionViajes } from './flowIntegrationService.js';

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

  // Buscar empresa
  const empresa = await buscarEmpresaPorTelefono(empresaTelefono);
  if (!empresa) {
    console.error('❌ Empresa no encontrada');
    return;
  }

  const phoneNumberId = (empresa as any).phoneNumberId;
  if (!phoneNumberId) {
    console.error('❌ phoneNumberId no configurado para la empresa');
    return;
  }

  // Obtener turnos del cliente
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

  const turnos = await TurnoModel.find({
    empresaId: (empresa as any)._id?.toString() || empresa.nombre,
    clienteId: clienteTelefono,
    fechaInicio: {
      $gte: fechaInicio,
      $lte: fechaFin
    },
    estado: { $in: ['pendiente', 'confirmado'] }
  }).sort({ fechaInicio: 1 }).limit(10);

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

  // Enviar mensaje
  await enviarMensajeWhatsAppTexto(
    clienteTelefono,
    mensaje,
    phoneNumberId
  );

  // Iniciar flujo de notificaciones
  await iniciarFlujoNotificacionViajes(
    clienteTelefono,
    (empresa as any)._id?.toString() || empresa.nombre,
    viajes
  );

  console.log('✅ Notificación enviada y flujo iniciado exitosamente');
}
