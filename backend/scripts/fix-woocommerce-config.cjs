require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'crm_bot';

async function fixWooCommerceConfig() {
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
    
    console.log('🔧 CORRIGIENDO CONFIGURACIÓN WOOCOMMERCE\n');
    
    // 1. Corregir edge router → woocommerce (agregar condición)
    const edgeIndex = flow.edges.findIndex(e => e.id === 'e5' || (e.source === 'router' && e.target === 'woocommerce'));
    
    if (edgeIndex !== -1) {
      flow.edges[edgeIndex] = {
        ...flow.edges[edgeIndex],
        data: {
          ...flow.edges[edgeIndex].data,
          condition: '{{gpt-formateador.variables_completas}} equals true'
        }
      };
      console.log('✅ Edge router → woocommerce: agregada condición');
      console.log('   Condición: {{gpt-formateador.variables_completas}} equals true\n');
    }
    
    // 2. Corregir configuración del nodo WooCommerce
    const nodeIndex = flow.nodes.findIndex(n => n.id === 'woocommerce');
    
    if (nodeIndex !== -1) {
      flow.nodes[nodeIndex].data.config = {
        module: 'search-product',
        search: '{{titulo}}',  // Cambiar de titulo_libro a titulo
        limit: '10',
        orderBy: 'title',
        // Editorial y edición se filtran en el backend si no son "cualquiera"
        editorial: '{{editorial}}',
        edicion: '{{edicion}}'
      };
      
      console.log('✅ Nodo WooCommerce: configuración actualizada');
      console.log('   search: {{titulo}}');
      console.log('   editorial: {{editorial}}');
      console.log('   edicion: {{edicion}}');
      console.log('   (Si editorial/edicion = "cualquiera", el backend los ignora)\n');
    }
    
    // Actualizar en BD
    const result = await flowsCollection.updateOne(
      { _id: flow._id },
      { 
        $set: { 
          nodes: flow.nodes,
          edges: flow.edges,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Flujo actualizado en MongoDB\n');
      
      console.log('📋 FLUJO CORRECTO:');
      console.log('   1. gpt-formateador extrae: titulo, editorial, edicion');
      console.log('   2. Guarda en globalVariables');
      console.log('   3. router evalúa: variables_completas = true');
      console.log('   4. router → woocommerce (con condición)');
      console.log('   5. woocommerce busca por titulo');
      console.log('   6. Si editorial/edicion != "cualquiera", filtra por ellos');
    } else {
      console.log('⚠️  No se realizaron cambios');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixWooCommerceConfig();
