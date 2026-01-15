require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'crm_bot';

async function verEdgeWooCommerce() {
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
    
    console.log('📊 EDGE ROUTER → WOOCOMMERCE:');
    console.log('═══════════════════════════════════════\n');
    
    // Buscar edge que va a woocommerce
    const edgeToWoo = flow.edges.find(e => e.target === 'woocommerce');
    
    if (edgeToWoo) {
      console.log('✅ Edge encontrado:');
      console.log(JSON.stringify(edgeToWoo, null, 2));
      console.log('\n📋 CONDICIÓN:', edgeToWoo.data?.condition || 'SIN CONDICIÓN');
    } else {
      console.log('❌ No hay edge hacia woocommerce');
    }
    
    console.log('\n\n📊 CONFIGURACIÓN NODO WOOCOMMERCE:');
    console.log('═══════════════════════════════════════\n');
    
    const wooNode = flow.nodes.find(n => n.id === 'woocommerce');
    
    if (wooNode) {
      console.log('✅ Nodo encontrado:');
      console.log('   ID:', wooNode.id);
      console.log('   Type:', wooNode.type);
      console.log('   Label:', wooNode.data?.label);
      console.log('\n📋 CONFIG:');
      console.log(JSON.stringify(wooNode.data?.config, null, 2));
      
      console.log('\n📥 INPUT MAPPING (variablesEntrada):');
      if (wooNode.data?.config?.variablesEntrada) {
        console.log(JSON.stringify(wooNode.data.config.variablesEntrada, null, 2));
      } else {
        console.log('   ⚠️  No hay variablesEntrada configuradas');
      }
      
      console.log('\n📤 OUTPUT MAPPING (outputMapping):');
      if (wooNode.data?.config?.outputMapping) {
        console.log(JSON.stringify(wooNode.data.config.outputMapping, null, 2));
      } else {
        console.log('   ⚠️  No hay outputMapping configurado');
      }
    } else {
      console.log('❌ Nodo woocommerce no encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verEdgeWooCommerce();
