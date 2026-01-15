import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verPasosVeoVeo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar API de Veo Veo
    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (!api) {
      console.log('❌ No se encontró API de Veo Veo');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 API:', api.nombre);
    console.log('   ID:', api._id);
    console.log('   Workflows:', api.workflows?.length || 0);
    console.log('');

    // Buscar workflow de consulta de libros
    const workflow = api.workflows?.find(w => w.nombre?.includes('Consultar Libros'));

    if (!workflow) {
      console.log('❌ No se encontró workflow de consulta de libros');
      await mongoose.disconnect();
      return;
    }

    console.log('🔧 WORKFLOW:', workflow.nombre);
    console.log('   ID:', workflow._id);
    console.log('   Steps:', workflow.steps?.length || 0);
    console.log('');

    // Mostrar todos los pasos
    if (workflow.steps) {
      console.log('📋 PASOS DEL WORKFLOW:\n');
      workflow.steps.forEach((step, index) => {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`PASO ${step.orden}: ${step.nombre || 'Sin nombre'}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log('   Tipo:', step.tipo);
        console.log('   Variable:', step.nombreVariable || 'NO');
        console.log('   Endpoint ID:', step.endpointId || 'NO');
        
        if (step.pregunta) {
          console.log('   Pregunta:', step.pregunta.substring(0, 150));
          if (step.pregunta.length > 150) console.log('              ...');
        }
        
        if (step.validacion) {
          console.log('   Validación:');
          console.log('      Tipo:', step.validacion.tipo);
          if (step.validacion.opciones) {
            console.log('      Opciones:', step.validacion.opciones);
          }
        }
        
        if (step.endpointResponseConfig) {
          console.log('   Response Config:');
          console.log('      arrayPath:', step.endpointResponseConfig.arrayPath);
          console.log('      idField:', step.endpointResponseConfig.idField);
          console.log('      displayField:', step.endpointResponseConfig.displayField);
          console.log('      priceField:', step.endpointResponseConfig.priceField || 'NO');
          console.log('      stockField:', step.endpointResponseConfig.stockField || 'NO');
        }
      });
    }

    await mongoose.disconnect();
    console.log('\n\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verPasosVeoVeo();
