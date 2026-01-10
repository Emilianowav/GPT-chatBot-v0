require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * Corregir parámetros del nodo WooCommerce
 * Cambiar {{busqueda}} por {{titulo}}
 */

async function fixWooCommerceParams() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const flow = await flowsCollection.findOne({ _id: flowId });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    const updatedNodes = flow.nodes.map(node => {
      if (node.id === 'woocommerce') {
        console.log('🛒 Corrigiendo nodo WooCommerce');
        console.log('   Parámetros ANTES:');
        console.log(`      search: ${node.data.config.parametros?.search || 'N/A'}`);
        console.log(`      category: ${node.data.config.parametros?.category || 'N/A'}`);
        
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              parametros: {
                search: '{{titulo}}',
                per_page: '10',
                orderby: 'relevance',
                status: 'publish'
              }
            }
          }
        };
      }
      return node;
    });
    
    await flowsCollection.updateOne(
      { _id: flowId },
      { 
        $set: { 
          nodes: updatedNodes,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('\n   Parámetros DESPUÉS:');
    const wooNode = updatedNodes.find(n => n.id === 'woocommerce');
    console.log(`      search: ${wooNode.data.config.parametros.search}`);
    console.log(`      per_page: ${wooNode.data.config.parametros.per_page}`);
    console.log(`      orderby: ${wooNode.data.config.parametros.orderby}`);
    console.log(`      status: ${wooNode.data.config.parametros.status}`);
    
    console.log('\n✅ Parámetros de WooCommerce corregidos');
    console.log('   Ahora buscará usando {{titulo}} en lugar de {{busqueda}}');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixWooCommerceParams();
