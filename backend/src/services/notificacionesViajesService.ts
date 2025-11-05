// 🚗 Servicio de Notificaciones de Viajes - SIMPLIFICADO
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { EmpresaModel } from '../models/Empresa.js';
import { enviarMensajeWhatsAppTexto } from './metaService.js';
import { buscarEmpresaPorTelefono } from '../utils/empresaUtilsMongo.js';
import { iniciarFlujoNotificacionViajes } from './flowIntegrationService.js';
import { normalizarTelefono } from '../utils/telefonoUtils.js';
import { enviarNotificacionConfirmacion } from '../modules/calendar/services/confirmacionTurnosService.js';

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
  // ⚠️ IMPORTANTE: Normalizar teléfono para buscar
  // El cliente puede estar guardado con o sin +
  const telefonoNormalizadoBusqueda = normalizarTelefono(clienteTelefono);
  
  console.log('🔍 Buscando cliente por teléfono:', clienteTelefono);
  console.log('   Teléfono normalizado para búsqueda:', telefonoNormalizadoBusqueda);
  
  // Buscar contacto con teléfono normalizado
  const contacto = await ContactoEmpresaModel.findOne({
    empresaId: empresaDoc.nombre,
    telefono: telefonoNormalizadoBusqueda
  });

  if (!contacto) {
    console.error('❌ Contacto no encontrado');
    throw new Error(`Contacto no encontrado con teléfono ${clienteTelefono}`);
  }
  
  console.log('✅ Contacto encontrado:', contacto.nombre, contacto.apellido);
  console.log('   Contacto ID:', contacto._id.toString());
  console.log('   Teléfono en BD:', contacto.telefono);
  
  // ✅ El teléfono ya está normalizado en contactos_empresa

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

  // 4. Buscar turnos del contacto
  // ⚠️ IMPORTANTE: Solo buscar turnos PENDIENTES (no confirmados)
  console.log('🔍 Buscando turnos del contacto...');
  const turnos = await TurnoModel.find({
    empresaId: empresaDoc.nombre,
    clienteId: contacto._id.toString(),
    fechaInicio: {
      $gte: fechaInicio,
      $lte: fechaFin
    },
    estado: 'pendiente' // Solo turnos pendientes, NO confirmados
  })
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

  // ✅ USAR SERVICIO CON PLANTILLAS DE META
  console.log('📋 Usando servicio de confirmación con plantillas de Meta...');
  
  try {
    const enviado = await enviarNotificacionConfirmacion(
      contacto._id.toString(),  // clienteId
      turnos,                   // turnos completos
      empresaDoc.nombre         // empresaId (nombre)
    );
    
    if (enviado) {
      console.log('✅ Notificación enviada con plantilla de Meta y flujo iniciado exitosamente');
    } else {
      console.error('❌ No se pudo enviar la notificación');
      throw new Error('Error al enviar notificación con plantilla');
    }
  } catch (error) {
    console.error('❌ Error en enviarNotificacionConfirmacion:', error);
    throw error;
  }
}
