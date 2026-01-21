/**
 * Script para documentar la configuración COMPLETA de cada nodo del flujo Veo Veo
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function documentarNodos() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    const flow = await db.collection('flows').findOne({ 
      _id: new ObjectId(FLOW_ID) 
    });
    
    if (!flow) {
      throw new Error('❌ Flujo no encontrado');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 DOCUMENTACIÓN COMPLETA DE NODOS - FLUJO VEO VEO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    flow.nodes.forEach((node, index) => {
      console.log(`\n${index + 1}. ${node.id.toUpperCase()} (${node.type})`);
      console.log('─'.repeat(60));
      console.log(JSON.stringify(node.data, null, 2));
      console.log('─'.repeat(60));
    });
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
documentarNodos()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
