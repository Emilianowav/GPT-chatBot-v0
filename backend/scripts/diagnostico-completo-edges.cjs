const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.error('❌ Flujo no encontrado');
      return;
    }

    console.log('🔍 DIAGNÓSTICO COMPLETO DE CONEXIONES\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // 1. VERIFICAR ESTRUCTURA DE EDGES EN BD
    console.log('1️⃣ EDGES EN MONGODB\n');
    console.log(`Total de edges: ${flow.edges?.length || 0}\n`);
    
    if (flow.edges && flow.edges.length > 0) {
      console.log('Estructura de edges:');
      flow.edges.forEach((edge, i) => {
        console.log(`\nEdge ${i + 1}:`);
        console.log(`  ID: ${edge.id}`);
        console.log(`  Source: ${edge.source}`);
        console.log(`  Target: ${edge.target}`);
        console.log(`  Type: ${edge.type}`);
        if (edge.sourceHandle) console.log(`  SourceHandle: ${edge.sourceHandle}`);
        if (edge.targetHandle) console.log(`  TargetHandle: ${edge.targetHandle}`);
        if (edge.data) console.log(`  Data:`, edge.data);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('📍 POSICIONES DE NODOS\n');
    
    flow.nodes.forEach(node => {
      console.log(`${node.id}:`);
      console.log(`  Position: ${JSON.stringify(node.position)}`);
      console.log(`  Type: ${node.type}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

main();
