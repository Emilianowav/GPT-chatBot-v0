const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verificarEdgesRouter() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    const { ObjectId } = require('mongodb');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('\n📊 FLOW:', flow.nombre);
    console.log('═══════════════════════════════════════\n');
    
    // Buscar nodo router
    const router = flow.nodes.find(n => n.type === 'router');
    
    if (!router) {
      console.log('❌ No se encontró nodo router');
      return;
    }
    
    console.log('🔀 NODO ROUTER:', router.id);
    
    // Buscar edges que salen del router
    const routerEdges = flow.edges.filter(e => e.source === router.id);
    
    console.log(`\n📋 EDGES DEL ROUTER: ${routerEdges.length}\n`);
    
    routerEdges.forEach((edge, i) => {
      console.log(`Edge ${i + 1}:`);
      console.log(`   ID: ${edge.id}`);
      console.log(`   Source: ${edge.source}`);
      console.log(`   Target: ${edge.target}`);
      console.log(`   SourceHandle: ${edge.sourceHandle || 'UNDEFINED ⚠️'}`);
      console.log(`   TargetHandle: ${edge.targetHandle || 'undefined'}`);
      console.log(`   Label: ${edge.data?.label || 'SIN LABEL'}`);
      console.log(`   Condition: ${edge.data?.condition || 'SIN CONDICIÓN'}`);
      console.log('');
    });
    
    // Verificar si existen edges para route-1 y route-2
    const route1Edge = routerEdges.find(e => e.sourceHandle === 'route-1');
    const route2Edge = routerEdges.find(e => e.sourceHandle === 'route-2');
    
    console.log('\n🔍 VERIFICACIÓN:');
    console.log(`   route-1 edge: ${route1Edge ? '✅ EXISTE' : '❌ NO EXISTE'}`);
    console.log(`   route-2 edge: ${route2Edge ? '✅ EXISTE' : '❌ NO EXISTE'}`);
    
    if (!route1Edge) {
      console.log('\n⚠️  PROBLEMA: No hay edge con sourceHandle="route-1"');
      console.log('   El router no puede seguir la ruta "Faltan datos"');
    }
    
    if (!route2Edge) {
      console.log('\n⚠️  PROBLEMA: No hay edge con sourceHandle="route-2"');
      console.log('   El router no puede seguir la ruta "Datos completos"');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verificarEdgesRouter();
