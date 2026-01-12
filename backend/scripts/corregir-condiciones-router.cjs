const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function corregirCondicionesRouter() {
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
    
    // Buscar edges del router
    const edge1 = flow.edges.find(e => e.id === 'edge-4');
    const edge2 = flow.edges.find(e => e.id === 'reactflow__edge-routerroute-2-woocommerce');
    
    if (!edge1 || !edge2) {
      console.log('❌ No se encontraron los edges del router');
      return;
    }
    
    console.log('🔧 CORRIGIENDO CONDICIONES:\n');
    
    // Edge 1: route-1 (pedir datos) - cuando FALTAN variables
    console.log('Edge 1 (route-1 → pedir datos):');
    console.log(`   Antes: ${edge1.data?.condition}`);
    edge1.data = edge1.data || {};
    edge1.data.condition = '{{gpt-conversacional.variables_faltantes}} not_empty';
    edge1.data.label = 'Faltan datos';
    console.log(`   Después: ${edge1.data.condition}`);
    console.log(`   ✅ Corregido\n`);
    
    // Edge 2: route-2 (buscar en WooCommerce) - cuando NO faltan variables
    console.log('Edge 2 (route-2 → WooCommerce):');
    console.log(`   Antes: ${edge2.data?.condition}`);
    edge2.data = edge2.data || {};
    edge2.data.condition = '{{gpt-conversacional.variables_faltantes}} empty';
    edge2.data.label = 'Datos completos';
    console.log(`   Después: ${edge2.data.condition}`);
    console.log(`   ✅ Corregido\n`);
    
    // Guardar cambios
    const result = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Condiciones del router actualizadas correctamente');
      console.log('\n📋 RESUMEN:');
      console.log('   route-1: Faltan datos → {{gpt-conversacional.variables_faltantes}} not_empty');
      console.log('   route-2: Datos completos → {{gpt-conversacional.variables_faltantes}} empty');
    } else {
      console.log('⚠️  No se realizaron cambios');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

corregirCondicionesRouter();
