const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function listarNodos() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('📊 TODOS LOS NODOS DEL FLUJO:\n');
    console.log(`Total: ${flow.nodes.length} nodos\n`);
    
    flow.nodes.forEach((nodo, i) => {
      console.log(`${i + 1}. ID: "${nodo.id}"`);
      console.log(`   Label: ${nodo.data.label || 'Sin label'}`);
      console.log(`   Tipo: ${nodo.type}`);
      console.log('');
    });
    
    console.log('\n📋 EDGES DEL FLUJO:\n');
    console.log(`Total: ${flow.edges.length} edges\n`);
    
    flow.edges.forEach((edge, i) => {
      console.log(`${i + 1}. ${edge.source} → ${edge.target}`);
      console.log(`   ID: ${edge.id}`);
      if (edge.data?.condition) {
        console.log(`   Condición: ${edge.data.condition}`);
      }
      console.log('');
    });
    
    // Verificar API de WooCommerce
    console.log('\n🔍 VERIFICANDO APIs...\n');
    const apisCollection = db.collection('api_configs');
    const apis = await apisCollection.find({}).toArray();
    
    console.log(`Total APIs: ${apis.length}\n`);
    apis.forEach((api, i) => {
      console.log(`${i + 1}. ${api._id}`);
      console.log(`   Nombre: ${api.nombre}`);
      console.log(`   Base URL: ${api.baseUrl}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

listarNodos();
