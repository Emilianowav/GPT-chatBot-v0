import { FlowModel } from '../models/Flow.js';
import { obtenerRespuestaChat } from './openaiService.js';
import { enviarMensajeWhatsAppTexto } from './metaService.js';
import type { ChatCompletionMessageParam } from './openaiService.js';

interface FlowContext {
  [nodeId: string]: {
    input?: any;
    output?: any;
    error?: string;
  };
}

interface NodeExecutionResult {
  output: any;
  error?: string;
}

export class FlowExecutor {
  private context: FlowContext = {};

  /**
   * Ejecuta un flujo visual completo
   */
  async execute(flowId: string, triggerData: any): Promise<FlowContext> {
    try {
      console.log(`🚀 Ejecutando flujo: ${flowId}`);
      
      // 1. Cargar flujo de BD
      const flow = await FlowModel.findById(flowId);
      if (!flow) {
        throw new Error(`Flujo ${flowId} no encontrado`);
      }

      if (!flow.nodes || !flow.edges) {
        throw new Error(`Flujo ${flowId} no tiene nodos o edges`);
      }

      console.log(`📊 Flujo cargado: ${flow.nombre}`);
      console.log(`   Nodos: ${flow.nodes.length}`);
      console.log(`   Edges: ${flow.edges.length}`);

      // 🔍 DEBUG: Logear estructura completa de nodos
      console.log('\n🔍 DEBUG - Estructura de nodos:');
      flow.nodes.forEach((node: any, index: number) => {
        console.log(`   Nodo ${index + 1}:`);
        console.log(`      id: ${node.id}`);
        console.log(`      type: ${node.type}`);
        console.log(`      category: ${node.category || '❌ UNDEFINED'}`);
        console.log(`      data.label: ${node.data?.label || 'N/A'}`);
      });

      // 2. Inicializar contexto con datos del trigger
      this.context = {
        '1': {
          output: triggerData,
        },
      };

      // 3. Encontrar nodo trigger
      console.log('\n🔍 Buscando nodo con category === "trigger"...');
      const triggerNode = flow.nodes.find((n: any) => n.category === 'trigger');
      
      if (!triggerNode) {
        console.error('❌ NO SE ENCONTRÓ NODO TRIGGER');
        console.error('   Nodos disponibles:', flow.nodes.map((n: any) => ({
          id: n.id,
          category: n.category,
          type: n.type
        })));
        throw new Error('No se encontró nodo trigger en el flujo');
      }

      console.log(`✅ Trigger encontrado: ${triggerNode.id}`);

      // 4. Ejecutar nodos secuencialmente siguiendo los edges
      let currentNodeId = triggerNode.id;
      let executionCount = 0;
      const maxExecutions = 20; // Prevenir loops infinitos

      while (currentNodeId && executionCount < maxExecutions) {
        executionCount++;

        // Buscar siguiente edge
        const nextEdge = flow.edges.find((e: any) => e.source === currentNodeId);
        if (!nextEdge) {
          console.log(`✅ Fin del flujo (no hay más edges desde ${currentNodeId})`);
          break;
        }

        // Buscar siguiente nodo
        const nextNode = flow.nodes.find((n: any) => n.id === nextEdge.target);
        if (!nextNode) {
          console.error(`❌ Nodo ${nextEdge.target} no encontrado`);
          break;
        }

        console.log(`\n🔄 Ejecutando nodo ${executionCount}: ${nextNode.data.label} (${nextNode.type})`);

        // Ejecutar nodo
        try {
          const result = await this.executeNode(nextNode, nextEdge);
          this.context[nextNode.id] = result;
          console.log(`✅ Nodo ejecutado exitosamente`);
        } catch (error: any) {
          console.error(`❌ Error ejecutando nodo ${nextNode.id}:`, error.message);
          this.context[nextNode.id] = {
            output: null,
            error: error.message,
          };
          break; // Detener ejecución en caso de error
        }

        currentNodeId = nextNode.id;
      }

      if (executionCount >= maxExecutions) {
        console.warn(`⚠️  Flujo detenido: máximo de ${maxExecutions} ejecuciones alcanzado`);
      }

      console.log(`\n✅ Flujo completado. Nodos ejecutados: ${executionCount}`);
      return this.context;

    } catch (error: any) {
      console.error('❌ Error ejecutando flujo:', error);
      throw error;
    }
  }

  /**
   * Ejecuta un nodo específico según su tipo
   */
  private async executeNode(node: any, edge: any): Promise<NodeExecutionResult> {
    // Preparar input resolviendo variables del edge mapping
    const input = this.resolveVariables(edge.data?.mapping || {});

    switch (node.type) {
      case 'gpt':
        return await this.executeGPTNode(node, input);
      
      case 'whatsapp':
        return await this.executeWhatsAppNode(node, input);
      
      case 'router':
        return await this.executeRouterNode(node, input);
      
      default:
        console.warn(`⚠️  Tipo de nodo no soportado: ${node.type}`);
        return { output: input };
    }
  }

  /**
   * Ejecuta un nodo GPT (Conversacional, Formateador, Procesador, Transform)
   */
  private async executeGPTNode(node: any, input: any): Promise<NodeExecutionResult> {
    const config = node.data.config;
    
    console.log(`   Tipo GPT: ${config.tipo}`);
    console.log(`   Modelo: ${config.modelo}`);
    console.log(`   Input:`, JSON.stringify(input).substring(0, 100) + '...');

    // Construir mensajes para GPT
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: config.systemPrompt || 'Eres un asistente útil.',
      },
      {
        role: 'user',
        content: input.mensaje_usuario || input.message || JSON.stringify(input),
      },
    ];

    // Llamar a OpenAI
    const resultado = await obtenerRespuestaChat({
      modelo: config.modelo || 'gpt-4',
      historial: messages,
    });

    console.log(`   Respuesta GPT: ${resultado.texto.substring(0, 100)}...`);
    console.log(`   Tokens: ${resultado.tokens}, Costo: $${resultado.costo}`);

    // Preparar output según tipo de GPT
    const output: any = {
      respuesta_gpt: resultado.texto,
      tokens: resultado.tokens,
      costo: resultado.costo,
    };

    // Si es tipo transform, intentar parsear JSON
    if (config.tipo === 'transform' && config.outputFormat === 'json') {
      try {
        output.datos_estructurados = JSON.parse(resultado.texto);
      } catch (e) {
        console.warn('⚠️  No se pudo parsear respuesta como JSON');
        output.datos_estructurados = null;
      }
    }

    return { output };
  }

  /**
   * Ejecuta un nodo WhatsApp (Send Message)
   */
  private async executeWhatsAppNode(node: any, input: any): Promise<NodeExecutionResult> {
    const config = node.data.config;

    // Solo ejecutar si es send-message
    if (config.module !== 'send-message') {
      console.log(`   Módulo WhatsApp: ${config.module} (skip)`);
      return { output: input };
    }

    console.log(`   Enviando mensaje de WhatsApp`);
    
    // Resolver variables en el mensaje
    const mensaje = this.resolveVariableInString(config.message || input.message);
    const telefono = this.resolveVariableInString(config.to || input.to || input.telefono_usuario);

    console.log(`   To: ${telefono}`);
    console.log(`   Message: ${mensaje.substring(0, 100)}...`);

    // Enviar mensaje
    const resultado = await enviarMensajeWhatsAppTexto(
      telefono,
      mensaje,
      config.phoneNumberId || process.env.META_PHONE_NUMBER_ID || ''
    );

    console.log(`   Mensaje enviado. ID: ${resultado.messageId}`);

    return {
      output: {
        message_id: resultado.messageId,
        status: 'sent',
        to: telefono,
      },
    };
  }

  /**
   * Ejecuta un nodo Router (evalúa condiciones)
   */
  private async executeRouterNode(node: any, input: any): Promise<NodeExecutionResult> {
    const config = node.data.config;
    
    console.log(`   Evaluando condiciones del router`);

    // Por ahora, simplemente pasa el input al output
    // TODO: Implementar evaluación de condiciones
    
    return { output: input };
  }

  /**
   * Resuelve variables en un objeto mapping
   * Ejemplo: { 'mensaje_usuario': '1.message' } → { 'mensaje_usuario': 'Hola' }
   */
  private resolveVariables(mapping: Record<string, string>): any {
    const resolved: any = {};

    for (const [key, varPath] of Object.entries(mapping)) {
      resolved[key] = this.getVariableValue(varPath);
    }

    return resolved;
  }

  /**
   * Obtiene el valor de una variable del contexto
   * Ejemplo: '1.message' → context['1'].output.message
   */
  private getVariableValue(varPath: string): any {
    const parts = varPath.split('.');
    const nodeId = parts[0];
    const path = parts.slice(1);

    let value = this.context[nodeId]?.output;

    for (const part of path) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Resuelve variables en un string
   * Ejemplo: "Hola {{1.message}}" → "Hola mundo"
   */
  private resolveVariableInString(str: string): string {
    if (!str) return '';

    return str.replace(/\{\{([^}]+)\}\}/g, (match, varPath) => {
      const value = this.getVariableValue(varPath.trim());
      return value !== undefined ? String(value) : match;
    });
  }
}
