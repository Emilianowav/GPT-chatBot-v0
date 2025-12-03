// 🔍 SCRIPT PARA VERIFICAR EL MAPEO DE PARÁMETROS DEL WORKFLOW

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';

dotenv.config();

async function verifyWorkflowMapping() {
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
    
    console.log(`\n📋 Workflow: ${workflow.nombre}`);
    console.log(`📊 Total pasos: ${workflow.steps.length}`);
    
    console.log('\n🔍 VERIFICANDO PASOS:');
    console.log('='.repeat(60));
    
    workflow.steps.forEach((paso: any, index: number) => {
      console.log(`\n📍 PASO ${index + 1}: ${paso.nombre}`);
      console.log(`   Tipo: ${paso.tipo}`);
      console.log(`   Variable: ${paso.nombreVariable}`);
      
      if (paso.endpointId) {
        const endpoint = apiICenter.endpoints?.find((e: any) => e.id === paso.endpointId);
        console.log(`   Endpoint: ${endpoint?.nombre || paso.endpointId}`);
        console.log(`   Path: ${endpoint?.path || 'N/A'}`);
      }
      
      if (paso.mapeoParametros && Object.keys(paso.mapeoParametros).length > 0) {
        console.log(`   Mapeo de parámetros:`);
        for (const [paramName, varName] of Object.entries(paso.mapeoParametros)) {
          console.log(`      ${paramName} ← ${varName}`);
        }
      } else {
        console.log(`   Mapeo de parámetros: (ninguno)`);
      }
      
      if (paso.endpointResponseConfig) {
        console.log(`   Response config:`);
        console.log(`      idField: ${paso.endpointResponseConfig.idField}`);
        console.log(`      displayField: ${paso.endpointResponseConfig.displayField}`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🎯 VERIFICACIÓN DEL PASO FINAL (EJECUTAR):');
    
    const pasoFinal = workflow.steps.find((p: any) => p.tipo === 'ejecutar');
    
    if (!pasoFinal) {
      console.log('❌ No se encontró paso de tipo EJECUTAR');
      return;
    }
    
    console.log(`\n✅ Paso final encontrado: ${pasoFinal.nombre}`);
    console.log(`📦 Variable de resultado: ${pasoFinal.nombreVariable}`);
    
    if (!pasoFinal.mapeoParametros || Object.keys(pasoFinal.mapeoParametros).length === 0) {
      console.log('\n⚠️ ¡ADVERTENCIA! El paso final NO tiene mapeo de parámetros configurado');
      console.log('   Esto significa que NO se aplicarán los filtros acumulados');
      
      // Corregir el mapeo
      console.log('\n🔧 Corrigiendo mapeo de parámetros...');
      
      pasoFinal.mapeoParametros = {
        'location_id': 'sucursal_id',
        'category_id': 'categoria_id',
        'search': 'nombre_producto'
      };
      
      await apiICenter.save();
      console.log('✅ Mapeo corregido y guardado');
    } else {
      console.log('\n✅ Mapeo de parámetros configurado:');
      for (const [paramName, varName] of Object.entries(pasoFinal.mapeoParametros)) {
        console.log(`   ${paramName} ← ${varName}`);
      }
    }
    
    console.log('\n🎯 FLUJO DE DATOS ESPERADO:');
    console.log('   1. Usuario selecciona sucursal → guarda en "sucursal_id"');
    console.log('   2. Usuario selecciona categoría → guarda en "categoria_id"');
    console.log('   3. Usuario escribe producto → guarda en "nombre_producto"');
    console.log('   4. Paso EJECUTAR usa:');
    console.log('      - location_id = sucursal_id');
    console.log('      - category_id = categoria_id');
    console.log('      - search = nombre_producto (normalizado)');
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado');
  }
}

verifyWorkflowMapping();
