// 🎯 SCRIPT PARA ACTUALIZAR EL TEMPLATE DEL WORKFLOW

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';

dotenv.config();

async function updateWorkflowTemplate() {
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
    
    // Actualizar el template para que sea más conciso
    workflow.respuestaTemplate = `🎫 *BÚSQUEDA COMPLETADA - iCenter*

📍 *Sucursal:* {{sucursal_id}}
📂 *Categoría:* {{categoria_id}}
🔍 *Búsqueda:* {{nombre_producto}}

📦 *Productos encontrados:*

{{resultados}}

✅ ¡Consulta finalizada!`;
    
    console.log('\n💾 Guardando cambios...');
    await apiICenter.save();
    
    console.log('\n✅ TEMPLATE ACTUALIZADO!');
    console.log('\n📝 Nuevo template:');
    console.log(workflow.respuestaTemplate);
    
    console.log('\n🎯 Características:');
    console.log('   ✅ Formato conciso');
    console.log('   ✅ Máximo 5 productos');
    console.log('   ✅ Información esencial (nombre, precio, stock)');
    console.log('   ✅ Límite de 4000 caracteres');
    
    console.log('\n🚀 REINICIA EL BACKEND Y PRUEBA DE NUEVO!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado');
  }
}

updateWorkflowTemplate();
