require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'crm_bot';

async function verFlujoReal() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db(DB_NAME);
    const flowsCollection = db.collection('flows');
    
    // Buscar TODOS los flujos
    const flows = await flowsCollection.find({}).toArray();
    
    console.log(`📊 TOTAL FLUJOS: ${flows.length}\n`);
    
    flows.forEach((flow, i) => {
      console.log(`${i + 1}. ${flow.nombre}`);
      console.log(`   ID: ${flow._id}`);
      console.log(`   Nodos: ${flow.nodes.length}`);
      console.log(`   Edges: ${flow.edges.length}`);
      
      if (flow.nodes.length === 14) {
        console.log('   🎯 ESTE ES EL FLUJO DE 14 NODOS');
        
        console.log('\n   📋 NODOS:');
        flow.nodes.forEach(n => {
          console.log(`      - ${n.id} (${n.type})`);
        });
        
        console.log('\n   🔍 EDGES DESDE gpt-pedir-datos:');
        const edgesPedirDatos = flow.edges.filter(e => e.source === 'gpt-pedir-datos');
        if (edgesPedirDatos.length === 0) {
          console.log('      ❌ NO HAY EDGES');
        } else {
          edgesPedirDatos.forEach(e => {
            console.log(`      - ${e.id}: → ${e.target}`);
            console.log(`        Condición: ${e.data?.condition || 'SIN CONDICIÓN'}`);
          });
        }
      }
      
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verFlujoReal();
