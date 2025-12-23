import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

const empresaSchema = new mongoose.Schema({}, { strict: false });
const Empresa = mongoose.model('Empresa', empresaSchema, 'empresas');

const apiConfigSchema = new mongoose.Schema({}, { strict: false });
const ApiConfiguration = mongoose.model('ApiConfiguration', apiConfigSchema, 'api_configurations');

async function verificarEstructura() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar empresa Juventus
    const empresa = await Empresa.findOne({ 
      nombre: /juventus/i 
    });

    if (empresa) {
      console.log('\n📋 EMPRESA JUVENTUS:');
      console.log('   Nombre:', empresa.nombre);
      console.log('   ID:', empresa._id);
      console.log('   Chatbot ID:', empresa.chatbotId);
    }

    // Buscar API de Mis Canchas
    const api = await ApiConfiguration.findOne({ 
      nombre: /Mis Canchas/i 
    });

    if (api) {
      console.log('\n📋 API MIS CANCHAS:');
      console.log('   Nombre:', api.nombre);
      console.log('   ID:', api._id);
      console.log('   Empresa ID:', api.empresaId);
      console.log('   Workflows:', api.workflows?.length || 0);
      
      if (api.workflows && api.workflows.length > 0) {
        console.log('\n🔥 WORKFLOWS CONFIGURADOS:');
        api.workflows.forEach((wf, index) => {
          console.log(`\n   ${index + 1}. ${wf.nombre}`);
          console.log(`      ID: ${wf.id}`);
          console.log(`      Activo: ${wf.activo}`);
          console.log(`      Prioridad: ${wf.prioridad || 'N/A'}`);
          console.log(`      Trigger: ${wf.trigger?.tipo || 'N/A'}`);
          if (wf.trigger?.keywords) {
            console.log(`      Keywords: ${wf.trigger.keywords.join(', ')}`);
          }
          console.log(`      Pasos: ${wf.steps?.length || 0}`);
        });
      }

      // Verificar chatbotIntegration
      if (api.chatbotIntegration) {
        console.log('\n🤖 INTEGRACIÓN CHATBOT:');
        console.log('   Habilitado:', api.chatbotIntegration.habilitado);
        console.log('   Chatbot ID:', api.chatbotIntegration.chatbotId);
      }
    }

    console.log('\n✅ VERIFICACIÓN COMPLETA');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

verificarEstructura();
