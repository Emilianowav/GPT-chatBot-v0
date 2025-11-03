// 🔄 API para gestión de flujos
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface FlujoActivo {
  telefono: string;
  flujo: string;
  estado: string;
  prioridad: 'normal' | 'urgente' | 'baja';
  pausado: boolean;
  ultimaInteraccion: string;
  data: Record<string, any>;
}

/**
 * Obtener todos los flujos activos de una empresa
 */
export async function obtenerFlujosActivos(empresaId: string): Promise<FlujoActivo[]> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/api/flows/${empresaId}/active`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Error al obtener flujos activos');
  }
  
  return response.json();
}

/**
 * Pausar un flujo activo
 */
export async function pausarFlujo(empresaId: string, telefono: string): Promise<void> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/api/flows/${empresaId}/pause`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ telefono })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al pausar flujo');
  }
}

/**
 * Reanudar un flujo pausado
 */
export async function reanudarFlujo(empresaId: string, telefono: string): Promise<void> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/api/flows/${empresaId}/resume`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ telefono })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al reanudar flujo');
  }
}

/**
 * Cancelar un flujo activo
 */
export async function cancelarFlujo(empresaId: string, telefono: string): Promise<void> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/api/flows/${empresaId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ telefono })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al cancelar flujo');
  }
}
