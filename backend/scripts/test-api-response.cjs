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
    
    const flow = await flowsCollection.findOne({ 
      _id: new ObjectId(FLOW_ID) 
    });
    
    if (!flow) {
      console.error('❌ Flow no encontrado');
      return;
    }

    console.log('📊 SIMULACIÓN DE RESPUESTA API\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Simular lo que la API devuelve
    const apiResponse = flow;
    
    console.log('🔍 Estructura de respuesta:');
    console.log(`  _id: ${apiResponse._id}`);
    console.log(`  id: ${apiResponse.id}`);
    console.log(`  nombre: ${apiResponse.nombre}`);
    console.log(`  nodes: ${apiResponse.nodes?.length} nodos`);
    console.log(`  edges: ${apiResponse.edges?.length} edges`);
    console.log('');
    
    console.log('📦 Nodos en respuesta:');
    apiResponse.nodes?.forEach(node => {
      console.log(`  - ${node.id} (${node.type}) at ${JSON.stringify(node.position)}`);
    });
    console.log('');
    
    console.log('🔗 Edges en respuesta:');
    apiResponse.edges?.forEach(edge => {
      console.log(`  - ${edge.id}: ${edge.source} → ${edge.target} (type: ${edge.type})`);
      if (edge.sourceHandle) console.log(`    sourceHandle: ${edge.sourceHandle}`);
    });
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('✅ VERIFICACIÓN\n');
    
    // Verificar que todos los edges tengan source y target válidos
    const nodeIds = new Set(apiResponse.nodes.map(n => n.id));
    const edgesInvalidos = [];
    
    apiResponse.edges?.forEach(edge => {
      if (!nodeIds.has(edge.source)) {
        edgesInvalidos.push({ edge: edge.id, problema: `Source "${edge.source}" no existe` });
      }
      if (!nodeIds.has(edge.target)) {
        edgesInvalidos.push({ edge: edge.id, problema: `Target "${edge.target}" no existe` });
      }
    });
    
    if (edgesInvalidos.length > 0) {
      console.log('❌ EDGES INVÁLIDOS ENCONTRADOS:');
      edgesInvalidos.forEach(e => {
        console.log(`  - ${e.edge}: ${e.problema}`);
      });
    } else {
      console.log('✅ Todos los edges tienen source y target válidos');
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📋 RESUMEN PARA FRONTEND\n');
    console.log(`Total nodos: ${apiResponse.nodes?.length}`);
    console.log(`Total edges: ${apiResponse.edges?.length}`);
    console.log(`Edges válidos: ${apiResponse.edges?.length - edgesInvalidos.length}`);
    console.log(`Edges inválidos: ${edgesInvalidos.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

main();
