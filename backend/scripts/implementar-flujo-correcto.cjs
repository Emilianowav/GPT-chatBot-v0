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

    console.log('📋 Flujo:', flow.nombre);

    // ============================================================
    // 1. ELIMINAR NODOS DUPLICADOS (gpt-resultados y whatsapp-resultados)
    // ============================================================
    
    let nodosActualizados = flow.nodes.filter(n => 
      n.id !== 'gpt-resultados' && 
      n.id !== 'whatsapp-resultados'
    );

    let edgesActualizados = flow.edges.filter(e => 
      e.source !== 'gpt-resultados' && 
      e.target !== 'gpt-resultados' &&
      e.source !== 'whatsapp-resultados' && 
      e.target !== 'whatsapp-resultados'
    );

    console.log('\n🧹 Eliminados: gpt-resultados y whatsapp-resultados');

    // ============================================================
    // 2. ACTUALIZAR GPT ASISTENTE VENTAS (ahora muestra productos + pregunta)
    // ============================================================

    nodosActualizados = nodosActualizados.map(node => {
      if (node.id === 'gpt-asistente-ventas') {
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              systemPrompt: 'Eres un asistente de ventas de Veo Veo Libros.\n\nPRODUCTOS ENCONTRADOS:\n{{woocommerce}}\n\nTU TRABAJO:\n1. Muestra los productos de forma clara y atractiva\n2. Pregunta de forma natural si le interesa alguno o si quiere buscar más\n\nFORMATO:\n📚 Encontré estos libros:\n\n[Para cada producto]\n*[NOMBRE]*\n💰 Precio: $[precio]\n✅ Stock: [cantidad] unidades\n🔗 Ver más: [permalink]\n\n¿Te interesa alguno o preferís buscar otro libro?\n\nREGLAS:\n- Sé natural y conversacional\n- NO uses números para elegir\n- Muestra TODOS los productos disponibles\n- Pregunta abiertamente sin forzar opciones'
            }
          }
        };
      }
      return node;
    });

    console.log('✅ GPT Asistente actualizado (ahora muestra productos)');

    // ============================================================
    // 3. CONECTAR WooCommerce → GPT Asistente directamente
    // ============================================================

    // Eliminar edge antiguo de woocommerce
    edgesActualizados = edgesActualizados.filter(e => e.source !== 'woocommerce');

    // Agregar edge directo: woocommerce → gpt-asistente-ventas
    edgesActualizados.push({
      id: 'edge-woo-to-asistente',
      source: 'woocommerce',
      target: 'gpt-asistente-ventas',
      type: 'default'
    });

    console.log('✅ Conectado: WooCommerce → GPT Asistente');

    // ============================================================
    // 4. AGREGAR ROUTER PARA DETECTAR INTENCIÓN
    // ============================================================

    const routerIntencion = {
      id: 'router-intencion',
      type: 'router',
      position: { x: 1300, y: 100 },
      data: {
        label: 'Router',
        subtitle: 'Detectar Intención',
        config: {
          routes: [
            {
              id: 'route-agregar',
              label: 'Agregar al carrito',
              condition: '{{mensaje_usuario}} contains "si" OR {{mensaje_usuario}} contains "sí" OR {{mensaje_usuario}} contains "me interesa" OR {{mensaje_usuario}} contains "lo quiero" OR {{mensaje_usuario}} contains "dale" OR {{mensaje_usuario}} contains "ok"'
            },
            {
              id: 'route-buscar-mas',
              label: 'Buscar más',
              condition: '{{mensaje_usuario}} contains "buscar" OR {{mensaje_usuario}} contains "otro" OR {{mensaje_usuario}} contains "más" OR {{mensaje_usuario}} contains "diferente"'
            },
            {
              id: 'route-default',
              label: 'Continuar conversación',
              condition: 'default'
            }
          ]
        },
        hasConnection: true
      }
    };

    nodosActualizados.push(routerIntencion);
    console.log('✅ Router de intención agregado');

    // ============================================================
    // 5. AGREGAR GPT CONFIRMACIÓN (cuando agrega al carrito)
    // ============================================================

    const gptConfirmacion = {
      id: 'gpt-confirmacion-carrito',
      type: 'gpt',
      position: { x: 1500, y: 0 },
      data: {
        label: 'OpenAI (ChatGPT, Sera...',
        subtitle: 'conversacional',
        config: {
          tipo: 'conversacional',
          module: 'chat-completion',
          modelo: 'gpt-3.5-turbo',
          temperatura: 0.7,
          maxTokens: 500,
          systemPrompt: 'Eres un asistente de Veo Veo Libros.\n\nEl cliente acaba de mostrar interés en un libro.\n\nPRODUCTOS: {{woocommerce}}\n\nConfirma que anotaste el libro y pregunta si necesita algo más o si quiere finalizar la compra.\n\nEJEMPLO:\n"¡Perfecto! Anotado [nombre del libro] por $[precio]. ¿Necesitás buscar algo más o finalizamos la compra?"',
          personalidad: 'Eres amigable y eficiente.',
          topicos: [],
          accionesCompletado: [],
          variablesEntrada: [],
          variablesSalida: [],
          globalVariablesOutput: [],
          outputFormat: 'text'
        },
        hasConnection: true
      }
    };

    nodosActualizados.push(gptConfirmacion);

    const whatsappConfirmacion = {
      id: 'whatsapp-confirmacion-carrito',
      type: 'whatsapp',
      position: { x: 1700, y: 0 },
      data: {
        label: 'WhatsApp Business Cloud',
        subtitle: 'Send a Message',
        config: {
          module: 'send-message',
          message: '{{gpt-confirmacion-carrito.respuesta_gpt}}',
          telefono: '{{telefono_cliente}}',
          empresaId: '6940a9a181b92bfce970fdb5',
          phoneNumberId: '906667632531979'
        },
        hasConnection: true
      }
    };

    nodosActualizados.push(whatsappConfirmacion);
    console.log('✅ Nodos de confirmación agregados');

    // ============================================================
    // 6. AGREGAR ROUTER "¿ALGO MÁS?"
    // ============================================================

    const routerAlgoMas = {
      id: 'router-algo-mas',
      type: 'router',
      position: { x: 1900, y: 0 },
      data: {
        label: 'Router',
        subtitle: '¿Algo más?',
        config: {
          routes: [
            {
              id: 'route-finalizar',
              label: 'Finalizar compra',
              condition: '{{mensaje_usuario}} contains "no" OR {{mensaje_usuario}} contains "finalizar" OR {{mensaje_usuario}} contains "pagar" OR {{mensaje_usuario}} contains "comprar"'
            },
            {
              id: 'route-seguir',
              label: 'Seguir comprando',
              condition: 'default'
            }
          ]
        },
        hasConnection: true
      }
    };

    nodosActualizados.push(routerAlgoMas);
    console.log('✅ Router "¿Algo más?" agregado');

    // ============================================================
    // 7. CONECTAR EDGES
    // ============================================================

    // WhatsApp Asistente → Router Intención
    edgesActualizados.push({
      id: 'edge-whatsapp-asistente-to-router',
      source: 'whatsapp-asistente',
      target: 'router-intencion',
      type: 'default'
    });

    // Router → Agregar (GPT Confirmación)
    edgesActualizados.push({
      id: 'edge-router-to-confirmacion',
      source: 'router-intencion',
      sourceHandle: 'route-agregar',
      target: 'gpt-confirmacion-carrito',
      type: 'default'
    });

    // Router → Buscar más (Loop a GPT Conversacional)
    edgesActualizados.push({
      id: 'edge-router-to-buscar-mas',
      source: 'router-intencion',
      sourceHandle: 'route-buscar-mas',
      target: 'gpt-conversacional',
      type: 'default'
    });

    // Router → Default (GPT Asistente)
    edgesActualizados.push({
      id: 'edge-router-to-default',
      source: 'router-intencion',
      sourceHandle: 'route-default',
      target: 'gpt-asistente-ventas',
      type: 'default'
    });

    // GPT Confirmación → WhatsApp
    edgesActualizados.push({
      id: 'edge-confirmacion-to-whatsapp',
      source: 'gpt-confirmacion-carrito',
      target: 'whatsapp-confirmacion-carrito',
      type: 'default'
    });

    // WhatsApp Confirmación → Router Algo Más
    edgesActualizados.push({
      id: 'edge-whatsapp-conf-to-router-mas',
      source: 'whatsapp-confirmacion-carrito',
      target: 'router-algo-mas',
      type: 'default'
    });

    // Router Algo Más → Seguir (Loop a GPT Conversacional)
    edgesActualizados.push({
      id: 'edge-router-mas-to-seguir',
      source: 'router-algo-mas',
      sourceHandle: 'route-seguir',
      target: 'gpt-conversacional',
      type: 'default'
    });

    console.log('✅ Edges conectados');

    // ============================================================
    // 8. GUARDAR EN BD
    // ============================================================

    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      {
        $set: {
          nodes: nodosActualizados,
          edges: edgesActualizados
        }
      }
    );

    console.log('\n✅ FLUJO ACTUALIZADO');
    console.log(`   Total nodos: ${nodosActualizados.length}`);
    console.log(`   Total edges: ${edgesActualizados.length}`);

    console.log('\n📋 ESTRUCTURA FINAL:');
    console.log('   WooCommerce');
    console.log('   ↓');
    console.log('   GPT Asistente (muestra productos + pregunta)');
    console.log('   ↓');
    console.log('   WhatsApp');
    console.log('   ↓');
    console.log('   Router Intención');
    console.log('   ├─ Agregar → GPT Confirmación → WhatsApp → Router ¿Algo más?');
    console.log('   │                                              ├─ Finalizar → [PENDIENTE: Mercado Pago]');
    console.log('   │                                              └─ Seguir → Loop');
    console.log('   ├─ Buscar más → Loop a GPT Conversacional');
    console.log('   └─ Default → GPT Asistente (repregunta)');

    console.log('\n⚠️  PENDIENTE:');
    console.log('   - Conectar ruta "Finalizar" a Mercado Pago');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

main();
