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
    // FASE 1: AGREGAR NODOS DE CARRITO
    // ============================================================

    // 1. GPT "¿Agregar al carrito?"
    const gptAgregarCarrito = {
      id: 'gpt-agregar-carrito',
      type: 'gpt',
      position: { x: 900, y: 100 },
      data: {
        label: 'GPT: ¿Agregar al carrito?',
        config: {
          tipo: 'conversacional',
          modelo: 'gpt-3.5-turbo',
          systemPrompt: `Eres un asistente de Veo Veo Libros.

El usuario acaba de ver los resultados de su búsqueda.

RESULTADOS MOSTRADOS:
{{gpt-resultados.respuesta_gpt}}

Tu tarea es preguntarle de forma natural si desea agregar algún libro al carrito.

INSTRUCCIONES:
- Sé conversacional y amigable
- Si hay libros con stock, pregunta si quiere agregar alguno
- Si NO hay libros con stock, pregunta si quiere buscar otro libro
- NO uses números ni listas, mantén la conversación natural

EJEMPLOS:

Si hay stock:
"¿Te gustaría agregar alguno de estos libros al carrito? 😊"

Si NO hay stock:
"Lamentablemente estos libros no tienen stock en este momento. ¿Te gustaría buscar otro libro?"

Responde de forma natural según el contexto.`
        }
      }
    };

    // 2. Router: ¿Quiere agregar?
    const routerAgregar = {
      id: 'router-agregar',
      type: 'router',
      position: { x: 1100, y: 100 },
      data: {
        label: 'Router: ¿Agregar?',
        config: {
          routes: [
            {
              id: 'route-si',
              label: 'Sí, agregar',
              condition: '{{mensaje_usuario}} contains "si" OR {{mensaje_usuario}} contains "sí" OR {{mensaje_usuario}} contains "dale" OR {{mensaje_usuario}} contains "ok" OR {{mensaje_usuario}} contains "bueno"'
            },
            {
              id: 'route-no',
              label: 'No / Buscar otro',
              condition: 'default'
            }
          ]
        }
      }
    };

    // 3. Carrito (Agregar) - Agrega el PRIMER producto con stock
    const carritoAgregar = {
      id: 'carrito-agregar',
      type: 'carrito',
      position: { x: 1300, y: 50 },
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
              sku: '{{woocommerce[0].sku}}',
              stock_status: '{{woocommerce[0].stock_status}}'
            }
          }
        }
      }
    };

    // 4. GPT Confirmación
    const gptConfirmacion = {
      id: 'gpt-confirmacion',
      type: 'gpt',
      position: { x: 1500, y: 50 },
      data: {
        label: 'GPT: Confirmación',
        config: {
          tipo: 'conversacional',
          modelo: 'gpt-3.5-turbo',
          systemPrompt: 'Eres un asistente de Veo Veo Libros.\n\nEl usuario acaba de agregar un libro al carrito.\n\nINFORMACIÓN DEL CARRITO:\n- Total de items: {{carrito_items_count}}\n- Total a pagar: ${{carrito_total}}\n\nConfirma la acción y pregunta si desea finalizar la compra o seguir comprando.\n\nEJEMPLO:\n"✅ ¡Perfecto! Agregué el libro a tu carrito.\n\n🛒 Carrito: {{carrito_items_count}} item(s)\n💰 Total: ${{carrito_total}}\n\n¿Deseas finalizar la compra o seguir buscando más libros?"'
        }
      }
    };

    // 5. WhatsApp Confirmación
    const whatsappConfirmacion = {
      id: 'whatsapp-confirmacion',
      type: 'whatsapp',
      position: { x: 1700, y: 50 },
      data: {
        label: 'WhatsApp: Confirmación',
        config: {
          message: '{{gpt-confirmacion.respuesta_gpt}}',
          to: '{{telefono_cliente}}'
        }
      }
    };

    // 6. GPT Volver a buscar
    const gptVolverBuscar = {
      id: 'gpt-volver-buscar',
      type: 'gpt',
      position: { x: 1300, y: 200 },
      data: {
        label: 'GPT: Volver a buscar',
        config: {
          tipo: 'conversacional',
          modelo: 'gpt-3.5-turbo',
          systemPrompt: 'Eres un asistente de Veo Veo Libros.\n\nEl usuario decidió no agregar el libro al carrito o quiere buscar otro.\n\nPregúntale qué otro libro está buscando de forma amigable.\n\nEJEMPLO:\n"¡Perfecto! ¿Qué otro libro estás buscando? 📚"'
        }
      }
    };

    // 7. WhatsApp Volver a buscar
    const whatsappVolverBuscar = {
      id: 'whatsapp-volver-buscar',
      type: 'whatsapp',
      position: { x: 1500, y: 200 },
      data: {
        label: 'WhatsApp: Volver a buscar',
        config: {
          message: '{{gpt-volver-buscar.respuesta_gpt}}',
          to: '{{telefono_cliente}}'
        }
      }
    };

    // ============================================================
    // EDGES (CONEXIONES)
    // ============================================================

    const newEdges = [
      // Desde WhatsApp resultados → GPT agregar carrito
      {
        id: 'edge-whatsapp-resultados-to-gpt-agregar',
        source: 'whatsapp-resultados',
        target: 'gpt-agregar-carrito',
        type: 'default'
      },
      // GPT agregar → Router
      {
        id: 'edge-gpt-agregar-to-router',
        source: 'gpt-agregar-carrito',
        target: 'router-agregar',
        type: 'default'
      },
      // Router → Carrito (Sí)
      {
        id: 'edge-router-to-carrito',
        source: 'router-agregar',
        sourceHandle: 'route-si',
        target: 'carrito-agregar',
        type: 'default',
        data: {
          routeLabel: 'Sí, agregar'
        }
      },
      // Router → Volver a buscar (No)
      {
        id: 'edge-router-to-volver',
        source: 'router-agregar',
        sourceHandle: 'route-no',
        target: 'gpt-volver-buscar',
        type: 'default',
        data: {
          routeLabel: 'No / Buscar otro'
        }
      },
      // Carrito → GPT Confirmación
      {
        id: 'edge-carrito-to-confirmacion',
        source: 'carrito-agregar',
        target: 'gpt-confirmacion',
        type: 'default'
      },
      // GPT Confirmación → WhatsApp
      {
        id: 'edge-confirmacion-to-whatsapp',
        source: 'gpt-confirmacion',
        target: 'whatsapp-confirmacion',
        type: 'default'
      },
      // Volver a buscar → WhatsApp
      {
        id: 'edge-volver-to-whatsapp',
        source: 'gpt-volver-buscar',
        target: 'whatsapp-volver-buscar',
        type: 'default'
      }
    ];

    // ============================================================
    // ACTUALIZAR FLUJO EN BD
    // ============================================================

    // Agregar nuevos nodos
    const nodosActualizados = [
      ...flow.nodes,
      gptAgregarCarrito,
      routerAgregar,
      carritoAgregar,
      gptConfirmacion,
      whatsappConfirmacion,
      gptVolverBuscar,
      whatsappVolverBuscar
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

    console.log('\n✅ FASE 1 COMPLETADA');
    console.log(`   Nodos agregados: 7`);
    console.log(`   Edges agregados: 7`);
    console.log(`   Total nodos: ${nodosActualizados.length}`);
    console.log(`   Total edges: ${edgesActualizados.length}`);
    
    console.log('\n📋 NODOS AGREGADOS:');
    console.log('   1. gpt-agregar-carrito - Pregunta si agregar');
    console.log('   2. router-agregar - Decide Sí/No');
    console.log('   3. carrito-agregar - Agrega al carrito');
    console.log('   4. gpt-confirmacion - Confirma y pregunta si finalizar');
    console.log('   5. whatsapp-confirmacion - Envía confirmación');
    console.log('   6. gpt-volver-buscar - Pregunta qué buscar');
    console.log('   7. whatsapp-volver-buscar - Envía pregunta');

    console.log('\n🧪 TESTING:');
    console.log('   1. Limpiar estado: node scripts/limpiar-mi-numero.js');
    console.log('   2. En WhatsApp:');
    console.log('      "hola"');
    console.log('      "busco la soledad"');
    console.log('      "cualquiera"');
    console.log('      "sí" (para agregar al carrito)');
    console.log('   3. Verificar que se agregue al carrito en MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

main();
