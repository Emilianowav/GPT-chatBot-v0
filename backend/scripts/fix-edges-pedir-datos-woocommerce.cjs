require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixEdges() {
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

    console.log('📊 EDGES ACTUALES DESDE gpt-pedir-datos:');
    console.log('═══════════════════════════════════════\n');

    const edgesFromPedirDatos = flow.edges.filter(e => e.source === 'gpt-pedir-datos');
    edgesFromPedirDatos.forEach(edge => {
      console.log(`📌 Edge: ${edge.id}`);
      console.log(`   Source: ${edge.source}`);
      console.log(`   Target: ${edge.target}`);
      console.log(`   Label: ${edge.data?.label || 'N/A'}`);
      console.log(`   Condition: ${edge.data?.condition || 'N/A'}`);
      console.log('');
    });

    console.log('🔧 ARREGLANDO EDGES...\n');

    // Eliminar edges existentes desde gpt-pedir-datos
    flow.edges = flow.edges.filter(e => e.source !== 'gpt-pedir-datos');

    // Crear edge condicional: gpt-pedir-datos → whatsapp-preguntar (si faltan variables)
    const edgeToWhatsApp = {
      id: 'edge-pedir-whatsapp',
      source: 'gpt-pedir-datos',
      target: 'whatsapp-preguntar',
      sourceHandle: 'incomplete',
      targetHandle: null,
      type: 'custom',
      animated: true,
      data: {
        label: 'Faltan variables',
        condition: '{{gpt-pedir-datos.variables_completas}} equals false'
      }
    };

    // Crear edge condicional: gpt-pedir-datos → router (si variables completas)
    const edgeToRouter = {
      id: 'edge-pedir-router',
      source: 'gpt-pedir-datos',
      target: 'router',
      sourceHandle: 'complete',
      targetHandle: null,
      type: 'custom',
      animated: true,
      data: {
        label: 'Variables completas',
        condition: '{{gpt-pedir-datos.variables_completas}} equals true'
      }
    };

    flow.edges.push(edgeToWhatsApp);
    flow.edges.push(edgeToRouter);

    console.log('✅ Nuevos edges creados:');
    console.log('   1. gpt-pedir-datos → whatsapp-preguntar (si variables_completas = false)');
    console.log('   2. gpt-pedir-datos → router (si variables_completas = true)');
    console.log('');

    console.log('💾 Guardando en MongoDB...\n');

    await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );

    console.log('✅ Edges actualizados exitosamente\n');
    console.log('🎯 FLUJO CORRECTO:');
    console.log('   1. formateador extrae variables');
    console.log('   2. router evalúa si faltan variables');
    console.log('   3. Si faltan → gpt-pedir-datos → whatsapp-preguntar');
    console.log('   4. Si completas → gpt-pedir-datos → router → woocommerce');
    console.log('');
    console.log('📋 Ahora cuando el usuario diga "cualquiera":');
    console.log('   - gpt-pedir-datos extrae editorial="cualquiera", edicion="cualquiera"');
    console.log('   - variables_completas = true');
    console.log('   - Edge a router se activa');
    console.log('   - Router evalúa y va a woocommerce');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

fixEdges();
