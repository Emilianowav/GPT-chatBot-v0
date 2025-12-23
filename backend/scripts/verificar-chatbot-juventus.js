import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verificarChatbotJuventus() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;

    // 1. Buscar empresa Juventus
    const empresa = await db.collection('empresas').findOne({ nombre: /juventus/i });
    console.log('\n📋 EMPRESA JUVENTUS:');
    console.log('   ID:', empresa?._id);
    console.log('   Nombre:', empresa?.nombre);
    console.log('   Chatbot ID:', empresa?.chatbotId);

    // 2. Buscar chatbot
    const chatbots = await db.collection('chatbots').find({}).toArray();
    console.log('\n📋 CHATBOTS:');
    chatbots.forEach(cb => {
      console.log(`   - ${cb.nombre} (Empresa: ${cb.empresaId})`);
    });

    // 3. Buscar configuración del módulo
    const configModulo = await db.collection('configuracion_modulos').findOne({ 
      empresaId: empresa?._id?.toString() || 'Club Juventus'
    });
    console.log('\n📋 CONFIG MODULO:');
    console.log('   Existe:', !!configModulo);
    console.log('   tipoNegocio:', configModulo?.tipoNegocio);

    // 4. Buscar configuración del bot
    const configBot = await db.collection('configuracion_bots').findOne({ 
      empresaId: empresa?._id?.toString() || 'Club Juventus'
    });
    console.log('\n📋 CONFIG BOT (pasos):');
    console.log('   Existe:', !!configBot);
    console.log('   Activo:', configBot?.activo);

    // 5. Buscar API de Mis Canchas
    const apiConfig = await db.collection('api_configurations').findOne({ 
      nombre: /mis canchas/i 
    });
    console.log('\n📋 API MIS CANCHAS:');
    console.log('   Existe:', !!apiConfig);
    console.log('   Empresa ID:', apiConfig?.empresaId);
    console.log('   Workflows:', apiConfig?.workflows?.length || 0);
    if (apiConfig?.workflows?.length > 0) {
      apiConfig.workflows.forEach(wf => {
        console.log(`      - ${wf.nombre} (activo: ${wf.activo}, prioridad: ${wf.prioridad})`);
      });
    }

    // 6. Buscar chatbot integration
    console.log('\n📋 CHATBOT INTEGRATION:');
    console.log('   Habilitado:', apiConfig?.chatbotIntegration?.habilitado);
    console.log('   Chatbot ID:', apiConfig?.chatbotIntegration?.chatbotId);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

verificarChatbotJuventus();
