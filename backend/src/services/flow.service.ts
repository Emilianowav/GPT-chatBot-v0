import mongoose from 'mongoose';
import { Flow } from '../models/flow.model';
import { ConversationState } from '../models/conversation-state.model';
import { ApiConfiguration } from '../models/api-configuration.model';

export class FlowService {
  async getFlowsByEmpresa(empresaId: string) {
    return await Flow.find({ empresaId, activo: true }).sort({ createdAt: -1 });
  }

  async getFlowById(flowId: string) {
    return await Flow.findById(flowId);
  }

  async createFlow(flowData: any) {
    const flow = new Flow(flowData);
    return await flow.save();
  }

  async updateFlow(flowId: string, flowData: any) {
    return await Flow.findByIdAndUpdate(
      flowId,
      { ...flowData, updatedAt: new Date() },
      { new: true }
    );
  }

  async deleteFlow(flowId: string) {
    return await Flow.findByIdAndUpdate(
      flowId,
      { activo: false, updatedAt: new Date() },
      { new: true }
    );
  }

  async executeFlow(flowId: string, telefono: string, mensaje: string) {
    const flow = await Flow.findById(flowId);
    if (!flow) {
      throw new Error('Flow not found');
    }

    // Obtener o crear conversation state
    let conversationState = await ConversationState.findOne({
      telefono,
      empresaId: flow.empresaId
    });

    if (!conversationState) {
      conversationState = new ConversationState({
        telefono,
        empresaId: flow.empresaId,
        flujo_activo: flowId,
        estado_actual: null,
        variables: {},
        flujos_pendientes: [],
        prioridad: 'normal',
        pausado: false,
        ultima_interaccion: new Date()
      });
      await conversationState.save();
    }

    // Ejecutar nodo actual
    const currentNodeId = conversationState.estado_actual || flow.nodes[0]?.id;
    const currentNode = flow.nodes.find(n => n.id === currentNodeId);

    if (!currentNode) {
      throw new Error('Current node not found');
    }

    // Ejecutar según tipo de nodo
    const result = await this.executeNode(currentNode, conversationState, mensaje);

    // Actualizar conversation state
    conversationState.ultima_interaccion = new Date();
    await conversationState.save();

    return result;
  }

  private async executeNode(node: any, conversationState: any, mensaje: string) {
    switch (node.data.type) {
      case 'input':
        return await this.handleInputNode(node, conversationState, mensaje);
      
      case 'api_call':
        return await this.handleApiCallNode(node, conversationState);
      
      case 'router':
        return await this.handleRouterNode(node, conversationState, mensaje);
      
      default:
        throw new Error(`Unknown node type: ${node.data.type}`);
    }
  }

  private async handleInputNode(node: any, conversationState: any, mensaje: string) {
    const { config } = node.data;
    
    // Validar input
    if (config.validacion) {
      const isValid = this.validateInput(mensaje, config.validacion);
      if (!isValid) {
        return {
          success: false,
          message: config.validacion.mensajeError || 'Input inválido',
          nextNodeId: node.id // Volver a pedir
        };
      }
    }

    // Guardar variable
    if (config.nombreVariable) {
      conversationState.variables = conversationState.variables || {};
      conversationState.variables[config.nombreVariable] = mensaje;
      await conversationState.save();
    }

    return {
      success: true,
      message: config.pregunta,
      nextNodeId: this.getNextNodeId(node, conversationState)
    };
  }

  private async handleApiCallNode(node: any, conversationState: any) {
    const { config } = node.data;
    
    // Obtener API configuration
    const apiConfig = await ApiConfiguration.findById(config.apiConfigId);
    if (!apiConfig) {
      throw new Error('API Configuration not found');
    }

    // Obtener endpoint
    const endpoint = apiConfig.endpoints.find((e: any) => e.id === config.endpointId);
    if (!endpoint) {
      throw new Error('Endpoint not found');
    }

    // Reemplazar variables en parámetros
    const params = this.replaceVariables(config.parametros, conversationState.variables);

    // Ejecutar llamada API
    const response = await this.callApi(apiConfig, endpoint, params);

    // Guardar respuesta en variables
    if (config.nombreVariable) {
      conversationState.variables = conversationState.variables || {};
      conversationState.variables[config.nombreVariable] = response;
      await conversationState.save();
    }

    return {
      success: true,
      data: response,
      nextNodeId: this.getNextNodeId(node, conversationState)
    };
  }

  private async handleRouterNode(node: any, conversationState: any, mensaje: string) {
    const { config } = node.data;
    
    // Encontrar opción que coincida
    const opcion = config.opciones.find((o: any) => o.valor === mensaje);
    
    if (!opcion) {
      return {
        success: false,
        message: 'Opción inválida',
        nextNodeId: node.id
      };
    }

    return {
      success: true,
      nextNodeId: opcion.workflowId || this.getNextNodeId(node, conversationState)
    };
  }

  private validateInput(input: string, validacion: any): boolean {
    switch (validacion.tipo) {
      case 'texto':
        return validacion.requerido ? input.trim().length > 0 : true;
      
      case 'numero':
        const num = parseFloat(input);
        if (isNaN(num)) return false;
        if (validacion.min !== undefined && num < validacion.min) return false;
        if (validacion.max !== undefined && num > validacion.max) return false;
        return true;
      
      case 'opcion':
        return validacion.opciones.includes(input);
      
      default:
        return true;
    }
  }

  private replaceVariables(obj: any, variables: any): any {
    if (typeof obj === 'string') {
      return obj.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        return variables[varName] || match;
      });
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.replaceVariables(item, variables));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.replaceVariables(value, variables);
      }
      return result;
    }
    
    return obj;
  }

  private async callApi(apiConfig: any, endpoint: any, params: any) {
    const url = `${apiConfig.baseUrl}${endpoint.path}`;
    const method = endpoint.method || 'GET';
    
    // Construir headers
    const headers: any = {
      'Content-Type': 'application/json',
      ...apiConfig.headers
    };

    // Agregar autenticación
    if (apiConfig.autenticacion.tipo === 'basic') {
      const { username, password } = apiConfig.autenticacion.configuracion;
      const auth = Buffer.from(`${username}:${password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    // Ejecutar request
    const options: any = {
      method,
      headers
    };

    if (method === 'GET') {
      const queryString = new URLSearchParams(params).toString();
      const fullUrl = `${url}?${queryString}`;
      const response = await fetch(fullUrl, options);
      return await response.json();
    } else {
      options.body = JSON.stringify(params);
      const response = await fetch(url, options);
      return await response.json();
    }
  }

  private getNextNodeId(currentNode: any, conversationState: any): string | null {
    // Implementar lógica para obtener siguiente nodo
    // Por ahora retorna null
    return null;
  }
}
