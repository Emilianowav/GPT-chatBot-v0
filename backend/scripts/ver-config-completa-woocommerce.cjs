require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verConfigWoocommerce() {
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

    const woocommerce = flow.nodes.find(n => n.id === 'woocommerce');

    if (!woocommerce) {
      console.log('❌ Nodo woocommerce no encontrado');
      return;
    }

    console.log('🛍️  NODO WOOCOMMERCE - CONFIGURACIÓN COMPLETA');
    console.log('═══════════════════════════════════════\n');
    console.log(JSON.stringify(woocommerce, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

verConfigWoocommerce();
