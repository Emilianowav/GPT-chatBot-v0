const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';

async function verificarWooCommerceAPI() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    // Buscar todas las APIs de WooCommerce
    console.log('🔍 Buscando APIs de WooCommerce...\n');
    const apis = await db.collection('api_configs').find({ type: 'woocommerce' }).toArray();
    
    if (apis.length === 0) {
      console.log('⚠️  No hay APIs de WooCommerce configuradas\n');
      console.log('📋 PROBLEMA IDENTIFICADO:');
      console.log('   El nodo WooCommerce tiene apiConfigId: "695320fda03785dacc8d950b"');
      console.log('   Pero este documento NO existe en la colección api_configs');
      console.log('   Por eso WooCommerce no puede buscar productos reales\n');
      
      // Buscar empresas con WooCommerce configurado
      console.log('🔍 Buscando empresas con WooCommerce...\n');
      const empresas = await db.collection('empresas').find({
        'modulos.woocommerce': { $exists: true }
      }).toArray();
      
      if (empresas.length > 0) {
        console.log(`✅ Encontradas ${empresas.length} empresas con WooCommerce:\n`);
        empresas.forEach(emp => {
          console.log(`📦 ${emp.nombre}:`);
          if (emp.modulos?.woocommerce) {
            console.log(`   URL: ${emp.modulos.woocommerce.url || 'No configurada'}`);
            console.log(`   Consumer Key: ${emp.modulos.woocommerce.consumerKey ? '✅ Configurada' : '❌ Falta'}`);
            console.log(`   Consumer Secret: ${emp.modulos.woocommerce.consumerSecret ? '✅ Configurada' : '❌ Falta'}`);
          }
          console.log('');
        });
      } else {
        console.log('⚠️  No hay empresas con WooCommerce configurado\n');
      }
      
    } else {
      console.log(`✅ Encontradas ${apis.length} APIs de WooCommerce:\n`);
      apis.forEach(api => {
        console.log(`📦 ${api.name || 'Sin nombre'}:`);
        console.log(`   ID: ${api._id}`);
        console.log(`   URL: ${api.baseUrl || api.url}`);
        console.log(`   Type: ${api.type}`);
        console.log('');
      });
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verificarWooCommerceAPI();
