const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verFlujoActual() {
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
    
    console.log('\n📊 FLUJO ACTUAL EN MONGODB\n');
    console.log('═'.repeat(80));
    
    console.log('\n📍 NODOS:\n');
    flow.nodes.forEach((node, i) => {
      console.log(`${i + 1}. ${node.id} (${node.type})`);
    });
    
    console.log('\n📍 EDGES:\n');
    flow.edges.forEach((edge, i) => {
      const sourceHandle = edge.sourceHandle ? ` [${edge.sourceHandle}]` : '';
      console.log(`${i + 1}. ${edge.source}${sourceHandle} → ${edge.target}`);
    });
    
    console.log('\n📊 ESTADÍSTICAS:');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verFlujoActual();
