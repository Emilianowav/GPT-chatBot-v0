require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function testFlujo() {
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

    // Encontrar nodos relevantes
    const gptConversacional = flow.nodes.find(n => n.id === 'gpt-conversacional');
    const gptPedirDatos = flow.nodes.find(n => n.id === 'gpt-pedir-datos');
    const router = flow.nodes.find(n => n.id === 'router');

    console.log('🔍 NODO: gpt-conversacional');
    console.log('───────────────────────────────────────');
    console.log('Variables a recopilar:');
    if (gptConversacional?.data?.config?.variablesRecopilar) {
      gptConversacional.data.config.variablesRecopilar.forEach(v => {
        console.log(`  - ${v.nombre}: obligatorio=${v.obligatorio}`);
      });
    }
    console.log('');

    console.log('🔍 NODO: gpt-pedir-datos');
    console.log('───────────────────────────────────────');
    console.log('Variables a recopilar:');
    if (gptPedirDatos?.data?.config?.variablesRecopilar) {
      gptPedirDatos.data.config.variablesRecopilar.forEach(v => {
        console.log(`  - ${v.nombre}: obligatorio=${v.obligatorio}`);
      });
    }
    console.log('\nSystem Prompt (primeros 200 chars):');
    console.log(gptPedirDatos?.data?.config?.systemPrompt?.substring(0, 200) + '...');
    console.log('');

    console.log('🔍 EDGES desde gpt-pedir-datos:');
    console.log('───────────────────────────────────────');
    const edgesFromPedirDatos = flow.edges.filter(e => e.source === 'gpt-pedir-datos');
    edgesFromPedirDatos.forEach(edge => {
      console.log(`\n📌 Edge: ${edge.id}`);
      console.log(`   Source: ${edge.source} → Target: ${edge.target}`);
      console.log(`   Label: ${edge.data?.label || 'Sin label'}`);
      console.log(`   Condition: ${edge.data?.condition || 'Sin condición'}`);
    });
    console.log('');

    console.log('🔍 ROUTER: Rutas configuradas');
    console.log('───────────────────────────────────────');
    if (router?.data?.config?.routes) {
      router.data.config.routes.forEach(route => {
        console.log(`\n📍 Ruta: ${route.label}`);
        console.log(`   ID: ${route.id}`);
        console.log(`   Condition: ${route.condition}`);
      });
    }

    console.log('\n\n💡 ANÁLISIS:');
    console.log('═══════════════════════════════════════');
    console.log('1. Cuando usuario dice "cualquiera":');
    console.log('   → gpt-pedir-datos debe extraer editorial="cualquiera" Y edicion="cualquiera"');
    console.log('   → variables_completas debe ser TRUE');
    console.log('   → Edge condicional debe activarse y llevar a router');
    console.log('');
    console.log('2. El FlowExecutor debe:');
    console.log('   → Evaluar PRIMERO los edges con condiciones');
    console.log('   → Si condition cumple, usar ese edge');
    console.log('   → Si no, usar routerPath o fallback');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

testFlujo();
