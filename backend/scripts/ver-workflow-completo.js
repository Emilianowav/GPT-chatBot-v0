import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verWorkflowCompleto() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar API de Juventus
    const api = await db.collection('api_configurations').findOne({
      nombre: /mis canchas/i
    });

    if (!api) {
      console.log('❌ No se encontró API');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 API:', api.nombre);
    console.log('   ID:', api._id);
    console.log('   Workflows:', api.workflows?.length || 0);
    console.log('');

    if (api.workflows && api.workflows.length > 0) {
      const workflow = api.workflows[0];
      
      console.log('🔧 WORKFLOW:', workflow.nombre);
      console.log('   ID:', workflow._id);
      console.log('   Steps:', workflow.steps?.length || 0);
      console.log('   Pasos:', workflow.pasos?.length || 0);
      console.log('');

      // Mostrar todos los steps
      if (workflow.steps) {
        console.log('📋 STEPS DEL WORKFLOW:\n');
        workflow.steps.forEach((step, index) => {
          console.log(`PASO ${index}:`);
          console.log('   Nombre:', step.nombre);
          console.log('   Tipo:', step.tipo);
          console.log('   Variable:', step.nombreVariable || 'NO');
          console.log('   Endpoint ID:', step.endpointId || 'NO');
          console.log('   Pregunta:', step.pregunta?.substring(0, 100) || 'NO');
          console.log('');
        });
      }

      // Verificar paso 4 específicamente
      if (workflow.steps && workflow.steps[4]) {
        const paso4 = workflow.steps[4];
        console.log('\n🔍 PASO 4 EN DETALLE:');
        console.log('   Nombre:', paso4.nombre);
        console.log('   Tipo:', paso4.tipo);
        console.log('   Variable:', paso4.nombreVariable);
        console.log('   Endpoint ID:', paso4.endpointId || 'NO TIENE');
        console.log('   Parametros:', JSON.stringify(paso4.parametros, null, 2));
        console.log('');

        if (paso4.endpointId) {
          // Verificar si el endpoint existe
          const endpoint = api.endpoints?.find(e => e._id?.toString() === paso4.endpointId || e.id === paso4.endpointId);
          if (endpoint) {
            console.log('   ✅ Endpoint EXISTE:');
            console.log('      Nombre:', endpoint.nombre);
            console.log('      Método:', endpoint.metodo);
            console.log('      Path:', endpoint.path);
          } else {
            console.log('   ❌ Endpoint NO EXISTE');
            console.log('   Endpoints disponibles:');
            api.endpoints?.forEach(ep => {
              console.log(`      - ${ep.id || ep._id}: ${ep.nombre}`);
            });
          }
        }
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verWorkflowCompleto();
