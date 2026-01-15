const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function configurar() {
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
    
    // Buscar el nodo gpt-pedir-datos
    const nodo = flow.nodes.find(n => n.id === 'gpt-pedir-datos');
    
    if (!nodo) {
      console.log('❌ Nodo gpt-pedir-datos no encontrado');
      return;
    }
    
    console.log('📋 CONFIGURACIÓN ACTUAL:');
    console.log(JSON.stringify(nodo.data.config, null, 2));
    
    // Actualizar configuración
    nodo.data.config.variablesRecopilar = [
      {
        nombre: 'editorial',
        descripcion: 'Editorial del libro',
        obligatorio: false,
        tipo: 'texto',
        ejemplos: ['Santillana', 'Salamandra', 'Estrada', 'cualquiera']
      }
    ];
    
    nodo.data.config.topicHandling = 'disabled';
    nodo.data.config.topicos = [];
    
    // Mejorar el system prompt
    nodo.data.config.systemPrompt = `El usuario está buscando un libro pero falta información sobre la editorial.

Variables que ya tenemos:
- Título: {{titulo}}
- Edición: {{edicion}}

IMPORTANTE:
- Pregunta ESPECÍFICAMENTE por la editorial
- Dale la opción de elegir "cualquiera" si no tiene preferencia
- Sé breve y directo
- Mantén un tono amigable

Ejemplo: "¿De qué editorial lo necesitás? Si no tenés preferencia, podés decir 'cualquiera' 📚"`;
    
    // Guardar cambios
    await collection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n✅ CONFIGURACIÓN ACTUALIZADA:');
    console.log(JSON.stringify(nodo.data.config, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

configurar();
