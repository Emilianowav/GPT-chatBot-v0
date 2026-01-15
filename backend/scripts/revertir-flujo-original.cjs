const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function revertir() {
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
    
    console.log('🔄 REVIRTIENDO CAMBIOS...\n');
    
    // ELIMINAR el edge que agregué
    const edgesOriginales = flow.edges.filter(e => 
      e.id !== 'edge-loop-preguntar-webhook' && 
      e.id !== 'edge-loop-correcto'
    );
    
    console.log(`✅ Edges eliminados: ${flow.edges.length - edgesOriginales.length}`);
    
    flow.edges = edgesOriginales;
    
    // Guardar
    await collection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    console.log(`✅ Total edges ahora: ${flow.edges.length}`);
    console.log('\n📋 EDGES ACTUALES:');
    flow.edges.forEach(e => {
      console.log(`   ${e.id}: ${e.source} → ${e.target}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

revertir();
