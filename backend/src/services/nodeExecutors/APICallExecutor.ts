// 🌐 EXECUTOR: Nodo API Call - Llamar APIs Externas

import type { 
  APICallConfig, 
  NodeExecutionResult,
  WorkflowSession 
} from '../../types/NodeTypes.js';
import { apiExecutor } from '../../modules/integrations/services/apiExecutor.js';

export class APICallExecutor {
  
  /**
   * Ejecuta un nodo de llamada a API externa
   */
  async execute(
    config: APICallConfig,
    session: WorkflowSession
  ): Promise<NodeExecutionResult> {
    
    try {
      console.log(`🌐 [API Call] Ejecutando endpoint: ${config.endpointId}`);
      
      // Reemplazar variables en params y body
      const paramsProcesados = this.reemplazarVariables(config.params || {}, session.variables);
      const bodyProcesado = this.reemplazarVariables(config.body || {}, session.variables);
      
      // Ejecutar llamada a API
      const resultado = await apiExecutor.ejecutar(
        '', // apiConfigId - se debe obtener de la configuración
        config.endpointId,
        {
          query: paramsProcesados,
          body: bodyProcesado
        }
      );
      
      if (!resultado.success) {
        console.error(`❌ [API Call] Error:`, resultado.error);
        const errorMsg = typeof resultado.error === 'string' 
          ? resultado.error 
          : resultado.error?.mensaje || 'Error ejecutando API';
        return {
          success: false,
          error: errorMsg
        };
      }
      
      // Extraer datos si hay arrayPath configurado
      let datosExtraidos = resultado.data;
      
      if (config.arrayPath && resultado.data) {
        datosExtraidos = this.extraerPorRuta(resultado.data, config.arrayPath);
      }
      
      // Guardar en variables
      const variables = {
        ...session.variables,
        [config.outputVariable]: datosExtraidos
      };
      
      console.log(`✅ [API Call] Variable ${config.outputVariable} guardada con ${Array.isArray(datosExtraidos) ? datosExtraidos.length : 1} items`);
      
      return {
        success: true,
        variables
      };
      
    } catch (error: any) {
      console.error('❌ [API Call] Error:', error);
      return {
        success: false,
        error: error.message || 'Error ejecutando llamada a API'
      };
    }
  }
  
  /**
   * Reemplaza variables en un objeto con el formato {{variable}}
   */
  private reemplazarVariables(obj: any, variables: Record<string, any>): any {
    if (typeof obj === 'string') {
      return obj.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        const valor = variables[varName];
        return valor !== undefined ? String(valor) : match;
      });
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.reemplazarVariables(item, variables));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const resultado: any = {};
      for (const [key, value] of Object.entries(obj)) {
        resultado[key] = this.reemplazarVariables(value, variables);
      }
      return resultado;
    }
    
    return obj;
  }
  
  /**
   * Extrae datos siguiendo una ruta (ej: "data.items")
   */
  private extraerPorRuta(objeto: any, ruta: string): any {
    if (!ruta || !objeto) return objeto;
    
    const partes = ruta.split('.');
    let resultado = objeto;
    
    for (const parte of partes) {
      if (resultado && typeof resultado === 'object' && parte in resultado) {
        resultado = resultado[parte];
      } else {
        return null;
      }
    }
    
    return resultado;
  }
}
