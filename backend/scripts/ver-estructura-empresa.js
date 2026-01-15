import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verEstructura() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Ver estructura de Veo Veo
    const veoVeo = await db.collection('empresas').findOne({
      nombre: /veo veo/i
    });

    console.log('📋 Estructura de Veo Veo:');
    console.log(JSON.stringify(veoVeo, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verEstructura();
