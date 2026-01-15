require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'crm_bot';

async function verEstadoFlujo() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db(DB_NAME);
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({});
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('📊 ESTADO ACTUAL DEL FLUJO EN MONGODB:\n');
    console.log(`Nombre: ${flow.nombre}`);
    console.log(`Nodos: ${flow.nodes.length}`);
    console.log(`Edges: ${flow.edges.length}\n`);
    
    console.log('📋 NODOS:');
    flow.nodes.forEach(n => {
      console.log(`   - ${n.id} (${n.type})`);
    });
    
    console.log('\n📋 EDGES:');
    flow.edges.forEach(e => {
      const condition = e.data?.condition ? ` [${e.data.condition}]` : '';
      console.log(`   - ${e.id}: ${e.source} → ${e.target}${condition}`);
    });
    
    console.log('\n🔍 VERIFICACIÓN:');
    const hasRouter = flow.nodes.some(n => n.id === 'router');
    console.log(`   Router existe: ${hasRouter ? '❌ SÍ (debería estar eliminado)' : '✅ NO'}`);
    
    const edgeFormateadorWoo = flow.edges.find(e => e.source === 'gpt-formateador' && e.target === 'woocommerce');
    console.log(`   Edge formateador → woocommerce: ${edgeFormateadorWoo ? '✅ SÍ' : '❌ NO'}`);
    
    const edgeFormateadorPedir = flow.edges.find(e => e.source === 'gpt-formateador' && e.target === 'gpt-pedir-datos');
    console.log(`   Edge formateador → pedir-datos: ${edgeFormateadorPedir ? '✅ SÍ' : '❌ NO'}`);
    
    const edgePedirFormateador = flow.edges.find(e => e.source === 'gpt-pedir-datos' && e.target === 'gpt-formateador');
    console.log(`   Edge pedir-datos → formateador: ${edgePedirFormateador ? '✅ SÍ' : '❌ NO'}`);
    
    const edgePedirWhatsapp = flow.edges.find(e => e.source === 'gpt-pedir-datos' && e.target === 'whatsapp-preguntar');
    console.log(`   Edge pedir-datos → whatsapp: ${edgePedirWhatsapp ? '✅ SÍ' : '❌ NO'}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verEstadoFlujo();
