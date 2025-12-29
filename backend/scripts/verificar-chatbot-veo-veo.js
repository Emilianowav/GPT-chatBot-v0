import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verificarChatbot() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Obtener empresa
    const empresa = await db.collection('empresas').findOne({
      nombre: /veo veo/i
    });

    console.log('🏢 EMPRESA:');
    console.log('   ID:', empresa._id.toString());
    console.log('   Nombre:', empresa.nombre);

    const empresaIdString = empresa._id.toString();

    // Buscar chatbot
    const chatbot = await db.collection('chatbots').findOne({
      empresaId: empresaIdString,
      activo: true
    });

    console.log('\n🤖 CHATBOT:');
    if (chatbot) {
      console.log('   ✅ Encontrado');
      console.log('   ID:', chatbot._id);
      console.log('   Nombre:', chatbot.nombre);
      console.log('   Activo:', chatbot.activo);
    } else {
      console.log('   ❌ NO ENCONTRADO');
      console.log('\n🔍 Buscando chatbots con cualquier empresaId...');
      
      const todosChatbots = await db.collection('chatbots').find({}).toArray();
      console.log('   Total chatbots en BD:', todosChatbots.length);
      
      if (todosChatbots.length > 0) {
        console.log('\n📋 Chatbots encontrados:');
        todosChatbots.forEach((cb, i) => {
          console.log(`   ${i + 1}. ${cb.nombre || 'Sin nombre'}`);
          console.log(`      empresaId: ${cb.empresaId}`);
          console.log(`      activo: ${cb.activo}`);
        });
      }
      
      console.log('\n⚠️  PROBLEMA: No hay chatbot activo para Veo Veo');
      console.log('   Esto impide que se detecten los workflows');
      console.log('\n💡 SOLUCIÓN: Crear chatbot para Veo Veo');
    }

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarChatbot();
