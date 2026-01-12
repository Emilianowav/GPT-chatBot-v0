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
    console.log('   Edges actuales:', flow.edges.length);

    // ============================================================
    // FASE 2: AGREGAR MERCADO PAGO + CHECKOUT
    // ============================================================

    // 1. GPT Formateador - Detecta intención de finalizar compra
    const gptDetectarFinalizarCompra = {
      id: 'gpt-detectar-finalizar',
      type: 'gpt',
      position: { x: 1900, y: 50 },
      data: {
        label: 'GPT: Detectar Finalizar',
        config: {
          tipo: 'formateador',
          modelo: 'gpt-3.5-turbo',
          extractionConfig: {
            systemPrompt: 'Analiza el mensaje del usuario y determina si quiere FINALIZAR LA COMPRA o SEGUIR COMPRANDO.\n\nMensaje del usuario: {{mensaje_usuario}}\n\nDevuelve JSON:\n{\n  "quiere_finalizar": true/false\n}\n\nEjemplos:\n- "finalizar" → true\n- "pagar" → true\n- "comprar" → true\n- "checkout" → true\n- "seguir" → false\n- "buscar más" → false\n- "otro libro" → false'
          }
        }
      }
    };

    // 2. Router: ¿Finalizar o Seguir?
    const routerFinalizar = {
      id: 'router-finalizar',
      type: 'router',
      position: { x: 2100, y: 50 },
      data: {
        label: 'Router: ¿Finalizar?',
        config: {
          routes: [
            {
              id: 'route-finalizar',
              label: 'Finalizar compra',
              condition: '{{quiere_finalizar}} == true'
            },
            {
              id: 'route-seguir',
              label: 'Seguir comprando',
              condition: 'default'
            }
          ]
        }
      }
    };

    // 3. Carrito (Ver) - Muestra resumen antes de pagar
    const carritoVer = {
      id: 'carrito-ver',
      type: 'carrito',
      position: { x: 2300, y: 0 },
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

    // 4. Mercado Pago - Genera link de pago
    const mercadoPago = {
      id: 'mercadopago-checkout',
      type: 'mercadopago',
      position: { x: 2500, y: 0 },
      data: {
        label: 'Mercado Pago',
        config: {
          accessToken: '{{env.MERCADOPAGO_ACCESS_TOKEN}}',
          titulo: 'Veo Veo Libros',
          descripcion: 'Pedido #{{carrito_id}}',
          notificationUrl: '{{env.BACKEND_URL}}/webhooks/mercadopago',
          backUrls: {
            success: 'https://www.veoveolibros.com.ar/pago-exitoso',
            failure: 'https://www.veoveolibros.com.ar/pago-fallido',
            pending: 'https://www.veoveolibros.com.ar/pago-pendiente'
          },
          metadata: {
            empresa_id: '{{telefono_empresa}}',
            contacto_id: '{{contacto_id}}',
            telefono: '{{telefono_cliente}}'
          }
        }
      }
    };

    // 5. WhatsApp - Envía link de pago
    const whatsappLinkPago = {
      id: 'whatsapp-link-pago',
      type: 'whatsapp',
      position: { x: 2700, y: 0 },
      data: {
        label: 'WhatsApp: Link de Pago',
        config: {
          message: '{{mercadopago-checkout.mensaje}}',
          to: '{{telefono_cliente}}'
        }
      }
    };

    // 6. GPT Seguir comprando
    const gptSeguirComprando = {
      id: 'gpt-seguir-comprando',
      type: 'gpt',
      position: { x: 2300, y: 150 },
      data: {
        label: 'GPT: Seguir Comprando',
        config: {
          tipo: 'conversacional',
          modelo: 'gpt-3.5-turbo',
          systemPrompt: 'Eres un asistente de Veo Veo Libros.\n\nEl usuario quiere seguir comprando.\n\nPregúntale qué otro libro está buscando de forma amigable.\n\nEJEMPLO:\n"¡Perfecto! ¿Qué otro libro te gustaría buscar? 📚"'
        }
      }
    };

    // 7. WhatsApp Seguir comprando
    const whatsappSeguirComprando = {
      id: 'whatsapp-seguir-comprando',
      type: 'whatsapp',
      position: { x: 2500, y: 150 },
      data: {
        label: 'WhatsApp: Seguir',
        config: {
          message: '{{gpt-seguir-comprando.respuesta_gpt}}',
          to: '{{telefono_cliente}}'
        }
      }
    };

    // ============================================================
    // EDGES (CONEXIONES)
    // ============================================================

    const newEdges = [
      // Desde WhatsApp confirmación → GPT detectar finalizar
      {
        id: 'edge-confirmacion-to-detectar',
        source: 'whatsapp-confirmacion',
        target: 'gpt-detectar-finalizar',
        type: 'default'
      },
      // GPT detectar → Router finalizar
      {
        id: 'edge-detectar-to-router-finalizar',
        source: 'gpt-detectar-finalizar',
        target: 'router-finalizar',
        type: 'default'
      },
      // Router → Carrito Ver (Finalizar)
      {
        id: 'edge-router-finalizar-to-carrito-ver',
        source: 'router-finalizar',
        sourceHandle: 'route-finalizar',
        target: 'carrito-ver',
        type: 'default',
        data: {
          routeLabel: 'Finalizar compra'
        }
      },
      // Router → Seguir comprando
      {
        id: 'edge-router-finalizar-to-seguir',
        source: 'router-finalizar',
        sourceHandle: 'route-seguir',
        target: 'gpt-seguir-comprando',
        type: 'default',
        data: {
          routeLabel: 'Seguir comprando'
        }
      },
      // Carrito Ver → Mercado Pago
      {
        id: 'edge-carrito-ver-to-mp',
        source: 'carrito-ver',
        target: 'mercadopago-checkout',
        type: 'default'
      },
      // Mercado Pago → WhatsApp Link
      {
        id: 'edge-mp-to-whatsapp-link',
        source: 'mercadopago-checkout',
        target: 'whatsapp-link-pago',
        type: 'default'
      },
      // Seguir comprando → WhatsApp
      {
        id: 'edge-seguir-to-whatsapp',
        source: 'gpt-seguir-comprando',
        target: 'whatsapp-seguir-comprando',
        type: 'default'
      },
      // WhatsApp seguir → Volver a GPT Conversacional (loop)
      {
        id: 'edge-seguir-to-gpt-conv',
        source: 'whatsapp-seguir-comprando',
        target: 'gpt-conversacional',
        type: 'default'
      }
    ];

    // ============================================================
    // ACTUALIZAR FLUJO EN BD
    // ============================================================

    // Agregar nuevos nodos
    const nodosActualizados = [
      ...flow.nodes,
      gptDetectarFinalizarCompra,
      routerFinalizar,
      carritoVer,
      mercadoPago,
      whatsappLinkPago,
      gptSeguirComprando,
      whatsappSeguirComprando
    ];

    // Agregar nuevos edges
    const edgesActualizados = [
      ...flow.edges,
      ...newEdges
    ];

    const result = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      {
        $set: {
          nodes: nodosActualizados,
          edges: edgesActualizados
        }
      }
    );

    console.log('\n✅ FASE 2 COMPLETADA');
    console.log(`   Nodos agregados: 7`);
    console.log(`   Edges agregados: 8`);
    console.log(`   Total nodos: ${nodosActualizados.length}`);
    console.log(`   Total edges: ${edgesActualizados.length}`);
    
    console.log('\n📋 NODOS AGREGADOS:');
    console.log('   1. gpt-detectar-finalizar - Detecta intención');
    console.log('   2. router-finalizar - Decide Finalizar/Seguir');
    console.log('   3. carrito-ver - Muestra resumen');
    console.log('   4. mercadopago-checkout - Genera link de pago');
    console.log('   5. whatsapp-link-pago - Envía link');
    console.log('   6. gpt-seguir-comprando - Pregunta qué buscar');
    console.log('   7. whatsapp-seguir-comprando - Envía pregunta');

    console.log('\n🧪 TESTING:');
    console.log('   Después de agregar al carrito:');
    console.log('   "finalizar" → Debería generar link de MP');
    console.log('   "seguir" → Debería volver a búsqueda');

    console.log('\n⚠️  IMPORTANTE:');
    console.log('   Configurar variables de entorno:');
    console.log('   - MERCADOPAGO_ACCESS_TOKEN');
    console.log('   - BACKEND_URL');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

main();
