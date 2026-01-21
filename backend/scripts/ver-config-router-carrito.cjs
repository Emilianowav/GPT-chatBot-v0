/**
 * Script para ver la configuración completa del router-carrito
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verConfigRouter() {
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
    console.log('📋 CONFIGURACIÓN DEL ROUTER-CARRITO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Buscar el nodo router-carrito
    const routerCarrito = flow.nodes.find(n => n.id === 'router-carrito');
    
    if (!routerCarrito) {
      console.log('⚠️  Nodo router-carrito no encontrado');
      return;
    }
    
    console.log('NODO COMPLETO:');
    console.log(JSON.stringify(routerCarrito, null, 2));
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔗 EDGES DEL ROUTER-CARRITO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const edgesFromRouter = flow.edges.filter(e => e.source === 'router-carrito');
    
    edgesFromRouter.forEach((edge, index) => {
      console.log(`${index + 1}. Edge: ${edge.id}`);
      console.log(`   Target: ${edge.target}`);
      console.log(`   SourceHandle: ${edge.sourceHandle || 'N/A'}`);
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
verConfigRouter()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
