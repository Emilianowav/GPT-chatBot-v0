const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function agregarEdge() {
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
    
    // Verificar si el edge ya existe
    const edgeExiste = flow.edges.find(e => 
      e.source === 'whatsapp-preguntar' && e.target === 'webhook-whatsapp'
    );
    
    if (edgeExiste) {
      console.log('✅ El edge ya existe:', edgeExiste.id);
      return;
    }
    
    // Crear el edge de vuelta
    const nuevoEdge = {
      id: 'edge-loop-preguntar-webhook',
      source: 'whatsapp-preguntar',
      target: 'webhook-whatsapp',
      type: 'default',
      animated: true,
      data: {
        label: 'Volver al inicio',
        color: '#8b5cf6'
      }
    };
    
    flow.edges.push(nuevoEdge);
    
    // Guardar cambios
    await collection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    console.log('✅ Edge agregado:');
    console.log(`   ${nuevoEdge.id}: ${nuevoEdge.source} → ${nuevoEdge.target}`);
    console.log('\n📊 Total edges ahora:', flow.edges.length);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

agregarEdge();
