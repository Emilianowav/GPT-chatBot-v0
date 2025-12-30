import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function listarWorkflows() {
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

    console.log('📋 API:', api.nombre);
    console.log('   Workflows:', api.workflows?.length || 0);
    console.log('');

    if (api.workflows) {
      api.workflows.forEach((w, i) => {
        console.log(`${i + 1}. ${w.nombre} (${w.steps?.length || 0} pasos)`);
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listarWorkflows();
