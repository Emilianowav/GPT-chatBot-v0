import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixPaso2() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    console.log('📋 Paso 2 actual:');
    console.log('   Tipo:', api.workflows[0].steps[1].tipo);
    console.log('   Validación:', api.workflows[0].steps[1].validacion || 'NO TIENE');

    // Agregar validación al paso 2
    const update = {
      $set: {
        'workflows.0.steps.1.validacion': {
          tipo: 'numero',
          min: 1,
          max: 10,
          mensaje: 'Por favor escribí un número entre 1 y 10'
        },
        updatedAt: new Date()
      }
    };

    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      update
    );

    console.log('\n✅ Validación agregada al paso 2:');
    console.log('   Tipo: numero');
    console.log('   Min: 1');
    console.log('   Max: 10');

    // Verificar
    const apiActualizada = await db.collection('api_configurations').findOne({
      _id: api._id
    });

    console.log('\n📋 Paso 2 actualizado:');
    console.log(JSON.stringify(apiActualizada.workflows[0].steps[1].validacion, null, 2));

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPaso2();
