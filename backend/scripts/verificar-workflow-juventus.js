import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verificarWorkflowJuventus() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;

    // Buscar API de Mis Canchas
    const apiConfig = await db.collection('api_configurations').findOne({ 
      nombre: /mis canchas/i 
    });

    if (!apiConfig) {
      console.error('❌ No se encontró API de Mis Canchas');
      process.exit(1);
    }

    console.log('\n📋 API MIS CANCHAS:');
    console.log('   ID:', apiConfig._id);
    console.log('   Nombre:', apiConfig.nombre);
    console.log('   Estado:', apiConfig.estado);
    console.log('   Empresa ID:', apiConfig.empresaId);

    console.log('\n📋 CHATBOT INTEGRATION:');
    console.log('   Habilitado:', apiConfig.chatbotIntegration?.habilitado);
    console.log('   Chatbot ID:', apiConfig.chatbotIntegration?.chatbotId);

    console.log('\n📋 WORKFLOWS:');
    if (apiConfig.workflows && apiConfig.workflows.length > 0) {
      apiConfig.workflows.forEach((wf, i) => {
        console.log(`\n   ${i + 1}. ${wf.nombre}`);
        console.log(`      ID: ${wf._id}`);
        console.log(`      Activo: ${wf.activo}`);
        console.log(`      Prioridad: ${wf.prioridad}`);
        console.log(`      Trigger: ${wf.trigger?.tipo}`);
        console.log(`      Keywords: ${wf.trigger?.keywords?.join(', ')}`);
        console.log(`      Pasos: ${wf.pasos?.length || 0}`);
        
        if (wf.pasos && wf.pasos.length > 0) {
          console.log(`      Detalle de pasos:`);
          wf.pasos.forEach((paso, j) => {
            console.log(`         ${j + 1}. ${paso.nombre} (${paso.tipo})`);
          });
        }
      });
    } else {
      console.log('   ⚠️ No hay workflows configurados');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

verificarWorkflowJuventus();
