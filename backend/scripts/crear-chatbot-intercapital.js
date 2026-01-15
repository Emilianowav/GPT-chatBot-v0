import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function crearChatbot() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar empresa
    const empresa = await db.collection('empresas').findOne({
      nombre: 'Intercapital'
    });

    if (!empresa) {
      console.log('❌ Empresa Intercapital no encontrada');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 Empresa encontrada:', empresa.nombre);
    console.log(`   ID: ${empresa._id}\n`);

    // Verificar si ya existe chatbot
    const chatbotExistente = await db.collection('chatbots').findOne({
      empresaId: empresa._id
    });

    if (chatbotExistente) {
      console.log('⚠️  Ya existe un chatbot para Intercapital');
      console.log(`   - Nombre: ${chatbotExistente.nombre}`);
      console.log(`   - Activo: ${chatbotExistente.activo}`);
      
      // Actualizar para asegurar que esté activo
      await db.collection('chatbots').updateOne(
        { _id: chatbotExistente._id },
        { $set: { activo: true, updatedAt: new Date() } }
      );
      console.log('   ✅ Actualizado a activo: true');
      await mongoose.disconnect();
      return;
    }

    // Crear chatbot para Intercapital
    const chatbot = {
      empresaId: empresa._id,
      nombre: 'Intercapital Bot',
      descripcion: 'Bot conversacional con workflows para operaciones financieras',
      activo: true,
      tipo: 'hibrido', // Permite tanto workflows como conversacional
      whatsapp: {
        phoneNumberId: '976398932217836',
        businessAccountId: '772636765924023',
        accessToken: process.env.META_WHATSAPP_TOKEN
      },
      configuracion: {
        usaWorkflows: true,
        usaGPT: true,
        prioridadWorkflows: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('chatbots').insertOne(chatbot);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ CHATBOT CREADO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Datos del chatbot:');
    console.log(`   - ID: ${result.insertedId}`);
    console.log(`   - Nombre: ${chatbot.nombre}`);
    console.log(`   - Empresa ID: ${chatbot.empresaId}`);
    console.log(`   - Activo: ${chatbot.activo}`);
    console.log(`   - Tipo: ${chatbot.tipo}`);
    console.log(`   - Usa Workflows: ${chatbot.configuracion.usaWorkflows}`);

    console.log('\n✅ Ahora el router podrá detectar los workflows de Intercapital');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearChatbot();
