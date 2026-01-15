const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function debugFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const Flow = mongoose.model('Flow', new mongoose.Schema({}, { strict: false }));
    const flow = await Flow.findById('695a156681f6d67f0ae9cf40');

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log('\n📊 FLUJO:', flow.nombre);
    console.log('📝 ID:', flow._id);
    console.log('📦 Total nodos:', flow.nodes.length);
    console.log('🔗 Total edges:', flow.edges.length);

    console.log('\n🔍 NODOS DETALLADOS:\n');
    flow.nodes.forEach((node, index) => {
      console.log(`${index + 1}. ${node.id}`);
      console.log(`   Type: ${node.type}`);
      console.log(`   Label: ${node.data?.label || 'N/A'}`);
      console.log(`   Subtitle: ${node.data?.subtitle || 'N/A'}`);
      console.log(`   Config:`, node.data?.config ? JSON.stringify(node.data.config, null, 4) : 'N/A');
      console.log('');
    });

    console.log('\n🔗 EDGES DETALLADOS:\n');
    flow.edges.forEach((edge, index) => {
      console.log(`${index + 1}. ${edge.id}`);
      console.log(`   Source: ${edge.source} (handle: ${edge.sourceHandle || 'default'})`);
      console.log(`   Target: ${edge.target}`);
      console.log(`   Type: ${edge.type}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugFlow();
