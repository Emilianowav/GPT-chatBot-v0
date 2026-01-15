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
    
    console.log('🔍 PROBLEMA IDENTIFICADO:');
    console.log('   El flujo continúa ejecutándose después de whatsapp-asistente');
    console.log('   Debería detenerse y esperar la respuesta del usuario\n');
    
    // Buscar edge problemático: whatsapp-asistente → gpt-clasificador
    const edgeProblematico = flow.edges.find(e => 
      e.source === 'whatsapp-asistente' && e.target === 'gpt-clasificador'
    );
    
    if (!edgeProblematico) {
      console.log('⚠️  No se encontró el edge problemático');
      console.log('   Edges desde whatsapp-asistente:');
      flow.edges.filter(e => e.source === 'whatsapp-asistente').forEach(e => {
        console.log(`   - ${e.id}: ${e.source} → ${e.target}`);
      });
      return;
    }
    
    console.log('🔧 EDGE PROBLEMÁTICO ENCONTRADO:');
    console.log(`   ID: ${edgeProblematico.id}`);
    console.log(`   ${edgeProblematico.source} → ${edgeProblematico.target}\n`);
    
    console.log('❌ ELIMINANDO EDGE...\n');
    
    // Eliminar el edge
    flow.edges = flow.edges.filter(e => e.id !== edgeProblematico.id);
    
    // Guardar cambios
    const result = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Flujo actualizado correctamente\n');
      console.log('📋 COMPORTAMIENTO ESPERADO AHORA:');
      console.log('   1. Usuario: "Busco harry potter 5"');
      console.log('   2. Flujo ejecuta: webhook → formateador → router → woocommerce → gpt-asistente → whatsapp');
      console.log('   3. Flujo SE DETIENE después de enviar mensaje de WhatsApp ✅');
      console.log('   4. Usuario responde (nuevo webhook)');
      console.log('   5. Flujo ejecuta: webhook → ... (procesa nueva respuesta)');
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
