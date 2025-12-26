import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixWorkflow() {
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
    const paso4 = workflow.steps[4];
    
    console.log('📋 PASO 4 - ANTES:');
    console.log('   mapeoParametros:', paso4.mapeoParametros);
    console.log('');

    // Cambiar mapeo para que SOLO envíe fecha y deporte
    // El matching de hora y duración se hará en el código
    paso4.mapeoParametros = {
      fecha: '{{fecha}}',
      deporte: '{{deporte}}'
    };

    console.log('📋 PASO 4 - DESPUÉS:');
    console.log('   mapeoParametros:', paso4.mapeoParametros);
    console.log('');
    console.log('✅ Ahora la API traerá TODAS las canchas del día');
    console.log('✅ El código hará el matching de hora y duración');

    // Actualizar en BD
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { 
        $set: { 
          'workflows.0.steps.4.mapeoParametros': paso4.mapeoParametros
        } 
      }
    );

    console.log('\n✅ Workflow actualizado en BD');

    await mongoose.disconnect();
    console.log('✅ Corrección completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWorkflow();
