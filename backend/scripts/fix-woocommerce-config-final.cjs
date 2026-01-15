const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI;

async function fixWooCommerceConfigFinal() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const flowId = '695a156681f6d67f0ae9cf40';
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');

    // 1. Obtener credenciales de WooCommerce
    const api = await db.collection('api_configurations').findOne({ nombre: /veo veo/i });
    
    if (!api) {
      console.log('❌ No se encontró configuración de API para Veo Veo');
      process.exit(1);
    }

    console.log('🔑 Credenciales de WooCommerce:');
    console.log(`   Base URL: ${api.baseUrl}`);
    console.log('');

    // 2. Obtener flujo
    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId(flowId) });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    // 3. Configurar nodo WooCommerce
    const wooIndex = flow.nodes.findIndex(n => n.id === 'woocommerce-search');
    
    if (wooIndex === -1) {
      console.log('❌ Nodo WooCommerce no encontrado');
      process.exit(1);
    }

    console.log('🔧 Configurando nodo WooCommerce:\n');

    // Configuración correcta según FlowExecutor
    flow.nodes[wooIndex].data.config = {
      module: 'search-product', // ← Nombre correcto del módulo
      
      // Conexión de WooCommerce (credenciales)
      connection: {
        eshopUrl: 'https://www.veoveolibros.com.ar',
        consumerKey: api.autenticacion.configuracion.username,
        consumerSecret: api.autenticacion.configuracion.password
      },
      
      // Parámetros de búsqueda
      params: {
        search: '{{titulo_libro}}',
        limit: '10',
        orderBy: 'relevance'
      },
      
      // Variable de salida
      outputVariable: 'productos_encontrados'
    };

    console.log('✅ Configuración aplicada:');
    console.log(`   Module: search-product`);
    console.log(`   Connection: ✅ Configurada`);
    console.log(`   Params:`);
    console.log(`      search: {{titulo_libro}}`);
    console.log(`      limit: 10`);
    console.log(`      orderBy: relevance`);
    console.log(`   Output: productos_encontrados`);
    console.log('');

    // 4. Guardar cambios
    const result = await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(flowId) },
      { $set: { nodes: flow.nodes } }
    );

    console.log(`💾 Resultado: ${result.modifiedCount} documento(s) modificado(s)\n`);

    if (result.modifiedCount > 0) {
      console.log('✅ Nodo WooCommerce configurado correctamente\n');
      
      console.log('📋 CONFIGURACIÓN FINAL:');
      console.log('   ✅ Módulo: search-product (compatible con FlowExecutor)');
      console.log('   ✅ Credenciales: Incluidas en config.connection');
      console.log('   ✅ Query: {{titulo_libro}} será reemplazado por el valor extraído');
      console.log('   ✅ Output: productos_encontrados');
      console.log('');
      console.log('🧪 LISTO PARA TESTEAR');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixWooCommerceConfigFinal();
