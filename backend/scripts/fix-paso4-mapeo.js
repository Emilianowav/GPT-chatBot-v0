import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixPaso4() {
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
    
    console.log('📋 PASO 4 ACTUAL:');
    console.log('   Nombre:', workflow.steps[4].nombre);
    console.log('   Endpoint:', workflow.steps[4].endpointId);
    console.log('   Mapeo actual:', workflow.steps[4].parametros || workflow.steps[4].mapeoParametros || 'NO TIENE');
    console.log('');

    // Configurar mapeo de parámetros para el paso 4
    workflow.steps[4].parametros = {
      fecha: '{{fecha}}',
      deporte: '{{deporte}}',
      hora: '{{hora_preferida}}',
      duracion: '{{duracion}}'
    };

    console.log('✅ Mapeo configurado:');
    console.log('   fecha: {{fecha}}');
    console.log('   deporte: {{deporte}}');
    console.log('   hora: {{hora_preferida}}');
    console.log('   duracion: {{duracion}}');
    console.log('');

    // Actualizar en BD
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { 
        $set: { 
          'workflows.0.steps.4.parametros': workflow.steps[4].parametros
        } 
      }
    );

    console.log('✅ Workflow actualizado en BD');

    // Verificar
    const verificar = await db.collection('api_configurations').findOne({ 
      _id: api._id 
    });

    console.log('\n📋 VERIFICACIÓN:');
    console.log('   Paso 4 parametros:', JSON.stringify(verificar.workflows[0].steps[4].parametros, null, 2));

    await mongoose.disconnect();
    console.log('\n✅ Corrección completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPaso4();
