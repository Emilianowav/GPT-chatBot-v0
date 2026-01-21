/**
 * Script para arreglar el router-principal
 * Agregar routeHandles basados en config.routes
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function arreglarRouterPrincipal() {
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
    console.log('🔧 ARREGLANDO ROUTER-PRINCIPAL');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Buscar router-principal
    const routerIndex = flow.nodes.findIndex(n => n.id === 'router-principal');
    
    if (routerIndex === -1) {
      console.log('⚠️  router-principal no encontrado');
      return;
    }
    
    const router = flow.nodes[routerIndex];
    
    console.log('📋 ANTES:');
    console.log(`   routeHandles: ${JSON.stringify(router.data.routeHandles)}`);
    console.log(`   config.routes: ${router.data.config.routes.length} rutas`);
    
    // Agregar IDs a config.routes y generar routeHandles
    const routeIds = [
      'route-buscar-producto',
      'route-comprar',
      'route-consultar',
      'route-despedida'
    ];
    
    router.data.config.routes = router.data.config.routes.map((route, index) => ({
      ...route,
      id: routeIds[index]
    }));
    
    router.data.routeHandles = routeIds;
    
    console.log('\n📋 DESPUÉS:');
    console.log(`   routeHandles: ${JSON.stringify(router.data.routeHandles)}`);
    console.log('   Routes con IDs:');
    router.data.config.routes.forEach(r => {
      console.log(`      - ${r.id}: ${r.label}`);
    });
    
    // Actualizar nodo
    flow.nodes[routerIndex] = router;
    
    // Guardar
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          nodes: flow.nodes,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('\n✅ Router-principal actualizado correctamente');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
arreglarRouterPrincipal()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
