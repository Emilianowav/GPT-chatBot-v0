import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verWorkflow() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (!api || !api.workflows || api.workflows.length === 0) {
      console.log('❌ No se encontró workflow');
      await mongoose.disconnect();
      return;
    }

    const workflow = api.workflows[0];

    console.log('📋 Workflow completo de Veo Veo:\n');
    console.log(JSON.stringify(workflow, null, 2));

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verWorkflow();
