const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verEdges() {
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
    
    console.log('📊 EDGES DEL FLUJO:');
    console.log('═══════════════════════════════════════\n');
    
    // Buscar edges que salen de whatsapp-preguntar
    const edgesFromPreguntar = flow.edges.filter(e => e.source === 'whatsapp-preguntar');
    
    console.log(`📤 Edges desde whatsapp-preguntar: ${edgesFromPreguntar.length}`);
    edgesFromPreguntar.forEach(edge => {
      console.log(`   ${edge.id}: ${edge.source} → ${edge.target}`);
    });
    
    console.log('\n📤 Edges desde gpt-pedir-datos:');
    const edgesFromPedirDatos = flow.edges.filter(e => e.source === 'gpt-pedir-datos');
    console.log(`   Total: ${edgesFromPedirDatos.length}`);
    edgesFromPedirDatos.forEach(edge => {
      console.log(`   ${edge.id}: ${edge.source} → ${edge.target}`);
    });
    
    console.log('\n📋 TODOS LOS EDGES:');
    flow.edges.forEach(edge => {
      console.log(`   ${edge.id}: ${edge.source} → ${edge.target}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verEdges();
