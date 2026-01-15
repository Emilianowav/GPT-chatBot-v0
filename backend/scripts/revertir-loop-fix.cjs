const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function revertirLoop() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('📊 FLOW:', flow.nombre);
    console.log('═══════════════════════════════════════\n');
    
    // ELIMINAR el edge que causa el loop
    console.log('🔧 ELIMINANDO EDGE QUE CAUSA LOOP:\n');
    
    const edgeLoop = flow.edges.find(e => e.id === 'edge-whatsapp-to-formateador');
    
    if (edgeLoop) {
      console.log('❌ Eliminando edge:', edgeLoop.id);
      console.log(`   ${edgeLoop.source} → ${edgeLoop.target}\n`);
      
      flow.edges = flow.edges.filter(e => e.id !== 'edge-whatsapp-to-formateador');
    } else {
      console.log('⚠️  Edge de loop no encontrado (ya fue eliminado)\n');
    }
    
    // Guardar cambios
    const result = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Edge de loop eliminado correctamente\n');
    } else {
      console.log('⚠️  No se realizaron cambios\n');
    }
    
    console.log('📋 EDGES ACTUALES:');
    flow.edges.forEach(e => {
      console.log(`  ${e.id}: ${e.source} → ${e.target}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

revertirLoop();
