import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';

dotenv.config();

/**
 * Script para agregar el campo esperandoRepeticion a todos los contactos
 * que tienen un workflowState activo
 */
async function agregarCampoEsperandoRepeticion() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    // Buscar todos los contactos que tienen workflowState
    console.log('🔍 Buscando contactos con workflowState activo...');
    const contactosConWorkflow = await ContactoEmpresaModel.find({
      workflowState: { $exists: true, $ne: null }
    });

    console.log(`📊 Encontrados ${contactosConWorkflow.length} contactos con workflow activo\n`);

    if (contactosConWorkflow.length === 0) {
      console.log('ℹ️  No hay contactos con workflow activo para actualizar');
      return;
    }

    let actualizados = 0;
    let yaExistian = 0;

    for (const contacto of contactosConWorkflow) {
      const workflowState = contacto.workflowState as any;
      
      // Verificar si ya tiene el campo
      if (workflowState.esperandoRepeticion !== undefined) {
        console.log(`⏭️  ${contacto.nombre} ${contacto.apellido} - Ya tiene el campo`);
        yaExistian++;
        continue;
      }

      // Agregar el campo con valor false por defecto
      workflowState.esperandoRepeticion = false;
      
      await ContactoEmpresaModel.findByIdAndUpdate(contacto._id, {
        workflowState: workflowState
      });

      console.log(`✅ ${contacto.nombre} ${contacto.apellido} (${contacto.telefono}) - Campo agregado`);
      actualizados++;
    }

    console.log('\n📊 Resumen:');
    console.log(`   ✅ Actualizados: ${actualizados}`);
    console.log(`   ⏭️  Ya existían: ${yaExistian}`);
    console.log(`   📊 Total: ${contactosConWorkflow.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

agregarCampoEsperandoRepeticion();
