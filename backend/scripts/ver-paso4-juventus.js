import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verPaso4() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar workflow de Juventus
    const workflow = await db.collection('workflows').findOne({
      nombre: /juventus/i
    });

    if (!workflow) {
      console.log('❌ No se encontró workflow');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 WORKFLOW:', workflow.nombre);
    console.log('   ID:', workflow._id);
    console.log('   API ID:', workflow.apiId);
    console.log('   Total pasos:', workflow.pasos.length);
    console.log('');

    // Mostrar PASO 4
    const paso4 = workflow.pasos[4];
    console.log('📍 PASO 4:');
    console.log('   Nombre:', paso4.nombre);
    console.log('   Tipo:', paso4.tipo);
    console.log('   Endpoint ID:', paso4.endpointId || 'NO TIENE');
    console.log('   Variable:', paso4.variable || 'NO');
    console.log('   Mensaje:', paso4.mensaje?.substring(0, 150));
    console.log('');

    if (paso4.mapeoParametros) {
      console.log('   Mapeo de parámetros:', JSON.stringify(paso4.mapeoParametros, null, 2));
    }

    // Buscar API config
    const apiConfig = await db.collection('apiconfigs').findOne({
      _id: new mongoose.Types.ObjectId(workflow.apiId)
    });

    console.log('\n🔧 API CONFIG:', apiConfig.nombre);
    console.log('   Base URL:', apiConfig.baseUrl);
    console.log('');

    console.log('📋 ENDPOINTS DISPONIBLES:');
    apiConfig.endpoints?.forEach((endpoint, index) => {
      console.log(`   ${index + 1}. ID: "${endpoint.id}"`);
      console.log(`      Nombre: ${endpoint.nombre}`);
      console.log(`      ${endpoint.metodo} ${endpoint.path}`);
    });

    // Verificar si el endpoint del paso 4 existe
    if (paso4.endpointId) {
      console.log(`\n🔍 VERIFICANDO ENDPOINT DEL PASO 4:`);
      console.log('   Endpoint ID configurado:', paso4.endpointId);
      
      const endpointExiste = apiConfig.endpoints?.find(e => e.id === paso4.endpointId);
      if (endpointExiste) {
        console.log('   ✅ Endpoint EXISTE');
        console.log('   Nombre:', endpointExiste.nombre);
        console.log('   Path:', endpointExiste.path);
        console.log('   Método:', endpointExiste.metodo);
      } else {
        console.log('   ❌ Endpoint NO EXISTE en API Config');
      }
    } else {
      console.log('\n⚠️  PASO 4 NO TIENE ENDPOINT CONFIGURADO');
    }

    await mongoose.disconnect();
    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verPaso4();
