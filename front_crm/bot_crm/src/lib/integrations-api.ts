// 🔧 Helper para API de Integraciones
import type { EmpresaAuth } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Obtiene el ID correcto de empresa para usar en las APIs
 * Usa empresaId (nombre de empresa) porque el backend lo convierte a ObjectId
 */
export function getEmpresaIdForApi(empresa: EmpresaAuth | null): string {
  if (!empresa) {
    throw new Error('No hay empresa autenticada');
  }
  
  // IMPORTANTE: Usar empresaId (nombre de empresa), NO empresaMongoId
  // El backend convierte el nombre a ObjectId internamente
  return empresa.empresaId;
}

/**
 * Construye la URL base para las APIs de integraciones
 */
export function getIntegrationsApiUrl(empresa: EmpresaAuth | null): string {
  const empresaId = getEmpresaIdForApi(empresa);
  return `${API_BASE_URL}/api/modules/integrations/${empresaId}`;
}

/**
 * Helper para hacer requests a la API de integraciones
 */
export async function integrationsApiFetch(
  empresa: EmpresaAuth | null,
  endpoint: string,
  options?: RequestInit
) {
  const baseUrl = getIntegrationsApiUrl(empresa);
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  return response;
}
