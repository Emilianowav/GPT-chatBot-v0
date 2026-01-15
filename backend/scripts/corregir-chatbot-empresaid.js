import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function corregirChatbot() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar empresa
    const empresa = await db.collection('empresas').findOne({
      nombre: 'Intercapital'
    });

    if (!empresa) {
      console.log('❌ Empresa no encontrada');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 Empresa encontrada:');
    console.log(`   - Nombre: ${empresa.nombre}`);
    console.log(`   - _id: ${empresa._id}`);
    console.log(`   - Tipo: ${empresa._id.constructor.name}\n`);

    // Buscar chatbot con ObjectId
    const chatbotConObjectId = await db.collection('chatbots').findOne({
      empresaId: empresa._id
    });

    if (chatbotConObjectId) {
      console.log('🔍 Chatbot encontrado con empresaId como ObjectId:');
      console.log(`   - Nombre: ${chatbotConObjectId.nombre}`);
      console.log(`   - empresaId: ${chatbotConObjectId.empresaId}`);
      console.log(`   - Tipo: ${chatbotConObjectId.empresaId.constructor.name}\n`);

      console.log('🔧 Corrigiendo empresaId a String...');
      
      // Actualizar empresaId a String (nombre de empresa)
      const result = await db.collection('chatbots').updateOne(
        { _id: chatbotConObjectId._id },
        { 
          $set: { 
            empresaId: empresa.nombre, // Cambiar a nombre de empresa (String)
            updatedAt: new Date()
          } 
        }
      );

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ CHATBOT CORREGIDO');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log(`✅ Documentos modificados: ${result.modifiedCount}`);

      // Verificar
      const chatbotActualizado = await db.collection('chatbots').findOne({
        _id: chatbotConObjectId._id
      });

      console.log('\n📋 Chatbot actualizado:');
      console.log(`   - empresaId: ${chatbotActualizado.empresaId}`);
      console.log(`   - Tipo: ${typeof chatbotActualizado.empresaId}`);
      console.log(`   - Es String: ${typeof chatbotActualizado.empresaId === 'string'}`);

      // Probar búsqueda con el modelo
      console.log('\n🧪 Probando búsqueda con nombre de empresa...');
      const chatbotPorNombre = await db.collection('chatbots').findOne({
        empresaId: empresa.nombre,
        activo: true
      });

      if (chatbotPorNombre) {
        console.log('   ✅ Chatbot encontrado con empresaId como String');
      } else {
        console.log('   ❌ NO se encontró chatbot');
      }

    } else {
      console.log('⚠️  No se encontró chatbot con ObjectId');
      
      // Buscar con String
      const chatbotConString = await db.collection('chatbots').findOne({
        empresaId: empresa.nombre
      });

      if (chatbotConString) {
        console.log('✅ El chatbot ya tiene empresaId como String');
      } else {
        console.log('❌ No se encontró chatbot ni con ObjectId ni con String');
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

corregirChatbot();
