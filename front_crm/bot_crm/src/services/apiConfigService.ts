/**
 * Servicio para gestionar configuraciones de APIs (WooCommerce, etc.)
 * Usa las rutas del módulo de integraciones del backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiConfiguration {
  _id: string;
  nombre: string;
  descripcion?: string;
  empresaId: string;
  baseUrl: string;
  activo: boolean;
  autenticacion: {
    tipo: 'basic' | 'bearer' | 'oauth' | 'apikey';
    configuracion: {
      username?: string;
      password?: string;
      token?: string;
      apiKey?: string;
      consumerKey?: string;
      consumerSecret?: string;
    };
  };
  headers?: Record<string, string>;
  endpoints: ApiEndpoint[];
  creadoEn?: Date;
  actualizadoEn?: Date;
}

export interface ApiEndpoint {
  id: string;
  nombre: string;
  descripcion?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  parametros?: ApiParameter[];
  respuesta?: {
    tipo: 'object' | 'array';
    estructura?: Record<string, string>;
  };
}

export interface ApiParameter {
  nombre: string;
  tipo: string;
  requerido: boolean;
  descripcion?: string;
  ejemplo?: string;
  default?: string;
}

class ApiConfigService {
  /**
   * Obtener todas las APIs de una empresa
   */
  async getApis(empresaId: string): Promise<ApiConfiguration[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/modules/integrations/${empresaId}/apis`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al obtener APIs: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error en getApis:', error);
      throw error;
    }
  }

  /**
   * Obtener una API por ID
   */
  async getApiById(empresaId: string, apiId: string, incluirCredenciales = false): Promise<ApiConfiguration> {
    try {
      const url = new URL(`${API_BASE_URL}/api/modules/integrations/${empresaId}/apis/${apiId}`);
      if (incluirCredenciales) {
        url.searchParams.set('incluirCredenciales', 'true');
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al obtener API: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error en getApiById:', error);
      throw error;
    }
  }

  /**
   * Crear una nueva API
   */
  async createApi(empresaId: string, apiData: Partial<ApiConfiguration>): Promise<ApiConfiguration> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/modules/integrations/${empresaId}/apis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        throw new Error(`Error al crear API: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error en createApi:', error);
      throw error;
    }
  }

  /**
   * Actualizar una API existente
   */
  async updateApi(empresaId: string, apiId: string, apiData: Partial<ApiConfiguration>): Promise<ApiConfiguration> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/modules/integrations/${empresaId}/apis/${apiId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        throw new Error(`Error al actualizar API: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error en updateApi:', error);
      throw error;
    }
  }

  /**
   * Eliminar una API
   */
  async deleteApi(empresaId: string, apiId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/modules/integrations/${empresaId}/apis/${apiId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al eliminar API: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error en deleteApi:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo endpoint en una API
   */
  async createEndpoint(empresaId: string, apiId: string, endpointData: Partial<ApiEndpoint>): Promise<ApiConfiguration> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/modules/integrations/${empresaId}/apis/${apiId}/endpoints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(endpointData),
      });

      if (!response.ok) {
        throw new Error(`Error al crear endpoint: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error en createEndpoint:', error);
      throw error;
    }
  }

  /**
   * Actualizar un endpoint existente
   */
  async updateEndpoint(empresaId: string, apiId: string, endpointId: string, endpointData: Partial<ApiEndpoint>): Promise<ApiConfiguration> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/modules/integrations/${empresaId}/apis/${apiId}/endpoints/${endpointId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(endpointData),
      });

      if (!response.ok) {
        throw new Error(`Error al actualizar endpoint: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error en updateEndpoint:', error);
      throw error;
    }
  }

  /**
   * Eliminar un endpoint
   */
  async deleteEndpoint(empresaId: string, apiId: string, endpointId: string): Promise<ApiConfiguration> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/modules/integrations/${empresaId}/apis/${apiId}/endpoints/${endpointId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al eliminar endpoint: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error en deleteEndpoint:', error);
      throw error;
    }
  }

  /**
   * Probar un endpoint (proxy para evitar CORS)
   */
  async testEndpoint(empresaId: string, apiId: string, endpointId: string, params: Record<string, any>): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/modules/integrations/${empresaId}/apis/${apiId}/endpoints/${endpointId}/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ params }),
      });

      if (!response.ok) {
        throw new Error(`Error al probar endpoint: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error en testEndpoint:', error);
      throw error;
    }
  }

  /**
   * Crear una conexión de WooCommerce
   */
  async createWooCommerceConnection(
    empresaId: string,
    nombre: string,
    eshopUrl: string,
    consumerKey: string,
    consumerSecret: string
  ): Promise<ApiConfiguration> {
    const apiData: Partial<ApiConfiguration> = {
      nombre,
      descripcion: `Conexión de WooCommerce para ${eshopUrl}`,
      baseUrl: `${eshopUrl}/wp-json/wc/v3`,
      activo: true,
      autenticacion: {
        tipo: 'basic',
        configuracion: {
          username: consumerKey,
          password: consumerSecret,
        },
      },
      headers: {
        'Content-Type': 'application/json',
      },
      endpoints: [
        {
          id: 'buscar-productos',
          nombre: 'Buscar Productos',
          descripcion: 'Buscar productos por título, categoría o palabra clave',
          method: 'GET',
          path: '/products',
          parametros: [
            {
              nombre: 'search',
              tipo: 'string',
              requerido: false,
              descripcion: 'Término de búsqueda',
              ejemplo: 'Harry Potter',
            },
            {
              nombre: 'per_page',
              tipo: 'number',
              requerido: false,
              descripcion: 'Cantidad de resultados',
              ejemplo: '10',
              default: '10',
            },
            {
              nombre: 'orderby',
              tipo: 'string',
              requerido: false,
              descripcion: 'Campo para ordenar',
              ejemplo: 'relevance',
              default: 'relevance',
            },
            {
              nombre: 'status',
              tipo: 'string',
              requerido: false,
              descripcion: 'Estado del producto',
              ejemplo: 'publish',
              default: 'publish',
            },
          ],
          respuesta: {
            tipo: 'array',
            estructura: {
              id: 'number',
              name: 'string',
              price: 'string',
              stock_quantity: 'number',
              images: 'array',
            },
          },
        },
        {
          id: 'obtener-producto',
          nombre: 'Obtener Producto',
          descripcion: 'Obtener detalles de un producto por ID',
          method: 'GET',
          path: '/products/{id}',
          parametros: [
            {
              nombre: 'id',
              tipo: 'number',
              requerido: true,
              descripcion: 'ID del producto',
              ejemplo: '123',
            },
          ],
        },
        {
          id: 'crear-pedido',
          nombre: 'Crear Pedido',
          descripcion: 'Crear un nuevo pedido',
          method: 'POST',
          path: '/orders',
          parametros: [
            {
              nombre: 'payment_method',
              tipo: 'string',
              requerido: true,
              descripcion: 'Método de pago',
              ejemplo: 'mercadopago',
            },
            {
              nombre: 'line_items',
              tipo: 'array',
              requerido: true,
              descripcion: 'Productos del pedido',
            },
          ],
        },
      ],
    };

    return this.createApi(empresaId, apiData);
  }
}

export const apiConfigService = new ApiConfigService();
