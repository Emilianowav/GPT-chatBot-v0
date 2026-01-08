const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI;

async function fixWhatsAppPhoneNumber() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const flowId = '695a156681f6d67f0ae9cf40';
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId(flowId) });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log(`📊 Flujo: ${flow.nombre}\n`);

    // Encontrar nodo whatsapp-respuesta-gpt
    const whatsappIndex = flow.nodes.findIndex(n => n.id === 'whatsapp-respuesta-gpt');
    
    if (whatsappIndex === -1) {
      console.log('❌ Nodo whatsapp-respuesta-gpt no encontrado');
      process.exit(1);
    }

    console.log('🔧 Corrigiendo configuración del nodo WhatsApp:\n');
    console.log(`   Config actual:`, JSON.stringify(flow.nodes[whatsappIndex].data.config, null, 2));
    console.log('');

    // Corregir configuración
    flow.nodes[whatsappIndex].data.config = {
      module: 'send-message',
      phoneNumberId: '906667632531979',
      
      // Variables correctas del trigger
      to: '{{1.from}}', // El nodo 1 es el trigger que tiene el "from"
      message: '{{gpt-conversacional.respuesta_gpt}}' // Respuesta del GPT
    };

    console.log('✅ Nueva configuración:');
    console.log(`   Module: send-message`);
    console.log(`   Phone Number ID: 906667632531979`);
    console.log(`   To: {{1.from}} (teléfono del usuario desde el trigger)`);
    console.log(`   Message: {{gpt-conversacional.respuesta_gpt}}`);
    console.log('');

    // Guardar
    const result = await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(flowId) },
      { $set: { nodes: flow.nodes } }
    );

    console.log(`💾 Resultado: ${result.modifiedCount} documento(s) modificado(s)\n`);

    if (result.modifiedCount > 0) {
      console.log('✅ Nodo WhatsApp corregido\n');
      console.log('📋 VARIABLES DISPONIBLES EN EL FLUJO:');
      console.log('   1.from → Teléfono del usuario (ej: 5493794946066)');
      console.log('   1.to → Teléfono de la empresa');
      console.log('   1.phoneNumberId → ID del número de WhatsApp');
      console.log('   gpt-conversacional.respuesta_gpt → Respuesta del GPT');
      console.log('');
      console.log('🧪 LISTO PARA TESTEAR');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixWhatsAppPhoneNumber();
