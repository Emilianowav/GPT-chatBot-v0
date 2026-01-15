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
    
    // Buscar el nodo gpt-formateador
    const nodo = flow.nodes.find(n => n.id === 'gpt-formateador');
    
    if (!nodo) {
      console.log('❌ Nodo gpt-formateador no encontrado');
      return;
    }
    
    console.log('📋 CONFIGURACIÓN ACTUAL:');
    console.log(JSON.stringify(nodo.data.config, null, 2));
    
    // Actualizar configuración para que arme la consulta de WooCommerce
    nodo.data.config.systemPrompt = `Eres un formateador de consultas para WooCommerce.

Variables disponibles:
- Título: {{titulo}}
- Editorial: {{editorial}}
- Edición: {{edicion}}

Tu trabajo es armar una consulta de búsqueda óptima para WooCommerce.

REGLAS:
1. Si el título incluye el número de edición (ej: "harry potter 5"), NO lo incluyas en la búsqueda
2. Si hay editorial, inclúyela en la búsqueda
3. Devuelve SOLO el término de búsqueda, sin explicaciones

Ejemplos:
- titulo="Harry Potter 5", editorial="Salamandra" → "Harry Potter Salamandra"
- titulo="Matemática", editorial="Santillana", edicion="2023" → "Matemática Santillana"
- titulo="Don Quijote", editorial=null → "Don Quijote"

Devuelve SOLO el término de búsqueda optimizado.`;

    nodo.data.config.variablesRecopilar = [];
    nodo.data.config.topicHandling = 'disabled';
    nodo.data.config.topicos = [];
    
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
