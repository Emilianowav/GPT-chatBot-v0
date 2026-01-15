import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function getCredentials() {
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

    console.log('🔑 CREDENCIALES DE WOOCOMMERCE:');
    console.log('━'.repeat(60));
    
    if (api.autenticacion.configuracion.plainText) {
      console.log('Username:', api.autenticacion.configuracion.username);
      console.log('Password:', api.autenticacion.configuracion.password);
    } else {
      console.log('Las credenciales están encriptadas');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

getCredentials();
