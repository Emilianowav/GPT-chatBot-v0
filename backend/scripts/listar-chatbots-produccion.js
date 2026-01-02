import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function listarChatbots() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 LISTADO DE CHATBOTS EN PRODUCCIÓN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const chatbots = await db.collection('chatbots').find({}).toArray();

    console.log(`Total chatbots: ${chatbots.length}\n`);

    if (chatbots.length === 0) {
      console.log('⚠️  NO HAY CHATBOTS EN LA BASE DE DATOS');
      console.log('   Esto explica por qué el router no encuentra ninguno\n');
    } else {
      chatbots.forEach((bot, i) => {
        console.log(`${i + 1}. ${bot.nombre || 'Sin nombre'}`);
        console.log(`   - _id: ${bot._id}`);
        console.log(`   - empresaId: ${bot.empresaId}`);
        console.log(`   - activo: ${bot.activo}`);
        console.log(`   - tipo: ${bot.tipo || 'no especificado'}`);
        console.log(`   - phoneNumberId: ${bot.whatsapp?.phoneNumberId || 'no configurado'}`);
        console.log('');
      });
    }

    // Verificar empresa Intercapital
    const empresa = await db.collection('empresas').findOne({
      nombre: 'Intercapital'
    });

    if (empresa) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 BÚSQUEDA ESPECÍFICA PARA INTERCAPITAL');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log(`Empresa ID: ${empresa._id}\n`);

      const chatbotIntercapital = await db.collection('chatbots').findOne({
        empresaId: empresa._id
      });

      if (chatbotIntercapital) {
        console.log('✅ Chatbot de Intercapital encontrado');
        console.log(`   Nombre: ${chatbotIntercapital.nombre}`);
        console.log(`   Activo: ${chatbotIntercapital.activo}`);
      } else {
        console.log('❌ NO se encontró chatbot para Intercapital');
        console.log('   ⚠️  Esto explica por qué el router retorna NULL\n');
        console.log('💡 SOLUCIÓN: Ejecutar crear-chatbot-intercapital.js');
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listarChatbots();
