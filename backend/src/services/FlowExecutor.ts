import { FlowModel } from '../models/Flow.js';
import { obtenerRespuestaChat } from './openaiService.js';
import { enviarMensajeWhatsAppTexto } from './metaService.js';
import type { ChatCompletionMessageParam } from './openaiService.js';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { GPTPromptBuilder } from './GPTPromptBuilder.js';
import type { IGPTConversacionalConfig } from '../types/gpt-config.types.js';
import { createWooCommerceService } from './woocommerceService.js';

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
  private flowConfig: Record<string, any> = {}; // Configuraciones técnicas de nodos fuente
  private contactoId?: string;
  private historialConversacion: string[] = [];

  /**
   * Guarda una variable global
   */
  setGlobalVariable(key: string, value: any): void {
    this.globalVariables[key] = value;
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
   * Detecta nodos fuente y guarda sus configuraciones técnicas
   */
  private detectSourceNodes(nodes: any[]): void {
    console.log('🔍 [FLOW CONFIG] Detectando nodos fuente...');
    
    // Detectar WhatsApp Watch Events (trigger)
    const whatsappTrigger = nodes.find(n => 
      n.type === 'whatsapp' && 
      n.data?.config?.module === 'watch-events'
    );
    
    if (whatsappTrigger) {
      const config = whatsappTrigger.data.config;
      this.flowConfig.whatsapp = {
        phoneNumberId: config.phoneNumberId,
        verifyToken: config.verifyToken
      };
      console.log(`   ✅ WhatsApp configurado:`);
      console.log(`      Phone Number ID: ${config.phoneNumberId}`);
      console.log(`      Verify Token: ${config.verifyToken}`);
    }
    
    // Detectar primer nodo WooCommerce con conexión
    const wooCommerceSource = nodes.find(n => 
      n.type === 'woocommerce' && n.data?.config?.connection
    );
    
    if (wooCommerceSource) {
      const connection = wooCommerceSource.data.config.connection;
      this.flowConfig.woocommerce = connection;
      console.log(`   ✅ WooCommerce configurado:`);
      console.log(`      Eshop URL: ${connection.eshopUrl}`);
      console.log(`      Consumer Key: ${connection.consumerKey.substring(0, 10)}...`);
    }
    
    console.log('');
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

      // 2. Detectar y guardar configuraciones técnicas de nodos fuente
      this.detectSourceNodes(flow.nodes);

      if (!flow.nodes || !flow.edges) {
        throw new Error(`Flujo ${flowId} no tiene nodos o edges`);
      }

      console.log(`📊 Flujo: ${flow.nombre} (${flow.nodes.length} nodos, ${flow.edges.length} edges)`);

      // 2. Inicializar contexto con datos del trigger
      this.context = {
        '1': {
          output: triggerData,
        },
      };

      // 3. Encontrar nodo trigger
      const triggerNode = flow.nodes.find((n: any) => n.category === 'trigger');
      
      if (!triggerNode) {
        console.error('❌ NO SE ENCONTRÓ NODO TRIGGER');
        throw new Error('No se encontró nodo trigger en el flujo');
      }

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

        console.log(`🔄 ${executionCount}. ${nextNode.data.label}`);

        // Ejecutar nodo
        try {
          const result = await this.executeNode(nextNode, nextEdge);
          this.context[nextNode.id] = result;
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
      
      case 'woocommerce':
        return await this.executeWooCommerceNode(node, input);
      
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
      systemPrompt = GPTPromptBuilder.buildSystemPrompt(config);
    } else {
      // Fallback: usar systemPrompt legacy
      systemPrompt = config.systemPrompt || 'Eres un asistente útil.';
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

    console.log(`   ✅ ${resultado.tokens} tokens`);

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
      // Extraer variables de la respuesta del GPT (ahora es async)
      const variablesExtraidas = await GPTPromptBuilder.extractVariables(
        resultado.texto,
        config.variablesRecopilar
      );
      
      // Guardar cada variable extraída en variables globales
      for (const [nombre, valor] of Object.entries(variablesExtraidas)) {
        if (valor !== undefined && valor !== null && valor !== '') {
          this.setGlobalVariable(nombre, valor);
          output[nombre] = valor;
        }
      }
      
      // Validar si todas las variables obligatorias están completas
      const todasLasGlobales = this.getAllGlobalVariables();
      const validacion = GPTPromptBuilder.validateVariables(
        todasLasGlobales,
        config.variablesRecopilar
      );
      
      output.variables_completas = validacion.valido;
      output.variables_faltantes = validacion.faltantes;
      
      if (Object.keys(variablesExtraidas).length > 0) {
        console.log(`   📝 Variables: ${Object.keys(variablesExtraidas).join(', ')}`);
      }
    }

    // Detectar si el GPT marcó como completado
    if (config.accionesCompletado && config.accionesCompletado.length > 0) {
      const accionMarcar = config.accionesCompletado.find(a => a.tipo === 'marcar_completado');
      if (accionMarcar && accionMarcar.token) {
        const completado = GPTPromptBuilder.isCompletado(resultado.texto, accionMarcar.token);
        output.info_completa = completado;
        if (completado) {
          console.log(`   ✅ Info completa`);
        }
      }
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

    // Resolver variables en el mensaje
    const mensaje = this.resolveVariableInString(config.message || input.message);
    const telefono = this.resolveVariableInString(config.to || input.to || input.telefono_usuario);

    // Usar phoneNumberId del flowConfig si no está especificado en el nodo
    const phoneNumberId = config.phoneNumberId || 
                         this.flowConfig.whatsapp?.phoneNumberId || 
                         process.env.META_PHONE_NUMBER_ID || '';

    console.log(`   → ${telefono}`);

    // Enviar mensaje
    await enviarMensajeWhatsAppTexto(
      telefono,
      mensaje,
      phoneNumberId
    );

    return {
      output: {
        status: 'sent',
        to: telefono,
      },
    };
  }

  /**
   * Ejecuta un nodo WooCommerce
   */
  private async executeWooCommerceNode(node: any, input: any): Promise<NodeExecutionResult> {
    const config = node.data.config;
    
    console.log(`   🛍️  Módulo WooCommerce: ${config.module}`);
    
    // Obtener conexión (del nodo o del flowConfig)
    const connection = config.connection || this.flowConfig.woocommerce;
    
    if (!connection) {
      throw new Error('No hay conexión de WooCommerce configurada');
    }
    
    if (!config.connection && this.flowConfig.woocommerce) {
      console.log(`   🔗 Usando conexión del nodo fuente`);
    }
    
    // Crear servicio WooCommerce
    const wooService = createWooCommerceService(connection);
    
    // Resolver variables en params (soporta {{variable}} y referencias directas)
    const params: Record<string, any> = {};
    for (const [key, value] of Object.entries(config.params || {})) {
      const stringValue = String(value);
      // Si tiene formato {{variable}}, usar resolveVariableInString
      if (stringValue.includes('{{')) {
        params[key] = this.resolveVariableInString(stringValue);
      } else {
        // Si no, intentar resolver como referencia directa
        params[key] = this.getVariableValue(stringValue) || stringValue;
      }
    }
    
    console.log(`   📦 Parámetros:`, JSON.stringify(params).substring(0, 100) + '...');
    
    // Ejecutar módulo específico
    let result: any;
    
    try {
      switch (config.module) {
        case 'get-product':
          result = await wooService.getProduct(params.productId);
          break;
        
        case 'search-product':
          result = await wooService.searchProducts({
            search: params.search,
            category: params.category,
            limit: params.limit,
            orderBy: params.orderBy
          });
          break;
        
        case 'create-order':
          result = await wooService.createOrder({
            customerId: params.customerId,
            productId: params.productId,
            quantity: parseInt(params.quantity) || 1,
            customerPhone: params.customerPhone,
            customerName: params.customerName,
            customerEmail: params.customerEmail
          });
          break;
        
        case 'get-customer':
          result = await wooService.getCustomer(params.customerId);
          break;
        
        case 'search-customer':
          result = await wooService.searchCustomers({
            search: params.search,
            email: params.email,
            limit: params.limit
          });
          break;
        
        default:
          throw new Error(`Módulo WooCommerce no soportado: ${config.module}`);
      }
      
      console.log(`   ✅ Módulo ejecutado exitosamente`);
      
      return { output: result };
      
    } catch (error: any) {
      console.error(`   ❌ Error en módulo WooCommerce:`, error.message);
      throw error;
    }
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

    console.log(`      🔍 evaluateCondition - tipo: ${typeof condition}, valor: ${JSON.stringify(condition)?.substring(0, 100)}`);

    // Si la condición es un string, parsearla
    if (typeof condition === 'string') {
      console.log(`      ✅ Detectado string, llamando evaluateStringCondition`);
      return this.evaluateStringCondition(condition);
    }

    // Si es un objeto, usar formato estructurado
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
   * Evalúa una condición en formato string
   * Ejemplos: "{{titulo_libro}} exists", "{{titulo_libro}} empty", "true", "false"
   */
  private evaluateStringCondition(condition: string): boolean {
    // Resolver variables en la condición
    const resolvedCondition = this.resolveVariableInString(condition);
    
    console.log(`      Condición: ${condition}`);
    console.log(`      Resuelta: ${resolvedCondition}`);

    // Casos especiales
    if (resolvedCondition === 'true') return true;
    if (resolvedCondition === 'false') return false;

    // Parsear condiciones tipo "{{variable}} exists/empty"
    const existsMatch = resolvedCondition.match(/^(.+?)\s+exists$/i);
    if (existsMatch) {
      const value = existsMatch[1].trim();
      const exists = value !== '' && value !== 'undefined' && value !== 'null';
      console.log(`      → exists: ${exists}`);
      return exists;
    }

    const emptyMatch = resolvedCondition.match(/^(.+?)\s+empty$/i);
    if (emptyMatch) {
      const value = emptyMatch[1].trim();
      const empty = value === '' || value === 'undefined' || value === 'null';
      console.log(`      → empty: ${empty}`);
      return empty;
    }

    // Si no coincide con ningún patrón, evaluar como booleano
    return !!resolvedCondition && resolvedCondition !== 'false';
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
