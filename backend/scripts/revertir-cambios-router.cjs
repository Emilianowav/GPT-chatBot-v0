/**
 * Script para REVERTIR los cambios en el router-carrito
 * Volver a la configuración original
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function revertirCambios() {
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
    console.log('⏮️  REVIRTIENDO CAMBIOS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Buscar router-carrito
    const routerIndex = flow.nodes.findIndex(n => n.id === 'router-carrito');
    
    if (routerIndex === -1) {
      console.log('⚠️  Nodo router-carrito no encontrado');
      return;
    }
    
    const router = flow.nodes[routerIndex];
    
    // Quitar IDs de las routes (dejar solo condition, value, label)
    if (router.data.config.routes) {
      router.data.config.routes = router.data.config.routes.map(route => {
        const { id, ...rest } = route;
        return rest;
      });
      
      console.log('✅ IDs removidos de config.routes');
    }
    
    // Restaurar routeHandles originales
    router.data.routeHandles = [
      'edge-router-mercadopago',
      'edge-router-verificar',
      'edge-router-confirmacion'
    ];
    
    console.log('✅ routeHandles restaurados:', router.data.routeHandles);
    
    // Restaurar sourceHandles en edges
    flow.edges.forEach(edge => {
      if (edge.source === 'router-carrito') {
        if (edge.sourceHandle === 'route-mercadopago') {
          edge.sourceHandle = 'edge-router-mercadopago';
        } else if (edge.sourceHandle === 'route-verificar') {
          edge.sourceHandle = 'edge-router-verificar';
        } else if (edge.sourceHandle === 'route-confirmacion') {
          edge.sourceHandle = 'edge-router-confirmacion';
        }
      }
    });
    
    console.log('✅ sourceHandles restaurados en edges');
    
    // Actualizar nodo
    flow.nodes[routerIndex] = router;
    
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
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ CAMBIOS REVERTIDOS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
revertirCambios()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
