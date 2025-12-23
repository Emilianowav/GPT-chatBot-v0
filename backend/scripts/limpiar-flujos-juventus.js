import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

const chatbotSchema = new mongoose.Schema({}, { strict: false });
const Chatbot = mongoose.model('Chatbot', chatbotSchema, 'chatbots');

async function limpiarFlujosJuventus() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar el chatbot de Juventus
    const chatbot = await Chatbot.findOne({ 
      nombre: /juventus/i 
    });

    if (!chatbot) {
      console.error('❌ No se encontró el chatbot de Juventus');
      process.exit(1);
    }

    console.log('📋 Chatbot encontrado:', chatbot.nombre);
    console.log('🔍 Flujos actuales:');
    
    if (chatbot.flujos && chatbot.flujos.length > 0) {
      chatbot.flujos.forEach((flujo, index) => {
        console.log(`   ${index + 1}. ${flujo.nombre} (Activo: ${flujo.activo}, Prioridad: ${flujo.prioridad || 'N/A'})`);
      });
    } else {
      console.log('   No hay flujos configurados');
    }

    // Filtrar flujos: mantener solo conversacional
    const flujosAMantener = chatbot.flujos.filter(flujo => 
      flujo.tipo === 'conversacional' || 
      flujo.nombre.toLowerCase().includes('conversacional')
    );

    console.log('\n🧹 Limpiando flujos antiguos...');
    console.log(`   Flujos antes: ${chatbot.flujos.length}`);
    console.log(`   Flujos a mantener: ${flujosAMantener.length}`);

    chatbot.flujos = flujosAMantener;
    chatbot.markModified('flujos');
    
    await chatbot.save();

    console.log('\n✅ Flujos limpiados exitosamente!');
    console.log('📋 Flujos restantes:');
    chatbot.flujos.forEach((flujo, index) => {
      console.log(`   ${index + 1}. ${flujo.nombre} (Tipo: ${flujo.tipo})`);
    });

    console.log('\n📝 RESUMEN:');
    console.log('   ✅ Flujos antiguos eliminados');
    console.log('   ✅ Flujo conversacional mantenido');
    console.log('   ✅ El workflow de pasos está en la API de Mis Canchas');
    console.log('\n🎯 CONFIGURACIÓN FINAL:');
    console.log('   1. Flujo Conversacional (prioridad baja) - Para consultas generales');
    console.log('   2. Workflow de Reservas (prioridad 25) - Para reservas con pasos');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

limpiarFlujosJuventus();
