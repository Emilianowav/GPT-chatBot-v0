import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verMensajes() {
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

    console.log('📋 MENSAJES ACTUALES DEL WORKFLOW\n');
    console.log('='.repeat(80));
    console.log('\n🎬 MENSAJE INICIAL:');
    console.log('---');
    console.log(workflow.mensajeInicial || '(vacío)');
    console.log('---\n');

    workflow.steps.forEach((step, index) => {
      console.log('='.repeat(80));
      console.log(`\nPASO ${step.orden}: ${step.nombre}`);
      console.log(`Tipo: ${step.tipo}`);
      console.log('\n📝 PREGUNTA:');
      console.log('---');
      console.log(step.pregunta || '(vacío)');
      console.log('---');
      
      if (step.validacion) {
        console.log(`\n🔍 Validación: ${step.validacion.tipo}`);
        if (step.validacion.opciones) {
          console.log(`Opciones: ${step.validacion.opciones.join(', ')}`);
        }
      }
      console.log('');
    });

    console.log('='.repeat(80));

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verMensajes();
