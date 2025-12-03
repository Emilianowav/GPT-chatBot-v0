// 🚀 API KEYWORD HANDLER - Ejecuta endpoints cuando se detectan keywords
// Parte del Router Universal

import { apiExecutor } from '../modules/integrations/services/apiExecutor.js';
import type { KeywordMatch } from './universalRouter.js';
// @ts-ignore - Mustache se instalará
import Mustache from 'mustache';

/**
 * Resultado de ejecución de API keyword
 */
export interface ApiKeywordResult {
  success: boolean;
  response: string;
  error?: string;
  metadata?: {
    apiName: string;
    endpointName: string;
    executionTime: number;
  };
}

/**
 * 🚀 HANDLER DE KEYWORDS DE API
 * Ejecuta endpoints y formatea respuestas cuando se detectan keywords
 */
export class ApiKeywordHandler {
  
  /**
   * Ejecuta el endpoint asociado a la keyword detectada
   */
  async execute(match: KeywordMatch): Promise<ApiKeywordResult> {
    const startTime = Date.now();
    
    try {
      console.log('\n🚀 ========== EJECUTANDO API KEYWORD ==========');
      console.log('📋 API:', (match.apiConfig as any).nombre);
      console.log('🔑 Keyword:', match.keyword.palabra);
      console.log('📍 Endpoint ID:', match.keyword.endpointId);
      console.log('📦 Parámetros extraídos:', match.extractedParams);
      
      // 1. Buscar el endpoint
      const endpoint = (match.apiConfig as any).endpoints.find(
        (ep: any) => ep.id === match.keyword.endpointId
      );
      
      if (!endpoint) {
        console.error('❌ Endpoint no encontrado:', match.keyword.endpointId);
        return {
          success: false,
          response: '❌ Lo siento, hubo un error de configuración. Por favor contactá a soporte.',
          error: 'Endpoint no encontrado'
        };
      }
      
      console.log('✅ Endpoint encontrado:', endpoint.nombre);
      
      // 2. Preparar parámetros para la ejecución
      const executionParams = this.prepareExecutionParams(
        match.extractedParams,
        endpoint
      );
      
      console.log('📤 Parámetros de ejecución:', executionParams);
      
      // 3. Ejecutar el endpoint
      const result = await apiExecutor.ejecutar(
        (match.apiConfig as any)._id.toString(),
        match.keyword.endpointId,
        executionParams
      );
      
      console.log('📥 Resultado de ejecución:', {
        success: result.success,
        statusCode: (result as any).statusCode,
        hasData: !!result.data
      });
      
      if (!result.success) {
        console.error('❌ Error en ejecución:', result.error);
        return {
          success: false,
          response: '❌ No pude completar tu solicitud. Por favor intentá de nuevo más tarde.',
          error: typeof result.error === 'string' ? result.error : (result.error as any)?.mensaje || 'Error desconocido',
          metadata: {
            apiName: (match.apiConfig as any).nombre,
            endpointName: endpoint.nombre,
            executionTime: Date.now() - startTime
          }
        };
      }
      
      // 4. Formatear respuesta con template
      const formattedResponse = this.formatResponse(
        result.data,
        match.keyword.respuestaTemplate
      );
      
      console.log('✅ Respuesta formateada exitosamente');
      console.log('📝 Longitud de respuesta:', formattedResponse.length);
      
      return {
        success: true,
        response: formattedResponse,
        metadata: {
          apiName: (match.apiConfig as any).nombre,
          endpointName: endpoint.nombre,
          executionTime: Date.now() - startTime
        }
      };
      
    } catch (error: any) {
      console.error('❌ Error ejecutando API keyword:', error);
      return {
        success: false,
        response: '❌ Ocurrió un error inesperado. Por favor intentá de nuevo.',
        error: error.message,
        metadata: {
          apiName: (match.apiConfig as any).nombre,
          endpointName: 'unknown',
          executionTime: Date.now() - startTime
        }
      };
    }
  }
  
  /**
   * Prepara los parámetros en el formato esperado por apiExecutor
   */
  private prepareExecutionParams(
    extractedParams: Record<string, any>,
    endpoint: any
  ): any {
    const params: any = {};
    
    // Clasificar parámetros según su tipo
    if (endpoint.parametros) {
      // Query params
      if (endpoint.parametros.query) {
        params.query = {};
        for (const queryParam of endpoint.parametros.query) {
          if (extractedParams[queryParam.nombre] !== undefined) {
            params.query[queryParam.nombre] = extractedParams[queryParam.nombre];
          }
        }
      }
      
      // Path params
      if (endpoint.parametros.path) {
        params.path = {};
        for (const pathParam of endpoint.parametros.path) {
          if (extractedParams[pathParam.nombre] !== undefined) {
            params.path[pathParam.nombre] = extractedParams[pathParam.nombre];
          }
        }
      }
      
      // Body params
      if (endpoint.parametros.body) {
        params.body = {};
        const bodyFields = endpoint.parametros.body.campos || [];
        for (const bodyField of bodyFields) {
          if (extractedParams[bodyField.nombre] !== undefined) {
            params.body[bodyField.nombre] = extractedParams[bodyField.nombre];
          }
        }
      }
    }
    
    return params;
  }
  
  /**
   * Formatea la respuesta usando el template Mustache
   */
  private formatResponse(data: any, template: string): string {
    try {
      if (!template || template.trim() === '') {
        // Si no hay template, devolver JSON formateado
        return '```json\n' + JSON.stringify(data, null, 2) + '\n```';
      }
      
      console.log('🎨 Formateando respuesta con Mustache');
      console.log('📊 Data recibida:', JSON.stringify(data, null, 2));
      console.log('📝 Template:', template.substring(0, 100) + '...');
      
      // Normalizar datos: si viene en formato {success, data, count}, extraer data
      let templateData = data;
      
      if (data && typeof data === 'object') {
        // Si tiene estructura {success: true, data: [...]}
        if (data.success && data.data) {
          console.log('🔄 Detectada estructura con wrapper, extrayendo data...');
          templateData = data.data;
        }
        
        // Si es un array y el template usa una variable específica (ej: {{#sucursales}})
        if (Array.isArray(templateData)) {
          // Detectar la variable del template (primera palabra después de {{#)
          const match = template.match(/\{\{#(\w+)\}\}/);
          if (match && match[1]) {
            const arrayName = match[1];
            console.log(`🔄 Array detectado, mapeando a variable: ${arrayName}`);
            templateData = { [arrayName]: templateData };
          }
        }
      }
      
      console.log('📊 Data final para template:', JSON.stringify(templateData, null, 2));
      
      // Renderizar con Mustache
      const rendered = Mustache.render(template, templateData);
      
      console.log('✅ Template renderizado, longitud:', rendered.length);
      console.log('📄 Primeros 200 chars:', rendered.substring(0, 200));
      
      return rendered;
      
    } catch (error) {
      console.error('❌ Error formateando respuesta con Mustache:', error);
      // Fallback: devolver JSON
      return '```json\n' + JSON.stringify(data, null, 2) + '\n```';
    }
  }
}

// Singleton
export const apiKeywordHandler = new ApiKeywordHandler();
