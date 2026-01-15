const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function debugRouterHandles() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const { ObjectId } = require('mongodb');
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('\n🔍 ANÁLISIS DE ROUTER HANDLES\n');
    console.log('═'.repeat(60));
    
    // Encontrar todos los routers
    const routers = flow.nodes.filter(n => n.type === 'router');
    console.log(`\n📊 Routers encontrados: ${routers.length}`);
    routers.forEach(r => console.log(`  - ${r.id} (${r.name})`));
    
    // Analizar edges que salen de routers
    console.log('\n🔗 EDGES DESDE ROUTERS:\n');
    
    routers.forEach(router => {
      console.log(`\n🔷 Router: ${router.id}`);
      console.log('─'.repeat(60));
      
      const outgoingEdges = flow.edges.filter(e => e.source === router.id);
      
      if (outgoingEdges.length === 0) {
        console.log('  ⚠️  Sin edges salientes');
      } else {
        console.log(`  ✅ ${outgoingEdges.length} edges salientes:`);
        outgoingEdges.forEach(edge => {
          console.log(`\n    Edge ID: ${edge.id}`);
          console.log(`    Source: ${edge.source}`);
          console.log(`    Target: ${edge.target}`);
          console.log(`    sourceHandle: ${edge.sourceHandle || '❌ NO DEFINIDO'}`);
          console.log(`    targetHandle: ${edge.targetHandle || '(ninguno)'}`);
          console.log(`    type: ${edge.type || 'default'}`);
        });
      }
    });
    
    // Verificar si los sourceHandle existen
    console.log('\n\n📋 RESUMEN DE sourceHandles:\n');
    console.log('═'.repeat(60));
    
    const allSourceHandles = new Set();
    flow.edges.forEach(edge => {
      if (edge.sourceHandle) {
        allSourceHandles.add(edge.sourceHandle);
      }
    });
    
    console.log('Handles únicos encontrados en edges:');
    Array.from(allSourceHandles).sort().forEach(handle => {
      console.log(`  - ${handle}`);
    });
    
    console.log('\n✅ Script completado\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugRouterHandles();
