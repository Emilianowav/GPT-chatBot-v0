import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixPerPage() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (!api) {
      console.log('❌ No se encontró API de Veo Veo');
      await mongoose.disconnect();
      return;
    }

    const endpointIndex = api.endpoints.findIndex(e => e.id === 'buscar-productos');

    if (endpointIndex === -1) {
      console.log('❌ No se encontró endpoint buscar-productos');
      await mongoose.disconnect();
      return;
    }

    console.log('📝 ANTES:');
    console.log('   per_page:', api.endpoints[endpointIndex].parametros.per_page);
    console.log('');

    // Actualizar per_page a 100 (máximo de WooCommerce)
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      {
        $set: {
          [`endpoints.${endpointIndex}.parametros.per_page`]: 100
        }
      }
    );

    console.log('✅ Endpoint actualizado');
    console.log('');
    console.log('📝 DESPUÉS:');
    console.log('   per_page: 100');

    await mongoose.disconnect();
    console.log('\n✅ Corrección completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPerPage();
