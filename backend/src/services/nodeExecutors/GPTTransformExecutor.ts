// 🤖 EXECUTOR: Nodo GPT - Transformar/Formatear Datos

import type { 
  GPTTransformConfig, 
  NodeExecutionResult,
  WorkflowSession 
} from '../../types/NodeTypes.js';
import { obtenerRespuestaChat } from '../openaiService.js';

export class GPTTransformExecutor {
  
  /**
   * Ejecuta un nodo de transformación con GPT
   */
  async execute(
    config: GPTTransformConfig,
    session: WorkflowSession
  ): Promise<NodeExecutionResult> {
    
    try {
      // Reemplazar variables en el prompt
      const promptProcesado = this.reemplazarVariables(config.prompt, session.variables);
      
      console.log(`🤖 [GPT Transform] Ejecutando con prompt: ${promptProcesado.substring(0, 100)}...`);
      
      // Llamar a GPT
      const respuesta = await obtenerRespuestaChat({
        modelo: config.modelo,
        historial: [
          { role: 'user', content: promptProcesado }
        ]
        // Note: temperature y maxTokens se pueden agregar si openaiService los soporta
      });
      
      let valorProcesado = respuesta.texto;
      
      // Si debe parsear como JSON
      if (config.parseJSON) {
        try {
          // Intentar extraer JSON del texto (por si GPT agrega texto extra)
          const jsonMatch = valorProcesado.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            valorProcesado = JSON.parse(jsonMatch[0]);
          } else {
            valorProcesado = JSON.parse(valorProcesado);
          }
        } catch (parseError) {
          console.error('❌ [GPT Transform] Error parseando JSON:', parseError);
          return {
            success: false,
            error: 'Error parseando respuesta de GPT como JSON'
          };
        }
      }
      
      // Guardar en variables
      const variables = {
        ...session.variables,
        [config.outputVariable]: valorProcesado
      };
      
      console.log(`✅ [GPT Transform] Variable ${config.outputVariable} guardada`);
      
      return {
        success: true,
        variables
      };
      
    } catch (error: any) {
      console.error('❌ [GPT Transform] Error:', error);
      return {
        success: false,
        error: error.message || 'Error ejecutando transformación GPT'
      };
    }
  }
  
  /**
   * Reemplaza variables en un string con el formato {{variable}}
   */
  private reemplazarVariables(texto: string, variables: Record<string, any>): string {
    return texto.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      const valor = variables[varName];
      if (valor === undefined) {
        console.warn(`⚠️ Variable ${varName} no encontrada`);
        return match;
      }
      return typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
    });
  }
}
