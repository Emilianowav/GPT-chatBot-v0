require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verEdges() {
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
    console.log('═══════════════════════════════════════\n');

    console.log('🔍 EDGES DESDE gpt-pedir-datos:');
    console.log('───────────────────────────────────────\n');

    const edgesFromPedirDatos = flow.edges.filter(e => e.source === 'gpt-pedir-datos');

    if (edgesFromPedirDatos.length === 0) {
      console.log('❌ No hay edges desde gpt-pedir-datos');
      return;
    }

    edgesFromPedirDatos.forEach((edge, index) => {
      console.log(`${index + 1}. Edge ID: ${edge.id}`);
      console.log(`   Source: ${edge.source}`);
      console.log(`   Target: ${edge.target}`);
      console.log(`   SourceHandle: ${edge.sourceHandle || 'undefined'}`);
      console.log(`   TargetHandle: ${edge.targetHandle || 'undefined'}`);
      console.log(`   Type: ${edge.type || 'undefined'}`);
      console.log(`   Label: ${edge.data?.label || 'Sin label'}`);
      console.log(`   Condition: ${edge.data?.condition || 'Sin condición'}`);
      console.log(`   Data completo: ${JSON.stringify(edge.data, null, 2)}`);
      console.log('');
    });

    console.log('\n📋 ANÁLISIS:');
    console.log('───────────────────────────────────────');
    console.log('Debe haber 2 edges desde gpt-pedir-datos:');
    console.log('1. edge-5: variables_completas = false → whatsapp-preguntar');
    console.log('2. edge-pedir-woocommerce: variables_completas = true → woocommerce');
    console.log('');
    console.log('IMPORTANTE: El FlowExecutor evalúa las condiciones en ORDEN.');
    console.log('La condición "equals true" debe evaluarse ANTES que "equals false".');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

verEdges();
