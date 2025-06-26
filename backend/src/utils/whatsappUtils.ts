// 📁 utils/whatsappUtils.ts

import type { Request } from 'express';

interface Payload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from?: string;
          text?: { body?: string };
        }>;
        contacts?: Array<{
          profile?: { name?: string };
          wa_id?: string;
        }>;
        metadata?: { display_phone_number?: string };
      };
    }>;
  }>;
}

interface WhatsAppDatos {
  telefonoCliente: string | null;
  telefonoEmpresa: string | null;
  mensaje: string | null;
  profileName: string | null;
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
      error: "Payload inválido o incompleto"
    };
  }

  const telefonoCliente = mensajeObj.from?.replace(/\D/g, '') ?? null;
  const telefonoEmpresa = metadata.display_phone_number?.replace(/\D/g, '') ?? null;
  const mensaje = mensajeObj.text?.body ?? null;
  const profileName = contacto?.profile?.name ?? null;

  return { telefonoCliente, telefonoEmpresa, mensaje, profileName };
}
