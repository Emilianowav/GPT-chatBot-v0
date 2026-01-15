const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function revertir() {
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
    
    // Eliminar edge que agregué
    flow.edges = flow.edges.filter(e => e.id !== 'edge-pedir-datos-router');
    
    // Restaurar edge-5 sin condición
    const edge5 = flow.edges.find(e => e.id === 'edge-5');
    if (edge5 && edge5.data) {
      delete edge5.data.condition;
      delete edge5.data.label;
    }
    
    await collection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    console.log('✅ Edge eliminado y edge-5 restaurado\n');
    
    console.log('📋 ANÁLISIS DEL PROBLEMA REAL:');
    console.log('   El usuario dice "cualquiera"');
    console.log('   → gpt-pedir-datos extrae: editorial="cualquiera", edicion="cualquiera"');
    console.log('   → variables_completas = true');
    console.log('   → variables_faltantes = []');
    console.log('   → Pero el flujo va a whatsapp-preguntar y TERMINA');
    console.log('');
    console.log('   El problema es que el mensaje "cualquiera" se procesa UNA SOLA VEZ');
    console.log('   y no vuelve a pasar por el router para ir a WooCommerce.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

revertir();
