import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixMethodField() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (!api) {
      console.log('❌ No se encontró API');
      await mongoose.disconnect();
      return;
    }

    console.log('📡 API:', api.nombre);
    console.log('');

    // Actualizar cada endpoint: copiar method a metodo
    const updates = api.endpoints.map((ep, i) => ({
      [`endpoints.${i}.metodo`]: ep.method
    }));

    const updateObj = {};
    updates.forEach(update => {
      Object.assign(updateObj, update);
    });

    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: updateObj }
    );

    console.log('✅ Campos actualizados:');
    api.endpoints.forEach((ep, i) => {
      console.log(`   ${i + 1}. ${ep.nombre}: method=${ep.method} → metodo=${ep.method}`);
    });

    // Verificar
    const apiActualizada = await db.collection('api_configurations').findOne({
      _id: api._id
    });

    console.log('\n📋 Verificación:');
    apiActualizada.endpoints.forEach((ep, i) => {
      console.log(`   ${i + 1}. ${ep.nombre}: metodo=${ep.metodo || 'FALTA'}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixMethodField();
