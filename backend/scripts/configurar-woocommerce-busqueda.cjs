const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function configurarWooCommerceBusqueda() {
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
    const wooNode = flow.nodes.find(n => n.type === 'woocommerce');
    
    if (!wooNode) {
      console.log('❌ No se encontró nodo WooCommerce');
      return;
    }
    
    console.log('🔧 CONFIGURANDO NODO WOOCOMMERCE:\n');
    console.log('Antes:', JSON.stringify(wooNode.data?.config, null, 2));
    
    // Configurar el nodo para búsqueda de productos
    wooNode.data = wooNode.data || {};
    wooNode.data.config = {
      apiConfigId: '695320fda03785dacc8d950b',
      module: 'search-product',
      params: {
        search: '{{titulo}}',
        per_page: 10
      },
      outputMapping: {
        productos: 'productos',
        cantidad: 'count'
      }
    };
    
    console.log('\nDespués:', JSON.stringify(wooNode.data.config, null, 2));
    
    // Guardar cambios
    const result = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('\n✅ Nodo WooCommerce configurado correctamente');
      console.log('\n📋 CONFIGURACIÓN:');
      console.log('   module: search-product');
      console.log('   params.search: {{titulo}}');
      console.log('   params.per_page: 10');
      console.log('   output: { productos: [...], count: N }');
    } else {
      console.log('\n⚠️  No se realizaron cambios');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

configurarWooCommerceBusqueda();
