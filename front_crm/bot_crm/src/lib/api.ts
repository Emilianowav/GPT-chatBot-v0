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

    const url = `${this.baseUrl}${endpoint}`;
    console.log('🌐 API Request:', { url, method: options.method || 'GET' });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('📡 API Response:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('❌ API Error:', error);
        throw new Error(error.message || `Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Success:', data);
      return data;
    } catch (error) {
      console.error('❌ Fetch Error:', error);
      throw error;
    }
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

  async generarPrompt(data: {
    nombreEmpresa: string;
    categoria: string;
    personalidad?: string;
    tipoBot?: string;
    tipoNegocio?: string;
  }) {
    return this.request<{
      success: boolean;
      message?: string;
      prompt: string;
      tokens?: number;
    }>('/api/empresas/generar-prompt', {
      method: 'POST',
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

  // SuperAdmin - Gestión de Empresas
  async superAdminGetEmpresas(filtros?: {
    nombre?: string;
    categoria?: string;
    plan?: string;
    estadoFacturacion?: string;
    sinUso?: boolean;
    cercaLimite?: boolean;
    conWhatsApp?: boolean;
  }) {
    const params = new URLSearchParams();
    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    return this.request<{
      success: boolean;
      total: number;
      empresas: Array<Record<string, unknown>>;
    }>(`/api/sa/empresas${queryString ? `?${queryString}` : ''}`);
  }

  async superAdminGetEmpresaDetalle(empresaId: string) {
    return this.request<{
      success: boolean;
      empresa: Record<string, unknown>;
    }>(`/api/sa/empresas/${encodeURIComponent(empresaId)}`);
  }

  async superAdminCrearEmpresa(data: {
    nombre: string;
    email: string;
    telefono?: string;
    plan?: string;
    categoria?: string;
    tipoBot?: string;
    tipoNegocio?: string;
    prompt?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      empresa?: Record<string, unknown>;
    }>('/api/sa/empresas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async superAdminGenerarPrompt(data: {
    nombreEmpresa: string;
    categoria: string;
    personalidad?: string;
    tipoBot?: string;
    tipoNegocio?: string;
  }) {
    return this.request<{
      success: boolean;
      message?: string;
      prompt: string;
      tokens?: number;
    }>('/api/sa/generar-prompt', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async superAdminCrearUsuarioAdmin(empresaId: string, data: {
    username: string;
    password: string;
    email: string;
    nombre: string;
    apellido?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      usuario?: Record<string, unknown>;
    }>(`/api/sa/empresas/${encodeURIComponent(empresaId)}/user`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async superAdminEliminarEmpresa(empresaId: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/sa/empresas/${encodeURIComponent(empresaId)}`, {
      method: 'DELETE',
    });
  }

  async superAdminActualizarEmpresa(empresaId: string, data: {
    telefono?: string;
    email?: string;
    categoria?: string;
    plan?: string;
    prompt?: string;
    modelo?: string;
    phoneNumberId?: string;
    accessToken?: string;
    businessAccountId?: string;
    appId?: string;
    appSecret?: string;
    limites?: {
      mensajesMensuales?: number;
      usuariosActivos?: number;
      almacenamiento?: number;
      integraciones?: number;
      exportacionesMensuales?: number;
      agentesSimultaneos?: number;
      maxUsuarios?: number;
      maxAdmins?: number;
    };
    estadoFacturacion?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/sa/empresas/${encodeURIComponent(empresaId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Método genérico DELETE
  async delete(endpoint: string) {
    return this.request(`${endpoint}`, {
      method: 'DELETE',
    });
  }

  // ========== INTERVENCIÓN DE CONVERSACIONES ==========

  // Obtener estado de intervención de un contacto
  async getEstadoIntervencion(contactoId: string) {
    return this.request<{
      success: boolean;
      chatbotPausado: boolean;
      pausadoPor?: string;
      pausadoEn?: string;
    }>(`/api/intervencion/${contactoId}/estado`);
  }

  // Pausar chatbot para un contacto
  async pausarChatbot(contactoId: string) {
    return this.request<{
      success: boolean;
      message: string;
      contacto: {
        id: string;
        nombre: string;
        chatbotPausado: boolean;
        pausadoPor: string;
        pausadoEn: string;
      };
    }>(`/api/intervencion/${contactoId}/pausar`, {
      method: 'POST',
    });
  }

  // Reanudar chatbot para un contacto
  async reanudarChatbot(contactoId: string) {
    return this.request<{
      success: boolean;
      message: string;
      contacto: {
        id: string;
        nombre: string;
        chatbotPausado: boolean;
      };
    }>(`/api/intervencion/${contactoId}/reanudar`, {
      method: 'POST',
    });
  }

  // Enviar mensaje manual desde el CRM
  async enviarMensajeManual(contactoId: string, mensaje: string) {
    return this.request<{
      success: boolean;
      message: string;
      messageId?: string;
    }>(`/api/intervencion/${contactoId}/mensaje`, {
      method: 'POST',
      body: JSON.stringify({ mensaje }),
    });
  }
}

export const apiClient = new ApiClient();
