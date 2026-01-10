require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function fixRouterEdges() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const flow = await flowsCollection.findOne({ _id: flowId });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('📋 Flujo actual:');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}\n`);
    
    // Mostrar edges actuales del router
    console.log('🔍 Edges actuales desde router:');
    const routerEdges = flow.edges.filter(e => e.source === 'router');
    routerEdges.forEach(edge => {
      const targetNode = flow.nodes.find(n => n.id === edge.target);
      console.log(`   - ${edge.id} → ${targetNode?.data.label || edge.target}`);
      console.log(`     routeId: ${edge.data?.routeId || 'N/A'}`);
      console.log(`     sourceHandle: ${edge.sourceHandle || 'N/A'}`);
    });
    
    // Actualizar edges para que tengan el routeId correcto
    const updatedEdges = flow.edges.map(edge => {
      // Edge de router a gpt-pedir-datos (ruta 1: Faltan datos)
      if (edge.source === 'router' && edge.target === 'gpt-pedir-datos') {
        return {
          ...edge,
          id: 'router-route-1-gpt-pedir-datos',
          sourceHandle: 'route-1',
          data: {
            ...edge.data,
            routeId: 'route-1',
            routeLabel: 'Faltan datos'
          }
        };
      }
      
      // Edge de router a woocommerce (ruta 2: Datos completos)
      if (edge.source === 'router' && edge.target === 'woocommerce') {
        return {
          ...edge,
          id: 'router-route-2-woocommerce',
          sourceHandle: 'route-2',
          data: {
            ...edge.data,
            routeId: 'route-2',
            routeLabel: 'Datos completos'
          }
        };
      }
      
      return edge;
    });
    
    // Verificar que existe el edge de router a woocommerce
    const hasWooCommerceEdge = updatedEdges.some(e => 
      e.source === 'router' && e.target === 'woocommerce'
    );
    
    if (!hasWooCommerceEdge) {
      console.log('\n⚠️  No existe edge de router a woocommerce, creándolo...');
      updatedEdges.push({
        id: 'router-route-2-woocommerce',
        source: 'router',
        target: 'woocommerce',
        sourceHandle: 'route-2',
        type: 'default',
        animated: true,
        data: {
          routeId: 'route-2',
          routeLabel: 'Datos completos'
        }
      });
    }
    
    await flowsCollection.updateOne(
      { _id: flowId },
      { 
        $set: { 
          edges: updatedEdges,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('\n✅ Edges actualizados correctamente\n');
    console.log('📋 Nuevos edges desde router:');
    const newRouterEdges = updatedEdges.filter(e => e.source === 'router');
    newRouterEdges.forEach(edge => {
      const targetNode = flow.nodes.find(n => n.id === edge.target);
      console.log(`   ✓ ${edge.id}`);
      console.log(`     → ${targetNode?.data.label || edge.target}`);
      console.log(`     routeId: ${edge.data?.routeId}`);
      console.log(`     sourceHandle: ${edge.sourceHandle}`);
    });
    
    console.log('\n✅ Flujo corregido. Ahora el router debería funcionar correctamente.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixRouterEdges();
