import { FlowModel } from '../models/Flow.js';
import { obtenerRespuestaChat } from './openaiService.js';
import { enviarMensajeWhatsAppTexto } from './metaService.js';
import type { ChatCompletionMessageParam } from './openaiService.js';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { GPTPromptBuilder } from './GPTPromptBuilder.js';
import type { IGPTConversacionalConfig } from '../types/gpt-config.types.js';
import { createWooCommerceService } from './woocommerceService.js';
import { executeCarritoNode, executeMercadoPagoNode } from './FlowExecutor.carrito.js';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';

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

/**
 * Formato estándar de producto WooCommerce simplificado
 */
interface WooCommerceProductSimplified {
  id: number;
  name: string;
  price: string;
  regular_price?: string;
  sale_price?: string;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  permalink: string;
  image?: string;
  sku?: string;
  categories?: Array<{ id: number; name: string }>;
  on_sale?: boolean;
}

export class FlowExecutor {
  private context: FlowContext = {};
  private globalVariables: Record<string, any> = {};
  private flowConfig: Record<string, any> = {}; // Configuraciones técnicas de nodos fuente
  private contactoId?: string;
  private historialConversacion: string[] = [];
  private flow: any; // Flujo actual en ejecución

  /**
   * Normaliza un producto de WooCommerce al formato estándar simplificado
   * Esto asegura que GPT siempre reciba la misma estructura, sin importar qué módulo se use
   */
  private normalizeWooCommerceProduct(product: any): WooCommerceProductSimplified {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      stock_status: product.stock_status || 'outofstock',
      stock_quantity: product.stock_quantity ?? null,
      permalink: product.permalink,
      image: product.images?.[0]?.src || product.image,
      sku: product.sku,
      categories: product.categories?.map((cat: any) => ({
        id: cat.id,
        name: cat.name
      })),
      on_sale: product.on_sale || false
    };
  }

  /**
   * Normaliza respuesta de WooCommerce (array o single product)
   */
  private normalizeWooCommerceResponse(data: any): any {
    if (Array.isArray(data)) {
      return data.map(product => this.normalizeWooCommerceProduct(product));
    } else if (data && typeof data === 'object' && data.id) {
      return this.normalizeWooCommerceProduct(data);
    }
    return data;
  }

  /**
   * Aplica mapeo de campos personalizado a la respuesta de la API
   */
  private applyOutputMapping(data: any, fieldMappings: any[]): any {
    const mapObject = (obj: any) => {
      const mapped: any = {};
      for (const mapping of fieldMappings) {
        const value = obj[mapping.source];
        if (value !== undefined) {
          mapped[mapping.target] = value;
        }
      }
      return mapped;
    };

    if (Array.isArray(data)) {
      return data.map(item => mapObject(item));
    } else if (data && typeof data === 'object') {
      return mapObject(data);
    }
    return data;
  }

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
      this.flow = await FlowModel.findById(flowId).lean(); // ← USAR .lean() para obtener objeto plano
      if (!this.flow) {
        throw new Error(`Flujo ${flowId} no encontrado`);
      }

      // 2. Detectar y guardar configuraciones técnicas de nodos fuente
      this.detectSourceNodes(this.flow.nodes);

      if (!this.flow.nodes || !this.flow.edges) {
        throw new Error(`Flujo ${flowId} no tiene nodos o edges`);
      }

      console.log(`📊 Flujo: ${this.flow.nombre} (${this.flow.nodes.length} nodos, ${this.flow.edges.length} edges)`);

      // 2. Inicializar contexto con datos del trigger
      this.context = {
        '1': {
          output: triggerData,
        },
      };

      // 3. Inicializar variables globales estándar desde triggerData
      if (triggerData.from) {
        this.setGlobalVariable('telefono_cliente', triggerData.from);
      }
      if (triggerData.to) {
        this.setGlobalVariable('telefono_empresa', triggerData.to);
      }
      if (triggerData.phoneNumberId) {
        this.setGlobalVariable('phoneNumberId', triggerData.phoneNumberId);
      }
      if (triggerData.message) {
        this.setGlobalVariable('mensaje_usuario', triggerData.message);
      }
      
      console.log(`📋 Variables globales inicializadas:`, Object.keys(this.globalVariables));

      // 3. Encontrar nodo trigger (webhook)
      const triggerNode = this.flow.nodes.find((n: any) => n.type === 'webhook');
      
      if (!triggerNode) {
        console.error('❌ NO SE ENCONTRÓ NODO TRIGGER');
        console.log('🔍 Nodos disponibles:', this.flow.nodes.map((n: any) => ({ id: n.id, type: n.type })));
        throw new Error('No se encontró nodo trigger en el flujo');
      }

      console.log(`🔄 1. ${triggerNode.data.label}`);

      // 4. Ejecutar flujo desde el trigger
      let currentNodeId = triggerNode.id;
      let executionCount = 1;

      while (executionCount < 50) { // Límite de seguridad
        executionCount++;

        // Buscar siguiente edge(s)
        const possibleEdges = this.flow.edges.filter((e: any) => e.source === currentNodeId);
        
        if (possibleEdges.length === 0) {
          console.log(`✅ Fin del flujo (no hay más edges desde ${currentNodeId})`);
          break;
        }

        // Si hay múltiples edges (Router), elegir según _routerPath
        let nextEdge;
        if (possibleEdges.length > 1) {
          const routerPath = this.context[currentNodeId]?.output?._routerPath;
          console.log(`   🔀 Router detectado. Ruta elegida: ${routerPath || 'default'}`);
          
          // Buscar edge que coincida con la ruta (sourceHandle es donde está el routeId)
          nextEdge = possibleEdges.find((e: any) => 
            e.sourceHandle === routerPath ||
            e.data?.routeId === routerPath || 
            e.id.includes(routerPath)
          );
          
          // Si no encuentra, usar el primero (fallback)
          if (!nextEdge) {
            console.log(`   ⚠️  No se encontró edge para ruta ${routerPath}, usando fallback`);
            nextEdge = possibleEdges[0];
          } else {
            console.log(`   ✅ Edge encontrado para ruta ${routerPath}: ${nextEdge.id}`);
          }
        } else {
          nextEdge = possibleEdges[0];
        }

        // Buscar siguiente nodo
        const nextNode = this.flow.nodes.find((n: any) => n.id === nextEdge.target);
        if (!nextNode) {
          console.error(`❌ Nodo ${nextEdge.target} no encontrado`);
          break;
        }

        console.log(`🔄 ${executionCount}. ${nextNode.data.label}`);

        // Ejecutar nodo
        try {
          const result = await this.executeNode(nextNode, nextEdge);
          this.context[nextNode.id] = result;
          
          // LOG DETALLADO: Ver qué se guardó en el contexto
          console.log(`\n📊 [DEBUG] Contexto actualizado para nodo: ${nextNode.id}`);
          console.log(`   Tipo de output: ${typeof result.output}`);
          console.log(`   Es array: ${Array.isArray(result.output)}`);
          if (Array.isArray(result.output)) {
            console.log(`   Array length: ${result.output.length}`);
            console.log(`   Primer elemento:`, JSON.stringify(result.output[0])?.substring(0, 200));
          } else if (typeof result.output === 'object' && result.output !== null) {
            console.log(`   Keys:`, Object.keys(result.output));
            console.log(`   Output (primeros 300 chars):`, JSON.stringify(result.output)?.substring(0, 300));
          } else {
            console.log(`   Output:`, result.output);
          }
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

      if (executionCount >= 50) {
        console.warn(`⚠️  Flujo detenido: máximo de 50 ejecuciones alcanzado`);
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
      
      case 'carrito':
        return await executeCarritoNode(node, input, {
          contactoId: this.contactoId!,
          empresaId: this.getGlobalVariable('telefono_empresa'),
          resolveVariableInString: this.resolveVariableInString.bind(this),
          setGlobalVariable: this.setGlobalVariable.bind(this)
        });
      
      case 'mercadopago':
        return await executeMercadoPagoNode(node, input, {
          contactoId: this.contactoId!,
          empresaId: this.getGlobalVariable('telefono_empresa'),
          resolveVariableInString: this.resolveVariableInString.bind(this),
          setGlobalVariable: this.setGlobalVariable.bind(this)
        });
      
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

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`📝 NODO GPT: ${node.data.label} (${config.tipo})`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n📥 INPUT RECIBIDO:');
    console.log(JSON.stringify(input, null, 2));

    let userMessage: string;
    
    // Determinar contenido del mensaje según tipo de GPT
    if (config.tipo === 'transform') {
      // Para transform, si el input está vacío, usar mensaje_usuario de variables globales
      if (!input || Object.keys(input).length === 0) {
        userMessage = this.getGlobalVariable('mensaje_usuario') || '';
      } else {
        userMessage = typeof input === 'string' ? input : JSON.stringify(input, null, 2);
      }
    } else {
      // Para conversacional/formateador, usar el mensaje del usuario
      // Prioridad: input.mensaje_usuario > input.message > variable global mensaje_usuario
      userMessage = input.mensaje_usuario 
        || input.message 
        || this.getGlobalVariable('mensaje_usuario') 
        || JSON.stringify(input);
    }

    console.log('\n📨 USER MESSAGE:');
    console.log(`"${userMessage}"`);

    // COMPATIBILIDAD: Convertir configuracionExtraccion (legacy) a extractionConfig ANTES de usarlo
    if (config.tipo === 'formateador' && !config.extractionConfig && config.configuracionExtraccion) {
      console.log('   🔄 Convirtiendo configuracionExtraccion (legacy) a extractionConfig');
      config.extractionConfig = {
        enabled: true,
        method: 'advanced',
        contextSource: config.configuracionExtraccion.fuenteDatos || 'historial_completo',
        systemPrompt: config.configuracionExtraccion.instruccionesExtraccion,
        variables: (config.configuracionExtraccion.camposEsperados || []).map((campo: any) => ({
          nombre: campo.nombre,
          tipo: campo.tipoDato,
          requerido: campo.requerido,
          descripcion: campo.descripcion
        }))
      };
    }

    // Usar SOLO el systemPrompt del frontend (sin agregar nada)
    let systemPrompt: string;
    if (config.tipo === 'formateador' && config.extractionConfig?.systemPrompt) {
      // Para formateador: usar extractionConfig.systemPrompt
      console.log('\n🔧 Usando extractionConfig.systemPrompt del frontend');
      systemPrompt = config.extractionConfig.systemPrompt;
    } else if (config.systemPrompt) {
      // Para otros tipos: usar systemPrompt directo
      console.log('\n🔧 Usando systemPrompt del frontend');
      systemPrompt = config.systemPrompt;
    } else {
      console.log('\n🔧 Fallback: systemPrompt por defecto');
      systemPrompt = 'Eres un asistente útil.';
    }

    console.log('\n📋 SYSTEM PROMPT CONSTRUIDO:');
    console.log(systemPrompt.substring(0, 300) + '...');

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

    // AUDITORÍA: Mostrar systemPrompt DESPUÉS de resolver variables
    console.log('\n🔍 [AUDITORÍA] SYSTEM PROMPT DESPUÉS DE RESOLVER VARIABLES:');
    console.log('─'.repeat(80));
    console.log(systemPromptResolved);
    console.log('─'.repeat(80));

    // Si es conversacional, agregar historial completo
    if (config.tipo === 'conversacional' && this.historialConversacion.length > 0) {
      console.log(`\n📚 Agregando historial: ${this.historialConversacion.length} mensajes`);
      // Agregar historial (alternando user/assistant)
      for (let i = 0; i < this.historialConversacion.length; i++) {
        const msg = this.historialConversacion[i];
        const role = i % 2 === 0 ? 'user' : 'assistant';
        console.log(`   ${i + 1}. ${role}: ${msg.substring(0, 60)}${msg.length > 60 ? '...' : ''}`);
        messages.push({
          role: role as 'user' | 'assistant',
          content: msg,
        });
      }
    } else if (config.tipo === 'conversacional') {
      console.log('\n📚 Historial vacío (primera conversación)');
    }

    // Agregar mensaje actual
    messages.push({
      role: 'user',
      content: userMessage,
    });

    // Preparar output
    const output: any = {};

    // IMPORTANTE: Si es formateador, NO hacer llamada inicial a GPT
    // El formateador SOLO extrae datos, no genera respuestas
    if (config.tipo !== 'formateador') {
      // Llamar a OpenAI
      console.log(`\n🤖 Llamando a OpenAI (${config.modelo || 'gpt-4'})...`);
      const resultado = await obtenerRespuestaChat({
        modelo: config.modelo || 'gpt-4',
        historial: messages,
      });

      console.log(`\n✅ RESPUESTA DE GPT:`);
      console.log(`"${resultado.texto}"`);
      console.log(`Tokens: ${resultado.tokens}, Costo: $${resultado.costo}`);

      // Guardar respuesta en output
      output.respuesta_gpt = resultado.texto;
      output.tokens = resultado.tokens;
      output.costo = resultado.costo;
    } else {
      console.log('\n⏭️  Saltando llamada a GPT (formateador solo extrae datos)');
    }

    // Si es tipo transform, intentar parsear JSON
    if (config.tipo === 'transform' && config.outputFormat === 'json' && output.respuesta_gpt) {
      try {
        const jsonMatch = output.respuesta_gpt.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : output.respuesta_gpt;
        output.datos_estructurados = JSON.parse(jsonString);
        console.log(`   ✅ JSON parseado:`, output.datos_estructurados);
      } catch (e) {
        console.warn('⚠️  No se pudo parsear respuesta como JSON');
        console.warn('   Respuesta:', output.respuesta_gpt);
        output.datos_estructurados = null;
      }
    }

    // Guardar en historial si es conversacional
    if (config.tipo === 'conversacional' && output.respuesta_gpt) {
      console.log('\n💾 Guardando en historial de BD...');
      await this.saveToHistorial(userMessage);
      await this.saveToHistorial(output.respuesta_gpt);
      console.log(`   ✅ Historial actualizado (${this.historialConversacion.length} mensajes totales)`);
    }

    // Procesar extracción de datos SOLO si es formateador
    if (config.tipo === 'formateador' && config.extractionConfig?.systemPrompt) {
      console.log('   🔧 Usando extractionConfig del frontend');
      
      // Determinar fuente de datos
      const fuenteDatos = config.extractionConfig.contextSource || 'historial_completo';
      
      let contexto = '';
      if (fuenteDatos === 'historial_completo') {
        // Construir contexto con TODO el historial
        for (let i = 0; i < this.historialConversacion.length; i += 2) {
          const userMsg = this.historialConversacion[i];
          const assistantMsg = this.historialConversacion[i + 1];
          contexto += `Usuario: ${userMsg}\n`;
          if (assistantMsg) {
            contexto += `Asistente: ${assistantMsg}\n`;
          }
        }
        contexto += `Usuario: ${userMessage}`;
      } else {
        contexto = userMessage;
      }
      
      console.log(`\n📝 CONTEXTO PARA EXTRACCIÓN (${fuenteDatos}):`);
      console.log(contexto);
      console.log('\n🔍 Extrayendo variables...');
      
      // Usar extractionConfig.systemPrompt + extractionConfig.variables
      const datosExtraidos = await GPTPromptBuilder.extractWithFrontendConfig(
        contexto,
        config.extractionConfig
      );
      
      console.log('\n✅ DATOS EXTRAÍDOS:');
      console.log(JSON.stringify(datosExtraidos, null, 2));
      
      // Guardar cada dato extraído en variables globales
      // IMPORTANTE: Hacer merge con variables existentes para mantener valores previos
      console.log('\n💾 Guardando variables globales (con merge):');
      for (const [nombre, valor] of Object.entries(datosExtraidos)) {
        // Si el valor es null/undefined/"", verificar si ya existe una variable con ese nombre
        if (valor === undefined || valor === null || valor === '') {
          const existingValue = this.getVariableValue(nombre);
          if (existingValue !== undefined && existingValue !== null && existingValue !== '') {
            // Mantener el valor existente
            console.log(`   🔄 ${nombre} = "${JSON.stringify(existingValue)?.substring(0, 100)}" (mantenido del historial)`);
            output[nombre] = existingValue;
          } else {
            console.log(`   ⚠️  ${nombre} = ${valor} (no guardado, no existe valor previo)`);
          }
        } else {
          // Guardar el nuevo valor
          console.log(`   ✅ ${nombre} = "${JSON.stringify(valor)?.substring(0, 100)}"`);
          this.setGlobalVariable(nombre, valor);
          output[nombre] = valor;
        }
      }
      
      console.log('\n📋 VARIABLES GLOBALES ACTUALES:');
      Object.entries(this.globalVariables).forEach(([key, value]) => {
        console.log(`   ${key} = "${JSON.stringify(value)?.substring(0, 100)}"`);
      });
      
    } else if (config.variablesRecopilar && config.variablesRecopilar.length > 0) {
      // MODO LEGACY: Extracción simple con variablesRecopilar
      console.log('   🔧 Usando extracción legacy (variablesRecopilar)');
      
      // Extraer variables del HISTORIAL COMPLETO, no solo del mensaje actual
      let contextoCompleto = '';
      
      if (config.tipo === 'conversacional' && this.historialConversacion.length > 0) {
        // Incluir historial completo (solo mensajes del usuario)
        for (let i = 0; i < this.historialConversacion.length; i += 2) {
          contextoCompleto += this.historialConversacion[i] + '\n';
        }
      }
      
      // Agregar mensaje actual
      contextoCompleto += userMessage;
      
      const variablesExtraidas = await GPTPromptBuilder.extractVariables(
        contextoCompleto,
        config.variablesRecopilar
      );
      
      // Guardar cada variable extraída en variables globales
      for (const [nombre, valor] of Object.entries(variablesExtraidas)) {
        if (valor !== undefined && valor !== null && valor !== '') {
          console.log(`   💾 Guardando variable global: ${nombre} = ${JSON.stringify(valor)?.substring(0, 100)}`);
          this.setGlobalVariable(nombre, valor);
          output[nombre] = valor;
        }
      }
      
      console.log(`   📋 globalVariables después de guardar: ${JSON.stringify(Object.keys(this.globalVariables))}`);
      
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
    if (config.accionesCompletado && config.accionesCompletado.length > 0 && output.respuesta_gpt) {
      const accionMarcar = config.accionesCompletado.find(a => a.tipo === 'marcar_completado');
      if (accionMarcar && accionMarcar.token) {
        const completado = GPTPromptBuilder.isCompletado(output.respuesta_gpt, accionMarcar.token);
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

    // Resolver mensaje usando estrategia en cascada
    const mensaje = this.resolveWhatsAppMessage(config, input);
    
    // Validar que el mensaje no esté vacío
    if (!mensaje || mensaje.trim() === '') {
      const error = `Nodo WhatsApp ${node.id}: No se pudo resolver el mensaje. Verifica la configuración del nodo.`;
      console.error(`   ❌ ${error}`);
      throw new Error(error);
    }

    // Resolver teléfono usando estrategia en cascada
    const telefono = this.resolveWhatsAppPhone(config, input);
    
    // Validar que el teléfono no esté vacío
    if (!telefono || telefono.trim() === '') {
      const error = `Nodo WhatsApp ${node.id}: No se pudo resolver el número de teléfono.`;
      console.error(`   ❌ ${error}`);
      throw new Error(error);
    }

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
        message: mensaje,
      },
    };
  }

  /**
   * Resuelve el mensaje de WhatsApp usando estrategia en cascada
   * Prioridad:
   * 1. config.message (inglés)
   * 2. config.mensaje (español)
   * 3. input.message (del edge mapping)
   * 4. input.mensaje (del edge mapping)
   * 5. Buscar en output del nodo anterior si input tiene referencia
   */
  private resolveWhatsAppMessage(config: any, input: any): string {
    console.log('   🔍 [resolveWhatsAppMessage] Iniciando resolución...');
    console.log('      config.message:', config.message?.substring(0, 100));
    console.log('      config.mensaje:', config.mensaje?.substring(0, 100));
    console.log('      input:', JSON.stringify(input)?.substring(0, 200));
    
    // 1. Intentar desde config del nodo (normalizar message/mensaje)
    const configMessage = config.message || config.mensaje;
    if (configMessage) {
      console.log('      ✅ Usando config.message/mensaje');
      console.log('      Antes de resolver:', configMessage.substring(0, 150));
      const resolved = this.resolveVariableInString(configMessage);
      console.log('      Después de resolver:', resolved.substring(0, 150));
      if (resolved && resolved.trim() !== '') {
        return resolved;
      }
    }

    // 2. Intentar desde input (edge mapping)
    const inputMessage = input.message || input.mensaje;
    if (inputMessage) {
      console.log('      ✅ Usando input.message/mensaje');
      const resolved = this.resolveVariableInString(String(inputMessage));
      if (resolved && resolved.trim() !== '') {
        return resolved;
      }
    }

    // 3. Si input tiene una referencia a otro nodo, intentar obtener su output
    if (typeof input === 'object' && Object.keys(input).length > 0) {
      // Buscar campos que puedan contener el mensaje
      const possibleFields = ['respuesta_gpt', 'texto', 'content', 'body'];
      for (const field of possibleFields) {
        if (input[field]) {
          console.log(`      ✅ Usando input.${field}`);
          return String(input[field]);
        }
      }
    }

    console.log('      ⚠️  No se encontró mensaje');
    return '';
  }

  /**
   * Resuelve el teléfono de WhatsApp usando estrategia en cascada
   * Prioridad:
   * 1. config.to
   * 2. input.to
   * 3. input.telefono_usuario
   * 4. input.from (del trigger)
   * 5. Variable global 'telefono_usuario'
   */
  private resolveWhatsAppPhone(config: any, input: any): string {
    // 1. Desde config.telefono (nuevo estándar)
    if (config.telefono) {
      const resolved = this.resolveVariableInString(config.telefono);
      if (resolved && resolved.trim() !== '') {
        return resolved;
      }
    }

    // 2. Desde config.to (legacy)
    if (config.to) {
      const resolved = this.resolveVariableInString(config.to);
      if (resolved && resolved.trim() !== '') {
        return resolved;
      }
    }

    // 3. Desde input (edge mapping)
    if (input.to) {
      const resolved = this.resolveVariableInString(String(input.to));
      if (resolved && resolved.trim() !== '') {
        return resolved;
      }
    }

    // 4. Desde input.telefono_usuario
    if (input.telefono_usuario) {
      return String(input.telefono_usuario);
    }

    // 5. Desde input.from (trigger de WhatsApp)
    if (input.from) {
      return String(input.from);
    }

    // 6. Desde variable global telefono_cliente (nuevo estándar)
    const telefonoCliente = this.getGlobalVariable('telefono_cliente');
    if (telefonoCliente) {
      return String(telefonoCliente);
    }

    // 7. Desde variable global telefono_usuario (legacy)
    const globalPhone = this.getGlobalVariable('telefono_usuario');
    if (globalPhone) {
      return String(globalPhone);
    }

    return '';
  }

  /**
   * Ejecuta un nodo WooCommerce
   */
  private async executeWooCommerceNode(node: any, input: any): Promise<NodeExecutionResult> {
    const config = node.data.config;
    
    console.log(`   🛍️  Módulo WooCommerce: ${config.module}`);
    
    // Si tiene apiConfigId pero NO tiene module, usar el sistema de integraciones
    if (config.apiConfigId && !config.module) {
      console.log(`   🔗 Usando API de integraciones: ${config.apiConfigId}`);
      return await this.executeAPICallNode(node, input);
    }
    
    // Obtener conexión (del nodo o del flowConfig o de apiConfigId)
    let connection = config.connection || this.flowConfig.woocommerce;
    
    // Si tiene apiConfigId y module, cargar conexión desde la BD
    if (config.apiConfigId && config.module && !connection) {
      console.log(`   🔗 Cargando conexión desde API Config: ${config.apiConfigId}`);
      try {
        const apiConfig = await ApiConfigurationModel.findById(config.apiConfigId);
        
        if (apiConfig && apiConfig.type === 'woocommerce') {
          connection = {
            url: apiConfig.baseUrl,
            consumerKey: apiConfig.auth?.consumerKey,
            consumerSecret: apiConfig.auth?.consumerSecret
          };
          console.log(`   ✅ Conexión WooCommerce cargada desde BD`);
          console.log(`   📍 URL: ${connection.url}`);
        } else {
          console.log(`   ⚠️  API Config no encontrado o no es de tipo WooCommerce`);
        }
      } catch (error: any) {
        console.error(`   ⚠️  Error cargando API config:`, error.message);
      }
    }
    
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
          result = await wooService.searchProducts(params);
          console.log(`   ✅ Productos encontrados: ${result.length}`);
          // Retornar en formato { productos: [...] } para que sea accesible como woocommerce-search.productos
          return {
            output: {
              productos: result,
              count: result.length
            }
          };
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
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`🔀 NODO ROUTER`);
    console.log('═══════════════════════════════════════════════════════════');
    
    console.log('\n📊 VARIABLES GLOBALES DISPONIBLES (TODAS):');
    Object.entries(this.globalVariables).forEach(([key, value]) => {
      console.log(`   ${key} = ${JSON.stringify(value)}`);
    });
    
    console.log('\n🔍 VERIFICACIÓN DE VARIABLES CRÍTICAS:');
    console.log(`   titulo exists: ${this.getVariableValue('titulo') !== undefined && this.getVariableValue('titulo') !== null && this.getVariableValue('titulo') !== ''}`);
    console.log(`   titulo value: ${JSON.stringify(this.getVariableValue('titulo'))}`);
    console.log(`   editorial exists: ${this.getVariableValue('editorial') !== undefined && this.getVariableValue('editorial') !== null && this.getVariableValue('editorial') !== ''}`);
    console.log(`   editorial value: ${JSON.stringify(this.getVariableValue('editorial'))}`);
    console.log(`   edicion exists: ${this.getVariableValue('edicion') !== undefined && this.getVariableValue('edicion') !== null && this.getVariableValue('edicion') !== ''}`);
    console.log(`   edicion value: ${JSON.stringify(this.getVariableValue('edicion'))}`);
    console.log(`   Total variables: ${Object.keys(this.globalVariables).length}`);

    // Obtener edges que salen de este router
    const routerEdges = this.flow.edges.filter((e: any) => e.source === node.id);
    
    if (routerEdges.length === 0) {
      console.log(`   ⚠️  No hay edges desde este router, usando ruta por defecto`);
      return { 
        output: { 
          ...input, 
          _routerPath: 'default' 
        } 
      };
    }

    console.log(`\n📋 Rutas disponibles: ${routerEdges.length}`);

    // Evaluar cada edge en orden
    console.log('\n🔍 EVALUANDO RUTAS:');
    for (const edge of routerEdges) {
      const routeId = edge.sourceHandle || edge.id;
      const label = edge.data?.label || routeId;
      const condition = edge.data?.condition;
      
      console.log(`\n   Ruta: ${label} (${routeId})`);
      console.log(`   Condición: ${condition || 'SIN CONDICIÓN'}`);
      
      if (!condition) {
        console.log(`   ⚠️  Sin condición, se considera TRUE por defecto`);
        console.log(`\n✅ RUTA SELECCIONADA: ${label}`);
        return { 
          output: { 
            ...input, 
            _routerPath: routeId,
            _routerLabel: label 
          } 
        };
      }
      
      const conditionMet = this.evaluateStringCondition(condition);
      
      console.log(`   Resultado: ${conditionMet ? '✅ TRUE' : '❌ FALSE'}`);
      
      if (conditionMet) {
        console.log(`\n✅ RUTA SELECCIONADA: ${label}`);
        console.log(`   _routerPath = ${routeId}`);
        console.log(`   _routerLabel = ${label}`);
        return { 
          output: { 
            ...input, 
            _routerPath: routeId,
            _routerLabel: label 
          } 
        };
      }
    }

    // Si ninguna condición se cumple, usar la primera ruta como fallback
    console.log(`\n⚠️  NINGUNA CONDICIÓN CUMPLIDA - Usando primera ruta como fallback`);
    const fallbackEdge = routerEdges[0];
    const fallbackRouteId = fallbackEdge.sourceHandle || fallbackEdge.id;
    const fallbackLabel = fallbackEdge.data?.label || fallbackRouteId;
    
    return { 
      output: { 
        ...input, 
        _routerPath: fallbackRouteId,
        _routerLabel: fallbackLabel 
      } 
    };
  }

  /**
   * Evalúa una condición en formato string
   * Ejemplos: "{{titulo_libro}} exists", "{{cualquier_variable}} empty", "true", "false"
   */
  private evaluateStringCondition(condition: string): boolean {
    console.log(`      Condición original: ${condition}`);

    // Casos especiales: true/false literales
    if (condition.trim() === 'true') return true;
    if (condition.trim() === 'false') return false;

    // SOPORTE PARA OPERADORES LÓGICOS (OR, AND)
    // Evaluar OR primero (menor precedencia)
    if (condition.includes(' OR ')) {
      console.log(`      → Detectado operador OR`);
      const parts = condition.split(' OR ').map(p => p.trim());
      const results = parts.map(part => this.evaluateStringCondition(part));
      console.log(`      → Partes: ${parts.length}, Resultados: ${results.join(', ')}`);
      const result = results.some(r => r === true);
      console.log(`      → OR resultado: ${result}`);
      return result;
    }

    // Evaluar AND (mayor precedencia)
    if (condition.includes(' AND ')) {
      console.log(`      → Detectado operador AND`);
      const parts = condition.split(' AND ').map(p => p.trim());
      const results = parts.map(part => this.evaluateStringCondition(part));
      console.log(`      → Partes: ${parts.length}, Resultados: ${results.join(', ')}`);
      const result = results.every(r => r === true);
      console.log(`      → AND resultado: ${result}`);
      return result;
    }

    // CRÍTICO: Parsear condiciones ANTES de resolver variables
    // Esto permite evaluar 'exists' sobre el valor RAW de la variable
    
    // Patrón: "{{variable}} exists"
    const existsMatch = condition.match(/\{\{([^}]+)\}\}\s+exists$/i);
    if (existsMatch) {
      const varName = existsMatch[1].trim();
      console.log(`      → Detectado 'exists' para variable: "${varName}"`);
      
      // Obtener el valor RAW de la variable
      const value = this.getVariableValue(varName);
      
      // Validar que el valor exista y no sea null/undefined/vacío
      const exists = value !== undefined && 
                     value !== null && 
                     value !== '' &&
                     (typeof value !== 'string' || value.trim().length > 0);
      
      console.log(`      → Variable "${varName}" = ${JSON.stringify(value)?.substring(0, 100)}`);
      console.log(`      → exists = ${exists}`);
      return exists;
    }

    // Patrón: "{{variable}} not exists"
    const notExistsMatch = condition.match(/\{\{([^}]+)\}\}\s+not\s+exists?$/i);
    if (notExistsMatch) {
      const varName = notExistsMatch[1].trim();
      console.log(`      → Detectado 'not exists' para variable: "${varName}"`);
      
      const value = this.getVariableValue(varName);
      
      const notExists = value === undefined || 
                        value === null || 
                        value === '' ||
                        (typeof value === 'string' && value.trim().length === 0);
      
      console.log(`      → Variable "${varName}" = ${JSON.stringify(value)?.substring(0, 100)}`);
      console.log(`      → not exists = ${notExists}`);
      return notExists;
    }

    // Patrón: "{{variable}} empty"
    const emptyMatch = condition.match(/\{\{([^}]+)\}\}\s+empty$/i);
    if (emptyMatch) {
      const varName = emptyMatch[1].trim();
      console.log(`      → Detectado 'empty' para variable: "${varName}"`);
      
      const value = this.getVariableValue(varName);
      
      const empty = value === undefined || 
                    value === null || 
                    value === '' ||
                    (typeof value === 'string' && value.trim().length === 0) ||
                    (Array.isArray(value) && value.length === 0);
      
      console.log(`      → Variable "${varName}" = ${JSON.stringify(value)?.substring(0, 100)}`);
      console.log(`      → empty = ${empty}`);
      return empty;
    }

    // Patrón: "{{variable}} not_empty" o "{{variable}} not empty"
    const notEmptyMatch = condition.match(/\{\{([^}]+)\}\}\s+not[_\s]empty$/i);
    if (notEmptyMatch) {
      const varName = notEmptyMatch[1].trim();
      console.log(`      → Detectado 'not_empty' para variable: "${varName}"`);
      
      const value = this.getVariableValue(varName);
      
      const notEmpty = value !== undefined && 
                       value !== null && 
                       value !== '' &&
                       !(typeof value === 'string' && value.trim().length === 0) &&
                       !(Array.isArray(value) && value.length === 0);
      
      console.log(`      → Variable "${varName}" = ${JSON.stringify(value)?.substring(0, 100)}`);
      console.log(`      → not_empty = ${notEmpty}`);
      return notEmpty;
    }

    // Si no coincide con patrones especiales, resolver y evaluar normalmente
    const resolvedCondition = this.resolveVariableInString(condition);
    console.log(`      Condición resuelta: ${resolvedCondition}`);
    
    // Evaluar como booleano
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
    console.log(`         🔎 [getVariableValue] Buscando: "${varPath}"`);
    
    // Soporte para variables globales con prefijo 'global.'
    if (varPath.startsWith('global.')) {
      const globalKey = varPath.substring(7); // Remover 'global.'
      const value = this.getGlobalVariable(globalKey);
      console.log(`         → global.${globalKey} = ${JSON.stringify(value)?.substring(0, 100)}`);
      return value;
    }

    // Intentar buscar primero en globalVariables (sin prefijo)
    const globalValue = this.getGlobalVariable(varPath);
    if (globalValue !== undefined && globalValue !== null) {
      console.log(`         ✅ Encontrado en globalVariables: ${JSON.stringify(globalValue)?.substring(0, 100)}`);
      return globalValue;
    }
    console.log(`         ⚠️  No encontrado en globalVariables`);
    console.log(`         📋 globalVariables actuales: ${JSON.stringify(Object.keys(this.globalVariables))}`);

    // Si no está en globalVariables, buscar en contexto de nodos
    const parts = varPath.split('.');
    const nodeId = parts[0];
    const path = parts.slice(1);

    console.log(`         🔎 Buscando en contexto de nodo: "${nodeId}"`);
    console.log(`         📋 Nodos en contexto: ${JSON.stringify(Object.keys(this.context))}`);
    
    let value = this.context[nodeId]?.output;
    
    if (!value) {
      console.log(`         ❌ Nodo "${nodeId}" no encontrado en contexto`);
      return undefined;
    }
    
    console.log(`         ✅ Nodo encontrado, output: ${JSON.stringify(value)?.substring(0, 150)}`);

    for (const part of path) {
      if (value && typeof value === 'object') {
        value = value[part];
        console.log(`         → Accediendo a .${part}: ${JSON.stringify(value)?.substring(0, 100)}`);
      } else {
        console.log(`         ❌ No se puede acceder a .${part} (valor no es objeto)`);
        return undefined;
      }
    }

    console.log(`         ✅ Valor final: ${JSON.stringify(value)?.substring(0, 100)}`);
    return value;
  }

  /**
   * Resuelve una variable en un string (reemplaza {{variable}} con su valor)
   * Soporta:
   * - Variables simples: {{titulo_libro}}
   * - Propiedades anidadas: {{woocommerce-search.productos}}
   * - Acceso a propiedades: {{woocommerce-search.productos.length}}
   * - Fallbacks: {{variable || "default"}}
   * - Expresiones: {{woocommerce-search.productos.length || 0}}
   */
  private resolveVariableInString(str: string): string {
    if (!str) return '';

    // Buscar todas las variables en el formato {{...}}
    const regex = /\{\{([^}]+)\}\}/g;
    
    return str.replace(regex, (match, expression) => {
      expression = expression.trim();
      
      try {
        // Evaluar la expresión de forma segura
        const result = this.evaluateExpression(expression);
        
        // IMPORTANTE: NO formatear productos automáticamente
        // Dejar que GPT interprete el JSON según su systemPrompt
        // Si es un objeto complejo o array, convertirlo a JSON
        if (typeof result === 'object' && result !== null) {
          return JSON.stringify(result, null, 2);
        }
        
        // Retornar el valor como string
        return result !== undefined && result !== null ? String(result) : match;
      } catch (error) {
        console.warn(`      ⚠️  Error evaluando expresión "${expression}":`, error);
        return match; // Mantener el placeholder si hay error
      }
    });
  }

  /**
   * Evalúa una expresión de forma segura
   * Soporta: variables, propiedades, operadores lógicos (||), acceso a length
   */
  private evaluateExpression(expression: string): any {
    console.log(`      🧮 [evaluateExpression] Evaluando: "${expression}"`);
    
    // Caso 1: Expresión con fallback (||)
    if (expression.includes('||')) {
      console.log(`      → Detectado fallback (||)`);
      const parts = expression.split('||').map(p => p.trim());
      const leftValue = this.evaluateExpression(parts[0]);
      
      console.log(`      → Valor izquierdo: ${JSON.stringify(leftValue)}`);
      
      // Si el valor izquierdo existe y no está vacío, usarlo
      if (leftValue !== undefined && leftValue !== null && leftValue !== '') {
        console.log(`      ✅ Usando valor izquierdo`);
        return leftValue;
      }
      
      // Sino, evaluar el fallback
      const fallback = parts[1];
      console.log(`      → Usando fallback: "${fallback}"`);
      
      // Si el fallback es un número
      if (/^\d+$/.test(fallback)) {
        return parseInt(fallback, 10);
      }
      
      // Si el fallback es un string con comillas, removerlas
      if ((fallback.startsWith('"') && fallback.endsWith('"')) ||
          (fallback.startsWith("'") && fallback.endsWith("'"))) {
        return fallback.slice(1, -1);
      }
      
      return fallback;
    }
    
    // Caso 2: Acceso a propiedad .length
    if (expression.endsWith('.length')) {
      console.log(`      → Detectado acceso a .length`);
      const varPath = expression.slice(0, -7); // Remover '.length'
      const value = this.getVariableValue(varPath);
      
      if (Array.isArray(value)) {
        console.log(`      ✅ Es array, length: ${value.length}`);
        return value.length;
      }
      
      if (typeof value === 'string') {
        console.log(`      ✅ Es string, length: ${value.length}`);
        return value.length;
      }
      
      console.log(`      ⚠️  No es array ni string, retornando 0`);
      return 0;
    }
    
    // Caso 3: Variable simple o anidada
    console.log(`      → Variable simple/anidada`);
    const result = this.getVariableValue(expression);
    console.log(`      ✅ Resultado: ${JSON.stringify(result)?.substring(0, 100)}`);
    return result;
  }

  /**
   * Ejecuta un nodo de llamada a API usando el sistema de integraciones
   * GENÉRICO: Funciona con cualquier tipo de endpoint (GET, POST, PUT, DELETE)
   */
  private async executeAPICallNode(node: any, input: any): Promise<NodeExecutionResult> {
    const config = node.data.config;
    
    console.log(`\n🔗 Ejecutando llamada a API de integraciones`);
    console.log(`   API Config ID: ${config.apiConfigId}`);
    console.log(`   Endpoint ID: ${config.endpointId}`);
    
    try {
      // Importar dinámicamente el modelo y el ejecutor
      const { ApiConfigurationModel } = await import('../modules/integrations/models/index.js');
      const { apiExecutor } = await import('../modules/integrations/services/apiExecutor.js');
      
      // Obtener la configuración de la API
      const apiConfig = await ApiConfigurationModel.findById(config.apiConfigId);
      
      if (!apiConfig) {
        throw new Error(`API Configuration no encontrada: ${config.apiConfigId}`);
      }
      
      console.log(`   ✅ API encontrada: ${apiConfig.nombre}`);
      console.log(`   Base URL: ${apiConfig.baseUrl}`);
      
      // Buscar el endpoint
      const endpoint = apiConfig.endpoints?.find((e: any) => e.id === config.endpointId);
      
      if (!endpoint) {
        throw new Error(`Endpoint no encontrado: ${config.endpointId}`);
      }
      
      console.log(`   ✅ Endpoint encontrado: ${endpoint.nombre}`);
      console.log(`   Método: ${endpoint.metodo}`);
      console.log(`   Path: ${endpoint.path}`);
      
      // Resolver variables en parámetros
      const resolvedParams: Record<string, any> = {};
      for (const [key, value] of Object.entries(config.parametros || {})) {
        const stringValue = String(value);
        if (stringValue.includes('{{')) {
          resolvedParams[key] = this.resolveVariableInString(stringValue);
        } else {
          resolvedParams[key] = this.getVariableValue(stringValue) || stringValue;
        }
      }
      
      console.log(`   📦 Parámetros originales:`, JSON.stringify(config.parametros || {}, null, 2));
      console.log(`   📦 Parámetros resueltos (raw):`, JSON.stringify(resolvedParams, null, 2));
      
      // Convertir strings numéricos a números (per_page, page, etc.)
      const normalizedParams: Record<string, any> = {};
      for (const [key, value] of Object.entries(resolvedParams)) {
        // Si es un string que representa un número, convertirlo
        if (typeof value === 'string' && /^\d+$/.test(value)) {
          normalizedParams[key] = parseInt(value, 10);
          console.log(`   🔢 Convertido: ${key} = "${value}" → ${normalizedParams[key]}`);
        } else {
          normalizedParams[key] = value;
        }
      }
      
      console.log(`   📦 Parámetros normalizados:`, JSON.stringify(normalizedParams, null, 2));
      
      // DETECCIÓN AUTOMÁTICA: Determinar dónde van los parámetros según el método HTTP
      const apiParams: any = {};
      
      if (endpoint.metodo === 'GET' || endpoint.metodo === 'DELETE') {
        // GET y DELETE: parámetros van en query string
        apiParams.query = normalizedParams;
        console.log(`   🔍 Método ${endpoint.metodo}: Parámetros en query string`);
      } else if (endpoint.metodo === 'POST' || endpoint.metodo === 'PUT' || endpoint.metodo === 'PATCH') {
        // POST, PUT, PATCH: parámetros van en body
        apiParams.body = normalizedParams;
        console.log(`   📝 Método ${endpoint.metodo}: Parámetros en body`);
      } else {
        // Fallback: intentar detectar automáticamente
        console.log(`   ⚠️  Método desconocido: ${endpoint.metodo}, usando query por defecto`);
        apiParams.query = normalizedParams;
      }
      
      // Ejecutar la llamada a la API
      const result = await apiExecutor.ejecutar(
        config.apiConfigId,
        config.endpointId,
        apiParams,
        {} // contexto adicional
      );
      
      if (!result.success) {
        const errorMsg = result.error?.mensaje || 'Error ejecutando API';
        console.error(`   ❌ Error en API:`, errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log(`   ✅ API ejecutada exitosamente`);
      console.log(`   📊 Tipo de respuesta: ${Array.isArray(result.data) ? 'Array' : typeof result.data}`);
      console.log(`   📊 Cantidad de items: ${Array.isArray(result.data) ? result.data.length : 'N/A'}`);
      
      // NORMALIZACIÓN AUTOMÁTICA: Si es WooCommerce, simplificar la respuesta
      let normalizedData = result.data;
      if (node.type === 'woocommerce' || config.apiConfigId) {
        // Detectar si es respuesta de WooCommerce (tiene campos típicos como name, price, stock_status)
        const isWooCommerceResponse = Array.isArray(result.data) 
          ? result.data.length > 0 && result.data[0].name && result.data[0].price !== undefined
          : result.data?.name && result.data?.price !== undefined;
        
        if (isWooCommerceResponse) {
          normalizedData = this.normalizeWooCommerceResponse(result.data);
          console.log(`   🔄 Respuesta normalizada a formato estándar WooCommerce`);
          console.log(`   📦 Campos incluidos: id, name, price, stock_status, stock_quantity, permalink, image, sku, categories, on_sale`);
        }
      }

      // MAPEO DE CAMPOS: Si hay outputMapping configurado, aplicar transformación
      if (config.outputMapping?.enabled && config.outputMapping?.fields) {
        console.log(`   🗺️  Aplicando mapeo de campos personalizado...`);
        normalizedData = this.applyOutputMapping(normalizedData, config.outputMapping.fields);
        console.log(`   ✅ Mapeo aplicado. Campos mapeados: ${config.outputMapping.fields.length}`);
      }
      
      return { output: normalizedData };
      
    } catch (error: any) {
      console.error(`   ❌ Error ejecutando API:`, error.message);
      console.error(`   Stack:`, error.stack);
      throw error;
    }
  }

  /**
   * Formatea un array de productos de WooCommerce para WhatsApp
   */
  private formatProductsForWhatsApp(productos: any[]): string {
    if (!productos || productos.length === 0) {
      return 'No se encontraron productos.';
    }
    
    return productos.map((producto, index) => {
      const numero = index + 1;
      const nombre = producto.name || 'Sin nombre';
      const precio = producto.price ? `$${producto.price}` : 'Consultar';
      const stock = producto.in_stock ? '✅ Disponible' : '❌ Sin stock';
      
      return `${numero}. *${nombre}*\n   💰 ${precio}\n   ${stock}`;
    }).join('\n\n');
  }
}
