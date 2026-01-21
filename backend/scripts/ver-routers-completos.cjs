/**
 * Script para ver la configuración completa de todos los routers
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verRouters() {
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
    console.log('🔀 CONFIGURACIÓN DE TODOS LOS ROUTERS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const routers = flow.nodes.filter(n => n.type === 'router');
    
    routers.forEach(router => {
      console.log(`\n📋 ${router.id.toUpperCase()}`);
      console.log('─'.repeat(60));
      console.log(JSON.stringify(router.data, null, 2));
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
verRouters()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
