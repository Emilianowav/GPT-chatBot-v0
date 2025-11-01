// 📅 API Client para el módulo de Calendario
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper para obtener el token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    console.log('🔑 getAuthToken: Running on server side');
    return null;
  }
  const token = localStorage.getItem('auth_token');
  console.log('🔑 getAuthToken:', token ? `Token exists (${token.substring(0, 20)}...)` : 'NO TOKEN FOUND');
  
  // Debug: mostrar todas las claves en localStorage
  if (!token) {
    console.log('📦 localStorage keys:', Object.keys(localStorage));
  }
  
  return token;
}

// Helper para headers
function getHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  
  console.log('📤 Request headers:', {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token.substring(0, 20)}...` : 'NOT SET'
  });
  
  return headers;
}

// ========== TURNOS ==========

export interface Turno {
  _id: string;
  empresaId: string;
  agenteId: any;
  clienteId: string;
  fechaInicio: string;
  fechaFin: string;
  duracion: number;
  estado: 'pendiente' | 'confirmado' | 'en_curso' | 'completado' | 'cancelado' | 'no_asistio';
  servicio?: string;
  notas?: string;
  notasInternas?: string;
  precio?: number;
  confirmado: boolean;
  creadoEn: string;
  actualizadoEn: string;
  clienteInfo?: {
    _id: string;
    nombre: string;
    apellido: string;
    telefono?: string;
    email?: string;
  };
  datos?: {
    origen?: string;
    destino?: string;
    pasajeros?: number;
    equipaje?: string;
    observaciones?: string;
    [key: string]: any;
  };
}

export interface CrearTurnoData {
  agenteId: string;
  clienteId: string;
  fechaInicio: string;
  duracion: number;
  servicio?: string;
  notas?: string;
}

export async function obtenerTurnos(filtros?: {
  agenteId?: string;
  clienteId?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}) {
  const params = new URLSearchParams();
  if (filtros) {
    Object.entries(filtros).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }

  const response = await fetch(`${API_BASE_URL}/api/modules/calendar/turnos?${params}`, {
    headers: getHeaders()
  });

  if (!response.ok) throw new Error('Error al obtener turnos');
  return response.json();
}

export async function obtenerTurnosDelDia() {
  const response = await fetch(`${API_BASE_URL}/api/modules/calendar/turnos/hoy`, {
    headers: getHeaders()
  });

  if (!response.ok) throw new Error('Error al obtener turnos del día');
  return response.json();
}

export async function crearTurno(data: CrearTurnoData) {
  const response = await fetch(`${API_BASE_URL}/api/modules/calendar/turnos`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear turno');
  }

  return response.json();
}

export async function cancelarTurno(turnoId: string, motivo: string) {
  const response = await fetch(`${API_BASE_URL}/api/modules/calendar/turnos/${turnoId}`, {
    method: 'DELETE',
    headers: getHeaders(),
    body: JSON.stringify({ motivo })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al cancelar turno');
  }

  return response.json();
}

export async function actualizarEstadoTurno(
  turnoId: string,
  estado: string,
  motivoCancelacion?: string
) {
  const response = await fetch(`${API_BASE_URL}/api/modules/calendar/turnos/${turnoId}/estado`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ estado, motivoCancelacion })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al actualizar estado');
  }

  return response.json();
}

export async function obtenerEstadisticas(fechaDesde?: string, fechaHasta?: string) {
  const params = new URLSearchParams();
  if (fechaDesde) params.append('fechaDesde', fechaDesde);
  if (fechaHasta) params.append('fechaHasta', fechaHasta);

  const response = await fetch(`${API_BASE_URL}/api/modules/calendar/turnos/estadisticas?${params}`, {
    headers: getHeaders()
  });

  if (!response.ok) throw new Error('Error al obtener estadísticas');
  return response.json();
}

// ========== AGENTES ==========

export interface Agente {
  _id: string;
  empresaId: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  especialidad?: string;
  descripcion?: string;
  titulo?: string;
  sector?: string;
  modoAtencion: 'turnos_programados' | 'turnos_libres' | 'mixto';
  disponibilidad: Disponibilidad[];
  duracionTurnoPorDefecto: number;
  bufferEntreturnos: number;
  capacidadSimultanea?: number;
  maximoTurnosPorDia?: number;
  activo: boolean;
}

export interface Disponibilidad {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

export interface CrearAgenteData {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  especialidad?: string;
  descripcion?: string;
  titulo?: string;
  modoAtencion?: 'turnos_programados' | 'turnos_libres' | 'mixto';
  duracionTurnoPorDefecto?: number;
  bufferEntreturnos?: number;
  capacidadSimultanea?: number;
  maximoTurnosPorDia?: number;
}

export async function obtenerAgentes(soloActivos: boolean = false) {
  const params = soloActivos ? '?activos=true' : '';
  const response = await fetch(`${API_BASE_URL}/api/modules/calendar/agentes${params}`, {
    headers: getHeaders()
  });

  if (!response.ok) throw new Error('Error al obtener agentes');
  return response.json();
}

export async function obtenerAgentePorId(agenteId: string) {
  const response = await fetch(`${API_BASE_URL}/api/modules/calendar/agentes/${agenteId}`, {
    headers: getHeaders()
  });

  if (!response.ok) throw new Error('Error al obtener agente');
  return response.json();
}

export async function crearAgente(data: CrearAgenteData) {
  const headers = getHeaders();
  const url = `${API_BASE_URL}/api/modules/calendar/agentes`;
  const body = JSON.stringify(data);
  
  console.log('🚀 crearAgente - Request details:');
  console.log('  URL:', url);
  console.log('  Method: POST');
  console.log('  Headers:', headers);
  console.log('  Body:', body);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: body
  });

  console.log('📥 crearAgente - Response:', {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries())
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ crearAgente - Error response:', error);
    throw new Error(error.message || 'Error al crear agente');
  }

  const result = await response.json();
  console.log('✅ crearAgente - Success:', result);
  return result;
}

export async function actualizarAgente(agenteId: string, data: Partial<CrearAgenteData>) {
  const response = await fetch(`${API_BASE_URL}/api/modules/calendar/agentes/${agenteId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al actualizar agente');
  }

  return response.json();
}

export async function configurarDisponibilidad(
  agenteId: string,
  disponibilidad: Disponibilidad[]
) {
  const response = await fetch(`${API_BASE_URL}/api/modules/calendar/agentes/${agenteId}/disponibilidad`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ disponibilidad })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al configurar disponibilidad');
  }

  return response.json();
}

export async function eliminarAgente(agenteId: string) {
  const response = await fetch(`${API_BASE_URL}/api/modules/calendar/agentes/${agenteId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al eliminar agente');
  }

  return response.json();
}

// ========== DISPONIBILIDAD ==========

export interface Disponibilidad {
  diaSemana: number; // 0=Domingo, 1=Lunes, etc.
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  activo: boolean;
}

export interface DisponibilidadAgente {
  disponibilidad: Disponibilidad[];
  modoAtencion: string;
  duracionTurnoPorDefecto: number;
  bufferEntreturnos: number;
}

export interface Slot {
  fecha: string;
  disponible: boolean;
  agenteId: string;
  duracion: number;
}

export async function obtenerHorariosAgente(agenteId: string): Promise<DisponibilidadAgente> {
  const response = await fetch(
    `${API_BASE_URL}/api/modules/calendar/disponibilidad/${agenteId}/horarios`,
    { headers: getHeaders() }
  );

  if (!response.ok) throw new Error('Error al obtener horarios del agente');
  const data = await response.json();
  return data.disponibilidad;
}

export async function obtenerSlotsDisponibles(
  agenteId: string,
  fecha: string,
  duracion?: number
) {
  const params = new URLSearchParams({ fecha });
  if (duracion) params.append('duracion', duracion.toString());

  const response = await fetch(
    `${API_BASE_URL}/api/modules/calendar/disponibilidad/${agenteId}?${params}`,
    { headers: getHeaders() }
  );

  if (!response.ok) throw new Error('Error al obtener slots disponibles');
  return response.json();
}

export async function verificarDisponibilidad(
  agenteId: string,
  fechaInicio: string,
  duracion: number
) {
  const response = await fetch(`${API_BASE_URL}/api/modules/calendar/disponibilidad/verificar`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ agenteId, fechaInicio, duracion })
  });

  if (!response.ok) throw new Error('Error al verificar disponibilidad');
  return response.json();
}
