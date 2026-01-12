const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function checkRouterTypes() {
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
    
    console.log('\n🔍 VERIFICANDO TIPOS DE NODOS\n');
    console.log('═'.repeat(60));
    
    flow.nodes.forEach(node => {
      if (node.id.includes('router')) {
        console.log(`\n📍 Nodo: ${node.id}`);
        console.log(`   name: ${node.name}`);
        console.log(`   type: ${node.type}`);
        console.log(`   Estructura completa:`, JSON.stringify(node, null, 2));
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkRouterTypes();
