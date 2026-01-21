/**
 * Script para arreglar completamente el router-carrito:
 * 1. Agregar IDs a config.routes
 * 2. Eliminar edges duplicados
 * 3. Actualizar routeHandles en data
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function arreglarRouterCarrito() {
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
    console.log('🔧 ARREGLANDO ROUTER-CARRITO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 1. Buscar y actualizar el nodo router-carrito
    const routerIndex = flow.nodes.findIndex(n => n.id === 'router-carrito');
    
    if (routerIndex === -1) {
      console.log('⚠️  Nodo router-carrito no encontrado');
      return;
    }
    
    const router = flow.nodes[routerIndex];
    
    // Agregar IDs a las routes
    if (router.data.config.routes) {
      router.data.config.routes = router.data.config.routes.map((route, index) => {
        const routeId = index === 0 ? 'route-mercadopago' : 
                       index === 1 ? 'route-verificar' : 
                       'route-confirmacion';
        
        return {
          ...route,
          id: routeId
        };
      });
      
      console.log('✅ IDs agregados a config.routes:');
      router.data.config.routes.forEach(r => {
        console.log(`   ${r.id}: ${r.label}`);
      });
    }
    
    // Actualizar routeHandles en data
    router.data.routeHandles = ['route-mercadopago', 'route-verificar', 'route-confirmacion'];
    
    console.log('\n✅ routeHandles actualizados:', router.data.routeHandles);
    
    // 2. Eliminar edges duplicados
    console.log('\n🗑️  ELIMINANDO EDGES DUPLICADOS:');
    
    const edgesAEliminar = [
      'edge-router-solicitar',
      'reactflow__edge-router-carrito-whatsapp-confirmacion-pagotarget-router-carrito',
      'reactflow__edge-router-carrito-mercadopago-crear-preference'
    ];
    
    const edgesOriginales = flow.edges.length;
    
    flow.edges = flow.edges.filter(edge => {
      const eliminar = edgesAEliminar.includes(edge.id);
      if (eliminar) {
        console.log(`   ❌ Eliminando: ${edge.id}`);
      }
      return !eliminar;
    });
    
    console.log(`\n✅ Edges eliminados: ${edgesOriginales - flow.edges.length}`);
    
    // 3. Actualizar el nodo en el array
    flow.nodes[routerIndex] = router;
    
    // 4. Guardar cambios
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
    console.log('📊 RESUMEN');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Routes con IDs:');
    router.data.config.routes.forEach(r => {
      console.log(`   - ${r.id}: ${r.label}`);
    });
    console.log('');
    console.log('✅ Edges válidos del router-carrito:');
    flow.edges.filter(e => e.source === 'router-carrito').forEach(e => {
      console.log(`   - ${e.id} → ${e.target} (handle: ${e.sourceHandle})`);
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
arreglarRouterCarrito()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
