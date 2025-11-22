// 🔑 SCRIPT PARA AGREGAR KEYWORDS AL WORKFLOW DE ICENTER

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';

dotenv.config();

async function addKeywordsToWorkflow() {
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
    console.log(`   Trigger actual:`, workflow.trigger);
    
    // Agregar keywords al trigger
    workflow.trigger.keywords = [
      'productos',
      'producto',
      'buscar',
      'buscar producto',
      'quiero comprar',
      'necesito',
      'stock',
      'precio',
      'catalogo',
      'catálogo'
    ];
    
    console.log('\n💾 Guardando cambios...');
    await apiICenter.save();
    
    console.log('\n✅ KEYWORDS AGREGADAS!');
    console.log('\n📋 Trigger actualizado:');
    console.log(`   Tipo: ${workflow.trigger.tipo}`);
    console.log(`   Keywords:`, workflow.trigger.keywords);
    
    console.log('\n🎯 AHORA EL WORKFLOW SE ACTIVA CON:');
    console.log('   1. Primer mensaje del usuario (como antes)');
    console.log('   2. Cualquiera de estas palabras clave:');
    workflow.trigger.keywords.forEach((kw: string) => {
      console.log(`      - "${kw}"`);
    });
    
    console.log('\n💡 EJEMPLOS DE USO:');
    console.log('   Usuario: "Hola" → ✅ Activa (primer mensaje)');
    console.log('   Usuario: "Quiero buscar un producto" → ✅ Activa (keyword)');
    console.log('   Usuario: "Necesito un iPhone" → ✅ Activa (keyword)');
    console.log('   Usuario: "¿Tienen stock?" → ✅ Activa (keyword)');
    
    console.log('\n🚀 REINICIA EL BACKEND Y PRUEBA!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado');
  }
}

addKeywordsToWorkflow();
