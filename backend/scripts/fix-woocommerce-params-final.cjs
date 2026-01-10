require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * FIX FINAL: Eliminar parámetros inválidos de WooCommerce
 * - orderby: 'relevance' NO es válido (causa error 400)
 * - status: 'publish' NO es necesario (es el default)
 * 
 * SOLO USAR: search y per_page
 */

async function fixWooCommerceParamsFinal() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB (PRODUCCIÓN)\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const FLOW_ID = new ObjectId('695a156681f6d67f0ae9cf40');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('FIX FINAL: PARÁMETROS VÁLIDOS DE WOOCOMMERCE');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const flow = await flowsCollection.findOne({ _id: FLOW_ID });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log(`✅ Flow encontrado: ${flow.nombre}\n`);
    
    // Actualizar nodo WooCommerce
    for (let i = 0; i < flow.nodes.length; i++) {
      const node = flow.nodes[i];
      
      if (node.type === 'woocommerce' && node.id === 'woocommerce') {
        console.log('📦 Nodo WooCommerce encontrado');
        console.log('   Parámetros actuales:', JSON.stringify(node.data?.config?.parametros, null, 2));
        
        // SOLO parámetros válidos
        node.data.config.parametros = {
          search: '{{titulo}}',
          per_page: '100'
        };
        
        console.log('\n   ✅ Parámetros actualizados a SOLO válidos:');
        console.log('      - search: {{titulo}}');
        console.log('      - per_page: 100');
        console.log('\n   ❌ ELIMINADOS (causaban error 400):');
        console.log('      - orderby: "relevance" (no es válido en WooCommerce)');
        console.log('      - status: "publish" (no es necesario, es default)');
      }
    }
    
    // Guardar
    await flowsCollection.updateOne(
      { _id: FLOW_ID },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n✅ Flow actualizado en base de datos\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('VERIFICACIÓN');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const updatedFlow = await flowsCollection.findOne({ _id: FLOW_ID });
    const wooNode = updatedFlow.nodes.find(n => n.id === 'woocommerce');
    
    console.log('📋 Parámetros finales:', JSON.stringify(wooNode.data?.config?.parametros, null, 2));
    
    const hasOnlyValid = Object.keys(wooNode.data?.config?.parametros || {}).every(
      key => ['search', 'per_page'].includes(key)
    );
    
    console.log('');
    if (hasOnlyValid) {
      console.log('✅ SOLO parámetros válidos');
      console.log('✅ Sin orderby ni status');
      console.log('✅ WooCommerce aceptará la petición');
    } else {
      console.log('⚠️  Todavía hay parámetros inválidos');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixWooCommerceParamsFinal();
