import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function agregarEndpoint() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    console.log('📋 Endpoints actuales:');
    api.endpoints.forEach(ep => {
      console.log(`   - ${ep.id}: ${ep.nombre}`);
    });

    // Nuevo endpoint de búsqueda con filtros
    const nuevoEndpoint = {
      id: 'buscar-productos',
      nombre: 'Buscar Productos',
      metodo: 'GET',
      path: '/products',
      parametros: {
        per_page: 10,
        status: 'publish',
        path: [],
        query: [
          {
            nombre: 'search',
            tipo: 'string',
            requerido: false,
            descripcion: 'Búsqueda por título'
          },
          {
            nombre: 'per_page',
            tipo: 'number',
            requerido: false,
            descripcion: 'Cantidad de resultados'
          },
          {
            nombre: 'status',
            tipo: 'string',
            requerido: false,
            descripcion: 'Estado del producto'
          }
        ]
      }
    };

    // Agregar endpoint
    const result = await db.collection('api_configurations').updateOne(
      { _id: api._id },
      {
        $push: {
          endpoints: nuevoEndpoint
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    console.log('\n✅ Endpoint agregado:');
    console.log('   ID:', nuevoEndpoint.id);
    console.log('   Nombre:', nuevoEndpoint.nombre);
    console.log('   Método:', nuevoEndpoint.metodo);
    console.log('   Path:', nuevoEndpoint.path);
    console.log('   Parámetros de búsqueda:');
    console.log('   - search (título)');
    console.log('   - per_page (cantidad)');
    console.log('   - status (estado)');
    console.log('');
    console.log('   Documentos actualizados:', result.modifiedCount);

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

agregarEndpoint();
