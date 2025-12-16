// 📝 Servicio para trackear mensajes de conversación
// Captura mensajes enviados durante el procesamiento de flujos

interface ConversationContext {
  contactoId: string;
  mensajesEnviados: string[];
}

// Almacenamiento temporal por teléfono
const activeContexts: Map<string, ConversationContext> = new Map();

/**
 * Inicia el tracking de una conversación
 */
export function startTracking(telefono: string, contactoId: string): void {
  activeContexts.set(telefono, {
    contactoId,
    mensajesEnviados: []
  });
}

/**
 * Registra un mensaje enviado
 */
export function trackMessage(telefono: string, mensaje: string): void {
  const context = activeContexts.get(telefono);
  if (context) {
    context.mensajesEnviados.push(mensaje);
  }
}

/**
 * Obtiene los mensajes enviados y limpia el tracking
 */
export function endTracking(telefono: string): { contactoId: string; mensajes: string[] } | null {
  const context = activeContexts.get(telefono);
  if (context) {
    activeContexts.delete(telefono);
    return {
      contactoId: context.contactoId,
      mensajes: context.mensajesEnviados
    };
  }
  return null;
}

/**
 * Verifica si hay tracking activo para un teléfono
 */
export function isTracking(telefono: string): boolean {
  return activeContexts.has(telefono);
}
