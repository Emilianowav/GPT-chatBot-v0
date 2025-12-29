import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function testWorkflowDetection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Obtener empresa
    const empresa = await db.collection('empresas').findOne({
      nombre: /veo veo/i
    });

    console.log('🏢 EMPRESA:');
    console.log('   ID:', empresa._id.toString());
    console.log('   Nombre:', empresa.nombre);
    console.log('   Teléfono:', empresa.telefono);

    // Buscar APIs con workflows para esta empresa
    const empresaIdString = empresa._id.toString();
    
    console.log('\n🔍 Buscando APIs con workflows...');
    console.log('   empresaId a buscar:', empresaIdString);

    const apisConWorkflows = await db.collection('api_configurations').find({
      empresaId: empresaIdString,
      'workflows.0': { $exists: true }
    }).toArray();

    console.log('\n📋 APIs encontradas:', apisConWorkflows.length);

    if (apisConWorkflows.length === 0) {
      console.log('\n❌ NO SE ENCONTRARON APIs CON WORKFLOWS');
      console.log('\n🔍 Buscando todas las APIs de Veo Veo...');
      
      const todasLasApis = await db.collection('api_configurations').find({
        nombre: /veo veo/i
      }).toArray();

      console.log('   APIs encontradas por nombre:', todasLasApis.length);
      
      if (todasLasApis.length > 0) {
        const api = todasLasApis[0];
        console.log('\n📡 API encontrada:');
        console.log('   ID:', api._id);
        console.log('   Nombre:', api.nombre);
        console.log('   empresaId:', api.empresaId);
        console.log('   empresaId tipo:', typeof api.empresaId);
        console.log('   Workflows:', api.workflows?.length || 0);
        
        if (api.workflows && api.workflows.length > 0) {
          const workflow = api.workflows[0];
          console.log('\n🔄 WORKFLOW:');
          console.log('   Nombre:', workflow.nombre);
          console.log('   Activo:', workflow.activo);
          console.log('   Trigger tipo:', workflow.trigger?.tipo);
          console.log('   Keywords:', workflow.trigger?.keywords);
        }
      }
    } else {
      console.log('\n✅ APIs con workflows encontradas correctamente');
      apisConWorkflows.forEach((api, i) => {
        console.log(`\n${i + 1}. ${api.nombre}`);
        console.log('   Workflows:', api.workflows.length);
        api.workflows.forEach((wf, j) => {
          console.log(`   ${j + 1}. ${wf.nombre} - Activo: ${wf.activo}`);
        });
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testWorkflowDetection();
