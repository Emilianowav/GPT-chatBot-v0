/**
 * types.ts
 * Tipado centralizado del sistema.
 */

// === Usuario y Empresa ===

export type Usuario = {
  id: string;
  numero: string;
  nombre?: string;
  empresaId: string;
  empresaTelefono: string;

  historial: string[];
  interacciones: number;
  ultimaInteraccion: string;
  ultima_actualizacion: string;

  saludado: boolean;
  despedido: boolean;
  ultima_saludo?: string;
  resumen?: string;

  num_mensajes_enviados: number;
  num_mensajes_recibidos: number;
  num_media_recibidos: number;
  mensaje_ids: string[];
  ultimo_status?: string;

  tokens_consumidos?: number;

  contactoInformado?: boolean;
};

// === Empresa y Ubicaciones ===

export type EmpresaUbicacion = {
  nombre?: string;
  ciudad?: string;
  direccion?: string;
  derivarA?: string[]; // números de WhatsApp de asesores asociados a esa sucursal
};

export type EmpresaConfig = {
  nombre: string;
  categoria: string;
  telefono: string;
  prompt: string;
  modelo?: 'gpt-3.5-turbo' | 'gpt-4';
  derivarA?: string[]; // fallback general
  ubicaciones?: EmpresaUbicacion[];
  catalogoPath: string;
  linkCatalogo?: string;
  saludos?: string[];
  email?: string;
  phoneNumberId?: string; // Opcional: ahora se obtiene del webhook
};


// === Intenciones y Mensajes ===

export type IntencionClasificada =
  | 'consulta_producto'
  | 'saludo'
  | 'despedida'
  | 'otro';

export type MensajeEntrante = {
  from: string;
  body: string;
  timestamp: number;
};

export type MensajeProcesado = {
  respuesta: string;
  intencion: IntencionClasificada;
};

// === Métricas y reportes ===

export type ResumenConversacion = {
  usuario: Usuario;
  resumen: string;
  totalInteracciones: number;
  fecha: string;
};
