// 📦 Tipos para el sistema de módulos

export interface Modulo {
  id: string;
  nombre: string;
  descripcion: string;
  version: string;
  categoria: ModuloCategoria;
  icono: string;
  activo: boolean;
  fechaActivacion?: Date;
  fechaExpiracion?: Date;
  precio: number;
  planMinimo: Plan;
  dependencias: string[];
  permisos: string[];
  configuracion: any;
  autor: string;
  documentacion: string;
  soporte: string;
}

export enum ModuloCategoria {
  BOOKING = "booking",
  ANALYTICS = "analytics",
  AUTOMATION = "automation",
  INTEGRATION = "integration",
  AI_ADVANCED = "ai_advanced",
  CRM = "crm",
  MARKETING = "marketing",
  SUPPORT = "support",
  ECOMMERCE = "ecommerce"
}

export enum Plan {
  BASICO = "basico",
  STANDARD = "standard",
  PREMIUM = "premium",
  ENTERPRISE = "enterprise"
}

export interface Limites {
  mensajesMensuales: number;
  usuariosActivos: number;
  almacenamiento: number;
  integraciones: number;
  exportacionesMensuales: number;
  agentesSimultaneos: number;
}

export interface Uso {
  mensajesEsteMes: number;
  usuariosActivos: number;
  almacenamientoUsado: number;
  exportacionesEsteMes: number;
  ultimaActualizacion: Date;
}

export interface Facturacion {
  metodoPago?: string;
  ultimoPago?: Date;
  proximoPago?: Date;
  estado: 'activo' | 'suspendido' | 'prueba';
}

export interface EmpresaConModulos {
  id: string;
  nombre: string;
  plan: Plan;
  modulos: Modulo[];
  limites: Limites;
  uso: Uso;
  facturacion?: Facturacion;
}
