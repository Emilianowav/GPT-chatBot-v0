import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function listarWorkflows() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Listar TODOS los workflows
    const workflows = await db.collection('workflows').find({}).toArray();

    console.log(`📋 TOTAL WORKFLOWS: ${workflows.length}\n`);

    workflows.forEach((workflow, index) => {
      console.log(`${index + 1}. ${workflow.nombre}`);
      console.log(`   ID: ${workflow._id}`);
      console.log(`   Empresa ID: ${workflow.empresaId}`);
      console.log(`   API ID: ${workflow.apiId}`);
      console.log(`   Total pasos: ${workflow.pasos?.length || 0}`);
      console.log('');
    });

    // Buscar específicamente por Juventus
    console.log('\n🔍 BUSCANDO WORKFLOWS DE JUVENTUS:\n');
    
    const empresa = await db.collection('empresas').findOne({ nombre: /juventus/i });
    if (empresa) {
      console.log('🏢 Empresa Juventus encontrada:');
      console.log('   ID:', empresa._id);
      console.log('   Nombre:', empresa.nombre);
      console.log('');

      const workflowsJuventus = await db.collection('workflows').find({
        empresaId: empresa._id.toString()
      }).toArray();

      console.log(`📋 Workflows de Juventus: ${workflowsJuventus.length}\n`);
      
      workflowsJuventus.forEach((workflow, index) => {
        console.log(`${index + 1}. ${workflow.nombre}`);
        console.log(`   ID: ${workflow._id}`);
        console.log(`   Total pasos: ${workflow.pasos?.length || 0}`);
        
        if (workflow.pasos && workflow.pasos.length > 0) {
          console.log('   Pasos:');
          workflow.pasos.forEach((paso, i) => {
            console.log(`      ${i}. ${paso.nombre} (${paso.tipo})`);
            if (paso.endpointId) {
              console.log(`         → Endpoint: ${paso.endpointId}`);
            }
          });
        }
        console.log('');
      });
    } else {
      console.log('❌ No se encontró empresa Juventus');
    }

    await mongoose.disconnect();
    console.log('✅ Listado completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listarWorkflows();
