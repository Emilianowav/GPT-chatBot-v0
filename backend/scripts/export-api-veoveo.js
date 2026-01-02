import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function exportAPI() {
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

    // Guardar en archivo
    fs.writeFileSync(
      'api-veoveo-structure.json',
      JSON.stringify(api, null, 2)
    );

    console.log('✅ Estructura exportada a: api-veoveo-structure.json');
    console.log('\n📋 Resumen:');
    console.log(`   - Nombre: ${api.nombre}`);
    console.log(`   - Endpoints: ${api.endpoints?.length || 0}`);
    console.log(`   - Workflows: ${api.workflows?.length || 0}`);
    console.log(`   - Variables: ${Object.keys(api.variables || {}).length}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

exportAPI();
