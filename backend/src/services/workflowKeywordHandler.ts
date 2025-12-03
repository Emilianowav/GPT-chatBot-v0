// 🔄 WORKFLOW KEYWORD HANDLER - Ejecuta workflows cuando se detectan keywords
// Extensión del Router Universal para workflows

import { apiExecutor } from '../modules/integrations/services/apiExecutor.js';
import type { IWorkflow, IWorkflowStep } from '../modules/integrations/types/api.types.js';
// @ts-ignore
import Mustache from 'mustache';

/**
 * Resultado de ejecución de workflow
 */
export interface WorkflowKeywordResult {
  success: boolean;
  response: string;
  error?: string;
  metadata?: {
    workflowName: string;
    stepsExecuted: number;
    totalSteps: number;
    executionTime: number;
    stepResults?: Array<{
      stepNumber: number;
      endpointName: string;
      success: boolean;
      executionTime: number;
    }>;
  };
}

/**
 * Match de keyword de workflow
 */
export interface WorkflowKeywordMatch {
  workflow: IWorkflow;
  apiConfig: any;
  extractedParams: Record<string, any>;
  confidence: number;
}

/**
 * 🔄 HANDLER DE WORKFLOWS
 * Ejecuta secuencias de endpoints cuando se detectan keywords de workflows
 */
export class WorkflowKeywordHandler {
  
  /**
   * Ejecuta un workflow completo (secuencia de endpoints)
   */
  async execute(match: WorkflowKeywordMatch): Promise<WorkflowKeywordResult> {
    const startTime = Date.now();
    const stepResults: Array<any> = [];
    
    try {
      console.log('\n🔄 ========== EJECUTANDO WORKFLOW ==========');
      console.log('📋 API:', match.apiConfig.nombre);
      console.log('🔄 Workflow:', match.workflow.nombre);
      console.log('📊 Total de pasos:', match.workflow.steps.length);
      console.log('📦 Parámetros iniciales:', match.extractedParams);
      
      // Verificar que el workflow esté activo
      if (!match.workflow.activo) {
        console.warn('⚠️ Workflow inactivo');
        return {
          success: false,
          response: '❌ Este flujo está temporalmente deshabilitado.',
          error: 'Workflow inactivo'
        };
      }
      
      // Ordenar steps por orden
      const sortedSteps = [...match.workflow.steps].sort((a, b) => a.orden - b.orden);
      
      // Contexto acumulado: almacena respuestas de pasos anteriores
      const context: Record<string, any> = {
        ...match.extractedParams
      };
      
      let responses: any[] = [];
      
      // Enviar mensaje inicial si existe
      let finalResponse = '';
      if (match.workflow.mensajeInicial) {
        finalResponse += match.workflow.mensajeInicial + '\n\n';
      }
      
      // Ejecutar cada paso secuencialmente
      for (let i = 0; i < sortedSteps.length; i++) {
        const step = sortedSteps[i];
        const stepStartTime = Date.now();
        
        console.log(`\n📍 Ejecutando paso ${i + 1}/${sortedSteps.length}`);
        console.log('🎯 Endpoint ID:', step.endpointId);
        console.log('📝 Nombre:', step.nombre || 'Sin nombre');
        
        // Buscar el endpoint
        const endpoint = match.apiConfig.endpoints.find(
          (ep: any) => ep.id === step.endpointId
        );
        
        if (!endpoint) {
          console.error(`❌ Endpoint no encontrado: ${step.endpointId}`);
          stepResults.push({
            stepNumber: i + 1,
            endpointName: step.nombre || step.endpointId,
            success: false,
            executionTime: Date.now() - stepStartTime,
            error: 'Endpoint no encontrado'
          });
          
          return {
            success: false,
            response: `❌ Error en el paso ${i + 1}: Configuración incorrecta.`,
            error: `Endpoint ${step.endpointId} no encontrado`,
            metadata: {
              workflowName: match.workflow.nombre,
              stepsExecuted: i,
              totalSteps: sortedSteps.length,
              executionTime: Date.now() - startTime,
              stepResults
            }
          };
        }
        
        console.log('✅ Endpoint encontrado:', endpoint.nombre);
        
        // Preparar parámetros para este paso
        const stepParams = this.prepareStepParams(
          step,
          context,
          responses,
          endpoint
        );
        
        console.log('📤 Parámetros del paso:', stepParams);
        
        // Ejecutar el endpoint
        const result = await apiExecutor.ejecutar(
          match.apiConfig._id.toString(),
          step.endpointId,
          stepParams
        );
        
        const stepExecutionTime = Date.now() - stepStartTime;
        
        if (!result.success) {
          console.error(`❌ Error en paso ${i + 1}:`, result.error);
          
          stepResults.push({
            stepNumber: i + 1,
            endpointName: endpoint.nombre,
            success: false,
            executionTime: stepExecutionTime,
            error: result.error
          });
          
          return {
            success: false,
            response: `❌ Error en el paso ${i + 1} (${endpoint.nombre}): No se pudo completar la operación.`,
            error: typeof result.error === 'string' ? result.error : (result.error as any)?.mensaje,
            metadata: {
              workflowName: match.workflow.nombre,
              stepsExecuted: i,
              totalSteps: sortedSteps.length,
              executionTime: Date.now() - startTime,
              stepResults
            }
          };
        }
        
        console.log(`✅ Paso ${i + 1} completado exitosamente`);
        
        // Guardar resultado del paso
        responses.push(result.data);
        
        // Actualizar contexto con la respuesta de este paso
        context[`step${i + 1}`] = result.data;
        context[`step${i + 1}_response`] = result.data;
        
        // Si el paso tiene un nombre, también guardarlo con ese nombre
        if (step.nombre) {
          const safeName = step.nombre.replace(/\s+/g, '_').toLowerCase();
          context[safeName] = result.data;
        }
        
        stepResults.push({
          stepNumber: i + 1,
          endpointName: endpoint.nombre,
          success: true,
          executionTime: stepExecutionTime
        });
      }
      
      console.log('✅ Todos los pasos completados exitosamente');
      console.log('📊 Respuestas acumuladas:', responses.length);
      
      // Formatear respuesta final
      // Usar la última respuesta o combinar todas
      const lastResponse = responses[responses.length - 1];
      
      // Agregar información de los pasos si es útil
      finalResponse += this.formatWorkflowResponse(
        responses,
        sortedSteps,
        match.apiConfig.endpoints
      );
      
      // Agregar mensaje final si existe
      if (match.workflow.mensajeFinal) {
        finalResponse += '\n\n' + match.workflow.mensajeFinal;
      }
      
      return {
        success: true,
        response: finalResponse,
        metadata: {
          workflowName: match.workflow.nombre,
          stepsExecuted: sortedSteps.length,
          totalSteps: sortedSteps.length,
          executionTime: Date.now() - startTime,
          stepResults
        }
      };
      
    } catch (error: any) {
      console.error('❌ Error ejecutando workflow:', error);
      return {
        success: false,
        response: '❌ Ocurrió un error inesperado ejecutando el flujo. Por favor intentá de nuevo.',
        error: error.message,
        metadata: {
          workflowName: match.workflow.nombre,
          stepsExecuted: stepResults.length,
          totalSteps: match.workflow.steps.length,
          executionTime: Date.now() - startTime,
          stepResults
        }
      };
    }
  }
  
  /**
   * Prepara los parámetros para un paso específico
   * Puede usar valores fijos o mapear desde respuestas anteriores
   */
  private prepareStepParams(
    step: IWorkflowStep,
    context: Record<string, any>,
    previousResponses: any[],
    endpoint: any
  ): any {
    const params: any = {};
    
    // Si hay mapeo de parámetros, aplicarlo
    if (step.mapeoParametros) {
      console.log('🗺️ Aplicando mapeo de parámetros:', step.mapeoParametros);
      
      for (const [paramName, sourcePath] of Object.entries(step.mapeoParametros)) {
        const value = this.extractValueFromPath(sourcePath, context, previousResponses);
        
        if (value !== undefined) {
          // Determinar dónde va el parámetro (query, path, body)
          if (endpoint.parametros?.query?.find((p: any) => p.nombre === paramName)) {
            if (!params.query) params.query = {};
            params.query[paramName] = value;
          } else if (endpoint.parametros?.path?.find((p: any) => p.nombre === paramName)) {
            if (!params.path) params.path = {};
            params.path[paramName] = value;
          } else {
            // Por defecto, al body
            if (!params.body) params.body = {};
            params.body[paramName] = value;
          }
        }
      }
    }
    
    // Agregar parámetros del contexto inicial que coincidan con el endpoint
    if (endpoint.parametros) {
      // Query params
      if (endpoint.parametros.query) {
        for (const queryParam of endpoint.parametros.query) {
          if (context[queryParam.nombre] !== undefined && !params.query?.[queryParam.nombre]) {
            if (!params.query) params.query = {};
            params.query[queryParam.nombre] = context[queryParam.nombre];
          }
        }
      }
      
      // Path params
      if (endpoint.parametros.path) {
        for (const pathParam of endpoint.parametros.path) {
          if (context[pathParam.nombre] !== undefined && !params.path?.[pathParam.nombre]) {
            if (!params.path) params.path = {};
            params.path[pathParam.nombre] = context[pathParam.nombre];
          }
        }
      }
    }
    
    return params;
  }
  
  /**
   * Extrae un valor de un path como "step1.data.id" o "response.data[0].name"
   */
  private extractValueFromPath(
    path: string,
    context: Record<string, any>,
    previousResponses: any[]
  ): any {
    try {
      // Soportar paths como:
      // - "step1.data.id"
      // - "response.data[0].name"
      // - "previousResponse.id"
      
      const parts = path.split('.');
      let current: any = context;
      
      for (const part of parts) {
        if (current === undefined || current === null) {
          return undefined;
        }
        
        // Manejar índices de array: data[0]
        const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
        if (arrayMatch) {
          const [, key, index] = arrayMatch;
          current = current[key]?.[parseInt(index)];
        } else {
          current = current[part];
        }
      }
      
      return current;
      
    } catch (error) {
      console.error('❌ Error extrayendo valor del path:', path, error);
      return undefined;
    }
  }
  
  /**
   * Formatea la respuesta final del workflow
   */
  private formatWorkflowResponse(
    responses: any[],
    steps: IWorkflowStep[],
    endpoints: any[]
  ): string {
    // Por ahora, devolver la última respuesta formateada
    const lastResponse = responses[responses.length - 1];
    
    if (typeof lastResponse === 'string') {
      return lastResponse;
    }
    
    if (typeof lastResponse === 'object') {
      // Si es un array, formatear como lista
      if (Array.isArray(lastResponse)) {
        if (lastResponse.length === 0) {
          return 'No se encontraron resultados.';
        }
        
        return JSON.stringify(lastResponse, null, 2);
      }
      
      // Si es un objeto, formatear
      return JSON.stringify(lastResponse, null, 2);
    }
    
    return String(lastResponse);
  }
}

// Singleton
export const workflowKeywordHandler = new WorkflowKeywordHandler();
