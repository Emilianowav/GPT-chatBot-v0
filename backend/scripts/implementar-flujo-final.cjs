const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * IMPLEMENTAR FLUJO FINAL DEL USUARIO
 * 
 * ARQUITECTURA:
 * 
 * webhook → gpt-conversacional → gpt-formateador → router-inicial
 *   ├─ route-1 → gpt-pedir-datos → whatsapp-preguntar → woocommerce
 *   └─ route-2 → woocommerce
 *     → gpt-asistente-ventas (presenta productos)
 *     → whatsapp-asistente (envía productos)
 *     → gpt-clasificador (analiza intención)
 *     → router-intencion (3 salidas):
 *         ├─ route-buscar → [SIN EDGE - nuevo mensaje entra por webhook]
 *         ├─ route-agregar → gpt-carrito → whatsapp-confirmacion
 *         └─ route-checkout → gpt-mercadopago → whatsapp-pago
 * 
 * IMPORTANTE: route-buscar NO tiene edge visual. El loop se maneja porque
 * el nuevo mensaje del usuario entra por el webhook y vuelve a pasar por
 * toda la rama de búsqueda.
 */

async function implementarFlujoFinal() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('\n🚀 IMPLEMENTANDO FLUJO FINAL\n');
    console.log('═'.repeat(80));
    
    // ============================================================================
    // PASO 1: DEFINIR TODOS LOS NODOS
    // ============================================================================
    console.log('\n📍 PASO 1: Definir nodos\n');
    
    const nodosFinales = [
      // Flujo inicial
      {
        id: 'webhook-whatsapp',
        type: 'webhook',
        position: { x: 100, y: 200 },
        data: {
          label: 'WhatsApp Business Clo...',
          subtitle: 'Receive a Message',
          config: { trigger: 'whatsapp_message' }
        }
      },
      {
        id: 'gpt-conversacional',
        type: 'gpt',
        position: { x: 350, y: 200 },
        data: {
          label: 'OpenAI (ChatGPT, Sera...',
          subtitle: 'conversacional',
          config: {
            model: 'gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 500,
            systemPrompt: 'Eres un asistente de ventas de Veo Veo Libros. Ayudas a los clientes a encontrar libros que les interesen. Sé amable y conversacional.',
            topicHandling: 'none'
          }
        }
      },
      {
        id: 'gpt-formateador',
        type: 'gpt',
        position: { x: 600, y: 200 },
        data: {
          label: 'OpenAI (ChatGPT, Sera...',
          subtitle: 'formateador',
          config: {
            model: 'gpt-4o-mini',
            temperature: 0.3,
            maxTokens: 200,
            systemPrompt: 'Extrae los criterios de búsqueda del mensaje del usuario (género, autor, tema, etc.) y devuélvelos en formato estructurado para buscar en WooCommerce.',
            topicHandling: 'none'
          }
        }
      },
      {
        id: 'router',
        type: 'router',
        position: { x: 850, y: 200 },
        data: {
          label: 'Router',
          subtitle: 'Búsqueda Inicial',
          config: {
            routes: [
              { id: 'route-1', label: 'Pedir Datos', condition: 'necesita_datos' },
              { id: 'route-2', label: 'Buscar Directo', condition: 'buscar_directo' }
            ]
          }
        }
      },
      {
        id: 'gpt-pedir-datos',
        type: 'gpt',
        position: { x: 1100, y: 50 },
        data: {
          label: 'OpenAI (ChatGPT, Sera...',
          subtitle: 'conversacional',
          config: {
            model: 'gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 300,
            systemPrompt: 'El usuario no proporcionó suficiente información para buscar libros. Pregúntale qué tipo de libro está buscando (género, autor, tema, etc.).',
            topicHandling: 'none'
          }
        }
      },
      {
        id: 'whatsapp-preguntar',
        type: 'whatsapp',
        position: { x: 1350, y: 50 },
        data: {
          label: 'WhatsApp Business Clo...',
          subtitle: 'Send a Message',
          config: {
            action: 'send_message',
            message: '{{gpt_response}}'
          }
        }
      },
      
      // Búsqueda y presentación
      {
        id: 'woocommerce',
        type: 'woocommerce',
        position: { x: 1600, y: 200 },
        data: {
          label: 'WooCommerce',
          subtitle: 'Get a Product',
          config: {
            action: 'search_products',
            searchCriteria: '{{search_criteria}}'
          }
        }
      },
      {
        id: 'gpt-asistente-ventas',
        type: 'gpt',
        position: { x: 1850, y: 200 },
        data: {
          label: 'OpenAI (ChatGPT, Sera...',
          subtitle: 'conversacional',
          config: {
            model: 'gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 600,
            systemPrompt: 'Presenta los productos encontrados de forma atractiva. Menciona título, autor, precio y una breve descripción. Pregunta al usuario si quiere: 1) Buscar más productos, 2) Agregar alguno al carrito, o 3) Finalizar la compra.',
            topicHandling: 'none'
          }
        }
      },
      {
        id: 'whatsapp-asistente',
        type: 'whatsapp',
        position: { x: 2100, y: 200 },
        data: {
          label: 'WhatsApp Business Clo...',
          subtitle: 'Send a Message',
          config: {
            action: 'send_message',
            message: '{{gpt_response}}'
          }
        }
      },
      
      // Clasificación y routing
      {
        id: 'gpt-clasificador',
        type: 'gpt',
        position: { x: 2350, y: 200 },
        data: {
          label: 'OpenAI (ChatGPT, Sera...',
          subtitle: 'conversacional',
          config: {
            model: 'gpt-4o-mini',
            temperature: 0.1,
            maxTokens: 50,
            systemPrompt: 'Analiza la respuesta del usuario y clasifica su intención. Responde SOLO con una de estas opciones:\n- "buscar_mas" si quiere buscar más productos\n- "agregar_carrito" si quiere agregar un producto al carrito\n- "finalizar_compra" si quiere ir a checkout',
            topicHandling: 'none'
          }
        }
      },
      {
        id: 'router-intencion',
        type: 'router',
        position: { x: 2600, y: 200 },
        data: {
          label: 'Router',
          subtitle: 'Intención del Usuario',
          config: {
            routes: [
              { id: 'route-buscar', label: 'Buscar Más', condition: 'buscar_mas' },
              { id: 'route-agregar', label: 'Agregar al Carrito', condition: 'agregar_carrito' },
              { id: 'route-checkout', label: 'Finalizar Compra', condition: 'finalizar_compra' }
            ]
          }
        }
      },
      
      // Camino: Agregar al carrito
      {
        id: 'gpt-carrito',
        type: 'gpt',
        position: { x: 2850, y: 100 },
        data: {
          label: 'OpenAI (ChatGPT, Sera...',
          subtitle: 'conversacional',
          config: {
            model: 'gpt-4o-mini',
            temperature: 0.5,
            maxTokens: 400,
            systemPrompt: 'El usuario quiere agregar un producto al carrito. Extrae el producto mencionado, actualiza el carrito global (formato JSON: {productos: [{id, nombre, precio, cantidad}], total: X}), confirma la acción y pregunta si quiere seguir comprando o finalizar.',
            topicHandling: 'none'
          }
        }
      },
      {
        id: 'whatsapp-confirmacion',
        type: 'whatsapp',
        position: { x: 3100, y: 100 },
        data: {
          label: 'WhatsApp Business Clo...',
          subtitle: 'Send a Message',
          config: {
            action: 'send_message',
            message: '{{gpt_response}}'
          }
        }
      },
      
      // Camino: Checkout
      {
        id: 'gpt-mercadopago',
        type: 'gpt',
        position: { x: 2850, y: 300 },
        data: {
          label: 'OpenAI (ChatGPT, Sera...',
          subtitle: 'conversacional',
          config: {
            model: 'gpt-4o-mini',
            temperature: 0.3,
            maxTokens: 400,
            systemPrompt: 'El usuario quiere finalizar la compra. Lee el carrito del contexto global, prepara la información para MercadoPago (items, total), genera el link de pago y responde con el link para que el usuario pueda pagar.',
            topicHandling: 'none'
          }
        }
      },
      {
        id: 'whatsapp-pago',
        type: 'whatsapp',
        position: { x: 3100, y: 300 },
        data: {
          label: 'WhatsApp Business Clo...',
          subtitle: 'Send a Message',
          config: {
            action: 'send_message',
            message: '{{gpt_response}}'
          }
        }
      }
    ];
    
    flow.nodes = nodosFinales;
    console.log(`✅ ${nodosFinales.length} nodos definidos`);
    
    // ============================================================================
    // PASO 2: DEFINIR EDGES (SIN LOOPS VISUALES)
    // ============================================================================
    console.log('\n📍 PASO 2: Definir edges\n');
    
    const edgesFinales = [
      // Flujo inicial
      { id: 'edge-1', source: 'webhook-whatsapp', target: 'gpt-conversacional', type: 'default' },
      { id: 'edge-2', source: 'gpt-conversacional', target: 'gpt-formateador', type: 'default' },
      { id: 'edge-3', source: 'gpt-formateador', target: 'router', type: 'default' },
      
      // Router inicial (2 caminos)
      { id: 'edge-4', source: 'router', sourceHandle: 'route-1', target: 'gpt-pedir-datos', type: 'default' },
      { id: 'edge-5', source: 'gpt-pedir-datos', target: 'whatsapp-preguntar', type: 'default' },
      { id: 'edge-6', source: 'whatsapp-preguntar', target: 'woocommerce', type: 'default' },
      { id: 'edge-7', source: 'router', sourceHandle: 'route-2', target: 'woocommerce', type: 'default' },
      
      // Presentación de productos
      { id: 'edge-8', source: 'woocommerce', target: 'gpt-asistente-ventas', type: 'default' },
      { id: 'edge-9', source: 'gpt-asistente-ventas', target: 'whatsapp-asistente', type: 'default' },
      { id: 'edge-10', source: 'whatsapp-asistente', target: 'gpt-clasificador', type: 'default' },
      { id: 'edge-11', source: 'gpt-clasificador', target: 'router-intencion', type: 'default' },
      
      // Router intención (solo 2 edges, route-buscar SIN edge)
      { id: 'edge-12', source: 'router-intencion', sourceHandle: 'route-agregar', target: 'gpt-carrito', type: 'default' },
      { id: 'edge-13', source: 'gpt-carrito', target: 'whatsapp-confirmacion', type: 'default' },
      { id: 'edge-14', source: 'router-intencion', sourceHandle: 'route-checkout', target: 'gpt-mercadopago', type: 'default' },
      { id: 'edge-15', source: 'gpt-mercadopago', target: 'whatsapp-pago', type: 'default' }
      
      // NOTA: route-buscar NO tiene edge. El nuevo mensaje del usuario entra por webhook.
    ];
    
    flow.edges = edgesFinales;
    console.log(`✅ ${edgesFinales.length} edges definidos`);
    console.log('⚠️  route-buscar NO tiene edge (loop se maneja por webhook)');
    
    // ============================================================================
    // PASO 3: GUARDAR EN MONGODB
    // ============================================================================
    console.log('\n📍 PASO 3: Guardar en MongoDB\n');
    
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          nodes: flow.nodes,
          edges: flow.edges
        } 
      }
    );
    
    console.log('✅ Cambios guardados');
    
    // ============================================================================
    // VERIFICACIÓN
    // ============================================================================
    console.log('\n📊 VERIFICACIÓN\n');
    console.log('─'.repeat(80));
    
    let errores = 0;
    
    flow.nodes.forEach(node => {
      const incoming = flow.edges.filter(e => e.target === node.id).length;
      const outgoing = flow.edges.filter(e => e.source === node.id).length;
      
      if (node.type !== 'router' && node.type !== 'webhook' && incoming > 1) {
        if (node.id === 'woocommerce' && incoming === 2) {
          console.log(`⚠️  ${node.id}: ${incoming} entradas (válido - convergencia)`);
        } else {
          console.log(`❌ ${node.id}: ${incoming} entradas`);
          errores++;
        }
      }
      
      if (node.type !== 'router' && outgoing > 1) {
        console.log(`❌ ${node.id}: ${outgoing} salidas`);
        errores++;
      }
    });
    
    if (errores === 0) {
      console.log('✅ Todas las conexiones son válidas');
    }
    
    // ============================================================================
    // RESUMEN
    // ============================================================================
    console.log('\n\n🎯 FLUJO FINAL IMPLEMENTADO:\n');
    console.log('webhook → conversacional → formateador → router-inicial');
    console.log('  ├─ route-1 → gpt-pedir-datos → whatsapp-preguntar → woocommerce');
    console.log('  └─ route-2 → woocommerce');
    console.log('    → gpt-asistente-ventas → whatsapp-asistente');
    console.log('    → gpt-clasificador → router-intencion');
    console.log('      ├─ route-buscar → [SIN EDGE - loop por webhook]');
    console.log('      ├─ route-agregar → gpt-carrito → whatsapp-confirmacion');
    console.log('      └─ route-checkout → gpt-mercadopago → whatsapp-pago');
    
    console.log('\n📊 ESTADÍSTICAS:');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    console.log(`   Routers: 2`);
    
    console.log('\n✅ Implementación completada\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

implementarFlujoFinal();
