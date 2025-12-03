import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';

dotenv.config();

async function limpiarEstadoWorkflow() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    // Buscar el contacto de prueba
    const telefono = '5493794946066'; // Tu número de prueba
    const empresaId = 'iCenter'; // Nombre de la empresa

    console.log('🔍 Buscando contacto con:');
    console.log('   Teléfono:', telefono);
    console.log('   Empresa:', empresaId);
    console.log('');

    const contacto = await ContactoEmpresaModel.findOne({
      telefono,
      empresaId
    });

    if (!contacto) {
      console.log('❌ No se encontró el contacto');
      return;
    }

    console.log('👤 Contacto encontrado:', contacto.nombre, contacto.apellido);
    
    if (!contacto.workflowState) {
      console.log('ℹ️  No hay workflow activo, nada que limpiar');
      return;
    }

    console.log('🗑️  Limpiando estado del workflow...');
    
    await ContactoEmpresaModel.findByIdAndUpdate(contacto._id, {
      $unset: { workflowState: 1 }
    });

    console.log('✅ Estado del workflow limpiado');
    console.log('');
    console.log('Ahora puedes probar el flujo desde cero enviando "tienen" por WhatsApp');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

limpiarEstadoWorkflow();
