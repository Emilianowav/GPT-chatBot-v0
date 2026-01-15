require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verEdgesDesdeRouter() {
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

    // Buscar todos los edges que salen del router
    const edgesDesdeRouter = flow.edges.filter(e => e.source === 'router');

    console.log(`🔍 EDGES DESDE ROUTER (${edgesDesdeRouter.length}):\n`);

    edgesDesdeRouter.forEach((edge, index) => {
      console.log(`${index + 1}. Edge ID: ${edge.id}`);
      console.log(`   Source: ${edge.source}`);
      console.log(`   Target: ${edge.target}`);
      console.log(`   SourceHandle: ${edge.sourceHandle || 'undefined'}`);
      console.log(`   TargetHandle: ${edge.targetHandle || 'undefined'}`);
      console.log(`   Label: ${edge.data?.label || 'sin label'}`);
      console.log(`   Condition: ${edge.data?.condition || 'sin condición'}`);
      console.log('');
    });

    // Buscar nodo WooCommerce
    const woocommerce = flow.nodes.find(n => n.id === 'woocommerce');
    if (woocommerce) {
      console.log('🛍️  NODO WOOCOMMERCE:');
      console.log(`   Position: x=${woocommerce.position.x}, y=${woocommerce.position.y}`);
      console.log(`   Config: ${JSON.stringify(woocommerce.data.config, null, 2)}`);
      console.log('');
    }

    // Buscar edges que llegan a WooCommerce
    const edgesAWoocommerce = flow.edges.filter(e => e.target === 'woocommerce');
    console.log(`🔍 EDGES QUE LLEGAN A WOOCOMMERCE (${edgesAWoocommerce.length}):\n`);

    edgesAWoocommerce.forEach((edge, index) => {
      console.log(`${index + 1}. Edge ID: ${edge.id}`);
      console.log(`   Source: ${edge.source}`);
      console.log(`   Target: ${edge.target}`);
      console.log(`   Condition: ${edge.data?.condition || 'sin condición'}`);
      console.log('');
    });

    // Buscar edges que salen de WooCommerce
    const edgesDesdeWoocommerce = flow.edges.filter(e => e.source === 'woocommerce');
    console.log(`🔍 EDGES QUE SALEN DE WOOCOMMERCE (${edgesDesdeWoocommerce.length}):\n`);

    edgesDesdeWoocommerce.forEach((edge, index) => {
      console.log(`${index + 1}. Edge ID: ${edge.id}`);
      console.log(`   Source: ${edge.source}`);
      console.log(`   Target: ${edge.target}`);
      console.log(`   Condition: ${edge.data?.condition || 'sin condición'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Desconectado');
  }
}

verEdgesDesdeRouter();
