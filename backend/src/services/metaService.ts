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
