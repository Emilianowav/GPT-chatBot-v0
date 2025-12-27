import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixEndpoint() {
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

    console.log('📋 CORRIGIENDO ENDPOINT PRE-CREAR-RESERVA\n');

    // Buscar el endpoint
    const endpointIndex = api.endpoints.findIndex(e => e.id === 'pre-crear-reserva');

    if (endpointIndex !== -1) {
      console.log('Antes:');
      console.log('  Path:', api.endpoints[endpointIndex].path);
      console.log('  Método:', api.endpoints[endpointIndex].metodo);

      // Actualizar el path correcto
      api.endpoints[endpointIndex].path = '/reservas/pre-crear';
      api.endpoints[endpointIndex].metodo = 'POST';
      api.endpoints[endpointIndex].parametros = {
        path: [],
        query: [],
        body: {
          tipo: 'json',
          schema: {
            cancha_id: { tipo: 'string', requerido: true },
            fecha: { tipo: 'string', requerido: true },
            hora_inicio: { tipo: 'string', requerido: true },
            duracion: { tipo: 'number', requerido: true },
            cliente: {
              tipo: 'object',
              requerido: true,
              propiedades: {
                nombre: { tipo: 'string', requerido: true },
                telefono: { tipo: 'string', requerido: true },
                email: { tipo: 'string', requerido: false }
              }
            }
          }
        }
      };

      console.log('\nDespués:');
      console.log('  Path:', api.endpoints[endpointIndex].path);
      console.log('  Método:', api.endpoints[endpointIndex].metodo);
      console.log('  ✅ Endpoint corregido');
    } else {
      console.log('❌ Endpoint pre-crear-reserva no encontrado');
    }

    // Guardar
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { endpoints: api.endpoints } }
    );

    console.log('\n✅ Endpoint actualizado en BD');

    await mongoose.disconnect();
    console.log('✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixEndpoint();
