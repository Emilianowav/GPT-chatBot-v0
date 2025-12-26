import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verPaso4Real() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /mis canchas/i
    });

    if (!api || !api.workflows || api.workflows.length === 0) {
      console.log('❌ No se encontró workflow');
      await mongoose.disconnect();
      return;
    }

    const workflow = api.workflows[0];
    const paso4 = workflow.steps[4];

    console.log('📋 PASO 4 - CONFIGURACIÓN COMPLETA:\n');
    console.log(JSON.stringify(paso4, null, 2));

    console.log('\n\n🔍 ANÁLISIS:');
    console.log('   Nombre:', paso4.nombre);
    console.log('   Tipo:', paso4.tipo);
    console.log('   Endpoint ID:', paso4.endpointId);
    console.log('   Tiene mapeoParametros:', paso4.mapeoParametros ? 'SÍ' : 'NO');
    console.log('   Tiene parametros:', paso4.parametros ? 'SÍ' : 'NO');
    
    if (paso4.parametros) {
      console.log('\n   📦 PARAMETROS:');
      for (const [key, value] of Object.entries(paso4.parametros)) {
        console.log(`      ${key}: "${value}"`);
      }
    }

    if (paso4.mapeoParametros) {
      console.log('\n   📦 MAPEO_PARAMETROS:');
      for (const [key, value] of Object.entries(paso4.mapeoParametros)) {
        console.log(`      ${key}: "${value}"`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verPaso4Real();
