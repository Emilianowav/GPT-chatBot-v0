const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fix() {
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
    
    // Verificar si ya existe el edge
    const existeEdge = flow.edges.find(e => 
      e.source === 'whatsapp-preguntar' && e.target === 'gpt-conversacional'
    );
    
    if (existeEdge) {
      console.log('⚠️  El edge ya existe, no se agregará duplicado');
      return;
    }
    
    // Agregar edge de whatsapp-preguntar → gpt-conversacional
    const nuevoEdge = {
      id: 'edge-loop-whatsapp-gpt',
      source: 'whatsapp-preguntar',
      target: 'gpt-conversacional',
      type: 'default',
      animated: false,
      data: {
        label: 'Re-evaluar',
        condition: '{{gpt-pedir-datos.variables_completas}} equals true'
      }
    };
    
    flow.edges.push(nuevoEdge);
    
    await collection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    console.log('✅ Edge agregado: whatsapp-preguntar → gpt-conversacional');
    console.log('\n📋 LÓGICA:');
    console.log('   Cuando gpt-pedir-datos completa todas las variables:');
    console.log('   → whatsapp-preguntar envía mensaje');
    console.log('   → Vuelve a gpt-conversacional');
    console.log('   → Router evalúa variables_faltantes (ahora vacío)');
    console.log('   → route-2 → WooCommerce ✅');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fix();
