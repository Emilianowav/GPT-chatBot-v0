/**
 * Script para ver TODAS las conexiones del flujo Veo Veo
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verTodasConexiones() {
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
    console.log('🔗 TODAS LAS CONEXIONES DEL FLUJO VEO VEO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(`Total edges: ${flow.edges.length}\n`);
    
    flow.edges.forEach((edge, index) => {
      console.log(`${index + 1}. ${edge.id}`);
      console.log(`   Source: ${edge.source}`);
      console.log(`   Target: ${edge.target}`);
      console.log(`   SourceHandle: ${edge.sourceHandle || 'N/A'}`);
      console.log(`   TargetHandle: ${edge.targetHandle || 'N/A'}`);
      console.log(`   Type: ${edge.type || 'default'}`);
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 NODOS CON routeHandles');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    flow.nodes.forEach(node => {
      if (node.data.routeHandles) {
        console.log(`${node.id} (${node.type}):`);
        console.log(`   routeHandles:`, node.data.routeHandles);
        console.log('');
      }
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
verTodasConexiones()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
