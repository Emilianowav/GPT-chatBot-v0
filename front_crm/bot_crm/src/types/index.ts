// 📋 Tipos del CRM

export interface Empresa {
  id: string;
  nombre: string;
  categoria: string;
  telefono: string;
  email?: string;
  modelo: 'gpt-3.5-turbo' | 'gpt-4';
  catalogoPath: string;
  linkCatalogo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Usuario {
  id: string;
  numero: string;
  nombre?: string;
  empresaId: string;
  empresaTelefono: string;
  interacciones: number;
  ultimaInteraccion: string;
  tokens_consumidos?: number;
  num_mensajes_enviados: number;
  num_mensajes_recibidos: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Estadisticas {
  totalUsuarios: number;
  totalInteracciones: number;
  totalTokens: number;
  usuariosActivos: number;
  promedioInteracciones: number;
  tokensPromedio: number;
}

export interface EmpresaAuth {
  empresaId: string; // Nombre de la empresa (usado en todas las APIs)
  empresaNombre: string;
  token: string;
  role?: string;
  username?: string;
}

export interface DashboardData {
  empresa: Empresa;
  estadisticas: Estadisticas;
  usuariosRecientes: Usuario[];
  interaccionesPorDia: { fecha: string; cantidad: number }[];
}

// SuperAdmin Types
export interface EmpresaListItem {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  categoria: string;
  plan: string;
  estadoFacturacion: string;
  mensajesEsteMes: number;
  limitesMensajes: number;
  porcentajeUso: string;
  usuariosActivos: number;
  limiteUsuarios: number;
  porcentajeUsuarios: string;
  whatsappConectado: boolean;
  fechaCreacion: string;
  ultimoPago?: string;
  proximoPago?: string;
}

export interface EmpresaDetalle {
  id: string;
  nombre: string;
  categoria: string;
  email: string;
  telefono: string;
  modelo: string;
  prompt: string;
  saludos: string[];
  plan: string;
  phoneNumberId?: string;
  accessToken?: string;
  businessAccountId?: string;
  appId?: string;
  appSecret?: string;
  modulos: Array<{
    id: string;
    nombre: string;
    activo: boolean;
  }>;
  limites: {
    mensajesMensuales: number;
    usuariosActivos: number;
    almacenamiento: number;
    integraciones: number;
    exportacionesMensuales: number;
    agentesSimultaneos: number;
    maxUsuarios: number;
    maxAdmins: number;
  };
  uso: {
    mensajesEsteMes: number;
    usuariosActivos: number;
    almacenamientoUsado: number;
    exportacionesEsteMes: number;
    ultimaActualizacion: string;
  };
  metricas: {
    porcentajeUsoMensajes: string;
    porcentajeUsoUsuarios: string;
    totalClientes: number;
    totalStaff: number;
    whatsappConectado: boolean;
  };
  facturacion: {
    estado: string;
    metodoPago?: string;
    ultimoPago?: string;
    proximoPago?: string;
  };
  alertas: Array<{
    tipo: 'info' | 'warning' | 'error';
    mensaje: string;
  }>;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface SuperAdminFilters {
  nombre?: string;
  categoria?: string;
  plan?: string;
  estadoFacturacion?: string;
  sinUso?: boolean;
  cercaLimite?: boolean;
  conWhatsApp?: boolean;
}
