import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verificar() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 VERIFICACIÓN EMPRESAID');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Empresa
    const empresa = await db.collection('empresas').findOne({
      nombre: 'Intercapital'
    });

    console.log('1️⃣ EMPRESA:');
    console.log(`   _id: ${empresa._id}`);
    console.log(`   Tipo: ${typeof empresa._id}`);
    console.log(`   Constructor: ${empresa._id.constructor.name}\n`);

    // 2. Chatbot
    const chatbot = await db.collection('chatbots').findOne({
      empresaId: empresa._id
    });

    console.log('2️⃣ CHATBOT:');
    if (chatbot) {
      console.log(`   ✅ Encontrado con ObjectId`);
      console.log(`   empresaId: ${chatbot.empresaId}`);
      console.log(`   Tipo: ${typeof chatbot.empresaId}`);
      console.log(`   Constructor: ${chatbot.empresaId.constructor.name}`);
      console.log(`   Coincide: ${chatbot.empresaId.toString() === empresa._id.toString()}\n`);
    } else {
      console.log('   ❌ NO encontrado con ObjectId\n');
    }

    // 3. Probar búsqueda con string
    const chatbotConString = await db.collection('chatbots').findOne({
      empresaId: empresa._id.toString()
    });

    console.log('3️⃣ CHATBOT (búsqueda con string):');
    if (chatbotConString) {
      console.log(`   ✅ Encontrado con string`);
    } else {
      console.log('   ❌ NO encontrado con string\n');
    }

    // 4. API Configuration
    const api = await db.collection('api_configurations').findOne({
      empresaId: empresa._id
    });

    console.log('4️⃣ API CONFIGURATION:');
    if (api) {
      console.log(`   ✅ Encontrada con ObjectId`);
      console.log(`   empresaId: ${api.empresaId}`);
      console.log(`   Tipo: ${typeof api.empresaId}`);
      console.log(`   Constructor: ${api.empresaId.constructor.name}\n`);
    } else {
      console.log('   ❌ NO encontrada con ObjectId\n');
    }

    // 5. Contacto
    const contacto = await db.collection('contactos').findOne({
      telefono: '5493794946066'
    });

    console.log('5️⃣ CONTACTO:');
    if (contacto) {
      console.log(`   empresaId: ${contacto.empresaId}`);
      console.log(`   Tipo: ${typeof contacto.empresaId}`);
      console.log(`   Es string: ${typeof contacto.empresaId === 'string'}`);
      console.log(`   Es ObjectId: ${contacto.empresaId instanceof mongoose.Types.ObjectId}`);
      console.log(`   Valor: "${contacto.empresaId}"\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ANÁLISIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (contacto && typeof contacto.empresaId === 'string') {
      console.log('⚠️  PROBLEMA DETECTADO:');
      console.log('   El contacto tiene empresaId como STRING');
      console.log('   El router busca chatbot con ese empresaId');
      console.log('   El chatbot tiene empresaId como ObjectId');
      console.log('   ❌ NO COINCIDEN - Por eso el router no encuentra el chatbot\n');
      
      console.log('💡 SOLUCIÓN:');
      console.log('   Opción 1: Convertir empresaId del contacto a ObjectId');
      console.log('   Opción 2: Modificar router para convertir string a ObjectId');
    } else {
      console.log('✅ Los tipos coinciden correctamente');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificar();
