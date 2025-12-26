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
    console.log('📋 WORKFLOW:', workflow.nombre);
    console.log('   Total pasos:', workflow.steps.length);
    console.log('');

    // El workflow debe tener SOLO estos pasos:
    // 0. Elegir deporte (recopilar)
    // 1. Elegir fecha (recopilar)
    // 2. Duración (recopilar)
    // 3. Hora preferida (recopilar)
    // 4. Consultar disponibilidad (consulta_filtrada → API)
    // 5. Solicitar nombre (recopilar)
    // 6. Solicitar teléfono (recopilar)
    // 7. Confirmar reserva (recopilar con validación)
    // 8. Generar link de pago (consulta_filtrada → código intercepta y crea PaymentLink)

    // ELIMINAR pasos 9, 10, 11 (son redundantes, el código ya maneja el mensaje)
    console.log('🔧 SIMPLIFICANDO WORKFLOW:');
    console.log('   Pasos actuales:', workflow.steps.length);
    
    // Mantener solo los primeros 9 pasos
    workflow.steps = workflow.steps.slice(0, 9);
    
    console.log('   Pasos después de simplificar:', workflow.steps.length);
    console.log('');

    // Verificar que el paso 8 tenga el endpointId correcto
    if (workflow.steps[8]) {
      workflow.steps[8].endpointId = 'generar-link-pago';
      workflow.steps[8].tipo = 'consulta_filtrada';
      workflow.steps[8].nombreVariable = 'pago';
      console.log('✅ Paso 8 configurado correctamente');
    }

    console.log('\n📋 PASOS FINALES:');
    workflow.steps.forEach((step, i) => {
      console.log(`   ${i}. ${step.nombre} (${step.tipo})`);
      if (step.endpointId) {
        console.log(`      → Endpoint: ${step.endpointId}`);
      }
    });

    // Actualizar en BD
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { 
        $set: { 
          'workflows.0.steps': workflow.steps
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
