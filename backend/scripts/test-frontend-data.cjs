const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ 
      _id: new ObjectId(FLOW_ID) 
    });
    
    if (!flow) {
      console.error('❌ Flow no encontrado');
      return;
    }

    console.log('\n🔍 SIMULACIÓN EXACTA DE LO QUE RECIBE EL FRONTEND\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Simular exactamente lo que devuelve la API
    const apiResponse = {
      _id: flow._id,
      nombre: flow.nombre,
      empresaId: flow.empresaId,
      activo: flow.activo,
      nodes: flow.nodes,
      edges: flow.edges
    };
    
    console.log('📦 API Response Structure:');
    console.log(JSON.stringify({
      _id: apiResponse._id.toString(),
      nombre: apiResponse.nombre,
      empresaId: apiResponse.empresaId,
      activo: apiResponse.activo,
      'nodes.length': apiResponse.nodes?.length,
      'edges.length': apiResponse.edges?.length
    }, null, 2));
    
    console.log('\n🔗 EDGES DETALLADOS:\n');
    
    apiResponse.edges?.forEach((edge, i) => {
      console.log(`Edge ${i + 1}:`);
      console.log(`  id: "${edge.id}"`);
      console.log(`  source: "${edge.source}"`);
      console.log(`  target: "${edge.target}"`);
      console.log(`  type: "${edge.type}"`);
      if (edge.sourceHandle) console.log(`  sourceHandle: "${edge.sourceHandle}"`);
      if (edge.targetHandle) console.log(`  targetHandle: "${edge.targetHandle}"`);
      if (edge.data) console.log(`  data:`, JSON.stringify(edge.data));
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📋 CÓDIGO FRONTEND ESPERADO:\n');
    console.log('```typescript');
    console.log('const response = await fetch(`http://localhost:3000/api/flows/by-id/${flowId}`);');
    console.log('const data = await response.json();');
    console.log('');
    console.log('// data.edges debería tener 17 elementos');
    console.log(`console.log('Edges:', data.edges?.length); // ${apiResponse.edges?.length}`);
    console.log('');
    console.log('// Cada edge debe tener: id, source, target, type');
    console.log('data.edges.forEach(edge => {');
    console.log('  console.log(`${edge.id}: ${edge.source} → ${edge.target}`);');
    console.log('});');
    console.log('```');
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('✅ VERIFICACIÓN FINAL:\n');
    
    const nodeIds = new Set(apiResponse.nodes.map(n => n.id));
    let edgesValidos = 0;
    let edgesInvalidos = 0;
    
    apiResponse.edges?.forEach(edge => {
      if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
        edgesValidos++;
      } else {
        edgesInvalidos++;
        console.log(`❌ Edge inválido: ${edge.id}`);
        if (!nodeIds.has(edge.source)) console.log(`   Source "${edge.source}" no existe`);
        if (!nodeIds.has(edge.target)) console.log(`   Target "${edge.target}" no existe`);
      }
    });
    
    console.log(`✅ Edges válidos: ${edgesValidos}`);
    console.log(`❌ Edges inválidos: ${edgesInvalidos}`);
    
    if (edgesValidos === apiResponse.edges?.length) {
      console.log('\n🎉 TODOS LOS EDGES SON VÁLIDOS');
      console.log('   El problema NO está en la base de datos.');
      console.log('   El problema está en el FRONTEND.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

main();
