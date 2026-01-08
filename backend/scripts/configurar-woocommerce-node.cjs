const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI;

async function configurarWooCommerceNode() {
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

    console.log('🔑 Credenciales de WooCommerce encontradas:');
    console.log(`   Base URL: ${api.baseUrl}`);
    console.log(`   Consumer Key: ${api.autenticacion.configuracion.username.substring(0, 20)}...`);
    console.log('');

    // 2. Obtener flujo
    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId(flowId) });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log(`📊 Flujo: ${flow.nombre}\n`);

    // 3. Encontrar nodo WooCommerce
    const wooIndex = flow.nodes.findIndex(n => n.id === 'woocommerce-search');
    
    if (wooIndex === -1) {
      console.log('❌ Nodo WooCommerce no encontrado');
      process.exit(1);
    }

    console.log('🔧 Configurando nodo WooCommerce:\n');
    console.log(`   Nodo actual: ${flow.nodes[wooIndex].data?.label}`);
    console.log(`   Tipo: ${flow.nodes[wooIndex].type}`);
    console.log('');

    // 4. Configurar nodo con credenciales y endpoint
    flow.nodes[wooIndex].data.config = {
      module: 'woo_search',
      tipo: 'Buscar Productos',
      endpointId: 'buscar-productos',
      
      // Credenciales de WooCommerce
      eshopUrl: 'https://www.veoveolibros.com.ar',
      consumerKey: api.autenticacion.configuracion.username,
      consumerSecret: api.autenticacion.configuracion.password,
      
      // Parámetros de búsqueda
      searchQuery: '{{titulo_libro}}',
      limit: 10,
      orderBy: 'relevance',
      
      // Variable de salida
      outputVariable: 'productos_encontrados'
    };

    console.log('✅ Configuración aplicada:');
    console.log(`   Endpoint: buscar-productos`);
    console.log(`   Search Query: {{titulo_libro}}`);
    console.log(`   Limit: 10`);
    console.log(`   Output Variable: productos_encontrados`);
    console.log('');

    // 5. Guardar cambios
    const result = await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(flowId) },
      { $set: { nodes: flow.nodes } }
    );

    console.log(`💾 Resultado: ${result.modifiedCount} documento(s) modificado(s)\n`);

    if (result.modifiedCount > 0) {
      console.log('✅ Nodo WooCommerce configurado correctamente\n');
      
      console.log('📋 CONFIGURACIÓN FINAL:');
      console.log('   - URL: https://www.veoveolibros.com.ar');
      console.log('   - Endpoint: /wp-json/wc/v3/products');
      console.log('   - Autenticación: Basic Auth (Consumer Key + Secret)');
      console.log('   - Query: {{titulo_libro}}');
      console.log('   - Respuesta: productos_encontrados');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

configurarWooCommerceNode();
