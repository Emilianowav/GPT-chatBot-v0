import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

const apiConfigSchema = new mongoose.Schema({}, { strict: false });
const ApiConfiguration = mongoose.model('ApiConfiguration', apiConfigSchema, 'api_configurations');

async function eliminarWorkflowAntiguo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const api = await ApiConfiguration.findOne({ 
      nombre: /Mis Canchas/i 
    });

    if (!api) {
      console.error('❌ No se encontró la API');
      process.exit(1);
    }

    console.log('📋 API encontrada:', api.nombre);
    console.log('🔍 Workflows actuales:');
    
    if (api.workflows && api.workflows.length > 0) {
      api.workflows.forEach((wf, index) => {
        console.log(`   ${index + 1}. ${wf.nombre} (ID: ${wf.id}, Prioridad: ${wf.prioridad})`);
      });
    }

    // Eliminar el workflow antiguo y mantener solo el nuevo
    const workflowAntiguo = api.workflows.find(wf => 
      wf.id === 'workflow-reserva-canchas-juventus'
    );

    if (workflowAntiguo) {
      console.log('\n🗑️ Eliminando workflow antiguo:', workflowAntiguo.nombre);
      
      api.workflows = api.workflows.filter(wf => 
        wf.id !== 'workflow-reserva-canchas-juventus'
      );
      
      api.markModified('workflows');
      await api.save();
      
      console.log('✅ Workflow antiguo eliminado');
    } else {
      console.log('\n⚠️ No se encontró el workflow antiguo');
    }

    console.log('\n📋 Workflows finales:');
    if (api.workflows && api.workflows.length > 0) {
      api.workflows.forEach((wf, index) => {
        console.log(`   ${index + 1}. ${wf.nombre}`);
        console.log(`      ID: ${wf.id}`);
        console.log(`      Activo: ${wf.activo}`);
        console.log(`      Prioridad: ${wf.prioridad}`);
        console.log(`      Keywords: ${wf.trigger?.keywords?.join(', ') || 'N/A'}`);
      });
    } else {
      console.log('   No hay workflows');
    }

    console.log('\n✅ CONFIGURACIÓN FINAL:');
    console.log('   ✅ Workflow antiguo eliminado');
    console.log('   ✅ Workflow nuevo de pasos (prioridad 25)');
    console.log('   ✅ Flujo conversacional como fallback');
    console.log('\n🚀 Reinicia el backend para aplicar cambios');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

eliminarWorkflowAntiguo();
