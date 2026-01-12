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

    console.log('📋 DIAGNÓSTICO DEL FLUJO\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Crear mapa de nodos
    const nodesMap = {};
    flow.nodes.forEach(n => {
      nodesMap[n.id] = n;
    });

    console.log('📊 NODOS (' + flow.nodes.length + ' total):\n');
    flow.nodes.forEach((n, i) => {
      console.log(`${i + 1}. [${n.type}] ${n.id}`);
      console.log(`   Label: ${n.data?.label || 'N/A'}`);
      console.log(`   Position: x=${n.position?.x || 0}, y=${n.position?.y || 0}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('🔗 EDGES (' + flow.edges.length + ' total):\n');
    
    const edgesValidos = [];
    const edgesInvalidos = [];

    flow.edges.forEach((e, i) => {
      const sourceExists = nodesMap[e.source];
      const targetExists = nodesMap[e.target];
      
      if (sourceExists && targetExists) {
        edgesValidos.push(e);
        console.log(`${i + 1}. ✅ ${e.source} → ${e.target}`);
      } else {
        edgesInvalidos.push(e);
        console.log(`${i + 1}. ❌ ${e.source} → ${e.target}`);
        if (!sourceExists) console.log(`   ⚠️  Source "${e.source}" no existe`);
        if (!targetExists) console.log(`   ⚠️  Target "${e.target}" no existe`);
      }
    });

    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('🔍 NODOS DESCONECTADOS:\n');

    const nodosConectados = new Set();
    edgesValidos.forEach(e => {
      nodosConectados.add(e.source);
      nodosConectados.add(e.target);
    });

    const nodosDesconectados = flow.nodes.filter(n => !nodosConectados.has(n.id));
    
    if (nodosDesconectados.length > 0) {
      nodosDesconectados.forEach(n => {
        console.log(`❌ ${n.id} (${n.type})`);
      });
    } else {
      console.log('✅ Todos los nodos están conectados');
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('📋 RESUMEN:\n');
    console.log(`Total nodos: ${flow.nodes.length}`);
    console.log(`Total edges: ${flow.edges.length}`);
    console.log(`Edges válidos: ${edgesValidos.length}`);
    console.log(`Edges inválidos: ${edgesInvalidos.length}`);
    console.log(`Nodos desconectados: ${nodosDesconectados.length}`);

    if (edgesInvalidos.length > 0 || nodosDesconectados.length > 0) {
      console.log('\n⚠️  PROBLEMAS DETECTADOS:');
      if (edgesInvalidos.length > 0) {
        console.log(`   - ${edgesInvalidos.length} edges apuntan a nodos inexistentes`);
      }
      if (nodosDesconectados.length > 0) {
        console.log(`   - ${nodosDesconectados.length} nodos no están conectados`);
      }
    } else {
      console.log('\n✅ No se detectaron problemas');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

main();
