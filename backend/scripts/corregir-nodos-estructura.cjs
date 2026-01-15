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
    console.log('   Nodos actuales:', flow.nodes.length);

    // ============================================================
    // CORREGIR ESTRUCTURA DE NODOS
    // ============================================================

    const nodosCorregidos = flow.nodes.map(node => {
      // Corregir GPT Asistente de Ventas
      if (node.id === 'gpt-asistente-ventas') {
        console.log('\n🔧 Corrigiendo: gpt-asistente-ventas');
        return {
          ...node,
          data: {
            label: 'OpenAI (ChatGPT, Sera...',
            subtitle: 'conversacional',
            executionCount: 0,
            config: {
              tipo: 'conversacional',
              module: 'chat-completion',
              modelo: 'gpt-4',
              temperatura: 0.7,
              maxTokens: 1000,
              systemPrompt: 'Eres un asistente de ventas de Veo Veo Libros. Tu objetivo es ayudar al cliente de forma natural y conversacional.\n\nCONTEXTO ACTUAL:\n- Resultados de búsqueda: {{gpt-resultados.respuesta_gpt}}\n- Productos disponibles: {{woocommerce}}\n\nTU TRABAJO:\n1. Mantener una conversación natural y fluida\n2. Entender la intención del usuario sin ser rígido\n3. Llevar un registro mental de lo que el usuario quiere comprar\n4. Responder preguntas como cuanto llevo, que tengo, etc.\n5. Cuando el usuario quiera finalizar, generar un resumen de compra\n\nREGLAS:\n- NO uses números para elegir productos, habla naturalmente\n- NO fuerces opciones, deja que la conversación fluya\n- Mantén en tu contexto los libros que el usuario ha mostrado interés\n- Si pregunta cuanto llevo, calcula el total basándote en lo que ha pedido\n- Si pregunta que tengo, lista los libros que mencionó querer\n\nEJEMPLOS:\n\nUsuario: Me interesa ese libro\nTú: Perfecto! Anotado el libro. Te gustaría buscar algo más o prefieres que preparemos tu pedido?\n\nUsuario: Cuanto llevo?\nTú: Hasta ahora tenés 1 libro por $39.900. Total: $39.900. Querés agregar algo más?\n\nUsuario: Quiero pagar\nTú: Excelente! Tu pedido: 1 libro por $39.900. Confirmamos el pedido?\n\nMantén la conversación natural, amigable y sin presionar. Usa tu memoria de la conversación para recordar qué libros mencionó el usuario.',
              personalidad: 'Eres un asistente de ventas amigable y profesional de Veo Veo Libros.',
              topicos: [
                {
                  id: 'topico-ventas-1',
                  titulo: 'Gestión de Carrito Mental',
                  contenido: 'Mantén registro mental de los libros que el usuario quiere comprar. Calcula totales cuando te lo pidan.',
                  keywords: ['carrito', 'total', 'cuanto llevo', 'que tengo']
                },
                {
                  id: 'topico-ventas-2',
                  titulo: 'Conversación Natural',
                  contenido: 'Habla de forma natural sin forzar opciones numeradas. Deja que la conversación fluya.',
                  keywords: ['natural', 'conversacional', 'fluido']
                },
                {
                  id: 'topico-ventas-3',
                  titulo: 'Finalización de Compra',
                  contenido: 'Cuando el usuario quiera pagar, genera un resumen claro del pedido y confirma.',
                  keywords: ['pagar', 'finalizar', 'comprar', 'checkout']
                }
              ],
              accionesCompletado: [],
              variablesEntrada: [],
              variablesSalida: [],
              globalVariablesOutput: [],
              outputFormat: 'text',
              label: 'GPT: Asistente de Ventas'
            },
            hasConnection: true
          }
        };
      }

      // Corregir WhatsApp Asistente
      if (node.id === 'whatsapp-asistente') {
        console.log('🔧 Corrigiendo: whatsapp-asistente');
        return {
          ...node,
          data: {
            label: 'WhatsApp Business Cloud',
            subtitle: 'Send a Message',
            executionCount: 0,
            config: {
              module: 'send-message',
              message: '{{gpt-asistente-ventas.respuesta_gpt}}',
              telefono: '{{telefono_cliente}}',
              empresaId: '6940a9a181b92bfce970fdb5',
              phoneNumberId: '906667632531979'
            },
            hasConnection: true
          }
        };
      }

      return node;
    });

    // ============================================================
    // ACTUALIZAR EN BD
    // ============================================================

    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      {
        $set: {
          nodes: nodosCorregidos
        }
      }
    );

    console.log('\n✅ NODOS CORREGIDOS');
    console.log('   Total nodos:', nodosCorregidos.length);
    
    console.log('\n📋 CAMBIOS REALIZADOS:');
    console.log('   1. gpt-asistente-ventas:');
    console.log('      - Agregado subtitle: "conversacional"');
    console.log('      - Agregado module: "chat-completion"');
    console.log('      - Agregado estructura completa de config');
    console.log('      - Agregado systemPrompt con instrucciones');
    console.log('      - Agregado personalidad y topicos');
    console.log('');
    console.log('   2. whatsapp-asistente:');
    console.log('      - Agregado subtitle: "Send a Message"');
    console.log('      - Agregado module: "send-message"');
    console.log('      - Cambiado "to" por "telefono"');
    console.log('      - Agregado empresaId y phoneNumberId');

    console.log('\n🎯 RESULTADO:');
    console.log('   - Los nodos ahora tienen la estructura correcta');
    console.log('   - El modal de GPT mostrará toda la configuración');
    console.log('   - El nodo de WhatsApp mostrará "Send a Message"');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

main();
