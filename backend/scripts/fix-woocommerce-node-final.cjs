require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * Actualizar el nodo WooCommerce para que use la API correctamente
 */

async function fixWooCommerceNode() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    const apisCollection = db.collection('apis');
    
    const flowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const apiConfigId = new ObjectId('695320fda03785dacc8d950b');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('ACTUALIZAR NODO WOOCOMMERCE');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Verificar que la API existe
    const api = await apisCollection.findOne({ _id: apiConfigId });
    if (!api) {
      console.log('❌ API no encontrada');
      return;
    }
    
    console.log('✅ API encontrada:', api.nombre);
    console.log('   Base URL:', api.baseUrl);
    console.log('   Endpoints:', api.endpoints.length);
    console.log('');
    
    // Obtener el flujo
    const flow = await flowsCollection.findOne({ _id: flowId });
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('✅ Flujo encontrado:', flow.nombre);
    console.log('');
    
    // Buscar el nodo WooCommerce
    const wooNodeIndex = flow.nodes.findIndex(n => n.id === 'woocommerce');
    if (wooNodeIndex === -1) {
      console.log('❌ Nodo WooCommerce no encontrado');
      return;
    }
    
    console.log('✅ Nodo WooCommerce encontrado');
    console.log('   Config actual:');
    console.log(JSON.stringify(flow.nodes[wooNodeIndex].data.config, null, 2));
    console.log('');
    
    // Actualizar configuración del nodo
    flow.nodes[wooNodeIndex].data.config = {
      module: 'get-product',
      apiConfigId: apiConfigId.toString(),
      endpointId: 'buscar-productos',
      parametros: {
        search: '{{titulo}}',
        per_page: '10',
        orderby: 'relevance',
        status: 'publish'
      },
      responseConfig: {
        arrayPath: '',
        idField: 'id',
        displayField: 'name',
        priceField: 'price',
        stockField: 'stock_quantity',
        imageField: 'images[0].src'
      },
      mensajeSinResultados: 'No encontré libros con esa búsqueda. ¿Podrías ser más específico o probar con otro término?'
    };
    
    console.log('📝 Nueva configuración:');
    console.log(JSON.stringify(flow.nodes[wooNodeIndex].data.config, null, 2));
    console.log('');
    
    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: flowId },
      { $set: { nodes: flow.nodes, actualizadoEn: new Date() } }
    );
    
    console.log('✅ Nodo WooCommerce actualizado exitosamente');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('VERIFICACIÓN');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('✅ El nodo ahora está configurado para:');
    console.log('   1. Usar la API:', apiConfigId.toString());
    console.log('   2. Llamar al endpoint: buscar-productos');
    console.log('   3. Buscar con el parámetro: search={{titulo}}');
    console.log('   4. Devolver máximo 10 resultados');
    console.log('   5. Ordenar por relevancia');
    console.log('');
    console.log('🎯 Próximo paso: Ejecutar el flujo desde WhatsApp');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixWooCommerceNode();
