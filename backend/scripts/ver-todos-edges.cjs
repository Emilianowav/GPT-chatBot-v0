require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verTodosEdges() {
  try {
    console.log('✅ Conectando a MongoDB...\n');
    await mongoose.connect(MONGODB_URI);

    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId(FLOW_ID) });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }

    console.log('📊 FLUJO:', flow.nombre);
    console.log(`   Total nodos: ${flow.nodes.length}`);
    console.log(`   Total edges: ${flow.edges.length}`);
    console.log('═══════════════════════════════════════\n');

    console.log('🔗 TODOS LOS EDGES:');
    console.log('───────────────────────────────────────\n');

    flow.edges.forEach((edge, index) => {
      console.log(`${index + 1}. Edge: ${edge.id}`);
      console.log(`   ${edge.source} → ${edge.target}`);
      console.log(`   Label: ${edge.data?.label || 'Sin label'}`);
      console.log(`   Condition: ${edge.data?.condition || 'Sin condición'}`);
      console.log('');
    });

    console.log('\n🔍 ANÁLISIS DE LOOPS:');
    console.log('───────────────────────────────────────');

    // Detectar loops
    const loopsDetectados = [];
    
    // Verificar si whatsapp-preguntar conecta a algo
    const fromWhatsapp = flow.edges.filter(e => e.source === 'whatsapp-preguntar');
    if (fromWhatsapp.length > 0) {
      loopsDetectados.push({
        tipo: 'Loop desde whatsapp-preguntar',
        edges: fromWhatsapp
      });
    }

    // Verificar si whatsapp-respuesta conecta a algo
    const fromWhatsappResp = flow.edges.filter(e => e.source === 'whatsapp-respuesta');
    if (fromWhatsappResp.length > 0) {
      loopsDetectados.push({
        tipo: 'Loop desde whatsapp-respuesta',
        edges: fromWhatsappResp
      });
    }

    // Verificar loops circulares (nodo A → B → A)
    const nodosVisitados = new Set();
    const verificarLoop = (nodeId, camino = []) => {
      if (camino.includes(nodeId)) {
        return { loop: true, camino: [...camino, nodeId] };
      }
      if (nodosVisitados.has(nodeId)) {
        return { loop: false };
      }
      
      const edgesSalientes = flow.edges.filter(e => e.source === nodeId);
      for (const edge of edgesSalientes) {
        const resultado = verificarLoop(edge.target, [...camino, nodeId]);
        if (resultado.loop) {
          return resultado;
        }
      }
      
      nodosVisitados.add(nodeId);
      return { loop: false };
    };

    const loopsCirculares = [];
    for (const node of flow.nodes) {
      nodosVisitados.clear();
      const resultado = verificarLoop(node.id);
      if (resultado.loop) {
        loopsCirculares.push(resultado.camino.join(' → '));
      }
    }

    if (loopsDetectados.length > 0) {
      console.log('\n⚠️  LOOPS DETECTADOS:');
      loopsDetectados.forEach(loop => {
        console.log(`\n${loop.tipo}:`);
        loop.edges.forEach(e => {
          console.log(`  - ${e.source} → ${e.target} (${e.id})`);
        });
      });
    }

    if (loopsCirculares.length > 0) {
      console.log('\n⚠️  LOOPS CIRCULARES:');
      loopsCirculares.forEach(camino => {
        console.log(`  - ${camino}`);
      });
    }

    if (loopsDetectados.length === 0 && loopsCirculares.length === 0) {
      console.log('✅ No se detectaron loops');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

verTodosEdges();
