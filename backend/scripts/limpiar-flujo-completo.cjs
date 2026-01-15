const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function limpiar() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const collection = db.collection('flows');
    
    const flow = await collection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('📋 LIMPIANDO EDGES INCORRECTOS...\n');
    
    // Eliminar todos los edges que agregué incorrectamente
    const edgesOriginales = flow.edges.filter(e => {
      // Mantener solo los edges originales
      return ![
        'edge-loop-preguntar-webhook',
        'edge-loop-correcto',
        'edge-pedir-datos-router',
        'edge-loop-whatsapp-gpt',
        'edge-pedir-formateador'
      ].includes(e.id);
    });
    
    console.log(`✅ Edges eliminados: ${flow.edges.length - edgesOriginales.length}`);
    console.log(`✅ Edges restantes: ${edgesOriginales.length}\n`);
    
    // Limpiar condiciones de edge-5
    const edge5 = edgesOriginales.find(e => e.id === 'edge-5');
    if (edge5 && edge5.data) {
      delete edge5.data.condition;
      delete edge5.data.label;
      console.log('✅ edge-5 limpiado (sin condiciones)');
    }
    
    await collection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: edgesOriginales } }
    );
    
    console.log('\n📋 ESTRUCTURA ORIGINAL RESTAURADA:');
    console.log('   webhook → gpt-conversacional → gpt-formateador → router');
    console.log('   router (route-1) → gpt-pedir-datos → whatsapp-preguntar');
    console.log('   router (route-2) → woocommerce');
    console.log('\n⚠️  PROBLEMA CONOCIDO:');
    console.log('   El flujo termina en whatsapp-preguntar sin continuar a WooCommerce.');
    console.log('   Esto es un problema de diseño del flujo original.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

limpiar();
