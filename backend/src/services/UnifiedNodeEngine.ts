// 🚀 UNIFIED NODE ENGINE - Motor de Ejecución de Workflows

import type { 
  Workflow,
  WorkflowNode,
  WorkflowSession,
  NodeExecutionResult,
  NodeType
} from '../types/NodeTypes.js';

import { ConversationalCollectExecutor } from './nodeExecutors/ConversationalCollectExecutor.js';
import { GPTTransformExecutor } from './nodeExecutors/GPTTransformExecutor.js';
import { FilterExecutor } from './nodeExecutors/FilterExecutor.js';
import { APICallExecutor } from './nodeExecutors/APICallExecutor.js';
import { ConversationalResponseExecutor } from './nodeExecutors/ConversationalResponseExecutor.js';
import { MercadoPagoExecutor } from './nodeExecutors/MercadoPagoExecutor.js';

/**
 * Motor unificado de ejecución de workflows
 */
export class UnifiedNodeEngine {
  
  private sessions: Map<string, WorkflowSession> = new Map();
  
  // Ejecutores por tipo de nodo
  private executors = {
    conversational_collect: new ConversationalCollectExecutor(),
    gpt_transform: new GPTTransformExecutor(),
    filter: new FilterExecutor(),
    api_call: new APICallExecutor(),
    conversational_response: new ConversationalResponseExecutor(),
    mercadopago_payment: new MercadoPagoExecutor()
  };
  
  /**
   * Inicia un nuevo workflow
   */
  async startWorkflow(
    workflow: Workflow,
    contactoId: string,
    empresaId: string
  ): Promise<string> {
    
    console.log(`\n🚀 ========== INICIANDO WORKFLOW: ${workflow.nombre} ==========`);
    
    // Buscar nodo inicial (primer nodo o webhook)
    const nodoInicial = workflow.nodes.find(n => n.type === 'webhook') || workflow.nodes[0];
    
    if (!nodoInicial) {
      throw new Error('No se encontró nodo inicial en el workflow');
    }
    
    // Crear sesión
    const sessionKey = `${empresaId}:${contactoId}`;
    const session: WorkflowSession = {
      workflowId: workflow.id,
      contactoId,
      empresaId,
      currentNodeId: nodoInicial.id,
      variables: {},
      startedAt: new Date(),
      lastActivity: new Date(),
      completed: false
    };
    
    this.sessions.set(sessionKey, session);
    
    console.log(`✅ Sesión creada: ${sessionKey}`);
    console.log(`📍 Nodo inicial: ${nodoInicial.id} (${nodoInicial.type})`);
    
    // Ejecutar primer nodo
    return await this.executeCurrentNode(workflow, session, empresaId);
  }
  
  /**
   * Procesa input del usuario y continúa el workflow
   */
  async handleUserInput(
    workflow: Workflow,
    contactoId: string,
    empresaId: string,
    userInput: string
  ): Promise<string> {
    
    const sessionKey = `${empresaId}:${contactoId}`;
    const session = this.sessions.get(sessionKey);
    
    if (!session) {
      console.log('⚠️ No hay sesión activa, iniciando nuevo workflow');
      return await this.startWorkflow(workflow, contactoId, empresaId);
    }
    
    console.log(`\n🔄 ========== PROCESANDO INPUT: ${userInput.substring(0, 50)} ==========`);
    console.log(`📍 Nodo actual: ${session.currentNodeId}`);
    
    // Actualizar actividad
    session.lastActivity = new Date();
    
    // Ejecutar nodo actual con el input del usuario
    return await this.executeCurrentNode(workflow, session, empresaId, userInput);
  }
  
  /**
   * Ejecuta el nodo actual de la sesión
   */
  private async executeCurrentNode(
    workflow: Workflow,
    session: WorkflowSession,
    empresaId: string,
    userInput?: string
  ): Promise<string> {
    
    const nodo = workflow.nodes.find(n => n.id === session.currentNodeId);
    
    if (!nodo) {
      console.error(`❌ Nodo ${session.currentNodeId} no encontrado`);
      session.completed = true;
      return 'Error: Nodo no encontrado en el workflow.';
    }
    
    console.log(`⚙️ Ejecutando nodo: ${nodo.id} (${nodo.type})`);
    
    // Ejecutar nodo según su tipo
    let resultado: NodeExecutionResult;
    
    try {
      resultado = await this.executeNode(nodo, session, empresaId, session.contactoId, userInput);
    } catch (error: any) {
      console.error(`❌ Error ejecutando nodo ${nodo.id}:`, error);
      return `Error ejecutando workflow: ${error.message}`;
    }
    
    // Si el nodo falló
    if (!resultado.success) {
      console.error(`❌ Nodo ${nodo.id} falló: ${resultado.error}`);
      
      // Si es un filtro que falló, buscar conexión alternativa
      if (nodo.type === 'filter') {
        const conexionAlternativa = nodo.connections.find(c => c.label === 'onFail');
        if (conexionAlternativa) {
          session.currentNodeId = conexionAlternativa.targetNodeId;
          return await this.executeCurrentNode(workflow, session, empresaId);
        }
      }
      
      return resultado.error || 'Error ejecutando nodo';
    }
    
    // Actualizar variables de sesión
    if (resultado.variables) {
      session.variables = resultado.variables;
      console.log(`📝 Variables actualizadas:`, Object.keys(resultado.variables));
    }
    
    // Si está esperando input del usuario
    if (resultado.waitingForInput) {
      console.log(`⏸️ Esperando input del usuario`);
      return resultado.response || '';
    }
    
    // Buscar siguiente nodo
    const siguienteNodo = await this.findNextNode(nodo, session, workflow);
    
    if (!siguienteNodo) {
      console.log(`✅ Workflow completado`);
      session.completed = true;
      this.sessions.delete(`${empresaId}:${session.contactoId}`);
      return resultado.response || '✅ Proceso completado.';
    }
    
    // Avanzar al siguiente nodo
    session.currentNodeId = siguienteNodo.id;
    console.log(`➡️ Avanzando a nodo: ${siguienteNodo.id} (${siguienteNodo.type})`);
    
    // Si el nodo actual generó una respuesta, devolverla
    if (resultado.response) {
      return resultado.response;
    }
    
    // Si no generó respuesta, ejecutar siguiente nodo inmediatamente
    return await this.executeCurrentNode(workflow, session, empresaId);
  }
  
  /**
   * Ejecuta un nodo específico según su tipo
   */
  private async executeNode(
    nodo: WorkflowNode,
    session: WorkflowSession,
    empresaId: string,
    contactoId: string,
    userInput?: string
  ): Promise<NodeExecutionResult> {
    
    const config = nodo.config;
    
    switch (nodo.type) {
      case 'conversational_collect':
        return await this.executors.conversational_collect.execute(config as any, session, userInput);
      
      case 'gpt_transform':
        return await this.executors.gpt_transform.execute(config as any, session);
      
      case 'filter':
        return await this.executors.filter.execute(config as any, session);
      
      case 'api_call':
        return await this.executors.api_call.execute(config as any, session);
      
      case 'conversational_response':
        return await this.executors.conversational_response.execute(config as any, session, userInput);
      
      case 'mercadopago_payment':
        return await this.executors.mercadopago_payment.execute(config as any, session, empresaId, contactoId);
      
      case 'router':
        // Router solo pasa al siguiente nodo
        return { success: true };
      
      case 'webhook':
        // Webhook es solo punto de entrada
        return { success: true };
      
      default:
        return {
          success: false,
          error: `Tipo de nodo no soportado: ${nodo.type}`
        };
    }
  }
  
  /**
   * Encuentra el siguiente nodo a ejecutar
   */
  private async findNextNode(
    nodoActual: WorkflowNode,
    session: WorkflowSession,
    workflow: Workflow
  ): Promise<WorkflowNode | null> {
    
    // Si no hay conexiones, fin del workflow
    if (!nodoActual.connections || nodoActual.connections.length === 0) {
      return null;
    }
    
    // Evaluar filtros en las conexiones
    for (const conexion of nodoActual.connections) {
      
      // Si la conexión tiene filtro, evaluarlo
      if (conexion.filter) {
        const filterExecutor = new FilterExecutor();
        const resultado = await filterExecutor.execute(conexion.filter, session);
        
        if (resultado.success) {
          // Filtro cumplido, usar esta conexión
          return workflow.nodes.find(n => n.id === conexion.targetNodeId) || null;
        }
      } else {
        // Sin filtro, usar esta conexión directamente
        return workflow.nodes.find(n => n.id === conexion.targetNodeId) || null;
      }
    }
    
    // Si ningún filtro se cumplió, fin del workflow
    return null;
  }
  
  /**
   * Obtiene el estado de una sesión
   */
  getSession(empresaId: string, contactoId: string): WorkflowSession | undefined {
    return this.sessions.get(`${empresaId}:${contactoId}`);
  }
  
  /**
   * Cancela una sesión activa
   */
  cancelSession(empresaId: string, contactoId: string): void {
    this.sessions.delete(`${empresaId}:${contactoId}`);
    console.log(`🗑️ Sesión cancelada: ${empresaId}:${contactoId}`);
  }
  
  /**
   * Limpia sesiones inactivas (más de 30 minutos)
   */
  cleanupInactiveSessions(): void {
    const ahora = new Date();
    const timeout = 30 * 60 * 1000; // 30 minutos
    
    for (const [key, session] of this.sessions.entries()) {
      const inactivo = ahora.getTime() - session.lastActivity.getTime();
      if (inactivo > timeout) {
        this.sessions.delete(key);
        console.log(`🗑️ Sesión inactiva eliminada: ${key}`);
      }
    }
  }
}

// Exportar instancia singleton
export const unifiedNodeEngine = new UnifiedNodeEngine();

// Limpiar sesiones inactivas cada 10 minutos
setInterval(() => {
  unifiedNodeEngine.cleanupInactiveSessions();
}, 10 * 60 * 1000);
