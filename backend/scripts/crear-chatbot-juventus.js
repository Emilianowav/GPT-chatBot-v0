import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function crearChatbotJuventus() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;

    // 1. Obtener empresa Juventus
    const empresa = await db.collection('empresas').findOne({ nombre: /juventus/i });
    if (!empresa) {
      console.error('❌ No se encontró la empresa Juventus');
      process.exit(1);
    }

    console.log('📋 Empresa:', empresa.nombre);
    console.log('🆔 ID:', empresa._id);

    // 2. Crear chatbot para Juventus
    const chatbot = {
      nombre: 'Bot Club Juventus',
      empresaId: empresa._id.toString(),
      tipo: 'conversacional',
      activo: true,
      configuracion: {
        modelo: 'gpt-4o-mini',
        temperatura: 0.7,
        maxTokens: 1000,
        systemPrompt: `Eres el asistente virtual de Club Juventus, un club deportivo con canchas de pádel, fútbol y tenis.

Tu rol es:
- Ayudar a los clientes a reservar canchas
- Informar sobre disponibilidad, precios y horarios
- Responder consultas sobre el club

Información del club:
- Horario: 8:00 a 23:00
- Deportes: Pádel, Fútbol 5, Tenis
- Ubicación: Corrientes, Argentina

Cuando el usuario quiera reservar, guíalo paso a paso preguntando:
1. Qué deporte quiere jugar
2. Para qué fecha
3. A qué hora
4. Duración (1h, 1.5h o 2h)

Sé amable, conciso y usa emojis para hacer la conversación más amigable.`
      },
      flujos: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const resultado = await db.collection('chatbots').insertOne(chatbot);
    console.log('\n✅ Chatbot creado:', resultado.insertedId);

    // 3. Actualizar empresa con chatbotId
    await db.collection('empresas').updateOne(
      { _id: empresa._id },
      { $set: { chatbotId: resultado.insertedId } }
    );
    console.log('✅ Empresa actualizada con chatbotId');

    // 4. Actualizar API de Mis Canchas con chatbotId correcto
    await db.collection('api_configurations').updateOne(
      { nombre: /mis canchas/i },
      { 
        $set: { 
          'chatbotIntegration.chatbotId': resultado.insertedId.toString(),
          'chatbotIntegration.habilitado': true
        } 
      }
    );
    console.log('✅ API Mis Canchas actualizada con chatbotId');

    console.log('\n📝 RESUMEN:');
    console.log('   ✅ Chatbot creado para Club Juventus');
    console.log('   ✅ Tipo: conversacional');
    console.log('   ✅ Empresa vinculada');
    console.log('   ✅ API Mis Canchas vinculada');
    console.log('\n🚀 Redesplegá en Render para probar');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

crearChatbotJuventus();
