const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verificarEstadoFlujo() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('\n🔍 ESTADO ACTUAL DEL FLUJO\n');
    console.log('═'.repeat(80));
    
    console.log(`\n📊 Estadísticas:`);
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    
    console.log(`\n📍 Nodos (posiciones):`);
    flow.nodes.forEach(node => {
      const pos = node.position;
      console.log(`   ${node.id}: x=${pos?.x || 'N/A'}, y=${pos?.y || 'N/A'}`);
    });
    
    console.log(`\n🔗 Edges:`);
    flow.edges.forEach(edge => {
      console.log(`   ${edge.id}:`);
      console.log(`      ${edge.source} → ${edge.target}`);
      console.log(`      handle: ${edge.sourceHandle || 'default'}`);
      if (edge.data?.condition) {
        console.log(`      condition: ${edge.data.condition.substring(0, 50)}...`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verificarEstadoFlujo();
