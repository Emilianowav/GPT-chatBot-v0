import { FlowModel } from '../models/Flow.js';
import { obtenerRespuestaChat } from './openaiService.js';
import { enviarMensajeWhatsAppTexto } from './metaService.js';
import type { ChatCompletionMessageParam } from './openaiService.js';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { GPTPromptBuilder } from './GPTPromptBuilder.js';
import type { IGPTConversacionalConfig } from '../types/gpt-config.types.js';

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
  private globalVariables: Record<string, any> = {};
  private contactoId?: string;
  private historialConversacion: string[] = [];

  /**
   * Guarda una variable global
   */
  setGlobalVariable(key: string, value: any): void {
    this.globalVariables[key] = value;
    console.log(`🌐 [GLOBAL] ${key} = ${JSON.stringify(value).substring(0, 100)}`);
  }

  /**
   * Obtiene una variable global
   */
  getGlobalVariable(key: string): any {
    return this.globalVariables[key];
  }

  /**
   * Obtiene todas las variables globales
   */
  getAllGlobalVariables(): Record<string, any> {
    return { ...this.globalVariables };
  }

  /**
   * Carga el historial de conversación del contacto
   */
  private async loadHistorial(contactoId: string): Promise<void> {
    try {
      const contacto = await ContactoEmpresaModel.findById(contactoId);
      if (contacto && contacto.conversaciones?.historial) {
        this.historialConversacion = contacto.conversaciones.historial;
        console.log(`📚 [HISTORIAL] Cargado: ${this.historialConversacion.length} mensajes`);
      }
    } catch (error) {
      console.warn('⚠️  Error cargando historial:', error);
      this.historialConversacion = [];
    }
  }

  /**
   * Guarda un mensaje en el historial del contacto
   */
  private async saveToHistorial(mensaje: string): Promise<void> {
    if (!this.contactoId) return;
    
    try {
      const { actualizarHistorialConversacion } = await import('./contactoService.js');
      await actualizarHistorialConversacion(this.contactoId, mensaje);
      this.historialConversacion.push(mensaje);
    } catch (error) {
      console.warn('⚠️  Error guardando en historial:', error);
    }
  }

  /**
   * Ejecuta un flujo visual completo
   */
  async execute(flowId: string, triggerData: any, contactoId?: string): Promise<FlowContext> {
    this.contactoId = contactoId;
    
    // Cargar historial de conversación si hay contactoId
    if (contactoId) {
      await this.loadHistorial(contactoId);
    }
    try {
      console.log(`🚀 Ejecutando flujo: ${flowId}`);
      
      // 1. Cargar flujo de BD
      const flow = await FlowModel.findById(flowId).lean(); // ← USAR .lean() para obtener objeto plano
      if (!flow) {
        throw new Error(`Flujo ${flowId} no encontrado`);
      }

      if (!flow.nodes || !flow.edges) {
        throw new Error(`Flujo ${flowId} no tiene nodos o edges`);
      }

      console.log(`📊 Flujo cargado: ${flow.nombre}`);
      console.log(`   Nodos: ${flow.nodes.length}`);
      console.log(`   Edges: ${flow.edges.length}`);
      
      // 🔍 DEBUG: Ver objeto completo del primer nodo
      console.log('\n🔍 DEBUG - Primer nodo RAW:', JSON.stringify(flow.nodes[0], null, 2));

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

        // Buscar siguiente edge(s)
        const possibleEdges = flow.edges.filter((e: any) => e.source === currentNodeId);
        
        if (possibleEdges.length === 0) {
          console.log(`✅ Fin del flujo (no hay más edges desde ${currentNodeId})`);
          break;
        }

        // Si hay múltiples edges (Router), elegir según _routerPath
        let nextEdge;
        if (possibleEdges.length > 1) {
          const routerPath = this.context[currentNodeId]?.output?._routerPath;
          console.log(`   🔀 Router detectado. Ruta elegida: ${routerPath || 'default'}`);
          
          // Buscar edge que coincida con la ruta
          nextEdge = possibleEdges.find((e: any) => 
            e.data?.routeId === routerPath || 
            e.id.includes(routerPath)
          );
          
          // Si no encuentra, usar el primero (fallback)
          if (!nextEdge) {
            console.log(`   ⚠️  No se encontró edge para ruta ${routerPath}, usando fallback`);
            nextEdge = possibleEdges[0];
          }
        } else {
          nextEdge = possibleEdges[0];
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
    const config = node.data.config as IGPTConversacionalConfig;
    
    console.log(`   Tipo GPT: ${config.tipo}`);
    console.log(`   Modelo: ${config.modelo}`);
    console.log(`   Input:`, JSON.stringify(input).substring(0, 100) + '...');

    let userMessage: string;
    
    // Determinar contenido del mensaje según tipo de GPT
    if (config.tipo === 'transform') {
      // Para transform, pasar todo el input como contexto
      userMessage = typeof input === 'string' ? input : JSON.stringify(input, null, 2);
    } else {
      // Para conversacional, usar el mensaje del usuario
      userMessage = input.mensaje_usuario || input.message || JSON.stringify(input);
    }

    // NUEVO: Construir systemPrompt dinámico desde los 3 bloques
    let systemPrompt: string;
    if (config.personalidad || config.topicos || config.variablesRecopilar) {
      console.log(`\n   🔧 [PROMPT] Construyendo desde bloques dinámicos...`);
      console.log(`   Personalidad: ${config.personalidad ? '✅' : '❌'}`);
      console.log(`   Tópicos: ${config.topicos?.length || 0}`);
      console.log(`   Variables: ${config.variablesRecopilar?.length || 0}`);
      console.log(`   Acciones: ${config.accionesCompletado?.length || 0}`);
      
      systemPrompt = GPTPromptBuilder.buildSystemPrompt(config);
      
      console.log(`   📝 Prompt generado: ${systemPrompt.length} caracteres`);
      console.log(`   📄 Preview del prompt:\n${systemPrompt.substring(0, 300)}...\n`);
    } else {
      // Fallback: usar systemPrompt legacy
      systemPrompt = config.systemPrompt || 'Eres un asistente útil.';
      console.log(`   📝 Usando systemPrompt legacy (${systemPrompt.length} caracteres)`);
    }

    // Construir mensajes para GPT
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Resolver variables globales en el systemPrompt
    const systemPromptResolved = this.resolveVariableInString(systemPrompt);
    messages[0].content = systemPromptResolved;

    // Si es conversacional, agregar historial completo
    if (config.tipo === 'conversacional' && this.historialConversacion.length > 0) {
      console.log(`   📚 Agregando historial: ${this.historialConversacion.length} mensajes`);
      
      // Agregar historial (alternando user/assistant)
      for (let i = 0; i < this.historialConversacion.length; i++) {
        const msg = this.historialConversacion[i];
        const role = i % 2 === 0 ? 'user' : 'assistant';
        messages.push({
          role: role as 'user' | 'assistant',
          content: msg,
        });
      }
    }

    // Agregar mensaje actual
    messages.push({
      role: 'user',
      content: userMessage,
    });

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
        const jsonMatch = resultado.texto.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : resultado.texto;
        output.datos_estructurados = JSON.parse(jsonString);
        console.log(`   ✅ JSON parseado:`, output.datos_estructurados);
      } catch (e) {
        console.warn('⚠️  No se pudo parsear respuesta como JSON');
        console.warn('   Respuesta:', resultado.texto);
        output.datos_estructurados = null;
      }
    }

    // Guardar en historial si es conversacional
    if (config.tipo === 'conversacional') {
      await this.saveToHistorial(userMessage);
      await this.saveToHistorial(resultado.texto);
    }

    // NUEVO: Procesar variables recopiladas automáticamente
    if (config.variablesRecopilar && config.variablesRecopilar.length > 0) {
      console.log(`\n   🔍 [VARIABLES] Procesando recopilación automática...`);
      console.log(`   Variables configuradas: ${config.variablesRecopilar.map(v => v.nombre).join(', ')}`);
      
      // Extraer variables de la respuesta del GPT (ahora es async)
      const variablesExtraidas = await GPTPromptBuilder.extractVariables(
        resultado.texto,
        config.variablesRecopilar
      );
      
      console.log(`   📦 Variables extraídas por GPT: ${Object.keys(variablesExtraidas).length}`);
      
      // Guardar cada variable extraída en variables globales
      for (const [nombre, valor] of Object.entries(variablesExtraidas)) {
        if (valor !== undefined && valor !== null && valor !== '') {
          console.log(`   💾 Guardando global: ${nombre} = ${JSON.stringify(valor)}`);
          this.setGlobalVariable(nombre, valor);
          output[nombre] = valor;
        }
      }
      
      // Mostrar estado actual de variables globales
      const todasLasGlobales = this.getAllGlobalVariables();
      console.log(`   🌐 Variables globales actuales:`, JSON.stringify(todasLasGlobales, null, 2));
      
      // Validar si todas las variables obligatorias están completas
      const validacion = GPTPromptBuilder.validateVariables(
        todasLasGlobales,
        config.variablesRecopilar
      );
      
      output.variables_completas = validacion.valido;
      output.variables_faltantes = validacion.faltantes;
      
      console.log(`   ✅ Variables extraídas: ${Object.keys(variablesExtraidas).length}`);
      console.log(`   📊 Validación completa: ${validacion.valido ? '✅ SÍ' : '❌ NO'}`);
      if (!validacion.valido) {
        console.log(`   ⚠️  Variables faltantes: ${validacion.faltantes.join(', ')}`);
      }
      console.log(''); // Línea en blanco para separar
    }

    // Detectar si el GPT marcó como completado
    if (config.accionesCompletado && config.accionesCompletado.length > 0) {
      console.log(`\n   🎯 [COMPLETADO] Verificando token de completado...`);
      const accionMarcar = config.accionesCompletado.find(a => a.tipo === 'marcar_completado');
      if (accionMarcar && accionMarcar.token) {
        console.log(`   Buscando token: "${accionMarcar.token}"`);
        const completado = GPTPromptBuilder.isCompletado(resultado.texto, accionMarcar.token);
        output.info_completa = completado;
        console.log(`   ${completado ? '✅ ENCONTRADO' : '⏳ NO ENCONTRADO'} - Info completa: ${completado}`);
        
        if (completado) {
          console.log(`   🎉 Recopilación completada exitosamente`);
        }
      } else {
        console.log(`   ⚠️  No hay token de completado configurado`);
      }
      console.log(''); // Línea en blanco
    }

    // Guardar variables globales si están configuradas (legacy)
    if (config.globalVariablesOutput && Array.isArray(config.globalVariablesOutput)) {
      for (const globalVar of config.globalVariablesOutput) {
        // Intentar extraer del output
        if (output[globalVar] !== undefined) {
          this.setGlobalVariable(globalVar, output[globalVar]);
        } else if (output.datos_estructurados && output.datos_estructurados[globalVar] !== undefined) {
          this.setGlobalVariable(globalVar, output.datos_estructurados[globalVar]);
        }
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
    console.log(`   Rutas configuradas: ${config.routes?.length || 0}`);

    // Si no hay rutas configuradas, usar ruta por defecto
    if (!config.routes || config.routes.length === 0) {
      console.log(`   ⚠️  No hay rutas configuradas, usando ruta por defecto`);
      return { 
        output: { 
          ...input, 
          _routerPath: 'default' 
        } 
      };
    }

    // Evaluar cada ruta en orden
    for (const route of config.routes) {
      console.log(`   🔍 Evaluando ruta: ${route.label || route.id}`);
      
      const conditionMet = this.evaluateCondition(route.condition, input);
      
      if (conditionMet) {
        console.log(`   ✅ Condición cumplida: ${route.label || route.id}`);
        return { 
          output: { 
            ...input, 
            _routerPath: route.id,
            _routerLabel: route.label 
          } 
        };
      }
    }

    // Si ninguna condición se cumple, usar ruta fallback
    console.log(`   ⚠️  Ninguna condición cumplida, usando ruta fallback`);
    return { 
      output: { 
        ...input, 
        _routerPath: 'fallback' 
      } 
    };
  }

  /**
   * Evalúa una condición del router
   */
  private evaluateCondition(condition: any, input: any): boolean {
    if (!condition) return false;

    const { field, operator, value } = condition;
    
    // Resolver el valor del campo (puede ser una variable como "gpt-conversacional.respuesta_gpt")
    const fieldValue = this.getVariableValue(field);
    
    console.log(`      Campo: ${field} = ${JSON.stringify(fieldValue)?.substring(0, 50)}...`);
    console.log(`      Operador: ${operator}`);
    console.log(`      Valor esperado: ${value}`);

    switch (operator) {
      case 'contains':
        return String(fieldValue || '').toLowerCase().includes(String(value).toLowerCase());
      
      case 'not_contains':
        return !String(fieldValue || '').toLowerCase().includes(String(value).toLowerCase());
      
      case 'equal':
        return fieldValue === value;
      
      case 'not_equal':
        return fieldValue !== value;
      
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      
      case 'less_than':
        return Number(fieldValue) < Number(value);
      
      case 'is_empty':
        return !fieldValue || String(fieldValue).trim() === '';
      
      case 'not_empty':
        return !!fieldValue && String(fieldValue).trim() !== '';
      
      case 'regex':
        try {
          const regex = new RegExp(value);
          return regex.test(String(fieldValue || ''));
        } catch (e) {
          console.warn(`      ⚠️  Regex inválido: ${value}`);
          return false;
        }
      
      default:
        console.warn(`      ⚠️  Operador desconocido: ${operator}`);
        return false;
    }
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
   * Obtiene el valor de una variable del contexto o variables globales
   * Ejemplo: '1.message' → context['1'].output.message
   * Ejemplo: 'global.titulo' → globalVariables['titulo']
   */
  private getVariableValue(varPath: string): any {
    // Soporte para variables globales
    if (varPath.startsWith('global.')) {
      const globalKey = varPath.substring(7); // Remover 'global.'
      return this.getGlobalVariable(globalKey);
    }

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
   * Resuelve una variable en un string (reemplaza {{variable}} con su valor)
   * Soporta fallbacks: {{variable || "default"}}
   */
  private resolveVariableInString(str: string): string {
    if (!str) return '';

    // Buscar todas las variables en el formato {{variable}} o {{variable || "default"}}
    const regex = /\{\{([^}]+)\}\}/g;
    
    return str.replace(regex, (match, expression) => {
      expression = expression.trim();
      
      // Verificar si hay operador de fallback ||
      if (expression.includes('||')) {
        const parts = expression.split('||').map(p => p.trim());
        const varPath = parts[0];
        let fallback = parts[1];
        
        // Remover comillas del fallback si existen
        if (fallback.startsWith('"') && fallback.endsWith('"')) {
          fallback = fallback.slice(1, -1);
        } else if (fallback.startsWith("'") && fallback.endsWith("'")) {
          fallback = fallback.slice(1, -1);
        }
        
        const value = this.getVariableValue(varPath);
        return value !== undefined && value !== null && value !== '' ? String(value) : fallback;
      }
      
      // Sin fallback, comportamiento normal
      const value = this.getVariableValue(expression);
      return value !== undefined && value !== null && value !== '' ? String(value) : match;
    });
  }
}
