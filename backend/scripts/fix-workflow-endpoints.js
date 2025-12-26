import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixWorkflowEndpoints() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar API de Juventus
    const api = await db.collection('api_configurations').findOne({
      nombre: /mis canchas/i
    });

    if (!api || !api.workflows || api.workflows.length === 0) {
      console.log('❌ No se encontró workflow');
      await mongoose.disconnect();
      return;
    }

    const workflow = api.workflows[0];
    console.log('📋 WORKFLOW:', workflow.nombre);
    console.log('   Total steps:', workflow.steps.length);
    console.log('');

    // Asignar endpoints a los pasos que los necesitan
    const updates = [];

    // PASO 4: Consultar disponibilidad
    if (workflow.steps[4]) {
      workflow.steps[4].endpointId = 'consultar-disponibilidad';
      updates.push('Paso 4: consultar-disponibilidad');
    }

    // PASO 8: Pre-crear reserva
    if (workflow.steps[8]) {
      workflow.steps[8].endpointId = 'pre-crear-reserva';
      updates.push('Paso 8: pre-crear-reserva');
    }

    // PASO 9: Generar link de pago (este es especial, usa generar-link-pago)
    if (workflow.steps[9]) {
      workflow.steps[9].endpointId = 'generar-link-pago';
      updates.push('Paso 9: generar-link-pago');
    }

    console.log('🔧 ACTUALIZACIONES A REALIZAR:');
    updates.forEach(u => console.log('   -', u));
    console.log('');

    // Actualizar en BD
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { 
        $set: { 
          'workflows.0.steps': workflow.steps
        } 
      }
    );

    console.log('✅ Workflow actualizado en BD');

    // Verificar
    const verificar = await db.collection('api_configurations').findOne({ 
      _id: api._id 
    });

    console.log('\n📋 VERIFICACIÓN:');
    console.log('   Paso 4 endpoint:', verificar.workflows[0].steps[4].endpointId);
    console.log('   Paso 8 endpoint:', verificar.workflows[0].steps[8].endpointId);
    console.log('   Paso 9 endpoint:', verificar.workflows[0].steps[9].endpointId);

    await mongoose.disconnect();
    console.log('\n✅ Corrección completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWorkflowEndpoints();
