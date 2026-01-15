const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verEdges() {
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
    
    console.log('NODOS:');
    flow.nodes.forEach(n => {
      console.log(`  ${n.id}: ${n.data.label} (${n.type})`);
    });
    
    console.log('\nEDGES:');
    flow.edges.forEach(e => {
      const condition = e.data?.condition || 'SIN CONDICIÓN';
      const handle = e.sourceHandle || 'default';
      console.log(`  ${e.id}:`);
      console.log(`    ${e.source} → ${e.target}`);
      console.log(`    Handle: ${handle}`);
      console.log(`    Condición: ${condition}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verEdges();
