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
    // AGREGAR NODO MERCADO PAGO
    // ============================================================

    // Nota: Como mercadopago no es un tipo de nodo reconocido por el frontend,
    // vamos a usar un nodo GPT que simule la generación del link de pago
    // hasta que se implemente el tipo mercadopago en el frontend

    const gptMercadoPago = {
      id: 'gpt-mercadopago',
      type: 'gpt',
      position: { x: 2100, y: -100 },
      data: {
        label: 'OpenAI (ChatGPT, Sera...',
        subtitle: 'conversacional',
        config: {
          tipo: 'conversacional',
          module: 'chat-completion',
          modelo: 'gpt-3.5-turbo',
          temperatura: 0.7,
          maxTokens: 500,
          systemPrompt: 'Eres un asistente de Veo Veo Libros.\n\nEl cliente ha confirmado que quiere finalizar la compra.\n\nGenera un mensaje de confirmación del pedido y solicita datos para el envío.\n\nEJEMPLO:\n"¡Perfecto! Confirmamos tu pedido:\n\n📚 Libros:\n[Lista de libros mencionados en la conversación]\n\n💰 Total: $[calcular total]\n\nPara procesar el envío necesito:\n1. Nombre completo\n2. Dirección de entrega\n3. Código postal\n\n¿Me podés pasar esos datos?"',
          personalidad: 'Eres profesional y eficiente en el proceso de checkout.',
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

    const whatsappMercadoPago = {
      id: 'whatsapp-mercadopago',
      type: 'whatsapp',
      position: { x: 2300, y: -100 },
      data: {
        label: 'WhatsApp Business Cloud',
        subtitle: 'Send a Message',
        config: {
          module: 'send-message',
          message: '{{gpt-mercadopago.respuesta_gpt}}',
          telefono: '{{telefono_cliente}}',
          empresaId: '6940a9a181b92bfce970fdb5',
          phoneNumberId: '906667632531979'
        },
        hasConnection: true
      }
    };

    flow.nodes.push(gptMercadoPago);
    flow.nodes.push(whatsappMercadoPago);

    console.log('✅ Nodos de Mercado Pago agregados');

    // ============================================================
    // CONECTAR ROUTER "FINALIZAR" → MERCADO PAGO
    // ============================================================

    flow.edges.push({
      id: 'edge-router-mas-to-finalizar',
      source: 'router-algo-mas',
      sourceHandle: 'route-finalizar',
      target: 'gpt-mercadopago',
      type: 'default'
    });

    flow.edges.push({
      id: 'edge-gpt-mp-to-whatsapp',
      source: 'gpt-mercadopago',
      target: 'whatsapp-mercadopago',
      type: 'default'
    });

    console.log('✅ Router conectado a Mercado Pago');

    // ============================================================
    // GUARDAR EN BD
    // ============================================================

    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      {
        $set: {
          nodes: flow.nodes,
          edges: flow.edges
        }
      }
    );

    console.log('\n✅ FLUJO COMPLETO IMPLEMENTADO');
    console.log(`   Total nodos: ${flow.nodes.length}`);
    console.log(`   Total edges: ${flow.edges.length}`);

    console.log('\n📋 FLUJO FINAL:');
    console.log('   1. Usuario: "Hola"');
    console.log('   2. GPT Conversacional: "¿Qué libro buscas?"');
    console.log('   3. Usuario: "Harry Potter 5"');
    console.log('   4. GPT Formateador: Extrae datos');
    console.log('   5. Router: ¿Tiene datos? → Sí');
    console.log('   6. WooCommerce: Busca productos');
    console.log('   7. GPT Asistente: Muestra productos + pregunta');
    console.log('   8. WhatsApp: Envía mensaje');
    console.log('   9. Usuario: "Sí, me interesa"');
    console.log('   10. Router Intención: Detecta "Agregar"');
    console.log('   11. GPT Confirmación: "Anotado! ¿Algo más?"');
    console.log('   12. WhatsApp: Envía confirmación');
    console.log('   13. Usuario: "No, quiero pagar"');
    console.log('   14. Router ¿Algo más?: Detecta "Finalizar"');
    console.log('   15. GPT Mercado Pago: Solicita datos de envío');
    console.log('   16. WhatsApp: Envía solicitud');

    console.log('\n🧪 TESTING:');
    console.log('   Probá este flujo en WhatsApp:');
    console.log('   1. "hola"');
    console.log('   2. "busco harry potter 5"');
    console.log('   3. "cualquiera"');
    console.log('   4. "sí" (para agregar)');
    console.log('   5. "no, quiero pagar" (para finalizar)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

main();
