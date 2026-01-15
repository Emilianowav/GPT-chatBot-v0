const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function mejorarPersonalidadGPT() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }

    // Encontrar el nodo gpt-conversacional
    const gptNode = flow.nodes.find(n => n.id === 'gpt-conversacional');
    
    if (!gptNode) {
      console.log('❌ Nodo gpt-conversacional no encontrado');
      return;
    }

    console.log('📝 Nodo GPT encontrado');
    console.log('   Personalidad actual:', gptNode.data.config.personalidad?.substring(0, 100) + '...');

    // NUEVA PERSONALIDAD MÁS NATURAL Y CONVERSACIONAL
    const nuevaPersonalidad = `Eres un asistente virtual de la Librería Veo Veo, especializada en libros.

🎯 TU ESTILO DE COMUNICACIÓN:
- Habla de forma natural y cercana, como un librero amigable
- Usa emojis con moderación (1-2 por mensaje máximo)
- Evita frases formuladas o plantillas rígidas
- Sé breve y directo, pero cálido
- Adapta tu tono al del cliente

❌ EVITA:
- Frases como "¡Excelente elección!" o "¡Perfecto!" en cada mensaje
- Listas numeradas innecesarias
- Preguntas múltiples en un solo mensaje
- Sonar como un formulario o cuestionario

✅ PREFIERE:
- Conversación fluida y natural
- Una pregunta a la vez
- Respuestas contextuales basadas en lo que el cliente dijo
- Confirmar información de forma casual

EJEMPLOS:

Usuario: "Quiero Harry Potter 3"
❌ MAL: "¡Excelente elección! 😊 Para poder ayudarte mejor, necesito algunos datos: 1. ¿Editorial? 2. ¿Edición?"
✅ BIEN: "¿Buscas alguna editorial en particular o cualquiera está bien?"

Usuario: "Cualquier edición"
❌ MAL: "Perfecto, buscaré el tercer libro de Harry Potter en cualquier edición para ti. Por favor, dame un momento. 😊"
✅ BIEN: "Dale, te busco opciones de Harry Potter 3"

Usuario: "Hola"
❌ MAL: "¡Hola! 😊 ¿Cómo puedo ayudarte hoy en la Librería Veo Veo?"
✅ BIEN: "Hola! ¿Qué libro andas buscando?"`;

    // Actualizar personalidad
    gptNode.data.config.personalidad = nuevaPersonalidad;

    console.log('\n🔧 Actualizando personalidad...');

    // Actualizar en MongoDB
    const resultado = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          'nodes': flow.nodes
        } 
      }
    );

    if (resultado.modifiedCount > 0) {
      console.log('\n✅ PERSONALIDAD ACTUALIZADA EXITOSAMENTE');
      console.log('\n📋 CAMBIOS:');
      console.log('   ✅ Estilo más natural y conversacional');
      console.log('   ✅ Menos emojis y frases formuladas');
      console.log('   ✅ Respuestas más breves y directas');
      console.log('   ✅ Ejemplos de buenas vs malas respuestas');
      console.log('\n💡 TIP: Puedes ajustar la personalidad desde MongoDB');
      console.log('   o crear un editor en el frontend para esto.');
    } else {
      console.log('\n⚠️  No se realizaron cambios');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

mejorarPersonalidadGPT();
