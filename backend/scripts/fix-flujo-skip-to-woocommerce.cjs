const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixFlujo() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('📊 FLOW:', flow.nombre);
    console.log('═══════════════════════════════════════\n');
    
    // SOLUCIÓN: Agregar edge desde webhook directo a WooCommerce
    // cuando las variables ya están completas
    
    console.log('🔧 AGREGANDO EDGE CONDICIONAL:\n');
    
    const newEdge = {
      id: 'edge-webhook-to-woocommerce',
      source: 'webhook-whatsapp',
      target: 'woocommerce',
      sourceHandle: null,
      targetHandle: null,
      type: 'default',
      data: {
        label: 'Variables completas (skip formateador)',
        condition: '{{titulo}} exists AND {{editorial}} exists AND {{edicion}} exists'
      }
    };
    
    // Verificar si ya existe
    const existeEdge = flow.edges.find(e => e.id === 'edge-webhook-to-woocommerce');
    
    if (existeEdge) {
      console.log('⚠️  El edge ya existe\n');
      return;
    }
    
    // Agregar el nuevo edge AL PRINCIPIO (para que se evalúe primero)
    flow.edges.unshift(newEdge);
    
    console.log('✅ Nuevo edge agregado:');
    console.log(`   ${newEdge.id}: webhook → woocommerce`);
    console.log(`   Condición: ${newEdge.data.condition}\n`);
    
    // Guardar cambios
    const result = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Flujo actualizado correctamente\n');
      console.log('📋 FLUJO CORREGIDO:');
      console.log('   Mensaje 1: webhook → formateador → router → pedir-datos → whatsapp [STOP]');
      console.log('   Mensaje 2: webhook → formateador → router → pedir-datos → whatsapp [STOP]');
      console.log('   Mensaje 3: webhook (variables completas) → WooCommerce ✅');
    } else {
      console.log('⚠️  No se realizaron cambios');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFlujo();
