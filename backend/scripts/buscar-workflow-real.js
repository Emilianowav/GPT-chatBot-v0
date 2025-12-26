import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function buscarWorkflow() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar en TODAS las colecciones posibles
    console.log('🔍 BUSCANDO EN COLECCIÓN: workflows');
    const workflows = await db.collection('workflows').find({}).toArray();
    console.log(`   Total: ${workflows.length}`);

    console.log('\n🔍 BUSCANDO EN COLECCIÓN: apiconfigs');
    const apiconfigs = await db.collection('apiconfigs').find({}).toArray();
    console.log(`   Total: ${apiconfigs.length}`);
    
    apiconfigs.forEach(api => {
      console.log(`\n   📋 API: ${api.nombre}`);
      console.log(`      ID: ${api._id}`);
      console.log(`      Empresa ID: ${api.empresaId}`);
      console.log(`      Workflows: ${api.workflows?.length || 0}`);
      
      if (api.workflows && api.workflows.length > 0) {
        api.workflows.forEach((wf, i) => {
          console.log(`\n      Workflow ${i + 1}: ${wf.nombre}`);
          console.log(`         Pasos: ${wf.pasos?.length || 0}`);
        });
      }
    });

    console.log('\n🔍 BUSCANDO EN COLECCIÓN: api_configurations');
    const apiConfigurations = await db.collection('api_configurations').find({}).toArray();
    console.log(`   Total: ${apiConfigurations.length}`);
    
    apiConfigurations.forEach(api => {
      console.log(`\n   📋 API: ${api.nombre}`);
      console.log(`      ID: ${api._id}`);
      console.log(`      Workflows: ${api.workflows?.length || 0}`);
      
      if (api.workflows && api.workflows.length > 0) {
        api.workflows.forEach((wf, i) => {
          console.log(`\n      Workflow ${i + 1}: ${wf.nombre}`);
          console.log(`         Steps: ${wf.steps?.length || 0}`);
          console.log(`         Pasos: ${wf.pasos?.length || 0}`);
        });
      }
    });

    // Buscar workflow activo del usuario
    console.log('\n\n🔍 BUSCANDO WORKFLOW ACTIVO DEL USUARIO:');
    const contacto = await db.collection('contactosempresas').findOne({
      telefono: '5493794946066'
    });

    if (contacto && contacto.workflowState) {
      console.log('   ✅ Usuario tiene workflow activo');
      console.log('   Workflow ID:', contacto.workflowState.workflowId);
      console.log('   Paso actual:', contacto.workflowState.pasoActual);
      
      // Buscar ese workflow específico
      const workflowId = contacto.workflowState.workflowId;
      
      console.log('\n   🔍 Buscando workflow por ID en todas las colecciones...');
      
      // Buscar en workflows
      const wf1 = await db.collection('workflows').findOne({
        _id: new mongoose.Types.ObjectId(workflowId)
      });
      if (wf1) {
        console.log('   ✅ ENCONTRADO en workflows');
        console.log('      Nombre:', wf1.nombre);
        console.log('      Pasos:', wf1.pasos?.length);
      }
      
      // Buscar en apiconfigs
      const apiWithWorkflow = await db.collection('apiconfigs').findOne({
        'workflows._id': new mongoose.Types.ObjectId(workflowId)
      });
      if (apiWithWorkflow) {
        console.log('   ✅ ENCONTRADO en apiconfigs');
        const wf = apiWithWorkflow.workflows.find(w => w._id.toString() === workflowId);
        console.log('      Nombre:', wf.nombre);
        console.log('      Pasos:', wf.pasos?.length);
      }
    } else {
      console.log('   ❌ Usuario NO tiene workflow activo');
    }

    await mongoose.disconnect();
    console.log('\n\n✅ Búsqueda completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

buscarWorkflow();
