// 🗣️ EXECUTOR: Nodo Conversacional - Recopilar Información

import type { 
  ConversationalCollectConfig, 
  NodeExecutionResult,
  WorkflowSession 
} from '../../types/NodeTypes.js';

export class ConversationalCollectExecutor {
  
  /**
   * Ejecuta un nodo de recopilación conversacional
   */
  async execute(
    config: ConversationalCollectConfig,
    session: WorkflowSession,
    userInput?: string
  ): Promise<NodeExecutionResult> {
    
    // Si no hay input del usuario, enviar la pregunta
    if (!userInput) {
      let mensaje = config.pregunta;
      
      // Si hay opciones, agregarlas al mensaje
      if (config.opciones && config.opciones.length > 0) {
        mensaje += '\n\n';
        config.opciones.forEach((opcion, index) => {
          mensaje += `${index + 1}. ${opcion}\n`;
        });
      }
      
      return {
        success: true,
        response: mensaje,
        waitingForInput: true
      };
    }
    
    // Validar input del usuario
    const validacion = this.validarInput(userInput, config);
    
    if (!validacion.valido) {
      return {
        success: false,
        response: validacion.mensajeError || 'Por favor, ingresá un valor válido.',
        waitingForInput: true
      };
    }
    
    // Guardar en variables de sesión
    const variables = {
      ...session.variables,
      [config.variable]: validacion.valorProcesado
    };
    
    return {
      success: true,
      variables,
      waitingForInput: false
    };
  }
  
  /**
   * Valida el input del usuario según el tipo de validación
   */
  private validarInput(
    input: string,
    config: ConversationalCollectConfig
  ): { valido: boolean; valorProcesado?: any; mensajeError?: string } {
    
    if (!config.validacion) {
      return { valido: true, valorProcesado: input };
    }
    
    const { tipo, regex, mensajeError } = config.validacion;
    
    switch (tipo) {
      case 'texto':
        if (input.trim().length === 0) {
          return { valido: false, mensajeError: mensajeError || 'El texto no puede estar vacío.' };
        }
        return { valido: true, valorProcesado: input.trim() };
      
      case 'numero':
        const numero = parseFloat(input);
        if (isNaN(numero)) {
          return { valido: false, mensajeError: mensajeError || 'Por favor, ingresá un número válido.' };
        }
        return { valido: true, valorProcesado: numero };
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input)) {
          return { valido: false, mensajeError: mensajeError || 'Por favor, ingresá un email válido.' };
        }
        return { valido: true, valorProcesado: input.toLowerCase() };
      
      case 'telefono':
        const telefonoRegex = /^[\d\s\-\+\(\)]+$/;
        if (!telefonoRegex.test(input)) {
          return { valido: false, mensajeError: mensajeError || 'Por favor, ingresá un teléfono válido.' };
        }
        return { valido: true, valorProcesado: input.replace(/\s/g, '') };
      
      case 'fecha':
        // Intentar parsear fecha en varios formatos
        const fecha = new Date(input);
        if (isNaN(fecha.getTime())) {
          return { valido: false, mensajeError: mensajeError || 'Por favor, ingresá una fecha válida.' };
        }
        return { valido: true, valorProcesado: fecha.toISOString() };
      
      case 'regex':
        if (!regex) {
          return { valido: true, valorProcesado: input };
        }
        const customRegex = new RegExp(regex);
        if (!customRegex.test(input)) {
          return { valido: false, mensajeError: mensajeError || 'El formato ingresado no es válido.' };
        }
        return { valido: true, valorProcesado: input };
      
      default:
        return { valido: true, valorProcesado: input };
    }
  }
}
