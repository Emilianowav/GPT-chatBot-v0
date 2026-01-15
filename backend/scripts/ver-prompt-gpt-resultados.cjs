const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    const resultadosNode = flow.nodes.find(n => n.id === 'gpt-resultados');
    
    if (!resultadosNode) {
      console.log('❌ Nodo gpt-resultados no encontrado');
      return;
    }
    
    console.log('📝 NODO: gpt-resultados');
    console.log('=' .repeat(80));
    console.log('\n🔧 CONFIG:');
    console.log(JSON.stringify(resultadosNode.data.config, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

main();
