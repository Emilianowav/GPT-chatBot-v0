import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixPaso5() {
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

    console.log('📋 CORRIGIENDO PASO 5\n');

    // Paso 5: Quitar "¡Perfecto! Encontré disponibilidad" porque ya lo muestra el código
    workflow.steps[5].pregunta = `¿A nombre de quién hacemos la reserva?`;

    console.log('✅ Paso 5 corregido:', workflow.steps[5].pregunta);

    // Guardar
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { workflows: api.workflows } }
    );

    console.log('\n✅ Paso 5 actualizado en BD');

    await mongoose.disconnect();
    console.log('✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPaso5();
