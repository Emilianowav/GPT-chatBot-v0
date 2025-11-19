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
  empresaId: string; // Nombre de la empresa (para compatibilidad)
  empresaMongoId?: string; // ID de MongoDB (para APIs)
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
