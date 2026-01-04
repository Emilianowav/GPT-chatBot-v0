// 💳 EXECUTOR: Nodo MercadoPago - Generar Link de Pago

import type { 
  MercadoPagoPaymentConfig, 
  NodeExecutionResult,
  WorkflowSession 
} from '../../types/NodeTypes.js';
import { generateDynamicPaymentLink } from '../paymentLinkService.js';

export class MercadoPagoExecutor {
  
  /**
   * Ejecuta un nodo de generación de pago MercadoPago
   */
  async execute(
    config: MercadoPagoPaymentConfig,
    session: WorkflowSession,
    empresaId: string,
    clientePhone: string
  ): Promise<NodeExecutionResult> {
    
    try {
      console.log(`💳 [MercadoPago] Generando link de pago`);
      
      // Reemplazar variables en title y description
      const title = this.reemplazarVariables(config.title, session.variables);
      const description = config.description 
        ? this.reemplazarVariables(config.description, session.variables)
        : '';
      
      // Calcular amount (puede ser expresión: {{precio * cantidad}})
      const amount = this.calcularAmount(config.amount, session.variables);
      
      if (amount <= 0) {
        return {
          success: false,
          error: 'El monto debe ser mayor a 0'
        };
      }
      
      console.log(`💳 [MercadoPago] Title: ${title}, Amount: $${amount}`);
      
      // Generar link de pago
      const resultado = await generateDynamicPaymentLink({
        empresaId,
        title,
        amount,
        description,
        clientePhone
      });
      
      if (!resultado.success || !resultado.paymentUrl) {
        console.error(`❌ [MercadoPago] Error: ${resultado.error}`);
        return {
          success: false,
          error: resultado.error || 'Error generando link de pago'
        };
      }
      
      // Guardar URL en variables
      const variables = {
        ...session.variables,
        [config.outputVariable]: resultado.paymentUrl
      };
      
      console.log(`✅ [MercadoPago] Link generado: ${resultado.paymentUrl}`);
      
      return {
        success: true,
        variables
      };
      
    } catch (error: any) {
      console.error('❌ [MercadoPago] Error:', error);
      return {
        success: false,
        error: error.message || 'Error generando pago'
      };
    }
  }
  
  /**
   * Calcula el amount (puede ser número, variable o expresión)
   */
  private calcularAmount(amount: string | number, variables: Record<string, any>): number {
    // Si es número directo
    if (typeof amount === 'number') {
      return amount;
    }
    
    // Si es string, puede ser variable o expresión
    const amountStr = String(amount);
    
    // Reemplazar variables
    const amountProcesado = this.reemplazarVariables(amountStr, variables);
    
    // Intentar evaluar como expresión matemática simple
    try {
      // Seguridad: solo permitir números, operadores y espacios
      if (!/^[\d\s\+\-\*\/\.\(\)]+$/.test(amountProcesado)) {
        return parseFloat(amountProcesado);
      }
      
      // Evaluar expresión
      const resultado = eval(amountProcesado);
      return parseFloat(resultado);
    } catch {
      return parseFloat(amountProcesado);
    }
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
      return String(valor);
    });
  }
}
