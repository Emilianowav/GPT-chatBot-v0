const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function checkWhatsAppConfig() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    
    // 1. Verificar empresa
    const empresa = await db.collection('empresas').findOne({ nombre: 'Veo Veo' });
    console.log('📱 EMPRESA VEO VEO:');
    console.log('   Phone Number ID:', empresa.phoneNumberId);
    console.log('   Token existe:', !!empresa.whatsappToken);
    console.log('   Token length:', empresa.whatsappToken?.length || 0);
    
    // 2. Verificar flujo
    const flow = await db.collection('flows').findOne({ 
      _id: new mongoose.Types.ObjectId(FLOW_ID) 
    });
    
    console.log('\n📊 FLUJO:');
    console.log('   Nombre:', flow.nombre);
    
    // 3. Verificar nodos WhatsApp
    const whatsappNodes = flow.nodes.filter(n => n.type === 'whatsapp');
    console.log('\n📱 NODOS WHATSAPP:', whatsappNodes.length);
    
    whatsappNodes.forEach(node => {
      console.log(`\n   ${node.id} (${node.data.label}):`);
      console.log('   Module:', node.data.config?.module);
      console.log('   Mensaje:', node.data.config?.mensaje?.substring(0, 50) + '...');
      console.log('   To:', node.data.config?.to);
    });
    
    // 4. Verificar nodo fuente WhatsApp
    const triggerNode = flow.nodes.find(n => n.id === 'whatsapp-trigger' || n.id === '1');
    if (triggerNode) {
      console.log('\n🎯 NODO TRIGGER:');
      console.log('   ID:', triggerNode.id);
      console.log('   Type:', triggerNode.type);
      console.log('   Config:', JSON.stringify(triggerNode.data.config, null, 2));
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkWhatsAppConfig();
