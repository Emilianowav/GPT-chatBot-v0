// 💬 EXECUTOR: Nodo Conversacional Response - Responder al Usuario

import type { 
  ConversationalResponseConfig, 
  NodeExecutionResult,
  WorkflowSession 
} from '../../types/NodeTypes.js';

export class ConversationalResponseExecutor {
  
  /**
   * Ejecuta un nodo de respuesta conversacional
   */
  async execute(
    config: ConversationalResponseConfig,
    session: WorkflowSession,
    userInput?: string
  ): Promise<NodeExecutionResult> {
    
    let mensaje = config.mensaje;
    
    // Si hay que formatear una lista
    if (config.formatearLista) {
      const lista = session.variables[config.formatearLista.variable];
      
      if (Array.isArray(lista) && lista.length > 0) {
        const itemsFormateados = lista.map((item, index) => {
          return this.formatearItem(config.formatearLista!.template, item, index);
        }).join('\n');
        
        mensaje = mensaje.replace(`{{${config.formatearLista.variable}}}`, itemsFormateados);
      }
    }
    
    // Reemplazar variables en el mensaje
    mensaje = this.reemplazarVariables(mensaje, session.variables);
    
    console.log(`💬 [Response] Enviando mensaje: ${mensaje.substring(0, 100)}...`);
    
    // Si espera respuesta del usuario
    if (config.esperarRespuesta && config.siguienteVariable) {
      
      // Si no hay input, enviar mensaje y esperar
      if (!userInput) {
        return {
          success: true,
          response: mensaje,
          waitingForInput: true
        };
      }
      
      // Si hay input, guardarlo en la variable
      const variables = {
        ...session.variables,
        [config.siguienteVariable]: userInput
      };
      
      return {
        success: true,
        variables,
        waitingForInput: false
      };
    }
    
    // Si no espera respuesta, solo enviar mensaje
    return {
      success: true,
      response: mensaje,
      waitingForInput: false
    };
  }
  
  /**
   * Formatea un item de lista usando un template
   */
  private formatearItem(template: string, item: any, index: number): string {
    let resultado = template;
    
    // Reemplazar {{index}}
    resultado = resultado.replace(/\{\{index\}\}/g, String(index + 1));
    
    // Reemplazar propiedades del item
    if (typeof item === 'object') {
      for (const [key, value] of Object.entries(item)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        resultado = resultado.replace(regex, String(value));
      }
    }
    
    return resultado;
  }
  
  /**
   * Reemplaza variables en un string con el formato {{variable}}
   */
  private reemplazarVariables(texto: string, variables: Record<string, any>): string {
    return texto.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      const valor = variables[varName];
      if (valor === undefined) {
        return match;
      }
      return typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
    });
  }
}
