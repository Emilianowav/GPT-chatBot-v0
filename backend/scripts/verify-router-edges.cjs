require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function verifyRouterEdges() {
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
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('VERIFICACIÓN DE ROUTER Y EDGES');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Encontrar el nodo router
    const routerNode = flow.nodes.find(n => n.id === 'router');
    if (routerNode) {
      console.log('📋 NODO ROUTER:');
      console.log('─────────────────────────────────────────────────────────');
      console.log('ID:', routerNode.id);
      console.log('Label:', routerNode.data.label);
      console.log('\n🔀 RUTAS CONFIGURADAS:');
      if (routerNode.data.config.routes) {
        routerNode.data.config.routes.forEach((route, i) => {
          console.log(`\n  ${i + 1}. ${route.label} (${route.id})`);
          console.log(`     Condición: ${route.condition}`);
          console.log(`     Descripción: ${route.descripcion || 'N/A'}`);
        });
      } else {
        console.log('  ❌ NO HAY RUTAS CONFIGURADAS');
      }
    }
    
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('EDGES DESDE EL ROUTER:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const routerEdges = flow.edges.filter(e => e.source === 'router');
    
    if (routerEdges.length === 0) {
      console.log('❌ NO HAY EDGES DESDE EL ROUTER');
    } else {
      routerEdges.forEach((edge, i) => {
        console.log(`\n${i + 1}. Edge: ${edge.id}`);
        console.log(`   Source: ${edge.source}`);
        console.log(`   Target: ${edge.target}`);
        console.log(`   SourceHandle: ${edge.sourceHandle || 'N/A'}`);
        console.log(`   RouteId (data): ${edge.data?.routeId || 'N/A'}`);
        console.log(`   Animated: ${edge.animated || false}`);
        
        // Encontrar el nodo destino
        const targetNode = flow.nodes.find(n => n.id === edge.target);
        if (targetNode) {
          console.log(`   → Nodo destino: ${targetNode.data.label}`);
        } else {
          console.log(`   ❌ Nodo destino NO ENCONTRADO`);
        }
      });
    }
    
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('DIAGNÓSTICO:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (routerNode && routerNode.data.config.routes) {
      const routes = routerNode.data.config.routes;
      
      routes.forEach(route => {
        const matchingEdge = routerEdges.find(e => 
          e.data?.routeId === route.id || 
          e.id.includes(route.id) ||
          e.sourceHandle === route.id
        );
        
        if (matchingEdge) {
          const targetNode = flow.nodes.find(n => n.id === matchingEdge.target);
          console.log(`✅ Ruta "${route.label}" (${route.id})`);
          console.log(`   → Edge: ${matchingEdge.id}`);
          console.log(`   → Destino: ${targetNode?.data.label || 'DESCONOCIDO'}`);
        } else {
          console.log(`❌ Ruta "${route.label}" (${route.id})`);
          console.log(`   → NO TIENE EDGE ASOCIADO`);
        }
        console.log('');
      });
    }
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verifyRouterEdges();
