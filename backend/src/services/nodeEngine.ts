// 🎯 Motor de Nodos - Procesa flujos configurables
import { FlowNodeModel, IFlowNode } from '../models/FlowNode.js';
import { FlowModel } from '../models/Flow.js';
import { generateDynamicPaymentLink } from './paymentLinkService.js';
import { apiExecutor } from '../modules/integrations/services/apiExecutor.js';
import { EmpresaModel } from '../models/Empresa.js';

interface NodeSession {
  empresaId: string;
  contactId: string;
  flowId: string;
  currentNode: string;
  variables: Record<string, any>;
  history: Array<{
    nodeId: string;
    timestamp: Date;
    userInput?: string;
    response?: string;
  }>;
  startedAt: Date;
  lastActivity: Date;
}

export class NodeEngine {
  private sessions: Map<string, NodeSession> = new Map();

  /**
   * Obtiene o crea una sesión para un contacto
   */
  private getSession(contactId: string, empresaId: string, flowId: string): NodeSession {
    const sessionKey = `${empresaId}:${contactId}`;
    
    if (!this.sessions.has(sessionKey)) {
      this.sessions.set(sessionKey, {
        empresaId,
        contactId,
        flowId,
        currentNode: '',
        variables: {},
        history: [],
        startedAt: new Date(),
        lastActivity: new Date()
      });
    }

    const session = this.sessions.get(sessionKey)!;
    session.lastActivity = new Date();
    return session;
  }

  /**
   * Inicia un flujo desde el nodo inicial
   */
  async startFlow(empresaId: string, contactId: string, flowId: string): Promise<string> {
    const flow = await FlowModel.findOne({ empresaId, id: flowId, activo: true });
    
    if (!flow) {
      throw new Error(`Flujo ${flowId} no encontrado o inactivo`);
    }

    const session = this.getSession(contactId, empresaId, flowId);
    session.flowId = flowId;
    session.currentNode = flow.startNode;
    session.variables = { ...flow.variables };

    return this.processNode(session);
  }

  /**
   * Procesa la entrada del usuario y avanza al siguiente nodo
   */
  async handleUserInput(empresaId: string, contactId: string, userInput: string): Promise<string> {
    const sessionKey = `${empresaId}:${contactId}`;
    const session = this.sessions.get(sessionKey);

    if (!session) {
      throw new Error('No hay sesión activa. Inicia un flujo primero.');
    }

    const currentNode = await FlowNodeModel.findOne({
      empresaId,
      flowId: session.flowId,
      id: session.currentNode,
      activo: true
    });

    if (!currentNode) {
      throw new Error(`Nodo ${session.currentNode} no encontrado`);
    }

    // Guardar en historial
    session.history.push({
      nodeId: currentNode.id,
      timestamp: new Date(),
      userInput,
      response: currentNode.message
    });

    // Procesar según tipo de nodo
    let nextNodeId: string | undefined;

    switch (currentNode.type) {
      case 'menu':
        nextNodeId = this.handleMenuNode(currentNode, userInput, session);
        break;

      case 'input':
        nextNodeId = await this.handleInputNode(currentNode, userInput, session);
        break;

      case 'condition':
        nextNodeId = this.handleConditionNode(currentNode, session);
        break;

      default:
        nextNodeId = currentNode.next;
    }

    if (!nextNodeId) {
      return '❌ No se pudo determinar el siguiente paso. Por favor, intenta de nuevo.';
    }

    session.currentNode = nextNodeId;
    return this.processNode(session);
  }

  /**
   * Procesa un nodo y devuelve el mensaje a enviar
   */
  private async processNode(session: NodeSession): Promise<string> {
    const node = await FlowNodeModel.findOne({
      empresaId: session.empresaId,
      flowId: session.flowId,
      id: session.currentNode,
      activo: true
    });

    if (!node) {
      throw new Error(`Nodo ${session.currentNode} no encontrado`);
    }

    // Reemplazar variables en el mensaje
    let message = node.message || '';
    message = this.replaceVariables(message, session.variables);

    // Agregar opciones si es un menú
    if (node.type === 'menu' && node.options && node.options.length > 0) {
      message += '\n\n';
      node.options.forEach((option, index) => {
        message += `${index + 1}. ${option.text}\n`;
      });
    }

    // Ejecutar acción si es un nodo de acción
    if (node.type === 'action' && node.action) {
      await this.executeAction(node, session);
      
      // Avanzar automáticamente al siguiente nodo
      if (node.action.onSuccess) {
        session.currentNode = node.action.onSuccess;
        return this.processNode(session);
      }
    }

    // Si es un nodo de mensaje simple, avanzar automáticamente
    if (node.type === 'message' && node.next) {
      session.currentNode = node.next;
      const nextMessage = await this.processNode(session);
      return `${message}\n\n${nextMessage}`;
    }

    return message;
  }

  /**
   * Maneja nodos de tipo menú
   */
  private handleMenuNode(node: IFlowNode, userInput: string, session: NodeSession): string | undefined {
    if (!node.options || node.options.length === 0) {
      return node.next;
    }

    const input = userInput.trim().toLowerCase();
    
    // Buscar por número (1, 2, 3...)
    const optionIndex = parseInt(input) - 1;
    if (optionIndex >= 0 && optionIndex < node.options.length) {
      const option = node.options[optionIndex];
      if (option.value) {
        session.variables[node.id] = option.value;
      }
      return option.next || node.next;
    }

    // Buscar por texto
    const matchedOption = node.options.find(opt => 
      opt.text.toLowerCase().includes(input) || input.includes(opt.text.toLowerCase())
    );

    if (matchedOption) {
      if (matchedOption.value) {
        session.variables[node.id] = matchedOption.value;
      }
      return matchedOption.next || node.next;
    }

    return undefined;
  }

  /**
   * Maneja nodos de tipo input
   */
  private async handleInputNode(node: IFlowNode, userInput: string, session: NodeSession): Promise<string | undefined> {
    // Validar input
    if (node.validation) {
      const isValid = this.validateInput(userInput, node.validation);
      if (!isValid) {
        return undefined; // Quedarse en el mismo nodo
      }
    }

    // Guardar en variables
    session.variables[node.id] = userInput;

    return node.next;
  }

  /**
   * Maneja nodos de tipo condición
   */
  private handleConditionNode(node: IFlowNode, session: NodeSession): string | undefined {
    if (!node.conditions || node.conditions.length === 0) {
      return node.next;
    }

    for (const condition of node.conditions) {
      if (condition.if) {
        const result = this.evaluateCondition(condition.if, session.variables, condition.operator, condition.value);
        if (result) {
          return condition.next;
        }
      } else if (condition.else) {
        return condition.next;
      }
    }

    return node.next;
  }

  /**
   * Ejecuta una acción (pago, API, etc.)
   */
  private async executeAction(node: IFlowNode, session: NodeSession): Promise<void> {
    if (!node.action) return;

    console.log(`🎬 Ejecutando acción: ${node.action.type}`);

    try {
      switch (node.action.type) {
        case 'create_payment_link':
          await this.executePaymentAction(node, session);
          break;

        case 'api_call':
          await this.executeApiCall(node, session);
          break;

        case 'save_data':
          Object.assign(session.variables, node.action.config);
          console.log('💾 Datos guardados en sesión');
          break;

        default:
          console.log(`⚠️ Acción no implementada: ${node.action.type}`);
      }
    } catch (error: any) {
      console.error(`❌ Error ejecutando acción ${node.action.type}:`, error.message);
      throw error;
    }
  }

  /**
   * Ejecuta acción de pago
   */
  private async executePaymentAction(node: IFlowNode, session: NodeSession): Promise<void> {
    if (!node.action?.config) return;

    console.log('💳 Generando link de pago...');

    // Reemplazar variables en la configuración
    const title = this.replaceVariables(node.action.config.title || 'Pago', session.variables);
    const amount = parseFloat(this.replaceVariables(String(node.action.config.amount || 0), session.variables));
    const description = this.replaceVariables(node.action.config.description || '', session.variables);

    // Obtener empresa
    const empresa = await EmpresaModel.findOne({ nombre: session.empresaId });
    if (!empresa) {
      throw new Error(`Empresa ${session.empresaId} no encontrada`);
    }

    // Generar link de pago
    const result = await generateDynamicPaymentLink({
      empresaId: session.empresaId,
      title,
      amount,
      description
    });
    
    if (!result.success || !result.paymentUrl) {
      throw new Error(result.error || 'No se pudo generar el link de pago');
    }
    
    const paymentLink = result.paymentUrl;

    // Guardar link en variables de sesión
    session.variables.payment_link = paymentLink;
    session.variables.payment_amount = amount;
    session.variables.payment_title = title;

    console.log(`✅ Link de pago generado: ${paymentLink}`);
  }

  /**
   * Ejecuta llamada a API
   */
  private async executeApiCall(node: IFlowNode, session: NodeSession): Promise<void> {
    if (!node.action?.config) return;

    console.log('🌐 Ejecutando llamada API...');

    const { endpoint, params, method } = node.action.config;

    // Reemplazar variables en parámetros
    const processedParams: any = {};
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        processedParams[key] = this.replaceVariables(String(value), session.variables);
      }
    }

    // Obtener empresa
    const empresa = await EmpresaModel.findOne({ nombre: session.empresaId });
    if (!empresa) {
      throw new Error(`Empresa ${session.empresaId} no encontrada`);
    }

    // Buscar configuración de API para la empresa
    const { ApiConfigurationModel } = await import('../modules/integrations/models/index.js');
    const apiConfig = await ApiConfigurationModel.findOne({ 
      empresaId: empresa._id,
      activo: true 
    });
    
    if (!apiConfig) {
      throw new Error(`No se encontró configuración de API para ${session.empresaId}`);
    }
    
    // Ejecutar API
    const result = await apiExecutor.ejecutar(
      apiConfig._id.toString(),
      endpoint,
      processedParams
    );
    
    const response = result.data;

    // Guardar respuesta en variables
    session.variables[`${endpoint}_response`] = response;
    session.variables.api_response = response;

    // Si la respuesta es un array, guardar también
    if (Array.isArray(response)) {
      session.variables.resultados = response;
      session.variables.resultados_count = response.length;
    }

    console.log(`✅ API ejecutada: ${endpoint}`);
  }

  /**
   * Valida input según reglas
   */
  private validateInput(input: string, validation: any): boolean {
    switch (validation.type) {
      case 'text':
        if (validation.min && input.length < validation.min) return false;
        if (validation.max && input.length > validation.max) return false;
        return true;

      case 'number':
        const num = parseFloat(input);
        if (isNaN(num)) return false;
        if (validation.min !== undefined && num < validation.min) return false;
        if (validation.max !== undefined && num > validation.max) return false;
        return true;

      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

      case 'phone':
        return /^\+?[\d\s-()]+$/.test(input);

      case 'regex':
        if (!validation.pattern) return true;
        return new RegExp(validation.pattern).test(input);

      default:
        return true;
    }
  }

  /**
   * Evalúa una condición
   */
  private evaluateCondition(condition: string, variables: Record<string, any>, operator: string = 'eq', value?: any): boolean {
    const varValue = this.getVariableValue(condition, variables);

    switch (operator) {
      case 'eq':
        return varValue == value;
      case 'neq':
        return varValue != value;
      case 'gt':
        return varValue > value;
      case 'lt':
        return varValue < value;
      case 'gte':
        return varValue >= value;
      case 'lte':
        return varValue <= value;
      case 'contains':
        return String(varValue).includes(String(value));
      case 'exists':
        return varValue !== undefined && varValue !== null;
      default:
        return false;
    }
  }

  /**
   * Obtiene valor de variable (soporta dot notation)
   */
  private getVariableValue(path: string, variables: Record<string, any>): any {
    const parts = path.split('.');
    let value: any = variables;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Reemplaza variables en un string
   */
  private replaceVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, varName) => {
      const value = this.getVariableValue(varName, variables);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Limpia sesión de un contacto
   */
  clearSession(empresaId: string, contactId: string): void {
    const sessionKey = `${empresaId}:${contactId}`;
    this.sessions.delete(sessionKey);
  }

  /**
   * Obtiene estado actual de la sesión
   */
  getSessionState(empresaId: string, contactId: string): NodeSession | undefined {
    const sessionKey = `${empresaId}:${contactId}`;
    return this.sessions.get(sessionKey);
  }
}

export const nodeEngine = new NodeEngine();
