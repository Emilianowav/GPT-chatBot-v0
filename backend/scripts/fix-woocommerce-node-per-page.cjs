require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * Actualizar nodo de WooCommerce para que SIEMPRE use per_page=100 (máximo de WooCommerce)
 * Esto asegura que se obtengan suficientes resultados sin necesidad de paginación automática
 */

async function fixWooCommerceNodePerPage() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB (PRODUCCIÓN)\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('ACTUALIZAR NODO WOOCOMMERCE - PER_PAGE=100');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Buscar todos los flows que tengan nodos de WooCommerce
    const flows = await flowsCollection.find({
      'nodes.type': 'woocommerce'
    }).toArray();
    
    console.log(`📋 Flows encontrados con nodos WooCommerce: ${flows.length}\n`);
    
    let totalUpdated = 0;
    
    for (const flow of flows) {
      console.log(`\n🔍 Flow: ${flow.nombre} (${flow._id})`);
      
      let flowUpdated = false;
      
      for (let i = 0; i < flow.nodes.length; i++) {
        const node = flow.nodes[i];
        
        if (node.type === 'woocommerce') {
          console.log(`   📦 Nodo WooCommerce encontrado: ${node.id}`);
          console.log(`      Módulo: ${node.data?.config?.module}`);
          
          // Verificar parámetros actuales
          const currentParams = node.data?.config?.parametros || {};
          console.log(`      Parámetros actuales:`, JSON.stringify(currentParams, null, 2));
          
          // Actualizar per_page a 100 (máximo de WooCommerce)
          if (!node.data) node.data = {};
          if (!node.data.config) node.data.config = {};
          if (!node.data.config.parametros) node.data.config.parametros = {};
          
          // Establecer per_page=100 (máximo permitido por WooCommerce)
          node.data.config.parametros.per_page = '100';
          
          // Si no tiene orderby, establecer 'relevance' para búsquedas
          if (!node.data.config.parametros.orderby) {
            node.data.config.parametros.orderby = 'relevance';
          }
          
          // Si no tiene status, establecer 'publish'
          if (!node.data.config.parametros.status) {
            node.data.config.parametros.status = 'publish';
          }
          
          console.log(`      ✅ Actualizado a per_page=100`);
          console.log(`      Nuevos parámetros:`, JSON.stringify(node.data.config.parametros, null, 2));
          
          flowUpdated = true;
        }
      }
      
      if (flowUpdated) {
        // Actualizar el flow en la base de datos
        await flowsCollection.updateOne(
          { _id: flow._id },
          { $set: { nodes: flow.nodes } }
        );
        
        console.log(`   ✅ Flow actualizado`);
        totalUpdated++;
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('RESUMEN');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`✅ Flows actualizados: ${totalUpdated}`);
    console.log(`✅ Todos los nodos WooCommerce ahora usan per_page=100`);
    console.log(`✅ Esto obtiene el máximo de resultados sin paginación automática`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixWooCommerceNodePerPage();
