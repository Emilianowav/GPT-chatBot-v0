const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.error('❌ Flujo no encontrado');
      return;
    }

    console.log('📋 Flujo actual:', flow.nombre);
    console.log('   Nodos actuales:', flow.nodes.length);

    // ============================================================
    // LIMPIAR NODOS ANTERIORES DE FASE 1
    // ============================================================
    
    const nodosAEliminar = [
      'gpt-agregar-carrito',
      'router-agregar',
      'carrito-agregar',
      'gpt-confirmacion',
      'whatsapp-confirmacion',
      'gpt-volver-buscar',
      'whatsapp-volver-buscar',
      'gpt-detectar-finalizar',
      'router-finalizar',
      'carrito-ver',
      'mercadopago-checkout',
      'whatsapp-link-pago',
      'gpt-seguir-comprando',
      'whatsapp-seguir-comprando'
    ];

    const nodosLimpios = flow.nodes.filter(n => !nodosAEliminar.includes(n.id));
    const edgesLimpios = flow.edges.filter(e => 
      !nodosAEliminar.includes(e.source) && 
      !nodosAEliminar.includes(e.target)
    );

    console.log(`   🧹 Eliminados: ${flow.nodes.length - nodosLimpios.length} nodos`);
    console.log(`   🧹 Eliminados: ${flow.edges.length - edgesLimpios.length} edges`);

    // ============================================================
    // NUEVO FLUJO: GPT CONVERSACIONAL DINÁMICO
    // ============================================================

    // 1. GPT Asistente de Ventas (maneja TODO)
    const gptAsistenteVentas = {
      id: 'gpt-asistente-ventas',
      type: 'gpt',
      position: { x: 900, y: 100 },
      data: {
        label: 'GPT: Asistente de Ventas',
        config: {
          tipo: 'conversacional',
          modelo: 'gpt-4',
          systemPrompt: 'Eres un asistente de ventas de Veo Veo Libros. Tu objetivo es ayudar al cliente de forma natural y conversacional.\\n\\nCONTEXTO ACTUAL:\\n- Resultados de búsqueda: {{gpt-resultados.respuesta_gpt}}\\n- Productos disponibles: {{woocommerce}}\\n- Carrito actual: {{carrito_items_count}} items, Total: ${{carrito_total}}\\n\\nTU TRABAJO:\\n1. Mantener una conversación natural y fluida\\n2. Entender la intención del usuario sin ser rígido\\n3. Ayudar a agregar productos al carrito cuando el usuario lo desee\\n4. Mostrar el carrito cuando el usuario lo pida\\n5. Guiar hacia el checkout cuando esté listo\\n\\nREGLAS:\\n- NO uses números para elegir productos, habla naturalmente\\n- NO fuerces opciones, deja que la conversación fluya\\n- Si el usuario dice algo como "me interesa", "lo quiero", "agrégalo" → indica que quiere agregar\\n- Si el usuario dice "cuánto llevo", "qué tengo" → indica que quiere ver el carrito\\n- Si el usuario dice "pagar", "finalizar", "comprar" → indica que quiere checkout\\n- Si no entiendes, pregunta de forma inteligente\\n\\nIMPORTANTE:\\nCuando el usuario quiera agregar un producto, responde incluyendo la palabra clave: [AGREGAR_AL_CARRITO]\\nCuando el usuario quiera ver el carrito, responde incluyendo: [VER_CARRITO]\\nCuando el usuario quiera finalizar, responde incluyendo: [FINALIZAR_COMPRA]\\n\\nEJEMPLOS DE CONVERSACIÓN:\\n\\nUsuario: "Me interesa La Soledad"\\nTú: "¡Perfecto! Te agrego \'La Soledad\' al carrito. [AGREGAR_AL_CARRITO] ¿Te gustaría buscar algo más o prefieres finalizar la compra?"\\n\\nUsuario: "Cuánto llevo?"\\nTú: "Déjame mostrarte tu carrito. [VER_CARRITO]"\\n\\nUsuario: "Quiero pagar"\\nTú: "¡Excelente! Te preparo el link de pago. [FINALIZAR_COMPRA]"\\n\\nUsuario: "No sé, tal vez"\\nTú: "Sin problema, tómate tu tiempo. ¿Querés que te cuente más sobre alguno de estos libros o preferís buscar otro título?"\\n\\nMantén la conversación natural, amigable y sin presionar.'
        }
      }
    };

    // 2. Router Detector de Acciones (detecta palabras clave)
    const routerAcciones = {
      id: 'router-acciones',
      type: 'router',
      position: { x: 1100, y: 100 },
      data: {
        label: 'Router: Acciones',
        config: {
          routes: [
            {
              id: 'route-agregar',
              label: 'Agregar al carrito',
              condition: '{{gpt-asistente-ventas.respuesta_gpt}} contains "[AGREGAR_AL_CARRITO]"'
            },
            {
              id: 'route-ver',
              label: 'Ver carrito',
              condition: '{{gpt-asistente-ventas.respuesta_gpt}} contains "[VER_CARRITO]"'
            },
            {
              id: 'route-finalizar',
              label: 'Finalizar compra',
              condition: '{{gpt-asistente-ventas.respuesta_gpt}} contains "[FINALIZAR_COMPRA]"'
            },
            {
              id: 'route-continuar',
              label: 'Continuar conversación',
              condition: 'default'
            }
          ]
        }
      }
    };

    // 3. Carrito (Agregar)
    const carritoAgregar = {
      id: 'carrito-agregar',
      type: 'carrito',
      position: { x: 1300, y: 0 },
      data: {
        label: 'Carrito: Agregar',
        config: {
          action: 'agregar',
          itemFields: {
            id: '{{woocommerce[0].id}}',
            nombre: '{{woocommerce[0].name}}',
            precio: '{{woocommerce[0].price}}',
            cantidad: 1,
            imagen: '{{woocommerce[0].image}}',
            metadata: {
              permalink: '{{woocommerce[0].permalink}}',
              sku: '{{woocommerce[0].sku}}'
            }
          }
        }
      }
    };

    // 4. Carrito (Ver)
    const carritoVer = {
      id: 'carrito-ver',
      type: 'carrito',
      position: { x: 1300, y: 100 },
      data: {
        label: 'Carrito: Ver',
        config: {
          action: 'ver',
          outputFormat: {
            enabled: true,
            template: 'whatsapp'
          }
        }
      }
    };

    // 5. Mercado Pago
    const mercadoPago = {
      id: 'mercadopago-checkout',
      type: 'mercadopago',
      position: { x: 1300, y: 200 },
      data: {
        label: 'Mercado Pago',
        config: {
          accessToken: '{{env.MERCADOPAGO_ACCESS_TOKEN}}',
          titulo: 'Veo Veo Libros',
          notificationUrl: '{{env.BACKEND_URL}}/webhooks/mercadopago'
        }
      }
    };

    // 6. WhatsApp Respuesta (para todas las acciones)
    const whatsappRespuesta = {
      id: 'whatsapp-respuesta',
      type: 'whatsapp',
      position: { x: 1500, y: 100 },
      data: {
        label: 'WhatsApp: Respuesta',
        config: {
          message: '{{gpt-asistente-ventas.respuesta_gpt}}',
          to: '{{telefono_cliente}}'
        }
      }
    };

    // ============================================================
    // EDGES (CONEXIONES)
    // ============================================================

    const newEdges = [
      // Desde WhatsApp resultados → GPT Asistente
      {
        id: 'edge-resultados-to-asistente',
        source: 'whatsapp-resultados',
        target: 'gpt-asistente-ventas',
        type: 'default'
      },
      // GPT Asistente → Router Acciones
      {
        id: 'edge-asistente-to-router',
        source: 'gpt-asistente-ventas',
        target: 'router-acciones',
        type: 'default'
      },
      // Router → Carrito Agregar
      {
        id: 'edge-router-to-agregar',
        source: 'router-acciones',
        sourceHandle: 'route-agregar',
        target: 'carrito-agregar',
        type: 'default'
      },
      // Router → Carrito Ver
      {
        id: 'edge-router-to-ver',
        source: 'router-acciones',
        sourceHandle: 'route-ver',
        target: 'carrito-ver',
        type: 'default'
      },
      // Router → Mercado Pago
      {
        id: 'edge-router-to-finalizar',
        source: 'router-acciones',
        sourceHandle: 'route-finalizar',
        target: 'mercadopago-checkout',
        type: 'default'
      },
      // Router → WhatsApp (continuar conversación)
      {
        id: 'edge-router-to-continuar',
        source: 'router-acciones',
        sourceHandle: 'route-continuar',
        target: 'whatsapp-respuesta',
        type: 'default'
      },
      // Carrito Agregar → WhatsApp
      {
        id: 'edge-agregar-to-whatsapp',
        source: 'carrito-agregar',
        target: 'whatsapp-respuesta',
        type: 'default'
      },
      // Carrito Ver → WhatsApp
      {
        id: 'edge-ver-to-whatsapp',
        source: 'carrito-ver',
        target: 'whatsapp-respuesta',
        type: 'default'
      },
      // Mercado Pago → WhatsApp
      {
        id: 'edge-mp-to-whatsapp',
        source: 'mercadopago-checkout',
        target: 'whatsapp-respuesta',
        type: 'default'
      },
      // WhatsApp → Loop a GPT Asistente (conversación continua)
      {
        id: 'edge-whatsapp-to-asistente-loop',
        source: 'whatsapp-respuesta',
        target: 'gpt-asistente-ventas',
        type: 'default'
      }
    ];

    // ============================================================
    // ACTUALIZAR FLUJO EN BD
    // ============================================================

    const nodosFinales = [
      ...nodosLimpios,
      gptAsistenteVentas,
      routerAcciones,
      carritoAgregar,
      carritoVer,
      mercadoPago,
      whatsappRespuesta
    ];

    const edgesFinales = [
      ...edgesLimpios,
      ...newEdges
    ];

    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      {
        $set: {
          nodes: nodosFinales,
          edges: edgesFinales
        }
      }
    );

    console.log('\n✅ FLUJO CONVERSACIONAL DINÁMICO CREADO');
    console.log(`   Total nodos: ${nodosFinales.length}`);
    console.log(`   Total edges: ${edgesFinales.length}`);
    
    console.log('\n📋 NODOS NUEVOS:');
    console.log('   1. gpt-asistente-ventas - GPT conversacional inteligente');
    console.log('   2. router-acciones - Detecta palabras clave');
    console.log('   3. carrito-agregar - Agrega producto');
    console.log('   4. carrito-ver - Muestra carrito');
    console.log('   5. mercadopago-checkout - Genera link de pago');
    console.log('   6. whatsapp-respuesta - Envía respuesta');

    console.log('\n💡 CÓMO FUNCIONA:');
    console.log('   - GPT mantiene conversación natural');
    console.log('   - Usuario habla libremente');
    console.log('   - GPT entiende intención y actúa');
    console.log('   - Sin opciones forzadas ni números');

    console.log('\n🧪 EJEMPLOS DE CONVERSACIÓN:');
    console.log('   Usuario: "Me interesa La Soledad"');
    console.log('   → GPT agrega al carrito automáticamente');
    console.log('');
    console.log('   Usuario: "Cuánto llevo?"');
    console.log('   → GPT muestra el carrito');
    console.log('');
    console.log('   Usuario: "Quiero pagar"');
    console.log('   → GPT genera link de Mercado Pago');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

main();
