import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verWorkflow() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (!api || !api.workflows || api.workflows.length === 0) {
      console.log('❌ No se encontró workflow');
      await mongoose.disconnect();
      return;
    }

    const workflow = api.workflows[0];

    console.log('📋 Workflow:', workflow.nombre);
    console.log('   ID:', workflow.id);
    console.log('   Activo:', workflow.activo);
    console.log('');

    console.log('📝 Pasos del workflow:');
    workflow.steps.forEach((step, i) => {
      console.log(`\n${i + 1}. ${step.nombre} (orden: ${step.orden})`);
      console.log(`   Tipo: ${step.tipo}`);
      console.log(`   Variable: ${step.nombreVariable || 'N/A'}`);
      console.log(`   Endpoint: ${step.endpointId || 'N/A'}`);
      if (step.pregunta) {
        console.log(`   Pregunta: ${step.pregunta.substring(0, 80)}...`);
      }
      if (step.validacion) {
        console.log(`   Validación: ${step.validacion.tipo}`);
      }
    });

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verWorkflow();
