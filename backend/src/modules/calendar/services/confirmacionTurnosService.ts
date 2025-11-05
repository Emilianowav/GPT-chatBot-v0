// 🔔 Servicio de Confirmación Interactiva de Turnos
// ⚠️ NOTA: La lógica de manejo de respuestas se movió a notificacionViajesFlow.ts
// Este servicio ahora solo envía el mensaje inicial e inicia el flujo.

import { TurnoModel } from '../models/Turno.js';
import { ContactoEmpresaModel } from '../../../models/ContactoEmpresa.js';
import { enviarMensajeWhatsAppTexto } from '../../../services/metaService.js';
import { EmpresaModel } from '../../../models/Empresa.js';
import { iniciarFlujoNotificacionViajes } from '../../../services/flowIntegrationService.js';

/**
 * Enviar notificación de confirmación con opciones
 * Construye el mensaje inicial y luego inicia el flujo en FlowManager
 */
export async function enviarNotificacionConfirmacion(
  clienteId: string,
  turnos: any[],
  empresaId: string
): Promise<boolean> {
  
  try {
    console.log(`🔔 [ConfirmacionTurnos] Enviando notificación a cliente ${clienteId}`);
    console.log(`   Turnos: ${turnos.length}`);
    
    const contacto = await ContactoEmpresaModel.findById(clienteId);
    if (!contacto || !contacto.telefono) {
      console.error('❌ Contacto sin teléfono');
      return false;
    }

    // Construir mensaje inicial
    let mensaje = `🚗 *Recordatorio de ${turnos.length > 1 ? 'viajes' : 'viaje'} para mañana*\n\n`;
    
    turnos.forEach((turno, index) => {
      const fechaInicio = new Date(turno.fechaInicio);
      const horas = String(fechaInicio.getUTCHours()).padStart(2, '0');
      const minutos = String(fechaInicio.getUTCMinutes()).padStart(2, '0');
      const hora = `${horas}:${minutos}`;
      
      const origen = turno.datos?.origen || 'No especificado';
      const destino = turno.datos?.destino || 'No especificado';
      const pasajeros = turno.datos?.pasajeros || '1';
      
      if (turnos.length > 1) {
        mensaje += `━━━━━━━━━━━━━━━━━━\n`;
        mensaje += `*Viaje ${index + 1}*\n\n`;
      }
      
      mensaje += `📍 *Origen:* ${origen}\n`;
      mensaje += `📍 *Destino:* ${destino}\n`;
      mensaje += `🕐 *Hora:* ${hora}\n`;
      mensaje += `👥 *Pasajeros:* ${pasajeros}\n\n`;
    });
    
    mensaje += `━━━━━━━━━━━━━━━━━━\n\n`;
    mensaje += `*¿Qué deseas hacer?*\n\n`;
    mensaje += `1️⃣ Confirmar ${turnos.length > 1 ? 'todos los viajes' : 'el viaje'}\n`;
    mensaje += `2️⃣ Editar un viaje específico\n`;
    mensaje += `\nResponde con el número de la opción.`;

    // Obtener empresa
    const empresa = await EmpresaModel.findOne({ nombre: empresaId });
    if (!empresa) {
      console.error('❌ No se encontró la empresa:', empresaId);
      return false;
    }

    const phoneNumberId = (empresa as any).phoneNumberId;
    if (!phoneNumberId) {
      console.error('❌ No se encontró phoneNumberId para la empresa:', empresaId);
      return false;
    }

    console.log(`📤 Enviando mensaje a ${contacto.telefono}`);
    
    // Enviar mensaje
    const enviado = await enviarMensajeWhatsAppTexto(contacto.telefono, mensaje, phoneNumberId);
    
    if (enviado) {
      console.log(`✅ Mensaje enviado correctamente`);
      
      // ✅ Iniciar flujo en FlowManager
      console.log(`🔄 Iniciando flujo de notificación de viajes...`);
      await iniciarFlujoNotificacionViajes(
        contacto.telefono,
        empresaId,
        turnos
      );
      
      console.log(`✅ Flujo iniciado correctamente`);
      
      // Marcar notificaciones como enviadas
      for (const turno of turnos) {
        if (!turno.notificaciones) turno.notificaciones = [];
        turno.notificaciones.push({
          tipo: 'confirmacion',
          programadaPara: new Date(),
          enviada: true,
          enviadaEn: new Date(),
          plantilla: 'confirmacion_interactiva'
        });
        await turno.save();
      }
      
      console.log(`✅ Notificaciones marcadas como enviadas`);
    } else {
      console.error('❌ Error al enviar mensaje de WhatsApp');
    }
    
    return enviado;
    
  } catch (error) {
    console.error('❌ Error enviando notificación de confirmación:', error);
    return false;
  }
}
