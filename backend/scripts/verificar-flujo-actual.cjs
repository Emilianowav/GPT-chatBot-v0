const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verificarFlujo() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    const db = client.db('crm_bot');
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.error('❌ Flujo no encontrado');
      return;
    }

    console.log('📊 ESTADO ACTUAL DEL FLUJO\n');
    console.log(`Nombre: ${flow.nombre}`);
    console.log(`Nodos: ${flow.nodes?.length || 0}`);
    console.log(`Edges: ${flow.edges?.length || 0}\n`);

    console.log('📋 NODOS:');
    flow.nodes?.forEach((node, i) => {
      console.log(`   ${i + 1}. ${node.id} (${node.type}) - Pos: (${node.position?.x}, ${node.position?.y})`);
    });

    console.log('\n🔗 EDGES:');
    flow.edges?.forEach((edge, i) => {
      const label = edge.label ? ` [${edge.label}]` : '';
      const handle = edge.sourceHandle ? ` via ${edge.sourceHandle}` : '';
      console.log(`   ${i + 1}. ${edge.source} → ${edge.target}${handle}${label}`);
    });

    console.log('\n⚠️  PROBLEMAS DETECTADOS:');
    
    // Verificar nodos sin posición
    const nodosSinPosicion = flow.nodes?.filter(n => !n.position || !n.position.x || !n.position.y);
    if (nodosSinPosicion?.length > 0) {
      console.log(`   ❌ ${nodosSinPosicion.length} nodos sin posición válida:`);
      nodosSinPosicion.forEach(n => console.log(`      - ${n.id}`));
    }

    // Verificar edges con nodos inexistentes
    const nodeIds = new Set(flow.nodes?.map(n => n.id));
    const edgesInvalidos = flow.edges?.filter(e => !nodeIds.has(e.source) || !nodeIds.has(e.target));
    if (edgesInvalidos?.length > 0) {
      console.log(`   ❌ ${edgesInvalidos.length} edges con nodos inexistentes:`);
      edgesInvalidos.forEach(e => console.log(`      - ${e.source} → ${e.target}`));
    }

    // Verificar nodos duplicados
    const nodosUnicos = new Set();
    const duplicados = [];
    flow.nodes?.forEach(n => {
      if (nodosUnicos.has(n.id)) {
        duplicados.push(n.id);
      }
      nodosUnicos.add(n.id);
    });
    if (duplicados.length > 0) {
      console.log(`   ❌ ${duplicados.length} nodos duplicados:`);
      duplicados.forEach(id => console.log(`      - ${id}`));
    }

    if (nodosSinPosicion?.length === 0 && edgesInvalidos?.length === 0 && duplicados.length === 0) {
      console.log('   ✅ No se detectaron problemas');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verificarFlujo();
