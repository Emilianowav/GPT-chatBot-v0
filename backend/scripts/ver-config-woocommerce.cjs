const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verConfigWooCommerce() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    const { ObjectId } = require('mongodb');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('\n📊 FLOW:', flow.nombre);
    console.log('═══════════════════════════════════════\n');
    
    // Buscar nodo WooCommerce
    const woocommerce = flow.nodes.find(n => n.type === 'woocommerce');
    
    if (!woocommerce) {
      console.log('❌ No se encontró nodo WooCommerce');
      return;
    }
    
    console.log('🛍️  NODO WOOCOMMERCE:', woocommerce.id);
    console.log('   Label:', woocommerce.data?.label);
    console.log('\n📋 CONFIGURACIÓN COMPLETA:');
    console.log(JSON.stringify(woocommerce.data?.config, null, 2));
    
    console.log('\n🔧 CAMPOS IMPORTANTES:');
    console.log('   apiConfigId:', woocommerce.data?.config?.apiConfigId);
    console.log('   endpointId:', woocommerce.data?.config?.endpointId);
    console.log('   module:', woocommerce.data?.config?.module);
    console.log('   action:', woocommerce.data?.config?.action);
    
    if (!woocommerce.data?.config?.endpointId && !woocommerce.data?.config?.module) {
      console.log('\n⚠️  PROBLEMA: No tiene endpointId ni module configurado');
      console.log('   Necesita uno de estos campos para funcionar');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verConfigWooCommerce();
