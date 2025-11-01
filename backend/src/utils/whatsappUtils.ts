// 📁 utils/whatsappUtils.ts

import type { Request } from 'express';

interface Payload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from?: string;
          text?: { body?: string };
          interactive?: {
            type?: string;
            button_reply?: {
              id?: string;
              title?: string;
            };
            list_reply?: {
              id?: string;
              title?: string;
            };
          };
          type?: string;
        }>;
        contacts?: Array<{
          profile?: { name?: string };
          wa_id?: string;
        }>;
        metadata?: { 
          display_phone_number?: string;
          phone_number_id?: string;
        };
      };
    }>;
  }>;
}

interface WhatsAppDatos {
  telefonoCliente: string | null;
  telefonoEmpresa: string | null;
  mensaje: string | null;
  profileName: string | null;
  phoneNumberId: string | null;
  tipoMensaje?: string;
  respuestaInteractiva?: string;
  error?: string;
}

export function extraerDatosDePayloadWhatsApp(payload: Payload): WhatsAppDatos {
  const valor = payload.entry?.[0]?.changes?.[0]?.value;
  const mensajeObj = valor?.messages?.[0];
  const metadata = valor?.metadata;
  const contacto = valor?.contacts?.[0];

  if (!mensajeObj || !metadata) {
    return {
      telefonoCliente: null,
      telefonoEmpresa: null,
      mensaje: null,
      profileName: null,
      phoneNumberId: null,
      error: "Payload inválido o incompleto"
    };
  }

  const telefonoCliente = mensajeObj.from?.replace(/\D/g, '') ?? null;
  const telefonoEmpresa = metadata.display_phone_number?.replace(/\D/g, '') ?? null;
  const profileName = contacto?.profile?.name ?? null;
  const phoneNumberId = metadata.phone_number_id ?? null;
  
  // Detectar tipo de mensaje
  const tipoMensaje = mensajeObj.type || 'text';
  let mensaje: string | null = null;
  let respuestaInteractiva: string | null = null;

  if (tipoMensaje === 'interactive') {
    // Mensaje interactivo (botón o lista)
    if (mensajeObj.interactive?.button_reply) {
      respuestaInteractiva = mensajeObj.interactive.button_reply.id ?? null;
      mensaje = mensajeObj.interactive.button_reply.title ?? null;
    } else if (mensajeObj.interactive?.list_reply) {
      respuestaInteractiva = mensajeObj.interactive.list_reply.id ?? null;
      mensaje = mensajeObj.interactive.list_reply.title ?? null;
    }
  } else {
    // Mensaje de texto normal
    mensaje = mensajeObj.text?.body ?? null;
  }

  return { 
    telefonoCliente, 
    telefonoEmpresa, 
    mensaje, 
    profileName, 
    phoneNumberId,
    tipoMensaje,
    respuestaInteractiva
  };
}
