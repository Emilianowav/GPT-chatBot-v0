const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function ver() {
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
    
    console.log('📋 EDGES DESDE gpt-pedir-datos:\n');
    
    const edgesDesdeGptPedir = flow.edges.filter(e => e.source === 'gpt-pedir-datos');
    
    if (edgesDesdeGptPedir.length === 0) {
      console.log('❌ NO HAY EDGES desde gpt-pedir-datos\n');
    } else {
      edgesDesdeGptPedir.forEach(e => {
        console.log(`📌 Edge ID: ${e.id}`);
        console.log(`   Source: ${e.source}`);
        console.log(`   Target: ${e.target}`);
        console.log(`   SourceHandle: ${e.sourceHandle || 'undefined'}`);
        console.log(`   TargetHandle: ${e.targetHandle || 'undefined'}`);
        if (e.data) {
          console.log(`   Label: ${e.data.label || 'undefined'}`);
          console.log(`   Condition: ${e.data.condition || 'undefined'}`);
        }
        console.log('');
      });
    }
    
    console.log('🔍 ANÁLISIS:');
    console.log('   El FlowExecutor evalúa edges en orden.');
    console.log('   Si hay múltiples edges desde un nodo, debe evaluar las condiciones.');
    console.log('   Si NO hay condición, el edge se ejecuta siempre.');
    console.log('');
    console.log('💡 PROBLEMA PROBABLE:');
    console.log('   1. El edge-5 NO tiene condición → siempre se ejecuta');
    console.log('   2. El edge condicional a router NO se está evaluando');
    console.log('   3. El FlowExecutor toma el PRIMER edge sin condición');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

ver();
