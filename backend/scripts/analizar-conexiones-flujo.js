import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';
const FLOW_ID = '695b5802cf46dd410a91f37c';

async function analizarConexiones() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const flow = await db.collection('flows').findOne({
      _id: new mongoose.Types.ObjectId(FLOW_ID)
    });

    if (!flow) {
      console.log('❌ Flow no encontrado');
      await mongoose.disconnect();
      return;
    }

    console.log('📊 ANÁLISIS DEL FLUJO:', flow.nombre);
    console.log('   Total nodos:', flow.nodes.length);
    console.log('   Total edges:', flow.edges.length);
    console.log('');

    // Contar conexiones salientes por nodo
    const connections = {};
    flow.edges.forEach(edge => {
      connections[edge.source] = (connections[edge.source] || 0) + 1;
    });

    console.log('🔍 NODOS CON MÚLTIPLES CONEXIONES SALIENTES:');
    console.log('');

    const nodosProblematicos = Object.entries(connections)
      .filter(([_, count]) => count > 1)
      .map(([nodeId, count]) => {
        const node = flow.nodes.find(n => n.id === nodeId);
        return { nodeId, count, node };
      });

    if (nodosProblematicos.length === 0) {
      console.log('✅ No hay nodos con múltiples conexiones salientes');
    } else {
      nodosProblematicos.forEach(({ nodeId, count, node }) => {
        console.log(`❌ ${nodeId}`);
        console.log(`   Tipo: ${node?.type || 'desconocido'}`);
        console.log(`   Label: ${node?.data?.label || 'sin label'}`);
        console.log(`   Conexiones: ${count}`);
        
        // Mostrar a qué nodos se conecta
        const targets = flow.edges
          .filter(e => e.source === nodeId)
          .map(e => {
            const targetNode = flow.nodes.find(n => n.id === e.target);
            return `${e.target} (${targetNode?.type})`;
          });
        console.log(`   Conecta a: ${targets.join(', ')}`);
        console.log('');
      });

      console.log('💡 SOLUCIÓN:');
      console.log('   Estos nodos necesitan un ROUTER intermedio');
      console.log('   El router manejará las múltiples salidas según condiciones');
    }

    await mongoose.disconnect();
    console.log('\n✅ Análisis completado');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

analizarConexiones();
