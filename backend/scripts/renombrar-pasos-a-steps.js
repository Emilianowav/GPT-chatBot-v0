import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function renombrarPasosASteps() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;

    // Buscar todas las APIs con workflows
    const apis = await db.collection('api_configurations').find({
      workflows: { $exists: true, $ne: [] }
    }).toArray();

    console.log(`\n📋 APIs encontradas: ${apis.length}\n`);

    for (const api of apis) {
      console.log(`🔄 Procesando API: ${api.nombre}`);
      
      if (api.workflows && Array.isArray(api.workflows)) {
        for (let i = 0; i < api.workflows.length; i++) {
          const workflow = api.workflows[i];
          
          // Si tiene 'pasos', renombrar a 'steps'
          if (workflow.pasos && !workflow.steps) {
            console.log(`   ✏️  Renombrando 'pasos' a 'steps' en workflow: ${workflow.nombre}`);
            workflow.steps = workflow.pasos;
            delete workflow.pasos;
          }
        }
        
        // Actualizar en BD
        await db.collection('api_configurations').updateOne(
          { _id: api._id },
          { $set: { workflows: api.workflows } }
        );
        
        console.log(`   ✅ API actualizada\n`);
      }
    }

    console.log('✅ Renombrado completado');

    // Verificar
    const apiVerificar = await db.collection('api_configurations').findOne({ 
      nombre: /mis canchas/i 
    });

    if (apiVerificar?.workflows?.[0]) {
      const wf = apiVerificar.workflows[0];
      console.log('\n📋 VERIFICACIÓN:');
      console.log('   Workflow:', wf.nombre);
      console.log('   Tiene "steps":', !!wf.steps);
      console.log('   Tiene "pasos":', !!wf.pasos);
      console.log('   Total steps:', wf.steps?.length || 0);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

renombrarPasosASteps();
