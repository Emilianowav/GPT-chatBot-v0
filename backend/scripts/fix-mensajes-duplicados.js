import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixMensajes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /mis canchas/i
    });

    if (!api || !api.workflows || api.workflows.length === 0) {
      console.log('❌ No se encontró workflow');
      await mongoose.disconnect();
      return;
    }

    const workflow = api.workflows[0];

    console.log('📋 CORRIGIENDO MENSAJES DUPLICADOS\n');

    // Mensaje de bienvenida va en workflow.mensajeInicial
    workflow.mensajeInicial = `¡Hola!
Bienvenido a *Club Juventus*

Te ayudo a reservar tu cancha.`;

    // Paso 0: Solo la pregunta del deporte
    workflow.steps[0].pregunta = `🎾 ¿Qué deporte querés jugar?

1️⃣ Paddle
2️⃣ Fútbol

Escribí el número`;

    console.log('✅ Mensaje de bienvenida:', workflow.mensajeInicial);
    console.log('✅ Paso 0 pregunta:', workflow.steps[0].pregunta);

    // Guardar
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { workflows: api.workflows } }
    );

    console.log('\n✅ Mensajes corregidos en BD');

    await mongoose.disconnect();
    console.log('✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixMensajes();
