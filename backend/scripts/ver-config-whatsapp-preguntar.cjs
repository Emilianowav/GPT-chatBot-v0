const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verConfigWhatsApp() {
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
    
    console.log('\n🔍 CONFIGURACIÓN DE NODOS WHATSAPP\n');
    console.log('═'.repeat(80));
    
    const whatsappNodes = flow.nodes.filter(n => n.type === 'whatsapp');
    
    whatsappNodes.forEach(node => {
      console.log(`\n📱 ${node.id}:`);
      console.log(JSON.stringify(node, null, 2));
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verConfigWhatsApp();
