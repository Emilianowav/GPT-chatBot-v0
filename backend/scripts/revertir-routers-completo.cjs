/**
 * Script para REVERTIR todos los cambios en routers
 * Restaurar router-principal a routeHandles: []
 * Eliminar sourceHandle de edges del router-principal
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function revertirRouters() {
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
    console.log('⏪ REVIRTIENDO CAMBIOS EN ROUTERS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 1. Revertir router-principal a routeHandles: []
    const routerPrincipalIndex = flow.nodes.findIndex(n => n.id === 'router-principal');
    
    if (routerPrincipalIndex !== -1) {
      console.log('1. Revirtiendo router-principal:');
      console.log(`   ANTES: routeHandles = ${JSON.stringify(flow.nodes[routerPrincipalIndex].data.routeHandles)}`);
      
      flow.nodes[routerPrincipalIndex].data.routeHandles = [];
      
      // Eliminar IDs de config.routes
      if (flow.nodes[routerPrincipalIndex].data.config?.routes) {
        flow.nodes[routerPrincipalIndex].data.config.routes = flow.nodes[routerPrincipalIndex].data.config.routes.map(route => {
          const { id, ...rest } = route;
          return rest;
        });
      }
      
      console.log(`   DESPUÉS: routeHandles = []`);
      console.log('   ✅ IDs eliminados de config.routes');
    }
    
    // 2. Eliminar sourceHandle de edges del router-principal
    console.log('\n2. Revirtiendo edges del router-principal:');
    
    flow.edges.forEach(edge => {
      if (edge.source === 'router-principal' && edge.sourceHandle) {
        console.log(`   ❌ ${edge.id}: eliminando sourceHandle "${edge.sourceHandle}"`);
        delete edge.sourceHandle;
      }
    });
    
    // Guardar
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          nodes: flow.nodes,
          edges: flow.edges,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('\n✅ Routers revertidos correctamente');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
revertirRouters()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
