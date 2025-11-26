/**
 * Extrae parámetros de una ruta de endpoint
 * 
 * Ejemplos:
 * - "/productos/:id" → ["id"]
 * - "/users/:userId/posts/:postId" → ["userId", "postId"]
 * - "/api/search?query=:search&category=:cat" → ["search", "cat"]
 */

interface Endpoint {
  path: string;
  parametros?: {
    path?: Array<{ nombre: string }>;
    query?: Array<{ nombre: string }>;
  };
}

export function extractEndpointParams(endpoint: Endpoint | null | undefined): string[] {
  if (!endpoint) return [];

  const params: Set<string> = new Set();

  // 1. Extraer parámetros del path (formato :param)
  if (endpoint.path) {
    const pathParams = endpoint.path.match(/:([a-zA-Z_][a-zA-Z0-9_]*)/g);
    if (pathParams) {
      pathParams.forEach(param => {
        params.add(param.substring(1)); // Remover el ":"
      });
    }

    // También formato {param}
    const braceParams = endpoint.path.match(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g);
    if (braceParams) {
      braceParams.forEach(param => {
        params.add(param.substring(1, param.length - 1)); // Remover "{" y "}"
      });
    }
  }

  // 2. Extraer parámetros definidos en parametros.path
  if (endpoint.parametros?.path) {
    endpoint.parametros.path.forEach(param => {
      params.add(param.nombre);
    });
  }

  // 3. Extraer parámetros definidos en parametros.query
  if (endpoint.parametros?.query) {
    endpoint.parametros.query.forEach(param => {
      params.add(param.nombre);
    });
  }

  return Array.from(params).sort();
}

/**
 * Obtiene un endpoint por su ID
 */
export function getEndpointById(endpoints: any[], endpointId: string): any | null {
  return endpoints.find(e => (e.id || e._id) === endpointId) || null;
}
