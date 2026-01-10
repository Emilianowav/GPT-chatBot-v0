const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function debugFlows() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    const db = client.db('crm_bot');
    const flowsCollection = db.collection('flows');

    // Buscar TODOS los flujos
    console.log('🔍 BUSCANDO TODOS LOS FLUJOS:\n');
    const allFlows = await flowsCollection.find({}).toArray();
    console.log(`   Total de flujos: ${allFlows.length}\n`);
    
    allFlows.forEach((flow, i) => {
      console.log(`   ${i + 1}. ID: ${flow._id}`);
      console.log(`      Nombre: ${flow.nombre}`);
      console.log(`      Nodos: ${flow.nodes?.length || 0}`);
      console.log(`      Edges: ${flow.edges?.length || 0}`);
      console.log('');
    });

    // Buscar específicamente por ID
    console.log(`🎯 BUSCANDO FLUJO ESPECÍFICO (${FLOW_ID}):\n`);
    const specificFlow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (specificFlow) {
      console.log(`   Nombre: ${specificFlow.nombre}`);
      console.log(`   Nodos: ${specificFlow.nodes?.length}`);
      console.log(`   IDs de nodos:`);
      specificFlow.nodes?.forEach((n, i) => {
        console.log(`      ${i + 1}. ${n.id}`);
      });
    } else {
      console.log('   ❌ No encontrado');
    }

    // Buscar por nombre
    console.log('\n🔍 BUSCANDO POR NOMBRE "WooCommerce":\n');
    const flowsByName = await flowsCollection.find({ 
      nombre: { $regex: 'WooCommerce', $options: 'i' } 
    }).toArray();
    
    console.log(`   Encontrados: ${flowsByName.length}`);
    flowsByName.forEach((flow, i) => {
      console.log(`   ${i + 1}. ID: ${flow._id}`);
      console.log(`      Nombre: ${flow.nombre}`);
      console.log(`      Nodos: ${flow.nodes?.length}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugFlows();
