// 🤖 API Client para Bot de Turnos
import { API_BASE_URL } from './config';

export interface PasoBot {
  id: string;
  orden: number;
  activo: boolean;
  tipo: 'menu' | 'input' | 'confirmacion' | 'finalizar';
  etiqueta: string;
  mensaje: string;
  campoACapturar?: string;
  guardarEn?: 'datos' | 'turno';
  claveGuardado?: string;
  validacion?: {
    tipo: 'fecha' | 'hora' | 'numero' | 'texto' | 'email' | 'telefono';
    requerido: boolean;
    min?: number;
    max?: number;
    formato?: string;
    mensajeError?: string;
  };
  opciones?: {
    numero: number;
    texto: string;
    siguientePaso?: string;
    finalizarFlujo?: boolean;
  }[];
  siguientePaso?: string;
  finalizarFlujo?: boolean;
  accion?: 'crear_turno' | 'consultar_turnos' | 'cancelar_turno' | 'ninguna';
}

export interface FlujoBot {
  nombre: string;
  descripcion: string;
  pasoInicial: string;
  pasos: PasoBot[];
}

export interface ConfiguracionBot {
  _id?: string;
  empresaId: string;
  activo: boolean;
  mensajeBienvenida: string;
  mensajeDespedida: string;
  mensajeError: string;
  timeoutMinutos: number;
  flujos?: {
    crearTurno: FlujoBot;
    consultarTurnos: FlujoBot;
    cancelarTurno: FlujoBot;
  };
  horariosAtencion?: {
    activo: boolean;
    inicio: string;
    fin: string;
    diasSemana: number[];
    mensajeFueraHorario: string;
  };
  requiereConfirmacion: boolean;
  permiteCancelacion: boolean;
  notificarAdmin: boolean;
}

/**
 * Obtener configuración del bot
 */
export async function obtenerConfiguracionBot(empresaId: string): Promise<ConfiguracionBot> {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(
    `${API_BASE_URL}/modules/calendar/bot/configuracion/${empresaId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener configuración del bot');
  }
  
  const data = await response.json();
  return data.configuracion;
}

/**
 * Actualizar configuración del bot
 */
export async function actualizarConfiguracionBot(
  empresaId: string,
  configuracion: Partial<ConfiguracionBot>
): Promise<ConfiguracionBot> {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(
    `${API_BASE_URL}/modules/calendar/bot/configuracion/${empresaId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(configuracion)
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al actualizar configuración del bot');
  }
  
  const data = await response.json();
  return data.configuracion;
}

/**
 * Activar/Desactivar bot
 */
export async function toggleBot(empresaId: string, activo: boolean): Promise<boolean> {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(
    `${API_BASE_URL}/modules/calendar/bot/activar/${empresaId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ activo })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al cambiar estado del bot');
  }
  
  const data = await response.json();
  return data.activo;
}

/**
 * Obtener estadísticas del bot
 */
export async function obtenerEstadisticasBot(empresaId: string): Promise<any> {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(
    `${API_BASE_URL}/modules/calendar/bot/estadisticas/${empresaId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener estadísticas');
  }
  
  const data = await response.json();
  return data.estadisticas;
}
