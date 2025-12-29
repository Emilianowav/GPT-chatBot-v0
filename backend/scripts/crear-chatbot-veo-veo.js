import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function crearChatbot() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Obtener empresa
    const empresa = await db.collection('empresas').findOne({
      nombre: /veo veo/i
    });

    if (!empresa) {
      console.log('❌ No se encontró empresa Veo Veo');
      await mongoose.disconnect();
      return;
    }

    console.log('🏢 Empresa encontrada:');
    console.log('   ID:', empresa._id);
    console.log('   Nombre:', empresa.nombre);

    const empresaIdString = empresa._id.toString();

    // Verificar si ya existe chatbot
    const chatbotExistente = await db.collection('chatbots').findOne({
      empresaId: empresaIdString
    });

    if (chatbotExistente) {
      console.log('\n⚠️  Ya existe un chatbot para Veo Veo');
      console.log('   Actualizando a activo...');
      
      await db.collection('chatbots').updateOne(
        { _id: chatbotExistente._id },
        { $set: { activo: true, updatedAt: new Date() } }
      );
      
      console.log('✅ Chatbot actualizado');
      await mongoose.disconnect();
      return;
    }

    // Crear chatbot
    const chatbot = {
      empresaId: empresaIdString,
      nombre: 'Bot Veo Veo',
      activo: true,
      modelo: 'gpt-3.5-turbo',
      temperatura: 0.7,
      maxTokens: 500,
      prompt: 'Sos el asistente virtual de Veo Veo, una librería. Tu objetivo es ayudar a los clientes a encontrar y comprar libros.',
      whatsapp: {
        phoneNumberId: empresa.phoneNumberId
      },
      configuracion: {
        usarWorkflows: true,
        usarHistorial: true,
        timeoutMinutos: 15
      },
      mensajes: {
        bienvenida: '¡Hola! 📚 Bienvenido a Veo Veo, tu librería de confianza.',
        despedida: '¡Gracias por tu compra! Te esperamos pronto.',
        error: 'Disculpá, no entendí tu mensaje. ¿Podés reformularlo?'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('chatbots').insertOne(chatbot);

    console.log('\n✅ CHATBOT CREADO EXITOSAMENTE');
    console.log('   ID:', result.insertedId);
    console.log('   Nombre:', chatbot.nombre);
    console.log('   empresaId:', chatbot.empresaId);
    console.log('   Activo:', chatbot.activo);

    console.log('\n🎯 AHORA EL WORKFLOW SE ACTIVARÁ CORRECTAMENTE');
    console.log('   El universalRouter detectará los workflows de Veo Veo');

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearChatbot();
