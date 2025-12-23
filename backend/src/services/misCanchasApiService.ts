/**
 * 🏟️ Servicio para consumir la API de Mis Canchas
 * 
 * Este servicio se conecta a la API externa de Mis Canchas para:
 * - Consultar deportes disponibles
 * - Consultar disponibilidad de canchas
 * - Crear pre-reservas
 * - Confirmar reservas
 * - Cancelar reservas
 */

import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';

interface DeporteResponse {
  id: string;
  nombre: string;
  icono: string;
}

interface HorarioDisponible {
  hora: string;
  duraciones: number[];
}

interface CanchaDisponible {
  id: string;
  nombre: string;
  tipo: string;
  horarios_disponibles: HorarioDisponible[];
  precio_hora: number;
  precio_hora_y_media: number;
  precio_dos_horas: number;
}

interface DisponibilidadResponse {
  success: boolean;
  fecha: string;
  deporte: string;
  canchas_disponibles: CanchaDisponible[];
}

interface PreReservaResponse {
  success: boolean;
  reserva_id: string;
  estado: string;
  expira_en: number;
  detalle: {
    cancha: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    duracion: number;
    precio_total: number;
    seña_requerida: number;
  };
}

interface ConfirmacionResponse {
  success: boolean;
  reserva_id: string;
  estado: string;
  codigo_reserva: string;
  mensaje: string;
}

class MisCanchasApiService {
  private baseUrl: string = '';
  private apiKey: string = '';
  private initialized: boolean = false;

  /**
   * Inicializa el servicio cargando la configuración de la API desde MongoDB
   */
  async initialize(empresaId: string): Promise<boolean> {
    try {
      const apiConfig = await ApiConfigurationModel.findOne({
        empresaId,
        nombre: 'Mis Canchas API',
        estado: 'activo'
      });

      if (!apiConfig) {
        console.log(`⚠️ [MisCanchasAPI] No se encontró configuración de API para empresa ${empresaId}`);
        return false;
      }

      this.baseUrl = apiConfig.baseUrl;
      this.apiKey = apiConfig.autenticacion?.configuracion?.token || '';

      if (!this.apiKey) {
        console.log(`⚠️ [MisCanchasAPI] API Key no configurada para empresa ${empresaId}`);
        return false;
      }

      this.initialized = true;
      console.log(`✅ [MisCanchasAPI] Inicializado para empresa ${empresaId}`);
      return true;
    } catch (error) {
      console.error('❌ [MisCanchasAPI] Error al inicializar:', error);
      return false;
    }
  }

  /**
   * Realiza una petición HTTP a la API
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: any,
    queryParams?: Record<string, string>
  ): Promise<T | null> {
    if (!this.initialized) {
      console.error('❌ [MisCanchasAPI] Servicio no inicializado');
      return null;
    }

    try {
      let url = `${this.baseUrl}${path}`;
      
      // Agregar query params
      if (queryParams && Object.keys(queryParams).length > 0) {
        const params = new URLSearchParams(queryParams);
        url += `?${params.toString()}`;
      }

      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true' // Para evitar la página de advertencia de ngrok
        }
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      console.log(`🌐 [MisCanchasAPI] ${method} ${url}`);
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [MisCanchasAPI] Error ${response.status}: ${errorText}`);
        return null;
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('❌ [MisCanchasAPI] Error en request:', error);
      return null;
    }
  }

  /**
   * Obtiene los deportes disponibles
   */
  async obtenerDeportes(): Promise<DeporteResponse[]> {
    const response = await this.request<{ success: boolean; deportes: DeporteResponse[] }>(
      'GET',
      '/deportes'
    );
    return response?.deportes || [];
  }

  /**
   * Consulta la disponibilidad de canchas
   */
  async consultarDisponibilidad(
    fecha: string,
    deporte: string,
    duracion: number = 60,
    horaInicio?: string
  ): Promise<DisponibilidadResponse | null> {
    const queryParams: Record<string, string> = {
      fecha,
      deporte,
      duracion: duracion.toString()
    };

    if (horaInicio) {
      queryParams.hora_inicio = horaInicio;
    }

    return await this.request<DisponibilidadResponse>('GET', '/disponibilidad', undefined, queryParams);
  }

  /**
   * Crea una pre-reserva (bloqueo temporal de 10 minutos)
   */
  async preCrearReserva(
    canchaId: string,
    fecha: string,
    horaInicio: string,
    duracion: number,
    cliente: { nombre: string; telefono: string; email?: string }
  ): Promise<PreReservaResponse | null> {
    return await this.request<PreReservaResponse>('POST', '/reservas/pre-crear', {
      cancha_id: canchaId,
      fecha,
      hora_inicio: horaInicio,
      duracion,
      cliente,
      origen: 'whatsapp'
    });
  }

  /**
   * Confirma una reserva después del pago
   */
  async confirmarReserva(
    reservaId: string,
    pago: { id: string; monto: number; metodo: string; estado: string }
  ): Promise<ConfirmacionResponse | null> {
    return await this.request<ConfirmacionResponse>(
      'PUT',
      `/reservas/${reservaId}/confirmar`,
      { pago }
    );
  }

  /**
   * Cancela una reserva
   */
  async cancelarReserva(reservaId: string): Promise<boolean> {
    const response = await this.request<{ success: boolean }>('DELETE', `/reservas/${reservaId}`);
    return response?.success || false;
  }

  /**
   * Obtiene los precios de las canchas
   */
  async obtenerPrecios(deporte?: string, canchaId?: string): Promise<any> {
    const queryParams: Record<string, string> = {};
    if (deporte) queryParams.deporte = deporte;
    if (canchaId) queryParams.cancha_id = canchaId;

    return await this.request<any>('GET', '/precios', undefined, queryParams);
  }

  /**
   * Verifica si el servicio está inicializado
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Formatea una fecha de DD/MM/AAAA o "hoy"/"mañana" a YYYY-MM-DD
   */
  formatearFechaParaApi(fechaTexto: string): string {
    const textoLower = fechaTexto.toLowerCase().trim();
    
    // Obtener fecha actual en Argentina (UTC-3)
    const ahora = new Date();
    const offsetArgentina = -3 * 60;
    const offsetLocal = ahora.getTimezoneOffset();
    const diferenciaMinutos = offsetLocal + offsetArgentina;
    const fechaArgentina = new Date(ahora.getTime() + diferenciaMinutos * 60 * 1000);
    
    let fecha: Date;
    
    if (textoLower === 'hoy') {
      fecha = fechaArgentina;
    } else if (textoLower === 'mañana' || textoLower === 'manana') {
      fecha = new Date(fechaArgentina);
      fecha.setDate(fecha.getDate() + 1);
    } else {
      // Parsear DD/MM/AAAA
      const match = fechaTexto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        const [, dia, mes, anio] = match;
        fecha = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
      } else {
        // Si no se puede parsear, usar hoy
        fecha = fechaArgentina;
      }
    }
    
    // Formatear a YYYY-MM-DD
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}

// Exportar instancia singleton
export const misCanchasApiService = new MisCanchasApiService();

// Exportar clase para crear instancias adicionales si es necesario
export { MisCanchasApiService };
