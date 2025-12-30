import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verificarWorkflowsSiguientes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    console.log('📋 Verificando workflows de Veo Veo...\n');

    if (!api || !api.workflows) {
      console.log('❌ No se encontraron workflows');
      await mongoose.disconnect();
      return;
    }

    console.log(`Total workflows: ${api.workflows.length}\n`);

    api.workflows.forEach((wf, index) => {
      console.log(`${index + 1}. ${wf.nombre} (ID: ${wf.id})`);
      console.log(`   Activo: ${wf.activo}`);
      console.log(`   Pasos: ${wf.steps?.length || 0}`);
      
      if (wf.workflowsSiguientes) {
        console.log(`   ✅ Tiene workflowsSiguientes:`);
        console.log(`      Pregunta: ${wf.workflowsSiguientes.pregunta || 'null'}`);
        console.log(`      Workflows derivados: ${wf.workflowsSiguientes.workflows?.length || 0}`);
        
        if (wf.workflowsSiguientes.workflows) {
          wf.workflowsSiguientes.workflows.forEach((w, i) => {
            console.log(`         ${i + 1}. Opción "${w.opcion}" → ${w.workflowId}`);
          });
        }
      } else {
        console.log(`   ⚠️ NO tiene workflowsSiguientes`);
      }
      console.log('');
    });

    await mongoose.disconnect();
    console.log('✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarWorkflowsSiguientes();
