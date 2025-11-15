// ⚡ Motor de Ejecución de APIs
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiConfigurationModel, ApiRequestLogModel } from '../models/index.js';
import { decrypt } from '../utils/encryption.js';
import type {
  IApiExecutionParams,
  IApiExecutionResult,
  IEndpoint,
  IRequestContext
} from '../types/api.types.js';

export class ApiExecutor {
  
  /**
   * Ejecuta una llamada a un endpoint de API configurada
   */
  async ejecutar(
    apiConfigId: string,
    endpointId: string,
    parametros: IApiExecutionParams = {},
    contexto?: IRequestContext
  ): Promise<IApiExecutionResult> {
    const startTime = Date.now();
    
    console.log('🎯 ApiExecutor.ejecutar() iniciado:', {
      apiConfigId,
      endpointId,
      parametros,
      contexto
    });
    
    try {
      // 1. Obtener configuración de la API
      const apiConfig = await ApiConfigurationModel.findById(apiConfigId);
      if (!apiConfig) {
        console.error('❌ API no encontrada:', apiConfigId);
        throw new Error('Configuración de API no encontrada');
      }
      
      console.log('✅ API encontrada:', {
        nombre: apiConfig.nombre,
        baseUrl: apiConfig.baseUrl,
        estado: apiConfig.estado
      });
      
      if (apiConfig.estado !== 'activo') {
        throw new Error(`La API está en estado: ${apiConfig.estado}`);
      }
      
      // 2. Obtener endpoint
      const endpoint = apiConfig.endpoints.find(ep => ep.id === endpointId);
      if (!endpoint) {
        console.error('❌ Endpoint no encontrado:', endpointId);
        console.log('📋 Endpoints disponibles:', apiConfig.endpoints.map(ep => ({ id: ep.id, nombre: ep.nombre })));
        throw new Error('Endpoint no encontrado');
      }
      
      console.log('✅ Endpoint encontrado:', {
        nombre: endpoint.nombre,
        metodo: endpoint.metodo,
        path: endpoint.path,
        parametros: endpoint.parametros
      });
      
      if (!endpoint.activo) {
        throw new Error('El endpoint está inactivo');
      }
      
      // 3. Construir request
      const requestConfig = this.construirRequest(apiConfig, endpoint, parametros);
      
      // 4. Ejecutar con reintentos
      let response: AxiosResponse;
      let error: any = null;
      
      try {
        response = await this.ejecutarConReintentos(
          requestConfig,
          apiConfig.configuracion
        );
        
        console.log('✅ Respuesta de API externa:', {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: typeof response.data === 'string' ? response.data.substring(0, 500) : response.data
        });
      } catch (err: any) {
        error = err;
        console.error('❌ Error en ejecución:', {
          message: err.message,
          code: err.code,
          response: err.response ? {
            status: err.response.status,
            statusText: err.response.statusText,
            data: err.response.data
          } : 'No response'
        });
        throw err;
      } finally {
        const endTime = Date.now();
        const tiempoRespuesta = endTime - startTime;
        
        // 5. Registrar log
        await this.registrarLog({
          empresaId: apiConfig.empresaId,
          apiConfigId: apiConfig._id,
          endpointId,
          request: requestConfig,
          response: error ? undefined : response,
          error,
          tiempoRespuesta,
          contexto
        });
        
        // 6. Actualizar estadísticas
        apiConfig.actualizarEstadisticas(!error, tiempoRespuesta);
        await apiConfig.save();
      }
      
      // 7. Aplicar transformación si existe
      let data = response!.data;
      if (endpoint.mapeo?.salida) {
        data = this.transformarRespuesta(data, endpoint.mapeo.salida);
      }
      
      return {
        success: true,
        data,
        metadata: {
          tiempoRespuesta: Date.now() - startTime,
          timestamp: new Date(),
          cached: false
        }
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: {
          mensaje: error.message || 'Error desconocido',
          codigo: error.code,
          statusCode: error.response?.status
        },
        metadata: {
          tiempoRespuesta: Date.now() - startTime,
          timestamp: new Date(),
          cached: false
        }
      };
    }
  }
  
  /**
   * Construye la configuración de la petición HTTP
   */
  private construirRequest(
    apiConfig: any,
    endpoint: IEndpoint,
    parametros: IApiExecutionParams
  ): AxiosRequestConfig {
    // Construir URL
    let url = apiConfig.baseUrl + endpoint.path;
    
    // Reemplazar parámetros de path
    if (parametros.path) {
      Object.entries(parametros.path).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, String(value));
        url = url.replace(`:${key}`, String(value));
      });
    }
    
    // Headers base (Content-Type solo para POST/PUT/PATCH)
    const headers: Record<string, string> = {
      'User-Agent': 'MomentoIA-Integration/1.0',
      ...parametros.headers
    };
    
    // Solo agregar Content-Type si hay body
    if (endpoint.metodo !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }
    
    const auth = apiConfig.autenticacion;
    
    try {
      if (auth.tipo === 'bearer') {
        const token = decrypt(auth.configuracion.token);
        const headerName = auth.configuracion.headerName || 'Authorization';
        headers[headerName] = `Bearer ${token}`;
        
      } else if (auth.tipo === 'api_key') {
        const key = decrypt(auth.configuracion.apiKey);
        const location = auth.configuracion.apiKeyLocation || 'header';
        
        if (location === 'header') {
          headers[auth.configuracion.apiKeyName || 'X-API-Key'] = key;
        } else if (location === 'query') {
          parametros.query = parametros.query || {};
          parametros.query[auth.configuracion.apiKeyName || 'api_key'] = key;
        }
        
      } else if (auth.tipo === 'basic') {
        const username = decrypt(auth.configuracion.username || '');
        const password = decrypt(auth.configuracion.password || '');
        const credentials = Buffer.from(`${username}:${password}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      }
      
      // Custom headers
      if (auth.configuracion.customHeaders) {
        Object.assign(headers, auth.configuracion.customHeaders);
      }
    } catch (error) {
      console.error('Error al procesar autenticación:', error);
    }
    
    // Timeout
    const timeout = endpoint.timeout || apiConfig.configuracion.timeout || 30000;
    
    const requestConfig: any = {
      method: endpoint.metodo,
      url,
      headers,
      timeout,
      validateStatus: () => true // No lanzar error por status codes
    };
    
    // Solo agregar params si hay query parameters
    if (parametros.query && Object.keys(parametros.query).length > 0) {
      requestConfig.params = parametros.query;
    }
    
    // Solo agregar data si hay body
    if (parametros.body && Object.keys(parametros.body).length > 0) {
      requestConfig.data = parametros.body;
    }
    
    // Construir URL completa con query params para el log
    const queryString = requestConfig.params 
      ? '?' + new URLSearchParams(requestConfig.params).toString()
      : '';
    const fullUrl = requestConfig.url + queryString;
    
    console.log('🚀 Ejecutando request a API externa:');
    console.log('   📍 URL completa:', fullUrl);
    console.log('   🔧 Método:', requestConfig.method);
    console.log('   📝 Query params:', requestConfig.params);
    console.log('   📦 Body:', requestConfig.data);
    console.log('   🔑 Headers:', requestConfig.headers);
    
    return requestConfig;
  }
  
  /**
   * Ejecuta la petición con reintentos automáticos
   */
  private async ejecutarConReintentos(
    request: AxiosRequestConfig,
    config: any
  ): Promise<AxiosResponse> {
    const maxReintentos = config.reintentos || 3;
    const backoff = config.reintentarEn || [1000, 2000, 4000];
    
    for (let intento = 0; intento <= maxReintentos; intento++) {
      try {
        const response = await axios(request);
        
        // Verificar si la respuesta es exitosa
        if (response.status >= 200 && response.status < 300) {
          return response;
        }
        
        // Si es un error del cliente (4xx), no reintentar
        if (response.status >= 400 && response.status < 500) {
          throw new Error(
            `Error ${response.status}: ${response.statusText || 'Error del cliente'}`
          );
        }
        
        // Si es un error del servidor (5xx) y no es el último intento, reintentar
        if (intento < maxReintentos) {
          await this.esperar(backoff[intento] || backoff[backoff.length - 1]);
          continue;
        }
        
        throw new Error(
          `Error ${response.status}: ${response.statusText || 'Error del servidor'}`
        );
        
      } catch (error: any) {
        // Si es el último intento, lanzar el error
        if (intento === maxReintentos) {
          throw error;
        }
        
        // Solo reintentar en errores de red o timeouts
        if (this.esErrorReintentar(error)) {
          await this.esperar(backoff[intento] || backoff[backoff.length - 1]);
          continue;
        }
        
        // Si no es un error reintentar, lanzar inmediatamente
        throw error;
      }
    }
    
    throw new Error('No se pudo completar la petición después de los reintentos');
  }
  
  /**
   * Determina si un error debe ser reintentado
   */
  private esErrorReintentar(error: any): boolean {
    // Errores de red
    if (!error.response) return true;
    
    // Timeouts
    if (error.code === 'ECONNABORTED') return true;
    
    // Errores del servidor (5xx)
    const status = error.response?.status;
    return status >= 500 && status < 600;
  }
  
  /**
   * Espera un tiempo determinado
   */
  private esperar(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Transforma la respuesta según el mapeo configurado
   */
  private transformarRespuesta(data: any, mapeo: Record<string, string>): any {
    const resultado: any = {};
    
    for (const [destino, origen] of Object.entries(mapeo)) {
      const valor = this.obtenerValorPorPath(data, origen);
      this.establecerValorPorPath(resultado, destino, valor);
    }
    
    return resultado;
  }
  
  /**
   * Obtiene un valor de un objeto usando un path (ej: "data.items[0].name")
   */
  private obtenerValorPorPath(obj: any, path: string): any {
    const partes = path.split('.');
    let valor = obj;
    
    for (const parte of partes) {
      if (valor === undefined || valor === null) return undefined;
      valor = valor[parte];
    }
    
    return valor;
  }
  
  /**
   * Establece un valor en un objeto usando un path
   */
  private establecerValorPorPath(obj: any, path: string, valor: any): void {
    const partes = path.split('.');
    let actual = obj;
    
    for (let i = 0; i < partes.length - 1; i++) {
      const parte = partes[i];
      if (!(parte in actual)) {
        actual[parte] = {};
      }
      actual = actual[parte];
    }
    
    actual[partes[partes.length - 1]] = valor;
  }
  
  /**
   * Registra el log de la petición
   */
  private async registrarLog(datos: {
    empresaId: any;
    apiConfigId: any;
    endpointId: string;
    request: AxiosRequestConfig;
    response?: AxiosResponse;
    error?: any;
    tiempoRespuesta: number;
    contexto?: IRequestContext;
  }): Promise<void> {
    try {
      await ApiRequestLogModel.create({
        empresaId: datos.empresaId,
        apiConfigId: datos.apiConfigId,
        endpointId: datos.endpointId,
        request: {
          metodo: datos.request.method?.toUpperCase() || 'GET',
          url: datos.request.url || '',
          headers: this.sanitizarHeaders(datos.request.headers || {}),
          parametros: datos.request.params,
          body: datos.request.data,
          timestamp: new Date()
        },
        response: datos.response ? {
          statusCode: datos.response.status,
          headers: this.sanitizarHeaders(datos.response.headers || {}),
          body: datos.response.data,
          tiempoRespuesta: datos.tiempoRespuesta,
          timestamp: new Date()
        } : undefined,
        error: datos.error ? {
          mensaje: datos.error.message || 'Error desconocido',
          codigo: datos.error.code,
          stack: datos.error.stack
        } : undefined,
        estado: datos.error ? 'error' : 'success',
        contexto: datos.contexto
      });
    } catch (error) {
      console.error('Error al registrar log de API:', error);
    }
  }
  
  /**
   * Sanitiza headers removiendo información sensible
   */
  private sanitizarHeaders(headers: any): Record<string, string> {
    const sanitizado: Record<string, string> = {};
    const camposSensibles = ['authorization', 'x-api-key', 'api-key', 'token'];
    
    for (const [key, value] of Object.entries(headers)) {
      const keyLower = key.toLowerCase();
      if (camposSensibles.includes(keyLower)) {
        sanitizado[key] = '***REDACTED***';
      } else {
        sanitizado[key] = String(value);
      }
    }
    
    return sanitizado;
  }
}

// Exportar instancia singleton
export const apiExecutor = new ApiExecutor();
