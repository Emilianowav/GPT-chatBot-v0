// 🌐 Cliente API para comunicarse con el backend
import { config } from './config';

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = config.apiUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      config.logConfig(); // Log de configuración en desarrollo
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('empresa_id');
      localStorage.removeItem('empresa_nombre');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(error.message || `Error: ${response.status}`);
    }

    return response.json();
  }

  // Autenticación
  async login(username: string, password: string) {
    return this.request<{ 
      success: boolean; 
      token: string; 
      user: {
        id: string;
        username: string;
        empresaId: string;
        empresaNombre: string;
        role: string;
        email?: string;
      };
      message?: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async getMe() {
    return this.request<{ success: boolean; user: Record<string, unknown> }>('/api/auth/me');
  }

  // Estadísticas
  async getStatus() {
    return this.request<Record<string, unknown>>('/api/status');
  }

  async getUsuarios() {
    return this.request<{ total: number; usuarios: Record<string, unknown>[] }>('/api/usuarios');
  }

  // Empresas
  async getEmpresaStats(empresaId: string) {
    return this.request<Record<string, unknown>>(`/api/empresas/${empresaId}/stats`);
  }

  async getEmpresa(empresaId: string) {
    return this.request<Record<string, unknown>>(`/api/empresas/${empresaId}`);
  }

  async updateEmpresa(empresaId: string, data: Record<string, unknown>) {
    return this.request<Record<string, unknown>>(`/api/empresas/${empresaId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Conversaciones
  async getConversaciones(empresaId: string) {
    return this.request<Record<string, unknown>>(`/api/conversaciones/${empresaId}`);
  }

  async getHistorialUsuario(empresaId: string, usuarioId: string) {
    return this.request<Record<string, unknown>>(`/api/conversaciones/${empresaId}/${usuarioId}`);
  }

  async buscarConversaciones(empresaId: string, query: string) {
    return this.request<Record<string, unknown>>(`/api/conversaciones/${empresaId}/buscar?q=${encodeURIComponent(query)}`);
  }
}

export const apiClient = new ApiClient();
