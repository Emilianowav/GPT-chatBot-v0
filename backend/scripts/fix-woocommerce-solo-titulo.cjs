require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'crm_bot';

async function fixWooCommerce() {
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
    
    console.log('🔧 CORRIGIENDO NODO WOOCOMMERCE\n');
    
    // Corregir configuración del nodo WooCommerce
    const nodeIndex = flow.nodes.findIndex(n => n.id === 'woocommerce');
    
    if (nodeIndex !== -1) {
      // WooCommerce solo acepta: search, category, limit, orderBy
      // NO acepta editorial ni edicion
      flow.nodes[nodeIndex].data.config = {
        module: 'search-product',
        params: {
          search: '{{titulo}}',
          limit: 10,
          orderBy: 'title'
        }
      };
      
      console.log('✅ Nodo WooCommerce configurado:');
      console.log('   module: search-product');
      console.log('   params.search: {{titulo}}');
      console.log('   params.limit: 10');
      console.log('   params.orderBy: title\n');
      
      console.log('📋 NOTA:');
      console.log('   - WooCommerce busca SOLO por título');
      console.log('   - Editorial y edición NO se envían a WooCommerce');
      console.log('   - Si el usuario especificó editorial/edición, se filtran DESPUÉS en el backend');
      console.log('   - Si el usuario dijo "cualquiera", se muestran todos los resultados\n');
    }
    
    // Actualizar en BD
    const result = await flowsCollection.updateOne(
      { _id: flow._id },
      { 
        $set: { 
          nodes: flow.nodes,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Flujo actualizado en MongoDB\n');
      
      console.log('📊 FLUJO FINAL:');
      console.log('   1. gpt-formateador extrae: titulo, editorial, edicion');
      console.log('   2. Guarda en globalVariables');
      console.log('   3. router evalúa: variables_completas = true');
      console.log('   4. router → woocommerce');
      console.log('   5. woocommerce busca por titulo en API');
      console.log('   6. Backend filtra resultados por editorial/edicion si != "cualquiera"');
    } else {
      console.log('⚠️  No se realizaron cambios');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixWooCommerce();
