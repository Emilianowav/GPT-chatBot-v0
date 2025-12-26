import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verificarEndpoint() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

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
    console.log('');

    // Buscar endpoint de disponibilidad
    const endpoint = api.endpoints.find(e => e.nombre.toLowerCase().includes('disponibilidad'));
    
    if (endpoint) {
      console.log('✅ Endpoint encontrado:');
      console.log('   Nombre:', endpoint.nombre);
      console.log('   ID:', endpoint._id);
      console.log('   Tipo de ID:', typeof endpoint._id);
      console.log('   ID como string:', endpoint._id.toString());
    } else {
      console.log('❌ Endpoint de disponibilidad NO encontrado');
    }

    console.log('');

    // Ver paso 4 del workflow
    const workflow = api.workflows[0];
    const paso4 = workflow.steps[4];

    console.log('📋 Paso 4 del workflow:');
    console.log('   Nombre:', paso4.nombre);
    console.log('   endpointId:', paso4.endpointId);
    console.log('   Tipo de endpointId:', typeof paso4.endpointId);
    console.log('');

    // Comparar
    if (endpoint) {
      const endpointIdString = endpoint._id.toString();
      const paso4EndpointId = paso4.endpointId;

      console.log('🔍 COMPARACIÓN:');
      console.log('   Endpoint real ID:', endpointIdString);
      console.log('   Paso 4 endpointId:', paso4EndpointId);
      console.log('   ¿Son iguales?:', endpointIdString === paso4EndpointId);
      console.log('');

      if (endpointIdString !== paso4EndpointId) {
        console.log('❌ NO COINCIDEN - Corrigiendo...');
        
        // Actualizar
        await db.collection('api_configurations').updateOne(
          { _id: api._id },
          { 
            $set: { 
              'workflows.0.steps.4.endpointId': endpointIdString
            } 
          }
        );

        console.log('✅ Paso 4 actualizado con endpointId correcto');
      } else {
        console.log('✅ endpointId es correcto');
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarEndpoint();
