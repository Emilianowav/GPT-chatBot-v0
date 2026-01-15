import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function actualizarMensajeInicial() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (!api) {
      console.log('❌ No se encontró API de Veo Veo');
      await mongoose.disconnect();
      return;
    }

    const workflows = api.workflows || [];
    const menuIndex = workflows.findIndex(w => w.nombre === 'Veo Veo - Menú Principal');

    if (menuIndex === -1) {
      console.log('❌ No se encontró workflow del Menú Principal');
      await mongoose.disconnect();
      return;
    }

    // Actualizar el mensaje inicial del workflow
    workflows[menuIndex].mensajeInicial = `Hola 👋
¡Bienvenido/a a Librería Veo Veo! 📚✏️
Estamos para ayudarte.`;

    // Actualizar la pregunta del paso 1
    if (workflows[menuIndex].steps && workflows[menuIndex].steps[0]) {
      workflows[menuIndex].steps[0].pregunta = `👉 Por favor, selecciona un ítem de consulta:

1️⃣ Libros escolares u otros títulos
2️⃣ Libros de Inglés
3️⃣ Soporte de ventas
4️⃣ Información del local
5️⃣ Promociones vigentes
6️⃣ Consultas personalizadas

Escribí el número`;
    }

    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { workflows: workflows } }
    );

    console.log('✅ Mensaje inicial del menú actualizado:');
    console.log('\n' + workflows[menuIndex].mensajeInicial);
    console.log('\n' + workflows[menuIndex].steps[0].pregunta);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

actualizarMensajeInicial();
