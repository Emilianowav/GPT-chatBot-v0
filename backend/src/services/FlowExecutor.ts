import { FlowModel } from '../models/Flow.js';
import { obtenerRespuestaChat } from './openaiService.js';
import { enviarMensajeWhatsAppTexto } from './metaService.js';
import type { ChatCompletionMessageParam } from './openaiService.js';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { EmpresaModel } from '../models/Empresa.js';
import { GPTPromptBuilder } from './GPTPromptBuilder.js';
import type { IGPTConversacionalConfig } from '../types/gpt-config.types.js';
import { createWooCommerceService } from './woocommerceService.js';
import { executeCarritoNode, executeMercadoPagoNode, executeVerificarPagoNode } from './FlowExecutor.carrito.js';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';
import axios from 'axios';
import { CarritoService } from './CarritoService.js';
import mongoose from 'mongoose';

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
  private topicos: Record<string, any> = {}; // Tópicos de conocimiento del flujo
  private contactoId?: string;
  private historialConversacion: string[] = [];
  private flow: any; // Flujo actual en ejecución

  /**
   * Normaliza un producto de WooCommerce al formato estándar simplificado
   * Esto asegura que GPT siempre reciba la misma estructura, sin importar qué módulo se use
   * OPTIMIZADO: Solo incluye campos esenciales para reducir tokens
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
   * Simplifica productos de WooCommerce para GPT
   * Solo incluye: título, precio, URL del catálogo
   * Configurable desde el frontend mediante fieldMappings
   */
  private simplifyProductsForGPT(products: any[], fieldMappings?: any[], baseUrl?: string): any[] {
    // Si hay fieldMappings del frontend, usarlos
    if (fieldMappings && fieldMappings.length > 0) {
      return products.map(product => {
        const simplified: any = {};
        fieldMappings.forEach(mapping => {
          const sourceValue = product[mapping.source];
          if (sourceValue !== undefined) {
            simplified[mapping.target] = sourceValue;
          }
        });
        return simplified;
      });
    }
    
    // Por defecto: solo título, precio y URL
    return products.map(product => {
      // Construir URL completa
      let url = product.permalink || '';
      
      // Si no hay permalink o es solo el slug, construir URL completa
      if (!url || !url.startsWith('http')) {
        const slug = product.slug || product.name?.toLowerCase().replace(/\s+/g, '-') || '';
        url = baseUrl ? `${baseUrl}/producto/${slug}` : slug;
      }
      
      return {
        titulo: product.name || '',
        precio: product.price || '0',
        url: url,
        stock: product.stock_status === 'instock' ? 'Disponible' : 'Sin stock'
      };
    });
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
   * Carga los tópicos de conocimiento del flujo
   */
  private loadTopicos(flow: any): void {
    console.log('\n🔍 [TÓPICOS] Intentando cargar tópicos...');
    console.log('   flow.config existe:', !!flow.config);
    console.log('   flow.config?.topicos existe:', !!flow.config?.topicos);
    console.log('   flow.config?.topicos_habilitados:', flow.config?.topicos_habilitados);
    
    if (flow.config?.topicos) {
      console.log('   Estructura de topicos:', JSON.stringify(flow.config.topicos, null, 2).substring(0, 500));
    }
    
    if (flow.config?.topicos && flow.config?.topicos_habilitados) {
      this.topicos = flow.config.topicos;
      console.log('📚 [TÓPICOS] Cargados:', Object.keys(this.topicos).join(', '));
      console.log('   Ejemplo - topicos.empresa:', JSON.stringify(this.topicos.empresa)?.substring(0, 200));
    } else {
      console.log('❌ [TÓPICOS] NO se cargaron. Razón:');
      if (!flow.config?.topicos) console.log('   - flow.config.topicos no existe');
      if (!flow.config?.topicos_habilitados) console.log('   - flow.config.topicos_habilitados es false o no existe');
    }
  }

  /**
   * Carga el historial de conversación del contacto
   */
  private async loadHistorial(contactoId: string): Promise<void> {
    try {
      console.log(`\n🔍 [HISTORIAL DEBUG] Intentando cargar historial para contactoId: ${contactoId}`);
      const contacto = await ContactoEmpresaModel.findById(contactoId);
      
      if (!contacto) {
        console.log(`❌ [HISTORIAL DEBUG] Contacto NO encontrado en BD`);
        this.historialConversacion = [];
        return;
      }
      
      console.log(`✅ [HISTORIAL DEBUG] Contacto encontrado: ${contacto.nombre || 'Sin nombre'}`);
      console.log(`   Tiene conversaciones: ${!!contacto.conversaciones}`);
      console.log(`   Tiene historial: ${!!contacto.conversaciones?.historial}`);
      
      if (contacto.conversaciones?.historial) {
        this.historialConversacion = contacto.conversaciones.historial;
        console.log(`📚 [HISTORIAL] Cargado: ${this.historialConversacion.length} mensajes`);
        
        // Mostrar últimos 3 mensajes para debugging
        if (this.historialConversacion.length > 0) {
          console.log(`   Últimos mensajes en historial:`);
          const ultimos = this.historialConversacion.slice(-3);
          ultimos.forEach((msg, i) => {
            console.log(`     ${i + 1}. ${msg.substring(0, 60)}${msg.length > 60 ? '...' : ''}`);
          });
        }
      } else {
        console.log(`⚠️  [HISTORIAL DEBUG] Contacto existe pero NO tiene historial`);
        this.historialConversacion = [];
      }
    } catch (error) {
      console.error('❌ [HISTORIAL DEBUG] Error cargando historial:', error);
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
        verifyToken: config.verifyToken,
        accessToken: config.accessToken // Guardar accessToken para usarlo al enviar mensajes
      };
      console.log(`   ✅ WhatsApp configurado:`);
      console.log(`      Phone Number ID: ${config.phoneNumberId}`);
      console.log(`      Verify Token: ${config.verifyToken}`);
      console.log(`      Access Token: ${config.accessToken ? 'Configurado desde BD' : 'No configurado (usará token centralizado)'}`);
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
    
    // CRÍTICO: Cargar globalVariables desde workflowState de MongoDB
    // Esto permite recuperar productos_formateados del mensaje anterior
    if (contactoId) {
      try {
        const ContactoEmpresaModel = (await import('../models/ContactoEmpresa.js')).ContactoEmpresaModel;
        const contacto = await ContactoEmpresaModel.findById(contactoId);
        
        if (contacto?.workflowState?.globalVariables) {
          console.log('\n📥 Cargando globalVariables desde workflowState...');
          this.globalVariables = { ...contacto.workflowState.globalVariables };
          console.log(`   ✅ ${Object.keys(this.globalVariables).length} variables cargadas desde MongoDB`);
          console.log(`   📋 Variables: ${Object.keys(this.globalVariables).join(', ')}`);
        }
      } catch (errorCarga) {
        console.error('   ⚠️ Error cargando globalVariables (no crítico):', errorCarga);
      }
    }
    
    try {
      console.log(`🚀 Ejecutando flujo: ${flowId}`);
      
      // 1. Cargar flujo de BD
      this.flow = await FlowModel.findById(flowId).lean(); // ← USAR .lean() para obtener objeto plano
      if (!this.flow) {
        throw new Error(`Flujo ${flowId} no encontrado`);
      }

      // 2. Cargar tópicos de conocimiento del flujo
      this.loadTopicos(this.flow);

      // 3. Detectar y guardar configuraciones técnicas de nodos fuente
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
        // Guardar mensaje del usuario en historial
        await this.saveToHistorial(triggerData.message);
        console.log(`📝 Mensaje del usuario guardado en historial`);
      }
      
      console.log(`📋 Variables globales inicializadas:`, Object.keys(this.globalVariables));

      // 3. Encontrar nodo trigger con múltiples estrategias de detección
      let triggerNode = this.flow.nodes.find((n: any) => n.data?.trigger === true);
      
      if (!triggerNode) {
        // Fallback 1: nodo de tipo webhook
        triggerNode = this.flow.nodes.find((n: any) => n.type === 'webhook');
      }
      
      if (!triggerNode) {
        // Fallback 2: nodo WhatsApp con módulo watch-events
        triggerNode = this.flow.nodes.find((n: any) => 
          n.type === 'whatsapp' && n.data?.config?.module === 'watch-events'
        );
      }
      
      if (!triggerNode) {
        // Fallback 3: nodo sin edges entrantes (nodo raíz del flujo)
        const targetIds = new Set(this.flow.edges.map((e: any) => e.target));
        triggerNode = this.flow.nodes.find((n: any) => !targetIds.has(n.id));
      }
      
      if (!triggerNode) {
        console.error('❌ NO SE ENCONTRÓ NODO TRIGGER');
        console.log('🔍 Nodos disponibles:', this.flow.nodes.map((n: any) => ({ id: n.id, type: n.type, trigger: n.data?.trigger })));
        throw new Error('No se encontró nodo trigger en el flujo');
      }
      
      console.log(`✅ Nodo trigger encontrado: ${triggerNode.id} (tipo: ${triggerNode.type})`);

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

        // Si hay múltiples edges, evaluar condiciones o usar routerPath
        let nextEdge;
        if (possibleEdges.length > 1) {
          // Primero intentar evaluar condiciones
          console.log(`   🔀 Múltiples edges detectados (${possibleEdges.length}), evaluando condiciones...`);
          console.log(`   📋 Edges disponibles:`);
          possibleEdges.forEach((e: any) => {
            console.log(`      - ${e.id}: ${e.data?.condition || 'SIN CONDICIÓN'} → ${e.target}`);
          });
          
          let edgeSinCondicion = null;
          
          for (const edge of possibleEdges) {
            if (edge.data?.condition && edge.data.condition.trim() !== '') {
              console.log(`   🔍 Evaluando condición del edge ${edge.id}: ${edge.data.condition}`);
              try {
                const conditionResult = this.evaluateStringCondition(edge.data.condition);
                console.log(`   → Resultado: ${conditionResult}`);
                
                if (conditionResult) {
                  nextEdge = edge;
                  console.log(`   ✅ Condición cumplida, usando edge: ${edge.id}`);
                  break;
                }
              } catch (error) {
                console.error(`   ❌ Error evaluando condición del edge ${edge.id}:`, error);
              }
            } else {
              console.log(`   ⚠️  Edge ${edge.id} NO tiene condición (será usado como fallback)`);
              edgeSinCondicion = edge;
            }
          }
          
          // Si no se encontró edge por condición, usar el edge sin condición (fallback)
          if (!nextEdge) {
            if (edgeSinCondicion) {
              console.log(`   ✅ Usando edge sin condición como fallback: ${edgeSinCondicion.id}`);
              nextEdge = edgeSinCondicion;
            } else {
              // Si no hay edge sin condición, intentar usar routerPath
              const routerPath = this.context[currentNodeId]?.output?._routerPath;
              console.log(`   🔀 No hay edge sin condición, usando routerPath: ${routerPath || 'default'}`);
              
              nextEdge = possibleEdges.find((e: any) => e.sourceHandle === routerPath);
              
              if (!nextEdge) {
                console.log(`   ⚠️  No se encontró edge para ruta ${routerPath}, usando primer edge`);
                nextEdge = possibleEdges[0];
              } else {
                console.log(`   ✅ Edge encontrado para ruta ${routerPath}: ${nextEdge.id}`);
              }
            }
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
      
      // CRÍTICO: Guardar globalVariables en workflowState de MongoDB
      // Esto permite que productos_formateados persista entre mensajes
      console.log('\n🔍 DEBUG GUARDADO DE GLOBALVARIABLES:');
      console.log(`   this.contactoId: ${this.contactoId}`);
      console.log(`   globalVariables keys: ${Object.keys(this.globalVariables).length}`);
      console.log(`   globalVariables: ${JSON.stringify(Object.keys(this.globalVariables))}`);
      
      if (this.contactoId && Object.keys(this.globalVariables).length > 0) {
        try {
          console.log('\n💾 Guardando globalVariables en workflowState...');
          const ContactoEmpresaModel = (await import('../models/ContactoEmpresa.js')).ContactoEmpresaModel;
          
          await ContactoEmpresaModel.findByIdAndUpdate(this.contactoId, {
            $set: {
              'workflowState.globalVariables': this.globalVariables,
              'workflowState.ultimaActualizacion': new Date()
            }
          });
          
          console.log(`   ✅ ${Object.keys(this.globalVariables).length} variables guardadas en MongoDB`);
          console.log(`   📋 Variables: ${Object.keys(this.globalVariables).join(', ')}`);
        } catch (errorGuardado) {
          console.error('   ⚠️ Error guardando globalVariables (no crítico):', errorGuardado);
        }
      } else {
        console.log('   ⚠️ NO SE GUARDAN globalVariables:');
        if (!this.contactoId) {
          console.log('      Razón: this.contactoId es undefined/null');
        }
        if (Object.keys(this.globalVariables).length === 0) {
          console.log('      Razón: globalVariables está vacío');
        }
      }
      
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
        // Verificar si es un nodo de verificación de pago
        if (node.data?.config?.action === 'verificar_pago') {
          return await executeVerificarPagoNode(
            node, 
            input, 
            {
              contactoId: this.contactoId!,
              empresaId: this.getGlobalVariable('telefono_empresa'),
              resolveVariableInString: this.resolveVariableInString.bind(this),
              setGlobalVariable: this.setGlobalVariable.bind(this)
            },
            this.contactoId!,
            this.getGlobalVariable('telefono_empresa')
          );
        }
        
        // Nodo de crear preferencia
        return await executeMercadoPagoNode(node, input, {
          contactoId: this.contactoId!,
          empresaId: this.getGlobalVariable('telefono_empresa'),
          resolveVariableInString: this.resolveVariableInString.bind(this),
          setGlobalVariable: this.setGlobalVariable.bind(this)
        });
      
      case 'http':
        return await this.executeHTTPNode(node, input);
      
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

    // DEBUG: Verificar qué se carga desde la BD
    console.log(`\n🔍 [DEBUG CARGA] Nodo: ${node.id}`);
    console.log(`   node.data.config.tipo desde BD: "${node.data.config?.tipo}"`);
    console.log(`   config.tipo después de cast: "${config.tipo}"`);
    console.log(`   node.data.config completo:`, JSON.stringify(node.data.config, null, 2).substring(0, 500));

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

    // Inyectar tópicos globales automáticamente si están habilitados
    if (this.flow?.config?.topicos_habilitados && this.topicos && Object.keys(this.topicos).length > 0) {
      console.log(`\n📚 [TÓPICOS GLOBALES] Inyectando automáticamente ${Object.keys(this.topicos).length} tópico(s)`);
      
      let topicosSection = '\n\n═══ INFORMACIÓN DE LA EMPRESA ═══\n';
      
      Object.entries(this.topicos).forEach(([key, value]: [string, any]) => {
        console.log(`   - ${key}`);
        
        // Si el tópico tiene estructura de objeto, formatearlo
        if (typeof value === 'object' && value !== null) {
          topicosSection += `\n**${key.toUpperCase().replace(/-/g, ' ')}:**\n`;
          Object.entries(value).forEach(([subKey, subValue]) => {
            topicosSection += `  • ${subKey}: ${subValue}\n`;
          });
        } else {
          topicosSection += `\n**${key.toUpperCase().replace(/-/g, ' ')}:** ${value}\n`;
        }
      });
      
      systemPrompt += topicosSection;
    }

    // Agregar tópicos locales del nodo (si existen) - estos tienen prioridad sobre los globales
    if (config.topicos && config.topicos.length > 0) {
      console.log(`\n📚 [TÓPICOS LOCALES] Agregando ${config.topicos.length} tópico(s) específicos del nodo`);
      
      let topicosSection = '\n\n═══ INFORMACIÓN ADICIONAL (ESPECÍFICA) ═══\n';
      config.topicos.forEach((topico: any, index: number) => {
        console.log(`   ${index + 1}. ${topico.titulo}`);
        topicosSection += `\n**${topico.titulo}:**\n${topico.contenido}\n`;
        if (topico.keywords && topico.keywords.length > 0) {
          topicosSection += `Keywords: ${topico.keywords.join(', ')}\n`;
        }
      });
      
      systemPrompt += topicosSection;
    }

    // Las variables globales se resuelven dinámicamente cuando se usan con {{variable}}
    // No inyectamos la lista completa para mantener el prompt limpio y contextual
    console.log(`\n🔢 [VARIABLES GLOBALES] ${Object.keys(this.globalVariables).length} variable(s) disponibles para resolución dinámica`);

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

    // TODOS LOS NODOS GPT ACCEDEN AL HISTORIAL DE MANERA NATIVA
    console.log(`\n🔍 [HISTORIAL DEBUG] Estado del historial en executeGPTNode:`);
    console.log(`   this.historialConversacion existe: ${!!this.historialConversacion}`);
    console.log(`   this.historialConversacion.length: ${this.historialConversacion?.length || 0}`);
    console.log(`   this.contactoId: ${this.contactoId || 'NO DEFINIDO'}`);
    
    if (this.historialConversacion.length > 0) {
      const maxHistorial = (config as any).maxHistorial ?? this.historialConversacion.length;
      const historialUsado = this.historialConversacion.slice(-maxHistorial);
      console.log(`\n📚 [HISTORIAL NATIVO] Agregando historial: ${historialUsado.length} de ${this.historialConversacion.length} mensajes (maxHistorial: ${maxHistorial})`);
      console.log(`   Tipo de nodo: ${config.tipo || 'N/A'}`);
      console.log(`   Nodo ID: ${node.id}`);
      
      // Agregar historial (alternando user/assistant)
      for (let i = 0; i < historialUsado.length; i++) {
        const msg = historialUsado[i];
        const posicionReal = this.historialConversacion.length - historialUsado.length + i;
        const role = posicionReal % 2 === 0 ? 'user' : 'assistant';
        console.log(`   ${i + 1}. ${role}: ${msg.substring(0, 60)}${msg.length > 60 ? '...' : ''}`);
        messages.push({
          role: role as 'user' | 'assistant',
          content: msg,
        });
      }
      
      console.log(`✅ [HISTORIAL NATIVO] Total de mensajes agregados al contexto GPT: ${historialUsado.length}`);
    } else {
      console.log('\n⚠️  [HISTORIAL NATIVO] Historial vacío');
      console.log(`   Posibles causas:`);
      console.log(`   1. Primera conversación del usuario`);
      console.log(`   2. contactoId no se pasó al FlowExecutor`);
      console.log(`   3. Contacto no tiene historial guardado en BD`);
      console.log(`   4. Error al cargar historial desde BD`);
    }

    // Agregar mensaje actual
    messages.push({
      role: 'user',
      content: userMessage,
    });

    // Preparar output
    const output: any = {};

    // DEBUG: Verificar tipo de nodo
    console.log(`\n🔍 [DEBUG] Tipo de nodo: "${config.tipo}"`);
    console.log(`   ¿Es formateador?: ${config.tipo === 'formateador'}`);
    console.log(`   ¿Tiene extractionConfig?: ${!!config.extractionConfig}`);
    console.log(`   ¿Tiene systemPrompt?: ${!!config.extractionConfig?.systemPrompt}`);

    // IMPORTANTE: Si es formateador, NO hacer llamada inicial a GPT
    // El formateador SOLO extrae datos, no genera respuestas
    if (config.tipo !== 'formateador') {
      // Llamar a OpenAI
      console.log(`\n🤖 Llamando a OpenAI (${config.modelo || 'gpt-3.5-turbo'})...`);
      const resultado = await obtenerRespuestaChat({
        modelo: config.modelo || 'gpt-3.5-turbo',
        historial: messages,
      });

      console.log(`\n✅ RESPUESTA DE GPT:`);
      console.log(`"${resultado.texto}"`);
      console.log(`Tokens: ${resultado.tokens}, Costo: $${resultado.costo}`);

      // Guardar respuesta en output
      output.respuesta_gpt = resultado.texto;
      output.tokens = resultado.tokens;
      output.costo = resultado.costo;

      // Si hay outputVariable configurada (para procesadores), extraer valor específico
      if ((config as any).outputVariable && resultado.texto) {
        const outputVarName = (config as any).outputVariable.trim();
        console.log(`\n📤 Extrayendo output variable: ${outputVarName}`);
        
        // Intentar extraer el valor (asumiendo que el GPT responde con el valor limpio)
        const cleanValue = resultado.texto.trim();
        output[outputVarName] = cleanValue;
        console.log(`   ✅ ${outputVarName} = "${cleanValue}"`);
      }
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

    // ⚠️ NO GUARDAR AQUÍ - El historial se guarda en whatsappController.ts
    // para evitar duplicación de mensajes
    // El FlowExecutor solo usa el historial en memoria (this.historialConversacion)
    console.log('\n📝 Historial se guardará al finalizar el flujo (whatsappController.ts)');
    console.log('   Evitando duplicación de mensajes...');
    
    console.log(`   📊 Total mensajes en historial: ${this.historialConversacion.length}`);

    // CRÍTICO: Procesar extracción DESPUÉS del GPT conversacional
    // Esto asegura que todos los nodos previos estén en el contexto
    // DEBUG: Verificar condición de extracción
    console.log(`\n🔍 [DEBUG] Verificando condición de extracción:`);
    console.log(`   config.tipo === 'formateador': ${config.tipo === 'formateador'}`);
    console.log(`   config.extractionConfig existe: ${!!config.extractionConfig}`);
    console.log(`   config.extractionConfig?.enabled: ${config.extractionConfig?.enabled}`);
    console.log(`   config.extractionConfig?.systemPrompt existe: ${!!config.extractionConfig?.systemPrompt}`);
    console.log(`   Condición completa: ${(config.tipo === 'formateador' || config.extractionConfig?.enabled) && config.extractionConfig?.systemPrompt}`);

    // Procesar extracción de datos si es formateador O si extractionConfig está habilitado
    if ((config.tipo === 'formateador' || config.extractionConfig?.enabled) && config.extractionConfig?.systemPrompt) {
      console.log('   🔧 Usando extractionConfig del frontend');
      
      // Determinar fuente de datos
      const fuenteDatos = config.extractionConfig.contextSource || 'historial_completo';
      
      let contexto = '';
      if (fuenteDatos === 'historial_completo') {
        // CRÍTICO: Agregar productos_formateados al contexto si existe
        // Esto permite que el GPT arme el carrito incluso si el historial está vacío
        const productosFormateados = this.getGlobalVariable('productos_formateados');
        if (productosFormateados) {
          contexto += `📚 PRODUCTOS DISPONIBLES:\n${productosFormateados}\n\n`;
          console.log('   ✅ productos_formateados agregado al contexto del GPT');
        }
        
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
      const extractionConfigAny = config.extractionConfig as any;
      const variablesToExtract = extractionConfigAny.variablesToExtract || config.extractionConfig.variables || [];
      console.log(`📋 Variables a extraer: ${variablesToExtract.map((v: any) => `${v.nombre}${v.requerido ? '*' : ''}`).join(', ')}`);
      
      // CRÍTICO: Resolver variables en extractionConfig.systemPrompt antes de enviar a GPT
      const extractionConfigResolved = {
        ...config.extractionConfig,
        systemPrompt: this.resolveVariableInString(config.extractionConfig.systemPrompt)
      };
      
      // Usar extractionConfig.systemPrompt + extractionConfig.variablesToExtract
      let datosExtraidos;
      try {
        datosExtraidos = await GPTPromptBuilder.extractWithFrontendConfig(
          contexto,
          extractionConfigResolved,
          this.globalVariables // Pasar variables globales como contexto
        );
      } catch (error: any) {
        console.error('\n❌ ERROR EN EXTRACCIÓN GPT:');
        console.error(`   Mensaje: ${error.message}`);
        console.error(`   Stack: ${error.stack?.substring(0, 200)}`);
        throw error;
      }
      
      console.log('\n✅ DATOS EXTRAÍDOS POR GPT:');
      console.log(JSON.stringify(datosExtraidos, null, 2));
      console.log(`\n📊 Resumen: ${Object.keys(datosExtraidos).length} variable(s) extraída(s)`);
      
      // 🔧 LÓGICA DIRECTA: Detectar confirmación automáticamente
      // Si el nodo es gpt-armar-carrito y el usuario confirma, forzar confirmacion_compra=true
      if (node.id === 'gpt-armar-carrito') {
        const mensajeUsuario = userMessage.toLowerCase().trim();
        const palabrasConfirmacion = ['si', 'sí', 'sii', 'confirmo', 'dale', 'ok', 'acepto', 'confirmar'];
        const esConfirmacion = palabrasConfirmacion.some(palabra => mensajeUsuario === palabra || mensajeUsuario.includes(palabra));
        
        if (esConfirmacion) {
          console.log('\n🎯 CONFIRMACIÓN DETECTADA AUTOMÁTICAMENTE');
          console.log(`   Mensaje: "${mensajeUsuario}"`);
          
          // Obtener mensaje_carrito de variables globales
          const mensajeCarrito = this.getGlobalVariable('mensaje_carrito');
          const productosPresent = this.getGlobalVariable('productos_presentados');
          
          if (mensajeCarrito || productosPresent) {
            console.log('   ✅ Forzando confirmacion_compra = true');
            datosExtraidos.confirmacion_compra = true;
            
            // Si hay mensaje_carrito, extraer productos de ahí
            if (mensajeCarrito && typeof mensajeCarrito === 'string') {
              console.log('   📦 Extrayendo productos del mensaje_carrito...');
              
              // Parsear formato: "📦 NOMBRE - $PRECIO x CANTIDAD = $SUBTOTAL"
              const lineas = mensajeCarrito.split('\n');
              const items: any[] = [];
              let totalCalculado = 0;
              
              for (const linea of lineas) {
                const match = linea.match(/📦\s*(.+?)\s*-\s*\$(\d+)\s*x\s*(\d+)\s*=\s*\$(\d+)/);
                if (match) {
                  const [, nombre, precio, cantidad, subtotal] = match;
                  items.push({
                    id: `producto-${items.length + 1}`,
                    nombre: nombre.trim(),
                    precio: parseInt(precio),
                    cantidad: parseInt(cantidad),
                    imagen: '',
                    permalink: ''
                  });
                  totalCalculado += parseInt(subtotal);
                  console.log(`      ✅ ${nombre.trim()} - $${precio} x ${cantidad}`);
                }
              }
              
              if (items.length > 0) {
                datosExtraidos.carrito_items = items;
                datosExtraidos.carrito_total = totalCalculado;
                datosExtraidos.mensaje_carrito = mensajeCarrito;
                console.log(`   ✅ ${items.length} producto(s) extraído(s)`);
                console.log(`   💰 Total: $${totalCalculado}`);
              }
            }
            // Si no hay mensaje_carrito pero hay productos_presentados, usar esos
            else if (productosPresent && Array.isArray(productosPresent) && productosPresent.length > 0) {
              console.log('   📦 Usando productos_presentados...');
              const producto = productosPresent[0];
              
              // Extraer cantidad del mensaje del usuario
              const cantidadMatch = mensajeUsuario.match(/(\d+)/);
              const cantidad = cantidadMatch ? parseInt(cantidadMatch[1]) : 1;
              
              const items = [{
                id: 'producto-1',
                nombre: producto.titulo,
                precio: parseInt(producto.precio),
                cantidad: cantidad,
                imagen: '',
                permalink: producto.url || ''
              }];
              
              const total = parseInt(producto.precio) * cantidad;
              datosExtraidos.carrito_items = items;
              datosExtraidos.carrito_total = total;
              datosExtraidos.mensaje_carrito = `📦 ${producto.titulo} - $${producto.precio} x ${cantidad} = $${total}`;
              
              console.log(`   ✅ Producto: ${producto.titulo} x${cantidad}`);
              console.log(`   💰 Total: $${total}`);
            }
          } else {
            console.log('   ⚠️  No hay mensaje_carrito ni productos_presentados para confirmar');
          }
        }
      }
      
      // Variables que deben limpiarse siempre cuando GPT extrae null (no persisten entre mensajes)
      const variablesSiempreLimpiar = ['confirmacion_usuario'];

      // Guardar cada dato extraído en variables globales
      // IMPORTANTE: Hacer merge con variables existentes para mantener valores previos
      console.log('\n💾 Guardando variables globales (con merge):');
      for (const [nombre, valor] of Object.entries(datosExtraidos)) {
        // Si el valor es null/undefined/"", verificar si ya existe una variable con ese nombre
        if (valor === undefined || valor === null || valor === '') {
          // Estas variables siempre se limpian - no deben persistir del mensaje anterior
          if (variablesSiempreLimpiar.includes(nombre)) {
            console.log(`   🧹 ${nombre} = null (limpiada, no persiste entre mensajes)`);
            this.setGlobalVariable(nombre, null);
            output[nombre] = null;
            continue;
          }
          const existingValue = this.getVariableValue(nombre);
          if (existingValue !== undefined && existingValue !== null && existingValue !== '') {
            // Mantener el valor existente
            console.log(`   🔄 ${nombre} = "${JSON.stringify(existingValue)?.substring(0, 100)}" (mantenido del historial)`);
            output[nombre] = existingValue;
          } else {
            console.log(`   ⚠️  ${nombre} = ${valor} (no guardado, no existe valor previo)`);
          }
        } else {
          // Limpiar comillas extra si el valor es un string que viene con comillas del JSON
          let valorLimpio = valor;
          if (typeof valor === 'string' && valor.startsWith('"') && valor.endsWith('"')) {
            valorLimpio = valor.slice(1, -1);
            console.log(`   🧹 Limpiando comillas extra: "${valor}" → "${valorLimpio}"`);
          }
          
          // Guardar el nuevo valor
          console.log(`   ✅ ${nombre} = "${JSON.stringify(valorLimpio)?.substring(0, 100)}"`);
          this.setGlobalVariable(nombre, valorLimpio);
          output[nombre] = valorLimpio;
        }
      }
      
      console.log('\n📋 VARIABLES GLOBALES ACTUALES:');
      Object.entries(this.globalVariables).forEach(([key, value]) => {
        console.log(`   ${key} = "${JSON.stringify(value)?.substring(0, 100)}"`);
      });
      
      // Generar variables_completas y variables_faltantes
      const variablesConfig = extractionConfigAny.variablesToExtract || config.extractionConfig.variables || [];
      if (variablesConfig.length > 0) {
        const variablesFaltantes: string[] = [];
        
        console.log('\n🔍 VALIDANDO VARIABLES (requerido vs opcional):');
        for (const varConfig of variablesConfig) {
          const valor = output[varConfig.nombre] || this.getGlobalVariable(varConfig.nombre);
          
          // CRÍTICO: Solo marcar como faltante si es REQUERIDA y está vacía
          // Variables opcionales (requerido: false) pueden ser null sin problema
          const estaVacia = valor === null || valor === undefined || valor === '';
          const esRequerida = varConfig.requerido === true;
          
          console.log(`   📌 ${varConfig.nombre}: requerido=${esRequerida}, valor=${estaVacia ? 'VACÍO' : 'PRESENTE'}`);
          
          if (estaVacia && esRequerida) {
            variablesFaltantes.push(varConfig.nombre);
            console.log(`      ⚠️  → FALTANTE (requerida y vacía)`);
          } else if (estaVacia && !esRequerida) {
            console.log(`      ✅ → OK (opcional, puede estar vacía)`);
          } else {
            console.log(`      ✅ → OK (tiene valor)`);
          }
        }
        
        output.variables_completas = variablesFaltantes.length === 0;
        output.variables_faltantes = variablesFaltantes;
        
        console.log('\n📊 VALIDACIÓN DE VARIABLES:');
        console.log(`   variables_completas: ${output.variables_completas}`);
        console.log(`   variables_faltantes: ${JSON.stringify(output.variables_faltantes)}`);
      }
      
      // 🛒 PERSISTIR CARRITO EN MONGODB si se extrajo carrito_items
      const empresaId = this.getGlobalVariable('telefono_empresa');
      if (datosExtraidos.carrito_items && this.contactoId && empresaId) {
        console.log('\n🛒 PERSISTIENDO CARRITO EN MONGODB...');
        try {
          let carritoItems = datosExtraidos.carrito_items;
          
          // Si carrito_items es un string JSON, parsearlo
          if (typeof carritoItems === 'string') {
            try {
              carritoItems = JSON.parse(carritoItems);
            } catch (e) {
              console.error('   ❌ Error parseando carrito_items:', e);
              carritoItems = [];
            }
          }
          
          // Asegurar que sea un array
          if (!Array.isArray(carritoItems)) {
            console.log('   ⚠️  carrito_items no es un array, convirtiéndolo...');
            carritoItems = [carritoItems];
          }
          
          if (carritoItems.length > 0) {
            console.log(`   📦 ${carritoItems.length} producto(s) a persistir`);
            
            // 🧪 TESTING MODE: Hardcodear precio a $0.20 (20 centavos ARS)
            const TESTING_MODE = true;
            const TESTING_PRICE = 0.20;
            
            if (TESTING_MODE) {
              console.log(`   🧪 TESTING MODE ACTIVADO: Precio hardcodeado a $${TESTING_PRICE}`);
            }
            
            // Limpiar el carrito actual primero
            await CarritoService.vaciarCarrito(
              new mongoose.Types.ObjectId(this.contactoId),
              empresaId
            );
            console.log('   🧹 Carrito limpiado');
            
            // Agregar cada producto al carrito
            for (const item of carritoItems) {
              if (item.id && item.nombre && item.precio) {
                const precioFinal = TESTING_MODE ? TESTING_PRICE : item.precio;
                await CarritoService.agregarProducto(
                  new mongoose.Types.ObjectId(this.contactoId),
                  empresaId,
                  {
                    id: String(item.id),
                    name: item.nombre,
                    price: String(precioFinal),
                    cantidad: item.cantidad || 1,
                    image: item.imagen,
                    permalink: item.permalink
                  },
                  this.getGlobalVariable('telefono_cliente')
                );
                console.log(`   ✅ Agregado: ${item.nombre} x${item.cantidad || 1} a $${precioFinal}`);
              }
            }
            
            // Obtener el carrito actualizado para verificar el total
            const carritoActualizado = await CarritoService.obtenerCarritoActivo(
              new mongoose.Types.ObjectId(this.contactoId),
              empresaId
            );
            
            console.log(`   💰 Total en BD: $${carritoActualizado.total}`);
            
            // Actualizar carrito_total en variables globales con el total REAL de la BD
            this.setGlobalVariable('carrito_total', carritoActualizado.total);
            output.carrito_total = carritoActualizado.total;
            
            console.log('   ✅ Carrito persistido en MongoDB');
          } else {
            console.log('   ⚠️  carrito_items está vacío, no se persiste');
          }
        } catch (error: any) {
          console.error('   ❌ Error persistiendo carrito:', error.message);
        }
      }
      
    } else if (config.variablesRecopilar && config.variablesRecopilar.length > 0) {
      // MODO LEGACY: Extracción simple con variablesRecopilar
      console.log('   🔧 Usando extracción legacy (variablesRecopilar)');
      console.log(`   ⚠️  ADVERTENCIA: Este nodo tiene variablesRecopilar (legacy)`);
      
      // Primero verificar qué variables faltan ANTES de extraer
      const todasLasGlobalesAntes = this.getAllGlobalVariables();
      const validacionAntes = GPTPromptBuilder.validateVariables(
        todasLasGlobalesAntes,
        config.variablesRecopilar
      );
      
      console.log(`   📊 Variables faltantes ANTES de extraer: ${JSON.stringify(validacionAntes.faltantes)}`);
      
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
      
      console.log(`   📨 Mensaje del usuario: "${userMessage}"`);
      console.log(`   📤 Enviando a GPT-3.5 para extracción...`);
      
      // Extracción con GPT (el prompt en GPTPromptBuilder ya maneja "cualquiera")
      const variablesExtraidas = await GPTPromptBuilder.extractVariables(
        contextoCompleto,
        config.variablesRecopilar
      );
      
      console.log(`   ✅ Variables extraídas por GPT: ${JSON.stringify(variablesExtraidas)}`);
      
      // Guardar cada variable extraída en variables globales
      for (const [nombre, valor] of Object.entries(variablesExtraidas)) {
        if (valor !== undefined && valor !== null && valor !== '') {
          console.log(`   💾 Guardando variable global: ${nombre} = ${JSON.stringify(valor)?.substring(0, 100)}`);
          this.setGlobalVariable(nombre, valor);
          output[nombre] = valor;
        }
      }
      
      if (Object.keys(variablesExtraidas).length > 0) {
        console.log(`   📝 Variables guardadas: ${Object.keys(variablesExtraidas).join(', ')}`);
      }
      
      console.log(`   📋 globalVariables DESPUÉS de guardar: ${JSON.stringify(Object.keys(this.globalVariables))}`);
      
      // Validar si todas las variables obligatorias están completas
      const todasLasGlobales = this.getAllGlobalVariables();
      const validacion = GPTPromptBuilder.validateVariables(
        todasLasGlobales,
        config.variablesRecopilar
      );
      
      output.variables_completas = validacion.valido;
      output.variables_faltantes = validacion.faltantes;
      
      console.log(`   🎯 RESULTADO: variables_completas = ${validacion.valido}, faltantes = ${JSON.stringify(validacion.faltantes)}`);
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

    // Guardar variables globales si están configuradas + auto-extracción si faltan
    if (config.globalVariablesOutput && Array.isArray(config.globalVariablesOutput) && config.globalVariablesOutput.length > 0) {
      console.log(`\n💾 [globalVariablesOutput] Procesando ${config.globalVariablesOutput.length} variables`);
      
      // Verificar si hay variables faltantes en el output
      const variablesFaltantes = config.globalVariablesOutput.filter(varName => 
        output[varName] === undefined && 
        (!output.datos_estructurados || output.datos_estructurados[varName] === undefined)
      );
      
      // Si hay variables faltantes Y el nodo tiene respuesta_gpt, intentar auto-extracción
      if (variablesFaltantes.length > 0 && output.respuesta_gpt) {
        console.log(`   ⚠️  Variables faltantes: ${variablesFaltantes.join(', ')}`);
        console.log(`   🤖 Intentando auto-extracción desde historial...`);
        
        try {
          // Construir contexto completo
          let contextoCompleto = '';
          if (this.historialConversacion.length > 0) {
            for (let i = 0; i < this.historialConversacion.length; i += 2) {
              const userMsg = this.historialConversacion[i];
              const assistantMsg = this.historialConversacion[i + 1];
              if (userMsg) contextoCompleto += `Usuario: ${userMsg}\n`;
              if (assistantMsg) contextoCompleto += `Asistente: ${assistantMsg}\n`;
            }
          }
          if (userMessage) contextoCompleto += `Usuario: ${userMessage}\n`;
          contextoCompleto += `Asistente: ${output.respuesta_gpt}`;
          
          // Prompt de extracción
          const extractionPrompt = `Analiza la conversación y extrae la información en formato JSON.

Variables a extraer:
${variablesFaltantes.map(v => `- ${v}`).join('\n')}

Conversación:
${contextoCompleto}

IMPORTANTE:
- Responde SOLO con un objeto JSON válido
- Si algún dato no está presente, usa null
- Para arrays vacíos, usa []
- Para números, usa el valor numérico sin comillas

Ejemplo:
{
  "carrito_items": [{"id": "123", "nombre": "Producto", "precio": 100, "cantidad": 1}],
  "carrito_total": 100
}`;

          const extractionResult = await obtenerRespuestaChat({
            modelo: 'gpt-3.5-turbo',
            historial: [{ role: 'user', content: extractionPrompt }]
          });
          
          const extractionResponse = extractionResult.texto;
          console.log(`   📄 Respuesta de extracción: ${extractionResponse.substring(0, 200)}`);
          
          const jsonMatch = extractionResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const datosExtraidos = JSON.parse(jsonMatch[0]);
            console.log(`   ✅ Datos extraídos:`, datosExtraidos);
            
            for (const [key, value] of Object.entries(datosExtraidos)) {
              if (value !== null && value !== undefined) {
                output[key] = value;
                console.log(`      💾 ${key} = ${JSON.stringify(value)?.substring(0, 100)}`);
              }
            }
          }
        } catch (error: any) {
          console.warn(`   ⚠️  Error en auto-extracción: ${error.message}`);
        }
      }
      
      // Ahora guardar todas las variables en globalVariables
      for (const globalVar of config.globalVariablesOutput) {
        if (output[globalVar] !== undefined) {
          this.setGlobalVariable(globalVar, output[globalVar]);
          console.log(`   ✅ ${globalVar} guardado en globalVariables`);
        } else if (output.datos_estructurados && output.datos_estructurados[globalVar] !== undefined) {
          this.setGlobalVariable(globalVar, output.datos_estructurados[globalVar]);
          console.log(`   ✅ ${globalVar} guardado desde datos_estructurados`);
        } else {
          console.log(`   ⚠️  ${globalVar} no encontrado en output`);
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

    // Si no tiene module configurado, asumir 'send-message' por defecto
    const module = config.module || 'send-message';
    
    // Solo ejecutar si es send-message
    if (module !== 'send-message') {
      console.log(`   Módulo WhatsApp: ${module} (skip)`);
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
    // Primero intentar desde globalVariables (viene del webhook inicial)
    let phoneNumberId = (this.globalVariables['phoneNumberId'] as string) || '';
    
    // Si no hay en globalVariables, intentar desde config
    if (!phoneNumberId && config.phoneNumberId) {
      phoneNumberId = config.phoneNumberId;
    }
    
    // Si no hay en config, usar flowConfig o env
    if (!phoneNumberId) {
      phoneNumberId = this.flowConfig.whatsapp?.phoneNumberId || 
                     process.env.META_PHONE_NUMBER_ID || '';
    }

    console.log(`   → ${telefono}`);

    // Obtener accessToken desde config del nodo o flowConfig
    const accessToken = config.accessToken || this.flowConfig.whatsapp?.accessToken;
    
    console.log(`   🔑 Access Token: ${accessToken ? 'Usando token de BD' : 'Usando token centralizado'}`);

    // Agregar identificador de nodo para debugging
    const mensajeConDebug = `${mensaje}\n\n🔧 [${node.id}]`;

    console.log(`   📤 Nodo emisor: ${node.id}`);

    // Enviar mensaje
    await enviarMensajeWhatsAppTexto(
      telefono,
      mensajeConDebug,
      phoneNumberId,
      accessToken // Pasar accessToken al servicio
    );

    // Guardar respuesta del bot en historial
    await this.saveToHistorial(mensaje);
    console.log(`   📝 Respuesta del bot guardada en historial`);

    // Limpiar variables si está configurado
    if (config.clearVariablesOnExecute && Array.isArray(config.clearVariablesOnExecute)) {
      console.log(`\n🧹 Limpiando variables después de enviar mensaje:`);
      for (const varName of config.clearVariablesOnExecute) {
        if (this.globalVariables[varName] !== undefined) {
          console.log(`   🗑️  ${varName} = ${JSON.stringify(this.globalVariables[varName])?.substring(0, 50)} → null`);
          this.setGlobalVariable(varName, null);
        }
      }
    }

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
      const possibleFields = ['respuesta_gpt', 'texto', 'content', 'body', 'mensaje'];
      for (const field of possibleFields) {
        if (input[field]) {
          console.log(`      ✅ Usando input.${field}`);
          const fieldValue = String(input[field]);
          console.log('      Antes de resolver:', fieldValue.substring(0, 150));
          // IMPORTANTE: Resolver variables también en campos de input (ej: respuesta_gpt de nodos GPT)
          const resolved = this.resolveVariableInString(fieldValue);
          console.log('      Después de resolver:', resolved.substring(0, 150));
          if (resolved && resolved.trim() !== '') {
            return resolved;
          }
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
        
        if (apiConfig) {
          // WooCommerce usa autenticacion.tipo = "basic" con username/password
          connection = {
            eshopUrl: apiConfig.baseUrl,
            consumerKey: apiConfig.autenticacion?.configuracion?.username || '',
            consumerSecret: apiConfig.autenticacion?.configuracion?.password || ''
          };
          console.log(`   ✅ Conexión WooCommerce cargada desde BD`);
          console.log(`   📍 URL: ${connection.eshopUrl}`);
        } else {
          console.log(`   ⚠️  API Config no encontrado`);
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
    console.log(`   🔍 [DEBUG] Resolviendo parámetros de WooCommerce...`);
    console.log(`   🔍 [DEBUG] config.params:`, JSON.stringify(config.params));
    
    for (const [key, value] of Object.entries(config.params || {})) {
      const stringValue = String(value);
      console.log(`   🔍 [DEBUG] Procesando param "${key}": "${stringValue}"`);
      
      // Si tiene formato {{variable}}, usar resolveVariableInString
      if (stringValue.includes('{{')) {
        const resolved = this.resolveVariableInString(stringValue);
        console.log(`   🔍 [DEBUG] Variable "${stringValue}" → "${resolved}"`);
        params[key] = resolved;
      } else {
        // Si no, intentar resolver como referencia directa
        const resolved = this.getVariableValue(stringValue) || stringValue;
        console.log(`   🔍 [DEBUG] Valor directo "${stringValue}" → "${resolved}"`);
        params[key] = resolved;
      }
    }
    
    console.log(`   📦 Parámetros RESUELTOS:`, JSON.stringify(params));
    console.log(`   🔍 [DEBUG] params.search = "${params.search}"`);
    console.log(`   🔍 [DEBUG] params.category = "${params.category}"`);
    
    // Ejecutar módulo específico
    let result: any;
    
    try {
      switch (config.module) {
        case 'get-product':
          result = await wooService.getProduct(params.productId);
          break;
        
        case 'search-product':
          // Construir objeto de búsqueda solo con parámetros válidos
          const searchParams: any = {};
          
          // Helper para validar si un parámetro es válido
          const isValidParam = (value: any): boolean => {
            if (!value) return false; // null, undefined, '', 0, false
            const strValue = String(value).trim();
            if (strValue === '') return false; // string vacío
            if (strValue.includes('{{')) return false; // placeholder sin resolver
            if (strValue === 'undefined' || strValue === 'null') return false; // strings literales
            return true;
          };
          
          // Solo incluir search si existe y es válido
          if (isValidParam(params.search)) {
            searchParams.search = params.search;
            console.log(`   ✅ Incluido params.search: "${params.search}"`);
          } else {
            console.log(`   ⏭️  Omitido params.search (no válido o vacío)`);
          }
          
          // Solo incluir category si existe y es válido
          if (isValidParam(params.category)) {
            searchParams.category = params.category;
            console.log(`   ✅ Incluido params.category: "${params.category}"`);
          } else {
            console.log(`   ⏭️  Omitido params.category (no válido o vacío)`);
          }
          
          // Incluir otros parámetros
          if (params.per_page) searchParams.per_page = params.per_page;
          if (params.orderby) searchParams.orderby = params.orderby;
          
          console.log(`   📦 Parámetros de búsqueda (solo válidos):`, JSON.stringify(searchParams));
          
          // 🛡️ FALLBACK ROBUSTO: Detectar múltiples productos incluso sin " | "
          let searchText = searchParams.search || '';
          
          // Si no tiene " | " pero tiene separadores comunes, agregarlos
          if (searchText && !searchText.includes(' | ')) {
            // Detectar patrones de múltiples productos
            const hasMultipleProducts = 
              searchText.match(/\s+y\s+/i) ||      // "Binaria 1 y Lecturas"
              searchText.match(/,\s*/g) ||          // "Matemática 5, Lengua 5"
              searchText.match(/\s+más\s+/i) ||    // "libro 1 más libro 2"
              searchText.match(/\s+e\s+/i);        // "libro 1 e historia"
            
            if (hasMultipleProducts) {
              console.log(`   🛡️ FALLBACK: Detectados múltiples productos sin " | ", normalizando...`);
              console.log(`   📝 Original: "${searchText}"`);
              
              // Normalizar separadores a " | "
              searchText = searchText
                .replace(/\s*,\s*/g, ' | ')        // Comas
                .replace(/\s+y\s+/gi, ' | ')       // "y"
                .replace(/\s+e\s+/gi, ' | ')       // "e"
                .replace(/\s+más\s+/gi, ' | ')     // "más"
                .replace(/\s*\|\s*/g, ' | ')       // Normalizar pipes
                .trim();
              
              searchParams.search = searchText;
              console.log(`   ✅ Normalizado: "${searchText}"`);
            }
          }
          
          // Detectar búsqueda múltiple (separada por " | ")
          if (searchParams.search && searchParams.search.includes(' | ')) {
            console.log(`   🔍 BÚSQUEDA MÚLTIPLE detectada`);
            const terminos = searchParams.search.split(' | ').map((t: string) => t.trim());
            console.log(`   📚 Buscando ${terminos.length} libro(s): ${terminos.join(', ')}`);
            
            // Buscar cada término por separado
            const resultadosPorTermino = await Promise.all(
              terminos.map(async (termino: string) => {
                // Normalizar cada término
                const terminoNormalizado = termino
                  .replace(/\s*\d+\s*$/, '') // Eliminar números al final
                  .replace(/\s+/g, ' ')       // Normalizar espacios
                  .trim();
                
                console.log(`   🔍 Buscando: "${termino}" → "${terminoNormalizado}"`);
                
                const productos = await wooService.searchProducts({
                  ...searchParams,
                  search: terminoNormalizado
                });
                
                console.log(`      ✅ ${productos.length} producto(s) encontrado(s)`);
                return productos;
              })
            );
            
            // Combinar todos los resultados (sin duplicados)
            const productosUnicos = new Map();
            resultadosPorTermino.flat().forEach((producto: any) => {
              productosUnicos.set(producto.id, producto);
            });
            
            result = Array.from(productosUnicos.values());
            console.log(`   ✅ Total productos únicos: ${result.length}`);
            
          } else {
            // Búsqueda simple (un solo término)
            
            // Mapeo de categorías conocidas a IDs de WooCommerce
            const categoryMap: Record<string, number> = {
              'autoayuda': 137,
              'auto ayuda': 137,
              'novela': 177,
              'novelas': 177,
              'infantil': 147,
              'infantiles': 147,
              'clasico': 166,
              'clasicos': 166,
              'clásico': 166,
              'clásicos': 166,
              'desarrollo personal': 135,
              'didactico': 220,
              'didacticos': 220,
              'didáctico': 220,
              'didácticos': 220,
              'escolares': 164,
              'escolar': 164,
              'literatura general': 146,
              'cuentos': 176,
              'cuento': 176
            };
            
            // Detectar si el término de búsqueda es una categoría conocida
            if (searchParams.search) {
              const searchLower = String(searchParams.search).toLowerCase().trim();
              const categoryId = categoryMap[searchLower];
              
              if (categoryId) {
                console.log(`   🏷️  CATEGORÍA DETECTADA: "${searchParams.search}" → ID ${categoryId}`);
                console.log(`   📂 Buscando por categoría en lugar de texto`);
                
                // Buscar por categoría en lugar de por texto
                delete searchParams.search;
                searchParams.category = categoryId;
              } else {
                // No es una categoría, normalizar término de búsqueda
                const searchNormalized = searchLower
                  .replace(/\s*\d+\s*$/, '') // Eliminar números al final
                  .replace(/\s+/g, ' ')       // Normalizar espacios
                  .trim();
                
                console.log(`   🔍 Búsqueda original: "${searchParams.search}"`);
                console.log(`   🔍 Búsqueda normalizada: "${searchNormalized}"`);
                
                searchParams.search = searchNormalized;
              }
            }
            
            result = await wooService.searchProducts(searchParams);
            console.log(`   ✅ Productos encontrados: ${result.length}`);
          }
          
          if (result.length === 0) {
            console.log(`   ⚠️  ADVERTENCIA: No se encontraron productos para "${searchParams.search || 'búsqueda vacía'}"`);
            console.log(`   💡 Sugerencia: Verificar que el término de búsqueda coincida con productos en WooCommerce`);
          }
          
          // Simplificar productos para GPT (solo título, precio, URL)
          // Configurable desde el frontend mediante config.productFieldMappings
          let productosSimplificados;
          try {
            productosSimplificados = this.simplifyProductsForGPT(
              result,
              config.productFieldMappings,
              connection.eshopUrl // Pasar baseUrl para construir URLs completas
            );
          } catch (error: any) {
            console.error(`   ❌ ERROR simplificando productos: ${error.message}`);
            throw error;
          }
          
          console.log(`   📊 Productos simplificados para GPT: ${productosSimplificados.length}`);
          console.log(`   📋 Campos por producto: ${Object.keys(productosSimplificados[0] || {}).join(', ')}`);
          
          if (productosSimplificados.length > 0) {
            const primerProducto = productosSimplificados[0];
            console.log(`   🔗 Ejemplo URL generada: ${primerProducto.url}`);
            console.log(`   💰 Ejemplo precio: $${primerProducto.precio}`);
          }
          
          // IMPORTANTE: Guardar productos como variable global para que el clasificador los detecte
          if (productosSimplificados.length > 0) {
            this.setGlobalVariable('productos_presentados', productosSimplificados);
            console.log(`   ✅ Guardado productos_presentados en global variables (${productosSimplificados.length} productos)`);
            
            // CRÍTICO: Formatear productos en texto legible para GPT
            // GPT no interpreta bien JSON crudo, necesita texto formateado
            const productosFormateados = productosSimplificados.map((p: any, i: number) => 
              `${i + 1}. ${p.titulo}\n   💰 Precio: $${p.precio}\n   📦 Stock: ${p.stock}\n   🔗 Link: ${p.url}`
            ).join('\n\n');
            
            this.setGlobalVariable('productos_formateados', productosFormateados);
            console.log(`   ✅ Guardado productos_formateados (texto legible para GPT)`);
            console.log(`   📝 Preview:\n${productosFormateados.substring(0, 200)}...`);
          }
          
          // Retornar en formato { productos: [...] } para que sea accesible como woocommerce.productos
          return {
            output: {
              productos: productosSimplificados,
              productos_completos: result, // Guardar versión completa por si se necesita
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
      
      // En lugar de lanzar el error, devolver un mensaje amigable al usuario
      // Esto permite que el flujo continúe y el usuario reciba una respuesta
      const mensajeError = '😔 Disculpá, estamos teniendo problemas técnicos para buscar productos en este momento.\n\n' +
                          '¿Podrías intentar de nuevo en unos minutos?\n\n' +
                          'Si el problema persiste, contactanos directamente. ¡Gracias por tu paciencia! 🙏';
      
      // Guardar mensaje de error en variables globales para que el siguiente nodo pueda usarlo
      this.setGlobalVariable('error_woocommerce', mensajeError);
      this.setGlobalVariable('productos_formateados', mensajeError);
      
      console.log(`   ⚠️  Devolviendo mensaje de error amigable al usuario`);
      
      return {
        output: {
          productos: [],
          count: 0,
          error: true,
          mensaje_error: mensajeError
        }
      };
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
    condition = condition.trim();
    console.log(`      Condición original: ${condition}`);

    // Casos especiales: true/false literales
    if (condition.trim() === 'true') return true;
    if (condition.trim() === 'false') return false;

    // SOPORTE PARA PARÉNTESIS: resolver grupos ANTES de evaluar OR/AND
    // Esto es crítico para condiciones como: A AND (B OR C) AND D
    if (condition.includes('(')) {
      // Reemplazar el grupo más interno (sin paréntesis anidados) por su resultado
      const resolved = condition.replace(/\(([^()]+)\)/g, (_, inner) => {
        const innerResult = this.evaluateStringCondition(inner.trim());
        console.log(`      → Grupo (${inner.trim()}) = ${innerResult}`);
        return innerResult ? 'true' : 'false';
      });
      console.log(`      → Condición con paréntesis resueltos: ${resolved}`);
      return this.evaluateStringCondition(resolved);
    }

    // SOPORTE PARA OPERADORES LÓGICOS (OR, AND, ||, &&)
    // IMPORTANTE: Solo splitear por OR/AND cuando NO hay paréntesis sin resolver
    // Evaluar AND primero (mayor precedencia), luego OR
    if (condition.includes(' AND ') || condition.includes(' && ')) {
      console.log(`      → Detectado operador AND/&&`);
      const parts = condition.split(/ AND | && /).map(p => p.trim());
      const results = parts.map(part => this.evaluateStringCondition(part));
      console.log(`      → Partes: ${parts.length}, Resultados: ${results.join(', ')}`);
      const result = results.every(r => r === true);
      console.log(`      → AND resultado: ${result}`);
      return result;
    }

    if (condition.includes(' OR ') || condition.includes(' || ')) {
      console.log(`      → Detectado operador OR/||`);
      const parts = condition.split(/ OR | \|\| /).map(p => p.trim());
      const results = parts.map(part => this.evaluateStringCondition(part));
      console.log(`      → Partes: ${parts.length}, Resultados: ${results.join(', ')}`);
      const result = results.some(r => r === true);
      console.log(`      → OR resultado: ${result}`);
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

    // Patrón: "{{variable}} equals value" o "{{variable}} equal value"
    const equalsMatch = condition.match(/\{\{([^}]+)\}\}\s+equals?\s+(.+)$/i);
    if (equalsMatch) {
      const varName = equalsMatch[1].trim();
      const expectedValue = equalsMatch[2].trim();
      console.log(`      → Detectado 'equals' para variable: "${varName}"`);
      
      const actualValue = this.getVariableValue(varName);
      
      // Normalizar valores para comparación
      const normalizedActual = String(actualValue).toLowerCase().trim();
      const normalizedExpected = expectedValue.toLowerCase().trim();
      
      const result = normalizedActual === normalizedExpected;
      
      console.log(`      → Variable "${varName}" = ${JSON.stringify(actualValue)}`);
      console.log(`      → Esperado: ${expectedValue}`);
      console.log(`      → Comparación: "${normalizedActual}" === "${normalizedExpected}"`);
      console.log(`      → Resultado: ${result}`);
      return result;
    }

    // Patrón: "{{variable}} not equals value" o "{{variable}} not equal value"
    const notEqualsMatch = condition.match(/\{\{([^}]+)\}\}\s+not\s+equals?\s+(.+)$/i);
    if (notEqualsMatch) {
      const varName = notEqualsMatch[1].trim();
      const expectedValue = notEqualsMatch[2].trim();
      console.log(`      → Detectado 'not equals' para variable: "${varName}"`);
      
      const actualValue = this.getVariableValue(varName);
      
      const normalizedActual = String(actualValue).toLowerCase().trim();
      const normalizedExpected = expectedValue.toLowerCase().trim();
      
      const result = normalizedActual !== normalizedExpected;
      
      console.log(`      → Variable "${varName}" = ${JSON.stringify(actualValue)}`);
      console.log(`      → Esperado diferente de: ${expectedValue}`);
      console.log(`      → Comparación: "${normalizedActual}" !== "${normalizedExpected}"`);
      console.log(`      → Resultado: ${result}`);
      return result;
    }

    // Patrón: "{{variable}} contains value"
    const containsMatch = condition.match(/\{\{([^}]+)\}\}\s+contains\s+(.+)$/i);
    if (containsMatch) {
      const varName = containsMatch[1].trim();
      const searchValue = containsMatch[2].trim();
      console.log(`      → Detectado 'contains' para variable: "${varName}"`);
      
      const actualValue = this.getVariableValue(varName);
      
      const normalizedActual = String(actualValue).toLowerCase().trim();
      const normalizedSearch = searchValue.toLowerCase().trim();
      
      const result = normalizedActual.includes(normalizedSearch);
      
      console.log(`      → Variable "${varName}" = ${JSON.stringify(actualValue)}`);
      console.log(`      → Buscando: ${searchValue}`);
      console.log(`      → Comparación: "${normalizedActual}".includes("${normalizedSearch}")`);
      console.log(`      → Resultado: ${result}`);
      return result;
    }

    // Patrón: "{{variable}} not contains value"
    const notContainsMatch = condition.match(/\{\{([^}]+)\}\}\s+not\s+contains\s+(.+)$/i);
    if (notContainsMatch) {
      const varName = notContainsMatch[1].trim();
      const searchValue = notContainsMatch[2].trim();
      console.log(`      → Detectado 'not contains' para variable: "${varName}"`);
      
      const actualValue = this.getVariableValue(varName);
      
      const normalizedActual = String(actualValue).toLowerCase().trim();
      const normalizedSearch = searchValue.toLowerCase().trim();
      
      const result = !normalizedActual.includes(normalizedSearch);
      
      console.log(`      → Variable "${varName}" = ${JSON.stringify(actualValue)}`);
      console.log(`      → Buscando: ${searchValue}`);
      console.log(`      → Comparación: !"${normalizedActual}".includes("${normalizedSearch}")`);
      console.log(`      → Resultado: ${result}`);
      return result;
    }

    // Patrón: "{{varA}} == {{varB}}" (comparación entre dos variables)
    const twoVarEqualsMatch = condition.match(/^\{\{([^}]+)\}\}\s*==\s*\{\{([^}]+)\}\}$/);
    if (twoVarEqualsMatch) {
      const varA = twoVarEqualsMatch[1].trim();
      const varB = twoVarEqualsMatch[2].trim();
      const valA = String(this.getVariableValue(varA) ?? '').toLowerCase().trim();
      const valB = String(this.getVariableValue(varB) ?? '').toLowerCase().trim();
      const result = valA === valB;
      console.log(`      → Comparación entre variables: {{${varA}}}="${valA}" == {{${varB}}}="${valB}" → ${result}`);
      return result;
    }

    // Patrón: "{{varA}} != {{varB}}" (desigualdad entre dos variables)
    const twoVarNotEqualsMatch = condition.match(/^\{\{([^}]+)\}\}\s*!=\s*\{\{([^}]+)\}\}$/);
    if (twoVarNotEqualsMatch) {
      const varA = twoVarNotEqualsMatch[1].trim();
      const varB = twoVarNotEqualsMatch[2].trim();
      const valA = String(this.getVariableValue(varA) ?? '').toLowerCase().trim();
      const valB = String(this.getVariableValue(varB) ?? '').toLowerCase().trim();
      const result = valA !== valB;
      console.log(`      → Comparación entre variables: {{${varA}}}="${valA}" != {{${varB}}}="${valB}" → ${result}`);
      return result;
    }

    // Patrón: "{{varA}} <= {{varB}}" (comparación numérica menor o igual)
    const twoVarLteMatch = condition.match(/^\{\{([^}]+)\}\}\s*<=\s*\{\{([^}]+)\}\}$/);
    if (twoVarLteMatch) {
      const varA = twoVarLteMatch[1].trim();
      const varB = twoVarLteMatch[2].trim();
      const valA = parseFloat(String(this.getVariableValue(varA) ?? 0));
      const valB = parseFloat(String(this.getVariableValue(varB) ?? 0));
      const result = valA <= valB;
      console.log(`      → Comparación numérica: {{${varA}}}=${valA} <= {{${varB}}}=${valB} → ${result}`);
      return result;
    }

    // Patrón: "{{varA}} >= {{varB}}" (comparación numérica mayor o igual)
    const twoVarGteMatch = condition.match(/^\{\{([^}]+)\}\}\s*>=\s*\{\{([^}]+)\}\}$/);
    if (twoVarGteMatch) {
      const varA = twoVarGteMatch[1].trim();
      const varB = twoVarGteMatch[2].trim();
      const valA = parseFloat(String(this.getVariableValue(varA) ?? 0));
      const valB = parseFloat(String(this.getVariableValue(varB) ?? 0));
      const result = valA >= valB;
      console.log(`      → Comparación numérica: {{${varA}}}=${valA} >= {{${varB}}}=${valB} → ${result}`);
      return result;
    }

    // Patrón: "{{varA}} < {{varB}}" (comparación numérica menor)
    const twoVarLtMatch = condition.match(/^\{\{([^}]+)\}\}\s*<\s*\{\{([^}]+)\}\}$/);
    if (twoVarLtMatch) {
      const varA = twoVarLtMatch[1].trim();
      const varB = twoVarLtMatch[2].trim();
      const valA = parseFloat(String(this.getVariableValue(varA) ?? 0));
      const valB = parseFloat(String(this.getVariableValue(varB) ?? 0));
      const result = valA < valB;
      console.log(`      → Comparación numérica: {{${varA}}}=${valA} < {{${varB}}}=${valB} → ${result}`);
      return result;
    }

    // Patrón: "{{varA}} > {{varB}}" (comparación numérica mayor)
    const twoVarGtMatch = condition.match(/^\{\{([^}]+)\}\}\s*>\s*\{\{([^}]+)\}\}$/);
    if (twoVarGtMatch) {
      const varA = twoVarGtMatch[1].trim();
      const varB = twoVarGtMatch[2].trim();
      const valA = parseFloat(String(this.getVariableValue(varA) ?? 0));
      const valB = parseFloat(String(this.getVariableValue(varB) ?? 0));
      const result = valA > valB;
      console.log(`      → Comparación numérica: {{${varA}}}=${valA} > {{${varB}}}=${valB} → ${result}`);
      return result;
    }

    // Patrón: "{{variable}} == value" (operador de igualdad estricta)
    const doubleEqualsMatch = condition.match(/\{\{([^}]+)\}\}\s*==\s*(.+)$/i);
    if (doubleEqualsMatch) {
      const varName = doubleEqualsMatch[1].trim();
      let expectedValue = doubleEqualsMatch[2].trim();
      console.log(`      → Detectado '==' para variable: "${varName}"`);
      
      const actualValue = this.getVariableValue(varName);
      
      // Remover comillas simples o dobles del expectedValue
      if ((expectedValue.startsWith("'") && expectedValue.endsWith("'")) ||
          (expectedValue.startsWith('"') && expectedValue.endsWith('"'))) {
        expectedValue = expectedValue.slice(1, -1);
      }
      
      // CRÍTICO: Manejar comparaciones booleanas
      // Si se compara con 'true' o 'false', convertir ambos a boolean
      if (expectedValue === 'true' || expectedValue === 'false') {
        const actualBool = actualValue === true || actualValue === 'true' || actualValue === 'True' || actualValue === 'TRUE';
        const expectedBool = expectedValue === 'true';
        const result = actualBool === expectedBool;
        
        console.log(`      → Variable "${varName}" = ${JSON.stringify(actualValue)}`);
        console.log(`      → Esperado (boolean): ${expectedValue}`);
        console.log(`      → Comparación booleana: ${actualBool} === ${expectedBool}`);
        console.log(`      → Resultado: ${result}`);
        return result;
      }
      
      // CRÍTICO: Tratar undefined, null y '' como equivalentes
      // Si actualValue es undefined/null, tratarlo como ''
      const normalizedActual = (actualValue === undefined || actualValue === null) 
        ? '' 
        : String(actualValue).toLowerCase().trim();
      const normalizedExpected = expectedValue.toLowerCase().trim();
      
      const result = normalizedActual === normalizedExpected;
      
      console.log(`      → Variable "${varName}" = ${JSON.stringify(actualValue)}`);
      console.log(`      → Esperado: ${expectedValue}`);
      console.log(`      → Comparación: "${normalizedActual}" === "${normalizedExpected}"`);
      console.log(`      → Resultado: ${result}`);
      return result;
    }

    // Patrón: "{{variable}} != value" (operador de desigualdad, valor literal)
    const notEqualsOperatorMatch = condition.match(/\{\{([^}]+)\}\}\s*!=\s*(.+)$/i);
    if (notEqualsOperatorMatch) {
      const varName = notEqualsOperatorMatch[1].trim();
      let expectedValue = notEqualsOperatorMatch[2].trim();
      console.log(`      → Detectado '!=' para variable: "${varName}"`);
      
      const actualValue = this.getVariableValue(varName);
      
      // Remover comillas simples o dobles del expectedValue
      if ((expectedValue.startsWith("'") && expectedValue.endsWith("'")) ||
          (expectedValue.startsWith('"') && expectedValue.endsWith('"'))) {
        expectedValue = expectedValue.slice(1, -1);
      }
      
      // CRÍTICO: Tratar undefined, null y '' como equivalentes
      // Si actualValue es undefined/null, tratarlo como ''
      const normalizedActual = (actualValue === undefined || actualValue === null) 
        ? '' 
        : String(actualValue).toLowerCase().trim();
      const normalizedExpected = expectedValue.toLowerCase().trim();
      
      const result = normalizedActual !== normalizedExpected;
      
      console.log(`      → Variable "${varName}" = ${JSON.stringify(actualValue)}`);
      console.log(`      → Esperado diferente de: ${expectedValue}`);
      console.log(`      → Comparación: "${normalizedActual}" !== "${normalizedExpected}"`);
      console.log(`      → Resultado: ${result}`);
      return result;
    }

    // Si no coincide con patrones especiales, resolver y evaluar normalmente
    const resolvedCondition = this.resolveVariableInString(condition);
    console.log(`      Condición resuelta: ${resolvedCondition}`);
    console.log(`      ⚠️  ADVERTENCIA: Condición no reconocida, evaluando como booleano genérico`);
    
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
    
    // Soporte para tópicos con prefijo 'topicos.'
    if (varPath.startsWith('topicos.')) {
      const topicoPath = varPath.substring(8).split('.'); // Remover 'topicos.' y dividir
      let value: any = this.topicos;
      
      for (const part of topicoPath) {
        if (value && typeof value === 'object') {
          value = value[part];
        } else {
          console.log(`         ❌ Tópico "${varPath}" no encontrado`);
          return undefined;
        }
      }
      
      console.log(`         📚 Tópico encontrado: ${JSON.stringify(value)?.substring(0, 200)}`);
      return value;
    }
    
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

    // Si no está en globalVariables, intentar buscar propiedades anidadas
    // Ejemplo: "carrito.productos" → buscar "carrito" en globalVariables y acceder a .productos
    const parts = varPath.split('.');
    if (parts.length > 1) {
      const baseVar = parts[0];
      const baseValue = this.getGlobalVariable(baseVar);
      
      if (baseValue !== undefined && baseValue !== null) {
        console.log(`         ✅ Variable base "${baseVar}" encontrada en globalVariables`);
        console.log(`         → Tipo: ${typeof baseValue}`);
        
        // Navegar por las propiedades anidadas
        let value = baseValue;
        for (let i = 1; i < parts.length; i++) {
          const prop = parts[i];
          
          // Si es string, intentar parsear como JSON
          if (typeof value === 'string') {
            try {
              value = JSON.parse(value);
              console.log(`         → Parseado como JSON`);
            } catch (e) {
              console.log(`         ❌ No se pudo parsear como JSON`);
              return undefined;
            }
          }
          
          if (value && typeof value === 'object' && prop in value) {
            value = value[prop];
            console.log(`         → Accediendo a .${prop}: ${JSON.stringify(value)?.substring(0, 100)}`);
          } else {
            console.log(`         ❌ Propiedad "${prop}" no encontrada en ${baseVar}`);
            return undefined;
          }
        }
        
        console.log(`         ✅ Valor final de ${varPath}: ${JSON.stringify(value)?.substring(0, 100)}`);
        return value;
      }
    }

    // Si no está en globalVariables, buscar en contexto de nodos
    const nodeId = parts[0];
    const path = parts.slice(1);

    console.log(`         🔎 Buscando en contexto de nodo: "${nodeId}"`);
    console.log(`         📋 Nodos en contexto: ${JSON.stringify(Object.keys(this.context))}`);
    
    let value = this.context[nodeId]?.output;
    
    if (!value) {
      console.log(`         ❌ Nodo "${nodeId}" no encontrado en contexto`);
      console.log(`         🔍 DEBUGGING: Mostrando TODO el contexto disponible:`);
      Object.entries(this.context).forEach(([key, val]) => {
        console.log(`            - ${key}: ${JSON.stringify(val)?.substring(0, 150)}`);
      });
      
      // SUGERENCIA: Buscar nodos que contengan "mercadopago" en su ID
      if (nodeId.toLowerCase().includes('mercadopago')) {
        console.log(`         💡 SUGERENCIA: Buscando nodos con "mercadopago" en el ID...`);
        const mercadopagoNodes = Object.keys(this.context).filter(k => 
          k.toLowerCase().includes('mercadopago') || 
          this.context[k]?.output?.preferencia_id
        );
        if (mercadopagoNodes.length > 0) {
          console.log(`         ✅ Nodos MercadoPago encontrados: ${mercadopagoNodes.join(', ')}`);
          console.log(`         💡 Intenta usar: {{${mercadopagoNodes[0]}.mensaje}}`);
        }
      }
      
      return undefined;
    }
    
    console.log(`         ✅ Nodo encontrado, output: ${JSON.stringify(value)?.substring(0, 150)}`);

    for (const part of path) {
      if (value && typeof value === 'object') {
        value = value[part];
        console.log(`         → Accediendo a .${part}: ${JSON.stringify(value)?.substring(0, 100)}`);
      } else {
        console.log(`         ❌ No se puede acceder a .${part} (valor no es objeto)`);
        console.log(`         🔍 DEBUGGING: Tipo de valor actual: ${typeof value}`);
        console.log(`         🔍 DEBUGGING: Valor actual: ${JSON.stringify(value)}`);
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
  private resolveVariableInString(str: string, depth: number = 0): string {
    if (!str) return '';
    
    // Prevenir recursión infinita
    const MAX_DEPTH = 5;
    if (depth >= MAX_DEPTH) {
      console.warn(`      ⚠️  Máxima profundidad de resolución alcanzada (${MAX_DEPTH})`);
      return str;
    }

    if (depth === 0) {
      console.log(`      🔧 [resolveVariableInString] Input: "${str.substring(0, 200)}${str.length > 200 ? '...' : ''}"`);
    }

    // Buscar todas las variables en el formato {{...}}
    const regex = /\{\{([^}]+)\}\}/g;
    
    const result = str.replace(regex, (match, expression) => {
      expression = expression.trim();
      if (depth === 0) {
        console.log(`      🔍 Encontrada variable: "${expression}"`);
      }
      
      try {
        // Evaluar la expresión de forma segura
        const result = this.evaluateExpression(expression);
        
        if (depth === 0) {
          console.log(`      ✅ Resultado de evaluación: ${JSON.stringify(result)?.substring(0, 100)}`);
        }
        
        // IMPORTANTE: NO formatear productos automáticamente
        // Dejar que GPT interprete el JSON según su systemPrompt
        // Si es un objeto complejo o array, convertirlo a JSON
        if (typeof result === 'object' && result !== null) {
          return JSON.stringify(result, null, 2);
        }
        
        // Retornar el valor como string
        if (result !== undefined && result !== null) {
          if (depth === 0) {
            console.log(`      ✅ Reemplazando "${match}" → "${String(result).substring(0, 100)}"`);
          }
          return String(result);
        } else {
          if (depth === 0) {
            console.log(`      ⚠️  Resultado undefined/null, manteniendo placeholder: "${match}"`);
          }
          return match;
        }
      } catch (error) {
        console.warn(`      ⚠️  Error evaluando expresión "${expression}":`, error);
        return match; // Mantener el placeholder si hay error
      }
    });
    
    // IMPORTANTE: Resolver recursivamente si aún quedan variables
    // Esto maneja casos como {{gpt.respuesta}} que contiene {{topicos.empresa.link}}
    const hasMoreVariables = /\{\{([^}]+)\}\}/.test(result);
    if (hasMoreVariables && depth < MAX_DEPTH) {
      console.log(`      🔄 Resolución recursiva (profundidad ${depth + 1}): Quedan variables por resolver`);
      return this.resolveVariableInString(result, depth + 1);
    }
    
    if (depth === 0) {
      console.log(`      🔧 [resolveVariableInString] Output: "${result.substring(0, 200)}${result.length > 200 ? '...' : ''}"`);
    }
    return result;
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

  /**
   * Ejecuta un nodo HTTP con reemplazo de variables y mapeo de respuestas
   */
  private async executeHTTPNode(node: any, input: any): Promise<NodeExecutionResult> {
    const config = node.data.config;

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`🌐 NODO HTTP: ${node.data.label}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n📥 CONFIG:');
    console.log(`   URL: ${config.url}`);
    console.log(`   Method: ${config.method}`);
    console.log(`   Timeout: ${config.timeout}ms`);

    try {
      // 1. Reemplazar variables en URL
      let finalUrl = config.url || '';
      Object.entries(this.globalVariables).forEach(([name, value]) => {
        const regex = new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g');
        finalUrl = finalUrl.replace(regex, String(value));
      });

      console.log(`   📍 URL final: ${finalUrl}`);

      // 2. Construir query params con variables reemplazadas
      const finalQueryParams: Record<string, string> = {};
      if (config.queryParams) {
        Object.entries(config.queryParams).forEach(([key, value]: [string, any]) => {
          let finalValue = String(value);
          Object.entries(this.globalVariables).forEach(([name, varValue]) => {
            const regex = new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g');
            finalValue = finalValue.replace(regex, String(varValue));
          });
          finalQueryParams[key] = finalValue;
        });
      }

      // Agregar query params a la URL
      if (Object.keys(finalQueryParams).length > 0) {
        const params = new URLSearchParams(finalQueryParams);
        finalUrl = `${finalUrl}?${params.toString()}`;
        console.log(`   🔗 URL con params: ${finalUrl}`);
      }

      // 3. Preparar headers con variables reemplazadas
      const finalHeaders: Record<string, string> = {};
      if (config.headers) {
        Object.entries(config.headers).forEach(([key, value]: [string, any]) => {
          let finalValue = String(value);
          Object.entries(this.globalVariables).forEach(([name, varValue]) => {
            const regex = new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g');
            finalValue = finalValue.replace(regex, String(varValue));
          });
          finalHeaders[key] = finalValue;
        });
      }

      console.log(`   📋 Headers: ${Object.keys(finalHeaders).join(', ')}`);

      // 4. Preparar body si existe (con variables reemplazadas)
      let finalBody: any = undefined;
      if (config.body && config.method !== 'GET') {
        let bodyString = config.body;
        Object.entries(this.globalVariables).forEach(([name, value]) => {
          const regex = new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g');
          bodyString = bodyString.replace(regex, String(value));
        });
        
        try {
          finalBody = JSON.parse(bodyString);
        } catch {
          finalBody = bodyString;
        }
        
        console.log(`   📦 Body COMPLETO:`);
        console.log(JSON.stringify(finalBody, null, 2));
      }

      // 5. Ejecutar request HTTP
      console.log(`   🚀 Ejecutando ${config.method} request...`);
      
      const response = await axios({
        url: finalUrl,
        method: config.method || 'GET',
        headers: finalHeaders,
        data: finalBody,
        timeout: config.timeout || 30000,
        validateStatus: () => true, // No lanzar error en status codes
      });

      console.log(`   ✅ Response status: ${response.status}`);

      // 6. Extraer datos según dataPath configurado
      let responseData = response.data;
      if (config.responseMapping?.dataPath) {
        const path = config.responseMapping.dataPath;
        const pathParts = path.split('.');
        
        for (const part of pathParts) {
          if (responseData && typeof responseData === 'object') {
            responseData = responseData[part];
          }
        }
        
        console.log(`   📊 Datos extraídos desde: ${path}`);
      }

      console.log(`   📦 Tipo de respuesta: ${Array.isArray(responseData) ? 'Array' : typeof responseData}`);
      if (Array.isArray(responseData)) {
        console.log(`   📊 Cantidad de items: ${responseData.length}`);
      }

      // 7. Aplicar variableMappings (guardar campos en variables globales)
      if (config.variableMappings && Array.isArray(config.variableMappings) && config.variableMappings.length > 0) {
        console.log(`\n💾 Aplicando ${config.variableMappings.length} mapeos de variables:`);
        
        for (const mapping of config.variableMappings) {
          try {
            // Extraer valor usando responsePath (ej: "data.comitente")
            const pathParts = mapping.responsePath.split('.');
            let value = responseData;
            
            for (const part of pathParts) {
              if (value && typeof value === 'object') {
                value = value[part];
              } else {
                value = undefined;
                break;
              }
            }

            if (value !== undefined && value !== null) {
              // Guardar en variable global
              if (mapping.variableType === 'global') {
                this.setGlobalVariable(mapping.variableName, value);
                console.log(`   ✅ ${mapping.variableName} = ${JSON.stringify(value).substring(0, 100)}`);
              }
            } else {
              console.log(`   ⚠️  ${mapping.variableName}: valor no encontrado en ${mapping.responsePath}`);
            }
          } catch (error: any) {
            console.warn(`   ❌ Error mapeando ${mapping.variableName}: ${error.message}`);
          }
        }
      }

      // 8. Retornar respuesta completa
      const output = {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        fullResponse: response.data,
      };

      console.log(`\n✅ Nodo HTTP ejecutado exitosamente`);
      
      // 9. Limpiar variables si está configurado
      if (config.clearVariablesOnExecute && Array.isArray(config.clearVariablesOnExecute)) {
        console.log(`\n🧹 Limpiando variables después de ejecutar ${node.data.label}:`);
        for (const varName of config.clearVariablesOnExecute) {
          if (this.globalVariables[varName] !== undefined) {
            console.log(`   🗑️  ${varName} = ${JSON.stringify(this.globalVariables[varName])?.substring(0, 50)} → null`);
            this.setGlobalVariable(varName, null);
          }
        }
      }
      
      return { output };

    } catch (error: any) {
      console.error(`\n❌ Error ejecutando HTTP request:`, error.message);
      
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Data: ${JSON.stringify(error.response.data).substring(0, 200)}`);
      }
      
      return {
        output: {
          error: error.message,
          status: error.response?.status || 500,
          data: error.response?.data || null,
        },
        error: error.message,
      };
    }
  }
}
