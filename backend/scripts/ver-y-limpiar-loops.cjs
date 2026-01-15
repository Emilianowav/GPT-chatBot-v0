require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function limpiarLoops() {
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

    console.log('🔍 EDGES ACTUALES desde whatsapp-preguntar:');
    console.log('───────────────────────────────────────');
    const edgesFromWhatsapp = flow.edges.filter(e => e.source === 'whatsapp-preguntar');
    
    if (edgesFromWhatsapp.length === 0) {
      console.log('✅ No hay edges desde whatsapp-preguntar (correcto)');
    } else {
      console.log(`⚠️  Encontrados ${edgesFromWhatsapp.length} edges incorrectos:\n`);
      edgesFromWhatsapp.forEach(edge => {
        console.log(`📌 Edge: ${edge.id}`);
        console.log(`   Source: ${edge.source} → Target: ${edge.target}`);
        console.log(`   Label: ${edge.data?.label || 'Sin label'}`);
        console.log('');
      });

      console.log('🗑️  ELIMINANDO edges de loop...\n');
      
      const edgesLimpios = flow.edges.filter(e => e.source !== 'whatsapp-preguntar');
      
      await flowsCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(FLOW_ID) },
        { $set: { edges: edgesLimpios } }
      );

      console.log(`✅ Eliminados ${edgesFromWhatsapp.length} edges de loop`);
    }

    console.log('\n📋 FLUJO CORRECTO:');
    console.log('═══════════════════════════════════════');
    console.log('1. webhook → gpt-conversacional → gpt-formateador → router');
    console.log('2. Si faltan variables:');
    console.log('   router → gpt-pedir-datos → whatsapp-preguntar → FIN');
    console.log('   (El usuario responde y se inicia un NUEVO flujo desde webhook)');
    console.log('3. Si variables completas:');
    console.log('   router → woocommerce → whatsapp-respuesta → FIN');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

limpiarLoops();
