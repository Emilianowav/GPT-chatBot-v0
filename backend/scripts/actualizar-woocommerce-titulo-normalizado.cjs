require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function actualizarWooCommerce() {
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

    const woocommerce = flow.nodes.find(n => n.id === 'woocommerce');

    if (!woocommerce) {
      console.log('❌ Nodo woocommerce no encontrado');
      return;
    }

    console.log('🔍 NODO WOOCOMMERCE ACTUAL:');
    console.log(`   Params: ${JSON.stringify(woocommerce.data.config.params)}\n`);

    // Cambiar el parámetro search de {{titulo}} a {{gpt-normalizador-titulo.respuesta_gpt}}
    woocommerce.data.config.params.search = '{{gpt-normalizador-titulo.respuesta_gpt}}';

    console.log('🔧 NUEVO PARAMS:');
    console.log(`   search: {{gpt-normalizador-titulo.respuesta_gpt}}`);
    console.log(`   per_page: ${woocommerce.data.config.params.per_page}\n`);

    console.log('💾 Guardando en MongoDB...\n');

    await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );

    console.log('✅ Nodo WooCommerce actualizado exitosamente\n');
    console.log('🎯 Ahora WooCommerce:');
    console.log('   1. Recibe el título normalizado de gpt-normalizador-titulo');
    console.log('   2. Busca con el título oficial completo');
    console.log('   3. Debería encontrar productos correctamente');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

actualizarWooCommerce();
