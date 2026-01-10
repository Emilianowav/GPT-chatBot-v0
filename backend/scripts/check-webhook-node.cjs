require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function checkWebhookNode() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const flow = await flowsCollection.findOne({ _id: flowId });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('📋 Flujo:', flow.nombre);
    console.log('📊 Nodos:', flow.nodes.length);
    console.log('\n🔍 Primer nodo (Webhook):');
    
    const webhookNode = flow.nodes[0];
    console.log(JSON.stringify(webhookNode, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkWebhookNode();
