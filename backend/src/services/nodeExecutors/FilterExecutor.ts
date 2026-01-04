// 🔍 EXECUTOR: Nodo Filtro - Validar Condiciones

import type { 
  FilterConfig, 
  FilterOperator,
  NodeExecutionResult,
  WorkflowSession 
} from '../../types/NodeTypes.js';

export class FilterExecutor {
  
  /**
   * Ejecuta un nodo de filtro/condición
   */
  async execute(
    config: FilterConfig,
    session: WorkflowSession
  ): Promise<NodeExecutionResult> {
    
    console.log(`🔍 [Filter] Evaluando ${config.conditions.length} condiciones con lógica ${config.logic}`);
    
    const resultados = config.conditions.map(condition => 
      this.evaluarCondicion(condition, session.variables)
    );
    
    let cumpleCondiciones: boolean;
    
    if (config.logic === 'AND') {
      cumpleCondiciones = resultados.every(r => r);
    } else {
      cumpleCondiciones = resultados.some(r => r);
    }
    
    console.log(`${cumpleCondiciones ? '✅' : '❌'} [Filter] Condiciones ${cumpleCondiciones ? 'cumplidas' : 'no cumplidas'}`);
    
    return {
      success: cumpleCondiciones,
      variables: session.variables
    };
  }
  
  /**
   * Evalúa una condición individual
   */
  private evaluarCondicion(
    condition: { field: string; operator: FilterOperator; value?: any },
    variables: Record<string, any>
  ): boolean {
    
    // Obtener valor del campo (puede ser variable)
    const valorCampo = this.obtenerValor(condition.field, variables);
    const valorComparacion = condition.value;
    
    console.log(`🔍 Evaluando: ${condition.field} (${valorCampo}) ${condition.operator} ${valorComparacion}`);
    
    switch (condition.operator) {
      case 'equal':
        return valorCampo == valorComparacion;
      
      case 'not_equal':
        return valorCampo != valorComparacion;
      
      case 'greater_than':
        return Number(valorCampo) > Number(valorComparacion);
      
      case 'less_than':
        return Number(valorCampo) < Number(valorComparacion);
      
      case 'greater_or_equal':
        return Number(valorCampo) >= Number(valorComparacion);
      
      case 'less_or_equal':
        return Number(valorCampo) <= Number(valorComparacion);
      
      case 'contains':
        return String(valorCampo).toLowerCase().includes(String(valorComparacion).toLowerCase());
      
      case 'not_contains':
        return !String(valorCampo).toLowerCase().includes(String(valorComparacion).toLowerCase());
      
      case 'starts_with':
        return String(valorCampo).toLowerCase().startsWith(String(valorComparacion).toLowerCase());
      
      case 'ends_with':
        return String(valorCampo).toLowerCase().endsWith(String(valorComparacion).toLowerCase());
      
      case 'is_empty':
        return !valorCampo || String(valorCampo).trim().length === 0;
      
      case 'not_empty':
        return !!valorCampo && String(valorCampo).trim().length > 0;
      
      case 'regex':
        try {
          const regex = new RegExp(valorComparacion);
          return regex.test(String(valorCampo));
        } catch {
          console.error(`❌ Regex inválido: ${valorComparacion}`);
          return false;
        }
      
      default:
        console.warn(`⚠️ Operador desconocido: ${condition.operator}`);
        return false;
    }
  }
  
  /**
   * Obtiene el valor de un campo (puede ser variable o literal)
   */
  private obtenerValor(campo: string, variables: Record<string, any>): any {
    // Si es una variable {{variable}}
    const match = campo.match(/^\{\{(\w+)\}\}$/);
    if (match) {
      return variables[match[1]];
    }
    
    // Si es un literal
    return campo;
  }
}
