import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

const chatbotSchema = new mongoose.Schema({}, { strict: false });
const Chatbot = mongoose.model('Chatbot', chatbotSchema, 'chatbots');

async function listarChatbots() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const chatbots = await Chatbot.find({});
    
    console.log(`\n📋 Total de chatbots: ${chatbots.length}\n`);
    
    chatbots.forEach((chatbot, index) => {
      console.log(`${index + 1}. ${chatbot.nombre || 'Sin nombre'}`);
      console.log(`   ID: ${chatbot._id}`);
      console.log(`   Empresa: ${chatbot.empresaId || 'N/A'}`);
      console.log(`   Flujos: ${chatbot.flujos?.length || 0}`);
      if (chatbot.flujos && chatbot.flujos.length > 0) {
        chatbot.flujos.forEach((flujo, i) => {
          console.log(`      ${i + 1}. ${flujo.nombre} (${flujo.tipo || 'N/A'})`);
        });
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado');
  }
}

listarChatbots();
