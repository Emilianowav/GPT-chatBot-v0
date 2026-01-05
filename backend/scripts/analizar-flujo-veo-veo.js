import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function analizarFlujoVeoVeo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const flow = await db.collection('flows').findOne({
      _id: new mongoose.Types.ObjectId('695b5802cf46dd410a91f37c')
    });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      await mongoose.disconnect();
      return;
    }

    console.log('📊 FLUJO ORIGINAL VEO VEO - CONSULTAR LIBROS');
    console.log('Nombre:', flow.nombre);
    console.log('Total nodos:', flow.nodes.length);
    console.log('Total edges:', flow.edges.length);
    
    console.log('\n📋 NODOS:');
    flow.nodes.forEach((n, i) => {
      console.log(`${i+1}. [${n.type}] ${n.data.label || n.id} (${n.id})`);
    });
    
    console.log('\n🔗 CONEXIONES:');
    flow.edges.forEach(e => {
      const sourceNode = flow.nodes.find(n => n.id === e.source);
      const targetNode = flow.nodes.find(n => n.id === e.target);
      console.log(`${e.source} (${sourceNode?.type}) -> ${e.target} (${targetNode?.type})`);
    });

    // Analizar nodos con múltiples salidas
    const outgoingConnections = {};
    flow.edges.forEach(edge => {
      outgoingConnections[edge.source] = (outgoingConnections[edge.source] || 0) + 1;
    });

    console.log('\n⚠️  NODOS CON MÚLTIPLES SALIDAS (necesitan Router):');
    Object.entries(outgoingConnections)
      .filter(([_, count]) => count > 1)
      .forEach(([nodeId, count]) => {
        const node = flow.nodes.find(n => n.id === nodeId);
        console.log(`- ${nodeId} (${node?.type}): ${count} salidas`);
        const targets = flow.edges
          .filter(e => e.source === nodeId)
          .map(e => {
            const targetNode = flow.nodes.find(n => n.id === e.target);
            return `  → ${e.target} (${targetNode?.type})`;
          });
        targets.forEach(t => console.log(t));
      });

    await mongoose.disconnect();
    console.log('\n✅ Análisis completado');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

analizarFlujoVeoVeo();
