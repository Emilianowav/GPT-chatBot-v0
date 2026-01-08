const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI;

const flowSchema = new mongoose.Schema({}, { strict: false, collection: 'flows' });
const FlowModel = mongoose.model('Flow', flowSchema);

async function verificarNodoTrigger() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const flowId = '695a156681f6d67f0ae9cf40';
    const flow = await FlowModel.findById(flowId);

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log(`📊 Flujo: ${flow.nombre}`);
    console.log(`   Nodos: ${flow.nodes?.length || 0}`);
    console.log(`   Edges: ${flow.edges?.length || 0}\n`);

    console.log('🔍 VERIFICANDO NODOS:\n');
    
    flow.nodes.forEach((node, index) => {
      console.log(`${index + 1}. ${node.data?.label || 'Sin label'}`);
      console.log(`   id: ${node.id}`);
      console.log(`   type: ${node.type}`);
      console.log(`   category: ${node.category || '❌ UNDEFINED'}`);
      console.log('');
    });

    const triggerNode = flow.nodes.find(n => n.category === 'trigger');
    
    if (triggerNode) {
      console.log('✅ Nodo trigger encontrado:', triggerNode.id);
    } else {
      console.log('❌ NO HAY NODO TRIGGER');
      console.log('\n🔧 El primer nodo debería ser el trigger (WhatsApp Watch Events)');
      console.log('   Primer nodo actual:', flow.nodes[0]?.id);
      console.log('   Category:', flow.nodes[0]?.category || 'undefined');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verificarNodoTrigger();
