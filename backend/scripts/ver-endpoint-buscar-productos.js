import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verEndpoint() {
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

    const endpoint = api.endpoints.find(e => e.id === 'buscar-productos');

    if (!endpoint) {
      console.log('❌ No se encontró endpoint buscar-productos');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 ENDPOINT: buscar-productos');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('ID:', endpoint.id);
    console.log('Nombre:', endpoint.nombre);
    console.log('Método:', endpoint.metodo);
    console.log('Ruta:', endpoint.ruta);
    console.log('\n📦 PARÁMETROS:');
    console.log(JSON.stringify(endpoint.parametros, null, 2));
    console.log('\n🔧 HEADERS:');
    console.log(JSON.stringify(endpoint.headers, null, 2));

    await mongoose.disconnect();
    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verEndpoint();
