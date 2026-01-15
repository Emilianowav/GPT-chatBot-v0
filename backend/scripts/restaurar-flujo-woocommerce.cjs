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
    // ELIMINAR NODOS DE CARRITO Y MERCADOPAGO
    // ============================================================
    
    const nodosAEliminar = [
      'gpt-asistente-ventas',
      'router-acciones',
      'carrito-agregar',
      'carrito-ver',
      'mercadopago-checkout',
      'whatsapp-respuesta'
    ];

    const nodosLimpios = flow.nodes.filter(n => !nodosAEliminar.includes(n.id));
    const edgesLimpios = flow.edges.filter(e => 
      !nodosAEliminar.includes(e.source) && 
      !nodosAEliminar.includes(e.target)
    );

    console.log(`\n🧹 Eliminando nodos que no existen en el frontend:`);
    console.log(`   Nodos eliminados: ${flow.nodes.length - nodosLimpios.length}`);
    console.log(`   Edges eliminados: ${flow.edges.length - edgesLimpios.length}`);

    // ============================================================
    // AGREGAR GPT ASISTENTE DE VENTAS (solo GPT, sin nodos especiales)
    // ============================================================

    const gptAsistenteVentas = {
      id: 'gpt-asistente-ventas',
      type: 'gpt',
      position: { x: 900, y: 100 },
      data: {
        label: 'GPT: Asistente de Ventas',
        config: {
          tipo: 'conversacional',
          modelo: 'gpt-4',
          systemPrompt: 'Eres un asistente de ventas de Veo Veo Libros. Tu objetivo es ayudar al cliente de forma natural y conversacional.\\n\\nCONTEXTO ACTUAL:\\n- Resultados de búsqueda: {{gpt-resultados.respuesta_gpt}}\\n- Productos disponibles: {{woocommerce}}\\n\\nTU TRABAJO:\\n1. Mantener una conversación natural y fluida\\n2. Entender la intención del usuario sin ser rígido\\n3. Llevar un registro mental de lo que el usuario quiere comprar\\n4. Responder preguntas como cuanto llevo, que tengo, etc.\\n5. Cuando el usuario quiera finalizar, generar un resumen de compra\\n\\nREGLAS:\\n- NO uses números para elegir productos, habla naturalmente\\n- NO fuerces opciones, deja que la conversación fluya\\n- Mantén en tu contexto los libros que el usuario ha mostrado interés\\n- Si pregunta cuanto llevo, calcula el total basándote en lo que ha pedido\\n- Si pregunta que tengo, lista los libros que mencionó querer\\n\\nEJEMPLOS DE CONVERSACIÓN:\\n\\nUsuario: Me interesa ese libro\\nTú: Perfecto! Anotado el libro. Te gustaría buscar algo más o prefieres que preparemos tu pedido?\\n\\nUsuario: Cuanto llevo?\\nTú: Hasta ahora tenés 1 libro por $39.900. Total: $39.900. Querés agregar algo más?\\n\\nUsuario: Quiero pagar\\nTú: Excelente! Tu pedido: 1 libro por $39.900. Confirmamos el pedido?\\n\\nMantén la conversación natural, amigable y sin presionar. Usa tu memoria de la conversación para recordar qué libros mencionó el usuario.'
        }
      }
    };

    const whatsappAsistente = {
      id: 'whatsapp-asistente',
      type: 'whatsapp',
      position: { x: 1100, y: 100 },
      data: {
        label: 'WhatsApp: Asistente',
        config: {
          message: '{{gpt-asistente-ventas.respuesta_gpt}}',
          to: '{{telefono_cliente}}'
        }
      }
    };

    // ============================================================
    // EDGES
    // ============================================================

    const newEdges = [
      // Desde WhatsApp resultados → GPT Asistente
      {
        id: 'edge-resultados-to-asistente',
        source: 'whatsapp-resultados',
        target: 'gpt-asistente-ventas',
        type: 'default'
      },
      // GPT Asistente → WhatsApp
      {
        id: 'edge-asistente-to-whatsapp',
        source: 'gpt-asistente-ventas',
        target: 'whatsapp-asistente',
        type: 'default'
      },
      // WhatsApp → Loop a GPT Asistente (conversación continua)
      {
        id: 'edge-whatsapp-to-asistente-loop',
        source: 'whatsapp-asistente',
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
      whatsappAsistente
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

    console.log('\n✅ FLUJO RESTAURADO Y MEJORADO');
    console.log(`   Total nodos: ${nodosFinales.length}`);
    console.log(`   Total edges: ${edgesFinales.length}`);
    
    console.log('\n📋 ESTRUCTURA FINAL:');
    console.log('   [Flujo WooCommerce original] → GPT Asistente de Ventas → WhatsApp → Loop');

    console.log('\n💡 CÓMO FUNCIONA:');
    console.log('   - GPT mantiene conversación natural');
    console.log('   - GPT usa su memoria para recordar qué quiere el usuario');
    console.log('   - GPT responde dinámicamente a "cuánto llevo", "qué tengo", etc.');
    console.log('   - NO hay nodos especiales de carrito (todo en contexto de GPT)');

    console.log('\n🧪 EJEMPLOS DE CONVERSACIÓN:');
    console.log('   Usuario: "Me interesa La Soledad"');
    console.log('   GPT: "¡Perfecto! Anotado \'La Soledad\' ($39.900)..."');
    console.log('');
    console.log('   Usuario: "Cuánto llevo?"');
    console.log('   GPT: "Hasta ahora tenés: La Soledad ($39.900). Total: $39.900"');
    console.log('');
    console.log('   Usuario: "Quiero pagar"');
    console.log('   GPT: "¡Excelente! Tu pedido: La Soledad ($39.900). ¿Confirmamos?"');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

main();
