import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verWorkflow() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar workflow de Juventus
    const workflow = await db.collection('workflows').findOne({
      nombre: /juventus/i
    });

    if (!workflow) {
      console.log('❌ No se encontró workflow de Juventus');
      return;
    }

    console.log('📋 WORKFLOW:', workflow.nombre);
    console.log('   ID:', workflow._id);
    console.log('   Total pasos:', workflow.pasos.length);
    console.log('');

    // Mostrar todos los pasos
    workflow.pasos.forEach((paso, index) => {
      console.log(`\n📍 PASO ${index}:`);
      console.log('   Nombre:', paso.nombre);
      console.log('   Tipo:', paso.tipo);
      console.log('   Endpoint ID:', paso.endpointId || 'NO');
      console.log('   Variable:', paso.variable || 'NO');
      console.log('   Mensaje:', paso.mensaje?.substring(0, 100) || 'NO');
      
      if (paso.endpointId) {
        console.log('   🔗 TIENE ENDPOINT:', paso.endpointId);
      }
      
      if (paso.mapeoParametros) {
        console.log('   📋 Mapeo de parámetros:', paso.mapeoParametros);
      }
    });

    // Buscar API config
    console.log('\n\n🔧 API CONFIG:');
    const apiConfig = await db.collection('apiconfigs').findOne({
      _id: new mongoose.Types.ObjectId(workflow.apiId)
    });

    if (apiConfig) {
      console.log('   Nombre:', apiConfig.nombre);
      console.log('   Base URL:', apiConfig.baseUrl);
      console.log('   Total endpoints:', apiConfig.endpoints?.length || 0);
      
      console.log('\n   📋 ENDPOINTS DISPONIBLES:');
      apiConfig.endpoints?.forEach((endpoint, index) => {
        console.log(`\n      ${index + 1}. ${endpoint.id}`);
        console.log('         Nombre:', endpoint.nombre);
        console.log('         Método:', endpoint.metodo);
        console.log('         Path:', endpoint.path);
      });
    }

    await mongoose.disconnect();
    console.log('\n\n✅ Análisis completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verWorkflow();
