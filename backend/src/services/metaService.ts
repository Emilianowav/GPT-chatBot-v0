import dotenv from "dotenv";
dotenv.config();
import fetch from "node-fetch";
import { getMetaToken } from "./metaTokenService.js";

const modoDev = process.env.MODO_DEV === "true";

// Función reutilizable para limpiar el número
function formatPhoneNumberForWhatsapp(number: string): string {
  let cleaned = number.replace(/\D/g, '');

  // Si ya tiene el formato correcto 549XXXXXXXXXX, dejarlo
  if (cleaned.startsWith('549') && cleaned.length >= 12) {
    console.log("📞 Número formateado:", cleaned);
    return cleaned;
  }

  // Si empieza con 54 pero no tiene el 9, agregarlo
  if (cleaned.startsWith('54') && !cleaned.startsWith('549')) {
    // Remover el 0 del código de área si existe
    cleaned = cleaned.replace(/^540/, '54');
    // Remover el 15 si existe
    cleaned = cleaned.replace(/^54(\d{2,4})15/, '54$1');
    // Agregar el 9 después del 54
    cleaned = '549' + cleaned.slice(2);
  }

  // Si no empieza con 54, asumir que es un número argentino sin código de país
  if (!cleaned.startsWith('54')) {
    // Remover 0 inicial del código de área
    cleaned = cleaned.replace(/^0/, '');
    // Remover 15
    cleaned = cleaned.replace(/^(\d{2,4})15/, '$1');
    // Agregar 549
    cleaned = '549' + cleaned;
  }

  console.log("📞 Número formateado:", cleaned);
  return cleaned;
}

/**
 * Enviar mensaje de texto a un número por WhatsApp API
 * @param numero Número del cliente (no formateado)
 * @param texto Contenido del mensaje
 * @param phoneNumberId ID de número de empresa (extraído de su config)
 */
export const enviarMensajeWhatsAppTexto = async (
  numero: string,
  texto: string,
  phoneNumberId: string
) => {
  console.log("📨 Enviando mensaje vía Meta WhatsApp API...");

  if (modoDev) {
    console.log("[DEV] Simulación de envío:", { numero, texto });
    return;
  }

  const numeroFormateado = formatPhoneNumberForWhatsapp(numero);
  const token = getMetaToken(); // Asegura que esté actualizado
  
  console.log('🔑 Token (primeros 20 chars):', token?.substring(0, 20) + '...');
  console.log('📱 Phone Number ID:', phoneNumberId);

  const API_URL = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: numeroFormateado,
    type: "text",
    text: { body: texto },
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ Error al enviar mensaje:", errorText);
    throw new Error(errorText);
  }

  const data = await res.json();
  console.log("✅ Mensaje enviado:", data);
  return data;
};

/**
 * Enviar mensaje con botones interactivos
 * @param numero Número del cliente
 * @param texto Contenido del mensaje
 * @param botones Array de botones (máximo 3)
 * @param phoneNumberId ID de número de empresa
 */
export const enviarMensajeConBotones = async (
  numero: string,
  texto: string,
  botones: Array<{ id: string; title: string }>,
  phoneNumberId: string
) => {
  console.log("📨 Enviando mensaje con botones vía Meta WhatsApp API...");

  if (modoDev) {
    console.log("[DEV] Simulación de envío con botones:", { numero, texto, botones });
    return;
  }

  const numeroFormateado = formatPhoneNumberForWhatsapp(numero);
  const token = getMetaToken();
  
  console.log('🔑 Token (primeros 20 chars):', token?.substring(0, 20) + '...');
  console.log('📱 Phone Number ID:', phoneNumberId);

  const API_URL = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: numeroFormateado,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: texto
      },
      action: {
        buttons: botones.slice(0, 3).map(btn => ({
          type: "reply",
          reply: {
            id: btn.id,
            title: btn.title.substring(0, 20) // Máximo 20 caracteres
          }
        }))
      }
    }
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ Error al enviar mensaje con botones:", errorText);
    throw new Error(errorText);
  }

  const data = await res.json();
  console.log("✅ Mensaje con botones enviado:", data);
  return data;
};

/**
 * Enviar mensaje con lista de opciones
 * @param numero Número del cliente
 * @param texto Contenido del mensaje
 * @param botonTexto Texto del botón para abrir la lista
 * @param opciones Array de opciones (máximo 10)
 * @param phoneNumberId ID de número de empresa
 */
export const enviarMensajeConLista = async (
  numero: string,
  texto: string,
  botonTexto: string,
  opciones: Array<{ id: string; title: string; description?: string }>,
  phoneNumberId: string
) => {
  console.log("📨 Enviando mensaje con lista vía Meta WhatsApp API...");

  if (modoDev) {
    console.log("[DEV] Simulación de envío con lista:", { numero, texto, opciones });
    return;
  }

  const numeroFormateado = formatPhoneNumberForWhatsapp(numero);
  const token = getMetaToken();
  
  const API_URL = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: numeroFormateado,
    type: "interactive",
    interactive: {
      type: "list",
      body: {
        text: texto
      },
      action: {
        button: botonTexto.substring(0, 20),
        sections: [
          {
            title: "Opciones",
            rows: opciones.slice(0, 10).map(opt => ({
              id: opt.id,
              title: opt.title.substring(0, 24),
              description: opt.description?.substring(0, 72)
            }))
          }
        ]
      }
    }
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ Error al enviar mensaje con lista:", errorText);
    throw new Error(errorText);
  }

  const data = await res.json();
  console.log("✅ Mensaje con lista enviado:", data);
  return data;
};
