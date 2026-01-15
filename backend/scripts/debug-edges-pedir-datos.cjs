require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'crm_bot';
const FLUJO_ID = '695a156681f6d67f0ae9cf40';

async function debugEdges() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db(DB_NAME);
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLUJO_ID) });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('📊 FLUJO EN MONGODB:');
    console.log(`   Total Edges: ${flow.edges.length}\n`);
    
    console.log('🔍 EDGES DESDE gpt-pedir-datos:');
    const edgesPedirDatos = flow.edges.filter(e => e.source === 'gpt-pedir-datos');
    
    if (edgesPedirDatos.length === 0) {
      console.log('   ❌ NO HAY EDGES desde gpt-pedir-datos\n');
    } else {
      console.log(`   Total: ${edgesPedirDatos.length}\n`);
      edgesPedirDatos.forEach((e, i) => {
        console.log(`   ${i + 1}. ID: ${e.id}`);
        console.log(`      Target: ${e.target}`);
        console.log(`      Condición: ${e.data?.condition || 'SIN CONDICIÓN'}`);
        console.log(`      Label: ${e.data?.label || 'sin label'}\n`);
      });
    }
    
    console.log('📋 TODOS LOS EDGES:');
    flow.edges.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.source} → ${e.target}`);
      if (e.data?.condition) {
        console.log(`      Condición: ${e.data.condition}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugEdges();
