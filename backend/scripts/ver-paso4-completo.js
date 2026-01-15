import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verPaso4Completo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    const workflow = api.workflows.find(w => w.id === 'veo-veo-consultar-libros');
    const paso4 = workflow.steps.find(s => s.orden === 4);

    console.log('📋 Paso 4 completo:');
    console.log(JSON.stringify(paso4, null, 2));

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verPaso4Completo();
