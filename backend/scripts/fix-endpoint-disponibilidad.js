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

    console.log('📋 API ENCONTRADA:', api.nombre);
    console.log('');

    // Buscar el endpoint de disponibilidad
    const endpointIndex = api.endpoints.findIndex(e => e.id === 'consultar-disponibilidad');
    
    if (endpointIndex === -1) {
      console.log('❌ No se encontró endpoint consultar-disponibilidad');
      await mongoose.disconnect();
      return;
    }

    const endpoint = api.endpoints[endpointIndex];

    console.log('📋 ENDPOINT ACTUAL:');
    console.log('   ID:', endpoint.id);
    console.log('   Nombre:', endpoint.nombre);
    console.log('   Método:', endpoint.metodo);
    console.log('   Path:', endpoint.path);
    console.log('   Parámetros:', JSON.stringify(endpoint.parametros, null, 2));
    console.log('');

    console.log('🔧 CORRIGIENDO ENDPOINT...\n');

    // Actualizar el endpoint
    api.endpoints[endpointIndex] = {
      ...endpoint,
      path: '/courts/{courtId}/availability',
      metodo: 'GET',
      parametros: {
        path: [
          {
            nombre: 'courtId',
            tipo: 'string',
            requerido: true,
            descripcion: 'ID de la cancha'
          }
        ],
        query: [
          {
            nombre: 'date',
            tipo: 'string',
            requerido: true,
            descripcion: 'Fecha en formato YYYY-MM-DD'
          }
        ]
      }
    };

    console.log('📋 ENDPOINT CORREGIDO:');
    console.log('   Path:', api.endpoints[endpointIndex].path);
    console.log('   Método:', api.endpoints[endpointIndex].metodo);
    console.log('   Parámetros:', JSON.stringify(api.endpoints[endpointIndex].parametros, null, 2));
    console.log('');

    // Guardar en BD
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { endpoints: api.endpoints } }
    );

    console.log('✅ Endpoint actualizado en BD');
    console.log('');

    console.log('💡 NOTA IMPORTANTE:');
    console.log('   El endpoint ahora requiere:');
    console.log('   1. courtId en el path (ID de la cancha)');
    console.log('   2. date en query (fecha en formato YYYY-MM-DD)');
    console.log('');
    console.log('   El workflow debe:');
    console.log('   1. Primero obtener la lista de canchas del deporte');
    console.log('   2. Luego consultar disponibilidad de cada cancha');
    console.log('   3. Matchear horarios con hora_preferida y duración');

    await mongoose.disconnect();
    console.log('✅ Corrección completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixEndpoint();
