// 🔧 SCRIPT PARA ELIMINAR PASO DE CONFIRMACIÓN DUPLICADO

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';

dotenv.config();

async function fixDuplicateConfirmation() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await connectDB();
    
    console.log('📋 Buscando API de iCenter...');
    const apis = await ApiConfigurationModel.find({});
    
    let apiICenter = apis.find(api => 
      (api.empresaId && api.empresaId.toString().toLowerCase().includes('icenter')) || 
      (api.nombre && api.nombre.toLowerCase().includes('icenter'))
    );
    
    if (!apiICenter) {
      console.log('❌ No se encontró API de iCenter');
      return;
    }
    
    console.log(`🎯 API encontrada: ${apiICenter.nombre}`);
    
    // Buscar el workflow
    const workflow = apiICenter.workflows?.find((w: any) => 
      w.id === 'workflow-icenter-correcto'
    );
    
    if (!workflow) {
      console.log('❌ No se encontró el workflow');
      return;
    }
    
    console.log(`📋 Workflow encontrado: ${workflow.nombre}`);
    console.log(`📊 Pasos actuales: ${workflow.steps.length}`);
    
    // Eliminar pasos duplicados de confirmación
    const pasosConfirmacion = workflow.steps.filter((p: any) => 
      p.id === 'confirmar-datos' || p.nombre === 'Confirmar Datos'
    );
    
    console.log(`\n🔍 Pasos de confirmación encontrados: ${pasosConfirmacion.length}`);
    
    if (pasosConfirmacion.length > 1) {
      console.log('⚠️ Hay pasos duplicados, eliminando...');
      
      // Mantener solo el primero
      const pasoAMantener = pasosConfirmacion[0];
      
      // Eliminar los demás
      workflow.steps = workflow.steps.filter((p: any) => 
        p.id !== 'confirmar-datos' || p === pasoAMantener
      );
      
      console.log(`✅ Eliminados ${pasosConfirmacion.length - 1} pasos duplicados`);
    }
    
    // Reordenar todos los pasos
    workflow.steps.forEach((paso: any, index: number) => {
      paso.orden = index + 1;
    });
    
    console.log('\n💾 Guardando cambios...');
    await apiICenter.save();
    
    console.log('\n✅ WORKFLOW CORREGIDO!');
    console.log('\n📋 FLUJO FINAL:');
    workflow.steps.forEach((paso: any) => {
      console.log(`   ${paso.orden}. ${paso.nombre} (${paso.tipo})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado');
  }
}

fixDuplicateConfirmation();
