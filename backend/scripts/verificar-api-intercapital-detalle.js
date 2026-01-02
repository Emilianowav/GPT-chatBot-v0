import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verificar() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const apiConfig = await db.collection('api_configurations').findOne({ 
      nombre: /intercapital/i 
    }, { sort: { createdAt: -1 } });

    if (!apiConfig) {
      console.log('❌ API Configuration NO encontrada');
      await mongoose.disconnect();
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 DETALLE API INTERCAPITAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 INFORMACIÓN GENERAL:');
    console.log(`   - ID: ${apiConfig._id}`);
    console.log(`   - Nombre: ${apiConfig.nombre}`);
    console.log(`   - Base URL: ${apiConfig.baseUrl}`);
    console.log(`   - Tipo: ${apiConfig.tipo}`);
    console.log(`   - Estado: ${apiConfig.estado}`);
    console.log(`   - Activa: ${apiConfig.activa}`);
    console.log(`   - Empresa ID: ${apiConfig.empresaId}`);
    console.log(`   - Created: ${apiConfig.createdAt}`);

    console.log('\n🔐 AUTENTICACIÓN:');
    console.log(`   - Tipo: ${apiConfig.autenticacion?.tipo}`);
    console.log(`   - API Key: ${apiConfig.autenticacion?.configuracion?.apiKey?.substring(0, 20)}...`);
    console.log(`   - Header Name: ${apiConfig.autenticacion?.configuracion?.headerName}`);
    console.log(`   - API Key Location: ${apiConfig.autenticacion?.configuracion?.apiKeyLocation}`);
    console.log(`   - API Key Name: ${apiConfig.autenticacion?.configuracion?.apiKeyName}`);

    console.log('\n📡 ENDPOINTS:');
    apiConfig.endpoints?.forEach((ep, i) => {
      console.log(`\n   ${i + 1}. ${ep.id}`);
      console.log(`      - Nombre: ${ep.nombre}`);
      console.log(`      - Método: ${ep.method || ep.metodo}`);
      console.log(`      - Path: ${ep.path || ep.url}`);
      console.log(`      - Activo: ${ep.activo !== false}`);
    });

    console.log('\n📋 WORKFLOWS:');
    apiConfig.workflows?.forEach((wf, i) => {
      console.log(`\n   ${i + 1}. ${wf.nombre}`);
      console.log(`      - ID: ${wf.id || 'NO TIENE ID ❌'}`);
      console.log(`      - Activo: ${wf.activo}`);
      console.log(`      - Trigger: ${wf.trigger?.tipo}`);
      console.log(`      - Pasos: ${wf.steps?.length || 0}`);
      if (wf.trigger?.keywords) {
        console.log(`      - Keywords: ${wf.trigger.keywords.join(', ')}`);
      }
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ VERIFICACIÓN COMPLETADA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verificar si hay errores de validación
    console.log('🔍 VALIDACIÓN:');
    const errores = [];
    
    if (apiConfig.autenticacion?.tipo !== 'api_key' && 
        apiConfig.autenticacion?.tipo !== 'bearer' && 
        apiConfig.autenticacion?.tipo !== 'basic' &&
        apiConfig.autenticacion?.tipo !== 'oauth2' &&
        apiConfig.autenticacion?.tipo !== 'custom' &&
        apiConfig.autenticacion?.tipo !== 'none') {
      errores.push(`❌ Tipo de autenticación inválido: "${apiConfig.autenticacion?.tipo}"`);
      errores.push(`   Debe ser: api_key, bearer, basic, oauth2, custom, o none`);
    }

    apiConfig.workflows?.forEach((wf, i) => {
      if (!wf.id) {
        errores.push(`❌ Workflow ${i + 1} (${wf.nombre}) no tiene campo 'id'`);
      }
    });

    if (errores.length > 0) {
      console.log('\n⚠️  ERRORES ENCONTRADOS:');
      errores.forEach(err => console.log(`   ${err}`));
    } else {
      console.log('   ✅ Sin errores de validación');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificar();
