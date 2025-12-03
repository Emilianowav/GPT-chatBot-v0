// 🔧 SCRIPT PARA CORREGIR EL PARÁMETRO DE CATEGORÍA

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';

dotenv.config();

async function fixCategoryParam() {
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
    
    // Buscar el paso de categoría (paso 2)
    const pasoCategoría = workflow.steps.find((s: any) => 
      s.nombreVariable === 'categoria_id'
    );
    
    if (pasoCategoría) {
      console.log('\n🔧 Corrigiendo paso de categoría...');
      console.log(`   Paso: ${pasoCategoría.nombre}`);
      console.log(`   Mapeo anterior:`, pasoCategoría.mapeoParametros);
      
      // Corregir el mapeo: location_id está bien, pero no necesitamos filtrar por sucursal en categorías
      pasoCategoría.mapeoParametros = {};
      
      console.log(`   Mapeo nuevo:`, pasoCategoría.mapeoParametros);
      console.log('   ✅ Categorías ya no se filtran por sucursal');
    }
    
    // Buscar el paso final (EJECUTAR)
    const pasoFinal = workflow.steps.find((s: any) => s.tipo === 'ejecutar');
    
    if (!pasoFinal) {
      console.log('❌ No se encontró paso final');
      return;
    }
    
    console.log('\n🔧 Corrigiendo paso final (EJECUTAR)...');
    console.log(`   Paso: ${pasoFinal.nombre}`);
    console.log(`   Mapeo anterior:`, pasoFinal.mapeoParametros);
    
    // Corregir el nombre del parámetro
    pasoFinal.mapeoParametros = {
      'location_id': 'sucursal_id',
      'category': 'categoria_id',  // ✅ Cambiar de category_id a category
      'search': 'nombre_producto'
    };
    
    console.log(`   Mapeo nuevo:`, pasoFinal.mapeoParametros);
    
    console.log('\n💾 Guardando cambios...');
    await apiICenter.save();
    
    console.log('\n✅ CORRECCIÓN COMPLETADA!');
    console.log('\n📋 CAMBIOS REALIZADOS:');
    console.log('   1. Paso 2 (Categoría): Sin filtros (todas las categorías)');
    console.log('   2. Paso 4 (Búsqueda): Cambiar "category_id" → "category"');
    
    console.log('\n🎯 PARÁMETROS FINALES:');
    console.log('   GET /products?location_id=2&category=21&search=iphone');
    console.log('                              ^^^^^^^^ (sin _id)');
    
    console.log('\n🚀 REINICIA EL BACKEND Y PRUEBA DE NUEVO!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado');
  }
}

fixCategoryParam();
