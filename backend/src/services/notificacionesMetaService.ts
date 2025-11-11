// 🔔 Servicio Unificado de Notificaciones con Plantillas de Meta
// Sistema completamente nuevo y escalable

import axios from 'axios';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';
import { AgenteModel } from '../modules/calendar/models/Agente.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { EmpresaModel } from '../models/Empresa.js';

/**
 * Reemplazar variables en un objeto (recursivo)
 */
function reemplazarVariables(obj: any, variables: Record<string, any>): any {
  if (typeof obj === 'string') {
    return obj.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match;
    });
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => reemplazarVariables(item, variables));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const result: any = {};
    for (const key in obj) {
      result[key] = reemplazarVariables(obj[key], variables);
    }
    return result;
  }
  
  return obj;
}

/**
 * Construir lista de turnos formateada
 */
function construirListaTurnos(turnos: any[], config: any): string {
  if (turnos.length === 0) {
    return `No tienes ${config.nomenclatura?.turnos?.toLowerCase() || 'turnos'} programados para hoy.`;
  }
  
  let lista = '';
  
  for (let i = 0; i < turnos.length; i++) {
    const turno = turnos[i];
    const fechaInicio = new Date(turno.fechaInicio);
    const hora = fechaInicio.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires'
    });
    
    lista += `${i + 1}. ${hora}`;
    
    // ✅ SIEMPRE incluir nombre del cliente si existe
    if (turno.clienteNombre) {
      lista += ` - ${turno.clienteNombre}`;
    }
    
    // ✅ SIEMPRE incluir origen si existe
    if (turno.datos?.origen) {
      lista += ` | Origen: ${turno.datos.origen}`;
    }
    
    // ✅ SIEMPRE incluir destino si existe
    if (turno.datos?.destino) {
      lista += ` | Destino: ${turno.datos.destino}`;
    }
    
    if (i < turnos.length - 1) {
      lista += ' || ';
    }
  }
  
  return lista;
}

/**
 * Enviar plantilla de Meta
 */
async function enviarPlantillaMeta(
  telefono: string,
  url: string,
  payload: any
): Promise<boolean> {
  try {
    const token = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_TOKEN;
    if (!token) {
      throw new Error('META_WHATSAPP_TOKEN no configurado');
    }

    const telefonoLimpio = telefono.replace(/[^\d+]/g, '');

    console.log('📤 [NotifMeta] Enviando plantilla:');
    console.log('   📞 Teléfono:', telefonoLimpio);
    console.log('   🌐 URL:', url);

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ [NotifMeta] Plantilla enviada');
    console.log('   📨 Message ID:', response.data.messages?.[0]?.id);
    
    return true;

  } catch (error: any) {
    console.error('❌ [NotifMeta] Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Enviar mensaje de texto simple (para mensajes dentro de conversaciones)
 */
export async function enviarMensajeWhatsAppTexto(
  telefono: string,
  mensaje: string,
  phoneNumberId: string
): Promise<boolean> {
  try {
    const token = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_TOKEN;
    if (!token) {
      throw new Error('META_WHATSAPP_TOKEN no configurado');
    }

    const telefonoLimpio = telefono.replace(/[^\d+]/g, '');
    const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: telefonoLimpio,
      type: 'text',
      text: {
        body: mensaje
      }
    };

    console.log('📤 [WhatsApp] Enviando mensaje de texto:', telefonoLimpio);

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ [WhatsApp] Mensaje enviado:', response.data.messages?.[0]?.id);
    return true;

  } catch (error: any) {
    console.error('❌ [WhatsApp] Error enviando mensaje:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Enviar mensaje con botones interactivos
 */
export async function enviarMensajeWhatsAppBotones(
  telefono: string,
  mensaje: string,
  botones: Array<{ id: string; texto: string }>,
  phoneNumberId: string
): Promise<boolean> {
  try {
    const token = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_TOKEN;
    if (!token) {
      throw new Error('META_WHATSAPP_TOKEN no configurado');
    }

    const telefonoLimpio = telefono.replace(/[^\d+]/g, '');
    const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

    // Limitar a máximo 3 botones (límite de WhatsApp)
    const botonesLimitados = botones.slice(0, 3);

    const payload = {
      messaging_product: 'whatsapp',
      to: telefonoLimpio,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: mensaje
        },
        action: {
          buttons: botonesLimitados.map(boton => ({
            type: 'reply',
            reply: {
              id: boton.id,
              title: boton.texto.substring(0, 20) // Máximo 20 caracteres
            }
          }))
        }
      }
    };

    console.log('📤 [WhatsApp] Enviando mensaje con botones:', telefonoLimpio);
    console.log('   🔘 Botones:', botonesLimitados.map(b => b.texto).join(', '));

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ [WhatsApp] Mensaje con botones enviado:', response.data.messages?.[0]?.id);
    return true;

  } catch (error: any) {
    console.error('❌ [WhatsApp] Error enviando mensaje con botones:', error.response?.data || error.message);
    throw error;
  }
}

// Exportar funciones de procesamiento
export { procesarNotificacionesDiariasAgentes } from './notificaciones/agentesService.js';
export { procesarNotificacionesConfirmacion } from './notificaciones/confirmacionService.js';
export { enviarNotificacionPrueba } from './notificaciones/pruebaService.js';

// Exportar utilidades
export { reemplazarVariables, construirListaTurnos, enviarPlantillaMeta };
