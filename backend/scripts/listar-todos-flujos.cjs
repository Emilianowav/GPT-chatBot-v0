require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'crm_bot';

async function listarFlujos() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db(DB_NAME);
    const flowsCollection = db.collection('flows');
    
    const flows = await flowsCollection.find({}).toArray();
    
    console.log(`📊 FLUJOS ENCONTRADOS: ${flows.length}\n`);
    
    flows.forEach((flow, index) => {
      console.log(`${index + 1}. ${flow.nombre || 'Sin nombre'}`);
      console.log(`   ID: ${flow._id}`);
      console.log(`   Nodos: ${flow.nodes?.length || 0}`);
      console.log(`   Edges: ${flow.edges?.length || 0}`);
      console.log(`   Creado: ${flow.createdAt || 'N/A'}`);
      console.log(`   Actualizado: ${flow.updatedAt || 'N/A'}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

listarFlujos();
