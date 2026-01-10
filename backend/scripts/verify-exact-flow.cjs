const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verifyExactFlow() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    const db = client.db('crm_bot');
    const flowsCollection = db.collection('flows');

    // Buscar el flujo EXACTO
    const flow = await flowsCollection.findOne({ 
      _id: new ObjectId(FLOW_ID) 
    });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }

    console.log('📊 FLUJO ENCONTRADO:');
    console.log(`   _id: ${flow._id}`);
    console.log(`   Nombre: ${flow.nombre}`);
    console.log(`   Empresa: ${flow.empresaId}`);
    console.log(`   Nodos: ${flow.nodes?.length || 0}`);
    console.log(`   Edges: ${flow.edges?.length || 0}`);
    console.log('');

    if (flow.nodes && flow.nodes.length > 0) {
      console.log('📋 LISTA DE NODOS:');
      flow.nodes.forEach((node, i) => {
        console.log(`   ${i + 1}. ${node.id} (${node.type})`);
      });
    }

    console.log('\n🔍 VERIFICANDO EMPRESAID:');
    console.log(`   empresaId en flow: ${flow.empresaId}`);
    console.log(`   Tipo: ${typeof flow.empresaId}`);

    // Buscar TODOS los flows con nombre similar
    console.log('\n🔍 BUSCANDO FLOWS CON NOMBRE SIMILAR:');
    const similarFlows = await flowsCollection.find({
      nombre: { $regex: 'WooCommerce', $options: 'i' }
    }).toArray();

    console.log(`   Total encontrados: ${similarFlows.length}`);
    similarFlows.forEach((f, i) => {
      console.log(`\n   ${i + 1}. _id: ${f._id}`);
      console.log(`      Nombre: ${f.nombre}`);
      console.log(`      Empresa: ${f.empresaId}`);
      console.log(`      Nodos: ${f.nodes?.length || 0}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verifyExactFlow();
