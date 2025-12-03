import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';

dotenv.config();

async function verificarEstadoWorkflow() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    // Buscar el contacto de prueba (ajusta el teléfono según tu caso)
    const telefono = '5493794946066'; // Tu número de prueba
    const empresaId = 'iCenter'; // Ajusta según tu empresa

    const contacto = await ContactoEmpresaModel.findOne({
      telefono,
      empresaId
    });

    if (!contacto) {
      console.log('❌ No se encontró el contacto');
      return;
    }

    console.log('👤 Contacto encontrado:');
    console.log('   ID:', contacto._id);
    console.log('   Nombre:', contacto.nombre, contacto.apellido);
    console.log('   Teléfono:', contacto.telefono);
    console.log('   Empresa:', contacto.empresaId);
    console.log('');

    if (!contacto.workflowState) {
      console.log('ℹ️  No hay workflow activo');
      return;
    }

    console.log('🔄 Estado del Workflow:');
    console.log('   Workflow ID:', contacto.workflowState.workflowId);
    console.log('   API ID:', contacto.workflowState.apiId);
    console.log('   Paso Actual:', contacto.workflowState.pasoActual);
    console.log('   Esperando Repetición:', (contacto.workflowState as any).esperandoRepeticion || false);
    console.log('   Última Actividad:', contacto.workflowState.ultimaActividad);
    console.log('');

    console.log('📦 Datos Recopilados:');
    if (contacto.workflowState.datosRecopilados) {
      for (const [key, value] of Object.entries(contacto.workflowState.datosRecopilados)) {
        console.log(`   ${key}:`, value);
      }
    } else {
      console.log('   (vacío)');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

verificarEstadoWorkflow();
