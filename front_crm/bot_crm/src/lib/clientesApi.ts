// 👤 API de Clientes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

export interface Cliente {
  _id: string;
  empresaId: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  fechaNacimiento?: string;
  dni?: string;
  notas?: string;
  sector?: string;
  agentesAsignados: string[];
  origen: 'chatbot' | 'manual';
  chatbotUserId?: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CrearClienteData {
  nombre: string;
  apellido: string;
  telefono: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  fechaNacimiento?: string;
  dni?: string;
  notas?: string;
}

/**
 * Obtener todos los clientes
 */
export async function obtenerClientes(soloActivos: boolean = false): Promise<Cliente[]> {
  const url = `${API_BASE_URL}/api/clientes${soloActivos ? '?activos=true' : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener clientes');
  }

  const data = await response.json();
  return data.clientes;
}

/**
 * Obtener un cliente por ID
 */
export async function obtenerClientePorId(clienteId: string): Promise<Cliente> {
  const response = await fetch(`${API_BASE_URL}/api/clientes/${clienteId}`, {
    method: 'GET',
    headers: getHeaders()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener cliente');
  }

  const data = await response.json();
  return data.cliente;
}

/**
 * Buscar clientes por término
 */
export async function buscarClientes(termino: string): Promise<Cliente[]> {
  const response = await fetch(`${API_BASE_URL}/api/clientes/buscar?q=${encodeURIComponent(termino)}`, {
    method: 'GET',
    headers: getHeaders()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al buscar clientes');
  }

  const data = await response.json();
  return data.clientes;
}

/**
 * Crear un nuevo cliente
 */
export async function crearCliente(data: CrearClienteData): Promise<Cliente> {
  const response = await fetch(`${API_BASE_URL}/api/clientes`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear cliente');
  }

  const result = await response.json();
  return result.cliente;
}

/**
 * Actualizar un cliente
 */
export async function actualizarCliente(
  clienteId: string,
  data: Partial<CrearClienteData>
): Promise<Cliente> {
  const response = await fetch(`${API_BASE_URL}/api/clientes/${clienteId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al actualizar cliente');
  }

  const result = await response.json();
  return result.cliente;
}

/**
 * Eliminar un cliente permanentemente
 */
export async function eliminarCliente(clienteId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/clientes/${clienteId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al eliminar cliente');
  }
}

/**
 * Agregar un agente a un cliente
 */
export async function agregarAgente(
  clienteId: string,
  agenteId: string
): Promise<Cliente> {
  const response = await fetch(`${API_BASE_URL}/api/clientes/${clienteId}/agentes`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ agenteId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al agregar agente');
  }

  const result = await response.json();
  return result.cliente;
}

/**
 * Remover un agente de un cliente
 */
export async function removerAgente(
  clienteId: string,
  agenteId: string
): Promise<Cliente> {
  const response = await fetch(`${API_BASE_URL}/api/clientes/${clienteId}/agentes/${agenteId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al remover agente');
  }

  const result = await response.json();
  return result.cliente;
}

/**
 * Reemplazar todos los agentes de un cliente
 */
export async function reemplazarAgentes(
  clienteId: string,
  agentesIds: string[]
): Promise<Cliente> {
  const response = await fetch(`${API_BASE_URL}/api/clientes/${clienteId}/agentes`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ agentesIds })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al reemplazar agentes');
  }

  const result = await response.json();
  return result.cliente;
}

/**
 * Obtener clientes asignados a un agente específico
 */
export async function obtenerClientesPorAgente(agenteId: string): Promise<Cliente[]> {
  const response = await fetch(`${API_BASE_URL}/api/clientes/por-agente/${agenteId}`, {
    method: 'GET',
    headers: getHeaders()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener clientes por agente');
  }

  const data = await response.json();
  return data.clientes;
}

/**
 * Obtener clientes sin agente asignado
 */
export async function obtenerClientesSinAgente(): Promise<Cliente[]> {
  const response = await fetch(`${API_BASE_URL}/api/clientes/sin-agente`, {
    method: 'GET',
    headers: getHeaders()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener clientes sin agente');
  }

  const data = await response.json();
  return data.clientes;
}
