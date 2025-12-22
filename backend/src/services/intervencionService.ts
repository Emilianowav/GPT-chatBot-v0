// 🎯 Servicio de Intervención de Conversaciones
// Permite pausar el chatbot y enviar mensajes manuales desde el CRM

import { ContactoEmpresaModel, IContactoEmpresa } from '../models/ContactoEmpresa.js';
import { enviarMensajeWhatsAppTexto } from './metaService.js';
import { EmpresaModel } from '../models/Empresa.js';
import { wss } from '../app.js';

/**
 * Pausar el chatbot para un contacto específico
 */
export async function pausarChatbot(
  contactoId: string,
  empresaId: string,
  pausadoPor: string
): Promise<IContactoEmpresa> {
  console.log('🔍 [INTERVENCION] Buscando contacto:', { contactoId, empresaId });
  
  // Buscar por ID primero, luego verificar empresa
  const contacto = await ContactoEmpresaModel.findById(contactoId);

  if (!contacto) {
    throw new Error('Contacto no encontrado');
  }

  // Verificar que el contacto pertenece a la empresa
  if (contacto.empresaId !== empresaId) {
    console.log('❌ [INTERVENCION] empresaId no coincide:', { 
      contactoEmpresaId: contacto.empresaId, 
      tokenEmpresaId: empresaId 
    });
    throw new Error('Este contacto no pertenece a tu empresa');
  }

  contacto.chatbotPausado = true;
  contacto.chatbotPausadoPor = pausadoPor;
  contacto.chatbotPausadoEn = new Date();
  await contacto.save();

  console.log(`⏸️ Chatbot pausado para ${contacto.nombre} ${contacto.apellido} por ${pausadoPor}`);

  // Notificar vía WebSocket
  notificarCambioEstado(empresaId, contactoId, true);

  return contacto;
}

/**
 * Reanudar el chatbot para un contacto específico
 */
export async function reanudarChatbot(
  contactoId: string,
  empresaId: string
): Promise<IContactoEmpresa> {
  const contacto = await ContactoEmpresaModel.findById(contactoId);

  if (!contacto) {
    throw new Error('Contacto no encontrado');
  }

  if (contacto.empresaId !== empresaId) {
    throw new Error('Este contacto no pertenece a tu empresa');
  }

  contacto.chatbotPausado = false;
  contacto.chatbotPausadoPor = undefined;
  contacto.chatbotPausadoEn = undefined;
  await contacto.save();

  console.log(`▶️ Chatbot reanudado para ${contacto.nombre} ${contacto.apellido}`);

  // Notificar vía WebSocket
  notificarCambioEstado(empresaId, contactoId, false);

  return contacto;
}

/**
 * Enviar mensaje manual desde el CRM
 */
export async function enviarMensajeManual(
  contactoId: string,
  empresaId: string,
  mensaje: string,
  enviadoPor: string
): Promise<{ success: boolean; messageId?: string }> {
  // Buscar contacto
  const contacto = await ContactoEmpresaModel.findById(contactoId);

  if (!contacto) {
    throw new Error('Contacto no encontrado');
  }

  if (contacto.empresaId !== empresaId) {
    throw new Error('Este contacto no pertenece a tu empresa');
  }

  // Usar phoneNumberId del último mensaje del contacto, o buscar de la empresa como fallback
  let phoneNumberId = contacto.ultimoPhoneNumberId;
  
  if (!phoneNumberId) {
    console.log('⚠️ [INTERVENCION] No hay ultimoPhoneNumberId, buscando de empresa...');
    const empresa = await EmpresaModel.findOne({ nombre: empresaId });
    if (!empresa) {
      throw new Error('Empresa no encontrada');
    }
    phoneNumberId = empresa.phoneNumberId;
  }
  
  if (!phoneNumberId) {
    throw new Error('No se pudo obtener phoneNumberId para enviar mensaje');
  }

  try {
    console.log('📤 [INTERVENCION] Enviando mensaje manual:', {
      telefonoContacto: contacto.telefono,
      phoneNumberId,
      usandoUltimoPhoneNumberId: !!contacto.ultimoPhoneNumberId,
      mensajeLength: mensaje.length
    });
    
    // Enviar mensaje vía WhatsApp API
    const result = await enviarMensajeWhatsAppTexto(
      contacto.telefono,
      mensaje,
      phoneNumberId
    );

    // Agregar mensaje al historial
    const mensajeHistorial = `Operador (${enviadoPor}): ${mensaje}`;
    contacto.conversaciones.historial.push(mensajeHistorial);
    contacto.conversaciones.ultimaConversacion = new Date();
    contacto.metricas.mensajesEnviados += 1;
    contacto.metricas.ultimaInteraccion = new Date();
    await contacto.save();

    console.log(`📤 Mensaje manual enviado a ${contacto.nombre} por ${enviadoPor}`);

    // Notificar vía WebSocket
    notificarNuevoMensaje(empresaId, contactoId, {
      contenido: mensaje,
      rol: 'assistant',
      fecha: new Date().toISOString(),
      enviadoPor
    });

    return { success: true, messageId: result?.messages?.[0]?.id };
  } catch (error: any) {
    console.error('❌ Error enviando mensaje manual:', error);
    throw new Error(`Error al enviar mensaje: ${error.message}`);
  }
}

/**
 * Obtener estado de intervención de un contacto
 */
export async function obtenerEstadoIntervencion(
  contactoId: string,
  empresaId: string
): Promise<{
  chatbotPausado: boolean;
  pausadoPor?: string;
  pausadoEn?: Date;
}> {
  const contacto = await ContactoEmpresaModel.findById(contactoId);

  if (!contacto) {
    throw new Error('Contacto no encontrado');
  }

  if (contacto.empresaId !== empresaId) {
    throw new Error('Este contacto no pertenece a tu empresa');
  }

  return {
    chatbotPausado: contacto.chatbotPausado || false,
    pausadoPor: contacto.chatbotPausadoPor,
    pausadoEn: contacto.chatbotPausadoEn
  };
}

/**
 * Notificar cambio de estado vía WebSocket
 */
function notificarCambioEstado(empresaId: string, contactoId: string, pausado: boolean) {
  if (wss) {
    wss.clients.forEach((client: any) => {
      if (client.readyState === 1 && client.empresaId === empresaId) {
        client.send(JSON.stringify({
          type: 'chatbot_estado',
          contactoId,
          pausado,
          timestamp: new Date().toISOString()
        }));
      }
    });
  }
}

/**
 * Notificar nuevo mensaje vía WebSocket
 */
function notificarNuevoMensaje(
  empresaId: string,
  contactoId: string,
  mensaje: { contenido: string; rol: string; fecha: string; enviadoPor?: string }
) {
  if (wss) {
    wss.clients.forEach((client: any) => {
      if (client.readyState === 1 && client.empresaId === empresaId) {
        client.send(JSON.stringify({
          type: 'mensaje_manual',
          contactoId,
          mensaje,
          timestamp: new Date().toISOString()
        }));
      }
    });
  }
}
