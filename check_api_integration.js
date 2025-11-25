// Script para verificar la configuración de integración de APIs con chatbot
const mongoose = require('./backend/node_modules/mongoose');
require('./backend/node_modules/dotenv').config({ path: './backend/.env' });

async function checkIntegration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.client.db('neural_chatbot');
    
    // 1. Buscar empresa iCenter
    const empresa = await db.collection('empresas').findOne({ nombre: 'iCenter' });
    if (!empresa) {
      console.log('❌ Empresa iCenter no encontrada');
      process.exit(1);
    }
    
    console.log('🏢 Empresa iCenter:');
    console.log('   _id:', empresa._id.toString());
    console.log('   nombre:', empresa.nombre);
    console.log('   telefono:', empresa.telefono);
    console.log('');
    
    // 2. Buscar chatbot de iCenter
    const chatbot = await db.collection('chatbots').findOne({ 
      empresaId: empresa._id.toString() 
    });
    
    if (!chatbot) {
      console.log('❌ No hay chatbot para iCenter');
      process.exit(1);
    }
    
    console.log('🤖 Chatbot:');
    console.log('   _id:', chatbot._id.toString());
    console.log('   nombre:', chatbot.nombre);
    console.log('   activo:', chatbot.activo);
    console.log('   empresaId:', chatbot.empresaId);
    console.log('');
    
    // 3. Buscar APIs con integración habilitada
    const apis = await db.collection('apiconfigurations').find({
      empresaId: empresa._id.toString(),
      'chatbotIntegration.habilitado': true
    }).toArray();
    
    console.log(`📋 APIs con integración habilitada: ${apis.length}`);
    console.log('');
    
    if (apis.length === 0) {
      console.log('⚠️ No hay APIs con integración habilitada');
      console.log('');
      console.log('📝 Para habilitar:');
      console.log('   1. Ve al CRM → APIs Configurables');
      console.log('   2. Selecciona una API');
      console.log('   3. Pestaña "🤖 Chatbot"');
      console.log('   4. Habilita integración');
      console.log('   5. Selecciona el chatbot');
      console.log('   6. Agrega keywords');
      console.log('   7. Guarda');
    } else {
      apis.forEach((api, index) => {
        console.log(`${index + 1}. API: ${api.nombre}`);
        console.log(`   _id: ${api._id.toString()}`);
        console.log(`   chatbotId: ${api.chatbotIntegration.chatbotId}`);
        console.log(`   keywords: ${api.chatbotIntegration.keywords?.length || 0}`);
        
        if (api.chatbotIntegration.keywords) {
          api.chatbotIntegration.keywords.forEach((kw, i) => {
            console.log(`   ${i + 1}. "${kw.palabra}" → endpoint: ${kw.endpointId}`);
            console.log(`      extraerParametros: ${kw.extraerParametros}`);
            console.log(`      template: ${kw.respuestaTemplate ? 'Sí' : 'No'}`);
          });
        }
        console.log('');
      });
    }
    
    // 4. Verificar que el chatbotId coincide
    if (apis.length > 0) {
      const apiChatbotId = apis[0].chatbotIntegration.chatbotId;
      const chatbotId = chatbot._id.toString();
      
      if (apiChatbotId === chatbotId) {
        console.log('✅ El chatbotId de la API coincide con el chatbot');
      } else {
        console.log('❌ ERROR: El chatbotId NO coincide');
        console.log(`   API tiene: ${apiChatbotId}`);
        console.log(`   Chatbot es: ${chatbotId}`);
      }
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkIntegration();
