import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verEndpointsJuventus() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;

    const apiJuventus = await db.collection('api_configurations').findOne({ 
      nombre: /mis canchas/i 
    });

    if (!apiJuventus) {
      console.error('❌ No se encontró API de Juventus');
      process.exit(1);
    }

    console.log('\n📋 API:', apiJuventus.nombre);
    console.log('📋 Endpoints:', apiJuventus.endpoints?.length || 0);

    if (apiJuventus.endpoints && apiJuventus.endpoints.length > 0) {
      console.log('\n📋 DETALLE DE ENDPOINTS:\n');
      apiJuventus.endpoints.forEach((ep, i) => {
        console.log(`${i + 1}. ${ep.nombre}`);
        console.log(`   ID: ${ep.id || ep._id || 'SIN ID'}`);
        console.log(`   Método: ${ep.metodo}`);
        console.log(`   Path: ${ep.path}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado');
  }
}

verEndpointsJuventus();
