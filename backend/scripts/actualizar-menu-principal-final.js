import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function actualizarMenuPrincipal() {
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

    // Actualizar el mensaje del menú principal en la pregunta del paso 1 del workflow "Menú Principal"
    const workflows = api.workflows || [];
    const menuPrincipalIndex = workflows.findIndex(w => w.nombre === 'Veo Veo - Menú Principal');

    if (menuPrincipalIndex !== -1) {
      const menuWorkflow = workflows[menuPrincipalIndex];
      
      if (menuWorkflow.steps && menuWorkflow.steps[0]) {
        menuWorkflow.steps[0].pregunta = `👉 Por favor, elegí una opción:

1️⃣ Libros escolares u otros títulos
2️⃣ Libros de Inglés
3️⃣ Soporte de ventas
4️⃣ Información del local
5️⃣ Promociones vigentes
6️⃣ Consultas personalizadas

Escribí el número`;

        workflows[menuPrincipalIndex] = menuWorkflow;

        await db.collection('api_configurations').updateOne(
          { _id: api._id },
          { $set: { workflows: workflows } }
        );

        console.log('✅ Menú principal actualizado en el workflow');
        console.log('\n📋 Nuevo mensaje:');
        console.log(menuWorkflow.steps[0].pregunta);
      }
    }

    // También actualizar el campo menuPrincipal.mensaje si existe
    const menuActualizado = `Hola 👋
¡Bienvenido/a a Librería Veo Veo! 📚✏️
Estamos para ayudarte.

👉 Por favor, elegí una opción:

1️⃣ Libros escolares u otros títulos
2️⃣ Libros de Inglés
3️⃣ Soporte de ventas
4️⃣ Información del local
5️⃣ Promociones vigentes
6️⃣ Consultas personalizadas

Escribí el número`;

    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { 'menuPrincipal.mensaje': menuActualizado } }
    );

    console.log('\n✅ Campo menuPrincipal.mensaje también actualizado');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

actualizarMenuPrincipal();
