const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verCondicionesRouter() {
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
    console.log('   Label:', router.data?.label);
    
    // Buscar edges que salen del router
    const routerEdges = flow.edges.filter(e => e.source === router.id);
    
    console.log(`\n📋 EDGES DEL ROUTER: ${routerEdges.length}`);
    
    routerEdges.forEach((edge, i) => {
      console.log(`\n   Edge ${i + 1}:`);
      console.log(`      ID: ${edge.id}`);
      console.log(`      Source: ${edge.source}`);
      console.log(`      Target: ${edge.target}`);
      console.log(`      SourceHandle: ${edge.sourceHandle}`);
      console.log(`      Label: ${edge.data?.label || 'SIN LABEL'}`);
      console.log(`      Condición: ${edge.data?.condition || 'SIN CONDICIÓN'}`);
      
      if (edge.data?.condition) {
        console.log(`      ✅ Tiene condición configurada`);
      } else {
        console.log(`      ⚠️  NO tiene condición (se considera TRUE por defecto)`);
      }
    });
    
    // Verificar nodo target de cada edge
    console.log('\n\n🎯 NODOS DESTINO:');
    routerEdges.forEach((edge, i) => {
      const targetNode = flow.nodes.find(n => n.id === edge.target);
      console.log(`\n   Edge ${i + 1} → ${targetNode?.data?.label || edge.target}`);
      console.log(`      Tipo: ${targetNode?.type}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verCondicionesRouter();
