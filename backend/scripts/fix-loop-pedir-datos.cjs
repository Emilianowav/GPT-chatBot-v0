require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixLoop() {
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

    console.log('🔍 PROBLEMA DETECTADO:');
    console.log('───────────────────────────────────────');
    console.log('Edge incorrecto:');
    console.log('  gpt-pedir-datos → router (cuando variables_completas = true)');
    console.log('  Esto crea un LOOP infinito\n');

    console.log('✅ SOLUCIÓN:');
    console.log('───────────────────────────────────────');
    console.log('Eliminar: gpt-pedir-datos → router');
    console.log('Crear: gpt-pedir-datos → woocommerce (cuando variables_completas = true)\n');

    // Eliminar edge incorrecto
    const edgesLimpios = flow.edges.filter(e => e.id !== 'edge-pedir-router-completo');

    // Crear edge correcto: gpt-pedir-datos → woocommerce
    const nuevoEdge = {
      id: 'edge-pedir-woocommerce',
      source: 'gpt-pedir-datos',
      target: 'woocommerce',
      sourceHandle: 'complete',
      targetHandle: null,
      type: 'default',
      data: {
        label: 'Variables completas',
        condition: '{{gpt-pedir-datos.variables_completas}} equals true'
      }
    };

    edgesLimpios.push(nuevoEdge);

    console.log('🔧 APLICANDO CAMBIOS...\n');

    await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { $set: { edges: edgesLimpios } }
    );

    console.log('✅ Cambios aplicados exitosamente\n');

    console.log('📋 FLUJO CORRECTO AHORA:');
    console.log('═══════════════════════════════════════');
    console.log('1. webhook → gpt-conversacional → gpt-formateador → router');
    console.log('2. Si faltan variables:');
    console.log('   router → gpt-pedir-datos');
    console.log('   ├─ Si aún faltan: → whatsapp-preguntar → FIN');
    console.log('   └─ Si completas: → woocommerce → ...');
    console.log('3. Si variables completas desde inicio:');
    console.log('   router → woocommerce → ...');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

fixLoop();
