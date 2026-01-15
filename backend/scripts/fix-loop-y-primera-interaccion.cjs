const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fix() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const collection = db.collection('flows');
    
    const flow = await collection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    // 1. ELIMINAR el edge incorrecto (whatsapp-preguntar → webhook-whatsapp)
    flow.edges = flow.edges.filter(e => e.id !== 'edge-loop-preguntar-webhook');
    
    // 2. AGREGAR edge correcto (whatsapp-preguntar → gpt-conversacional)
    const edgeExiste = flow.edges.find(e => 
      e.source === 'whatsapp-preguntar' && e.target === 'gpt-conversacional'
    );
    
    if (!edgeExiste) {
      flow.edges.push({
        id: 'edge-loop-correcto',
        source: 'whatsapp-preguntar',
        target: 'gpt-conversacional',
        type: 'default',
        animated: true,
        data: {
          label: 'Continuar conversación',
          color: '#8b5cf6'
        }
      });
      console.log('✅ Edge de loop agregado: whatsapp-preguntar → gpt-conversacional');
    }
    
    // 3. CONFIGURAR gpt-conversacional para primera interacción
    const gptConv = flow.nodes.find(n => n.id === 'gpt-conversacional');
    if (gptConv) {
      gptConv.data.config.systemPrompt = `Eres el asistente virtual de **Librería Veo Veo** 📚✏️

Características de tu personalidad:
- Tono amigable, profesional y entusiasta
- Usas emojis para hacer la conversación más cálida
- Eres paciente y comprensivo con errores de ortografía
- Siempre saludas con energía positiva

IMPORTANTE:
- Si el usuario saluda sin mencionar un libro, pregunta QUÉ libro está buscando
- Si menciona un libro, extrae el título y confirma
- NO preguntes por editorial o edición en la primera interacción
- Mantén las respuestas breves y directas`;
      
      console.log('✅ System prompt de gpt-conversacional actualizado');
    }
    
    // 4. CONFIGURAR gpt-pedir-datos para que NO use variables sin resolver
    const gptPedir = flow.nodes.find(n => n.id === 'gpt-pedir-datos');
    if (gptPedir) {
      gptPedir.data.config.systemPrompt = `El usuario está buscando un libro pero falta información sobre la editorial.

IMPORTANTE:
- Pregunta ESPECÍFICAMENTE por la editorial
- Dale la opción de elegir "cualquiera" si no tiene preferencia
- Sé breve y directo
- Mantén un tono amigable

Ejemplo: "¿De qué editorial lo necesitás? Si no tenés preferencia, podés decir 'cualquiera' 📚"`;
      
      console.log('✅ System prompt de gpt-pedir-datos actualizado (sin variables)');
    }
    
    // Guardar cambios
    await collection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes, edges: flow.edges } }
    );
    
    console.log('\n✅ FLUJO CORREGIDO');
    console.log(`   Total edges: ${flow.edges.length}`);
    console.log('\n📋 Edges desde whatsapp-preguntar:');
    flow.edges.filter(e => e.source === 'whatsapp-preguntar').forEach(e => {
      console.log(`   ${e.id}: ${e.source} → ${e.target}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fix();
