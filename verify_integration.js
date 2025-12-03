// Verificar configuración completa de integración
const mongoose = require('./backend/node_modules/mongoose');
require('./backend/node_modules/dotenv').config({ path: './backend/.env' });

async function verify() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.client.db('neural_chatbot');
    
    // 1. Verificar API
    const api = await db.collection('apiconfigurations').findOne({
      _id: new mongoose.Types.ObjectId('6917126a03862ac8bb3fd4f2')
    });
    
    console.log('📋 API:', api.nombre);
    console.log('   empresaId:', api.empresaId);
    console.log('   Endpoints:', api.endpoints.length);
    console.log('');
    
    // 2. Verificar chatbotIntegration
    if (!api.chatbotIntegration) {
      console.log('❌ NO HAY chatbotIntegration configurado');
      process.exit(1);
    }
    
    console.log('🤖 chatbotIntegration:');
    console.log('   habilitado:', api.chatbotIntegration.habilitado);
    console.log('   chatbotId:', api.chatbotIntegration.chatbotId);
    console.log('   keywords:', api.chatbotIntegration.keywords?.length || 0);
    console.log('');
    
    // 3. Verificar keywords
    if (!api.chatbotIntegration.keywords || api.chatbotIntegration.keywords.length === 0) {
      console.log('❌ NO HAY keywords configuradas');
      process.exit(1);
    }
    
    console.log('🔑 Keywords:');
    api.chatbotIntegration.keywords.forEach((kw, i) => {
      console.log(`\n   ${i+1}. "${kw.palabra}"`);
      console.log(`      endpointId: ${kw.endpointId}`);
      console.log(`      extraerParametros: ${kw.extraerParametros}`);
      console.log(`      template: ${kw.respuestaTemplate ? 'Sí (' + kw.respuestaTemplate.length + ' chars)' : 'No'}`);
      
      // Verificar que el endpoint existe
      const endpoint = api.endpoints.find(ep => ep.id === kw.endpointId);
      if (endpoint) {
        console.log(`      ✅ Endpoint encontrado: ${endpoint.nombre}`);
      } else {
        console.log(`      ❌ Endpoint NO encontrado`);
      }
    });
    console.log('');
    
    // 4. Verificar chatbot
    const chatbot = await db.collection('chatbots').findOne({
      _id: new mongoose.Types.ObjectId(api.chatbotIntegration.chatbotId)
    });
    
    if (!chatbot) {
      console.log('❌ Chatbot NO encontrado con ID:', api.chatbotIntegration.chatbotId);
      process.exit(1);
    }
    
    console.log('🤖 Chatbot vinculado:');
    console.log('   nombre:', chatbot.nombre);
    console.log('   activo:', chatbot.activo);
    console.log('   empresaId:', chatbot.empresaId);
    console.log('');
    
    // 5. Verificar que empresaId coincide
    if (chatbot.empresaId !== api.empresaId.toString()) {
      console.log('⚠️ ADVERTENCIA: empresaId no coincide');
      console.log('   API empresaId:', api.empresaId.toString());
      console.log('   Chatbot empresaId:', chatbot.empresaId);
    } else {
      console.log('✅ empresaId coincide correctamente');
    }
    console.log('');
    
    // 6. Resumen final
    console.log('═══════════════════════════════════════');
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('═══════════════════════════════════════');
    console.log('✅ API configurada:', api.nombre);
    console.log('✅ Integración habilitada:', api.chatbotIntegration.habilitado);
    console.log('✅ Chatbot vinculado:', chatbot.nombre);
    console.log('✅ Keywords configuradas:', api.chatbotIntegration.keywords.length);
    console.log('');
    console.log('🧪 Prueba enviando por WhatsApp:');
    api.chatbotIntegration.keywords.forEach(kw => {
      console.log(`   "${kw.palabra}"`);
    });
    console.log('');
    console.log('⚠️ IMPORTANTE:');
    console.log('   1. El código del Router Universal debe estar en Render');
    console.log('   2. Reinicia el servicio en Render');
    console.log('   3. Verifica los logs del backend cuando envíes un mensaje');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verify();
