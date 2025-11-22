// 🔍 SCRIPT PARA VERIFICAR EL ENDPOINT DE PRODUCTOS

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';

dotenv.config();

async function checkProductsEndpoint() {
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
    
    // Buscar endpoint de productos
    const endpointProductos = apiICenter.endpoints?.find((e: any) => 
      e.path?.toLowerCase().includes('product')
    );
    
    if (!endpointProductos) {
      console.log('❌ No se encontró endpoint de productos');
      return;
    }
    
    console.log('\n📋 ENDPOINT DE PRODUCTOS:');
    console.log('='.repeat(60));
    console.log(`Nombre: ${endpointProductos.nombre}`);
    console.log(`Método: ${endpointProductos.metodo}`);
    console.log(`Path: ${endpointProductos.path}`);
    console.log(`ID: ${endpointProductos.id}`);
    
    console.log('\n📝 PARÁMETROS CONFIGURADOS:');
    
    if (endpointProductos.parametros) {
      console.log('\n🔹 Path params:');
      if (endpointProductos.parametros.path && endpointProductos.parametros.path.length > 0) {
        endpointProductos.parametros.path.forEach((param: any) => {
          console.log(`   - ${param.nombre} (${param.tipo}) ${param.requerido ? '(requerido)' : ''}`);
          if (param.descripcion) console.log(`     ${param.descripcion}`);
        });
      } else {
        console.log('   (ninguno)');
      }
      
      console.log('\n🔹 Query params:');
      if (endpointProductos.parametros.query && endpointProductos.parametros.query.length > 0) {
        endpointProductos.parametros.query.forEach((param: any) => {
          console.log(`   - ${param.nombre} (${param.tipo}) ${param.requerido ? '(requerido)' : ''}`);
          if (param.descripcion) console.log(`     ${param.descripcion}`);
        });
      } else {
        console.log('   (ninguno)');
      }
      
      console.log('\n🔹 Body params:');
      if (endpointProductos.parametros.body && Array.isArray(endpointProductos.parametros.body) && endpointProductos.parametros.body.length > 0) {
        endpointProductos.parametros.body.forEach((param: any) => {
          console.log(`   - ${param.nombre} (${param.tipo}) ${param.requerido ? '(requerido)' : ''}`);
          if (param.descripcion) console.log(`     ${param.descripcion}`);
        });
      } else {
        console.log('   (ninguno)');
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🎯 ANÁLISIS:');
    console.log('\nLa API está devolviendo fundas (categoría Accesorios)');
    console.log('cuando pedimos categoría 21 (Smartphones).');
    console.log('\nPosibles causas:');
    console.log('1. El parámetro "category_id" no filtra correctamente en la API');
    console.log('2. Las fundas están etiquetadas como relacionadas a smartphones');
    console.log('3. El nombre del parámetro es diferente (ej: "category" en vez de "category_id")');
    
    console.log('\n💡 SOLUCIONES:');
    console.log('1. Verificar la documentación de la API de iCenter');
    console.log('2. Probar con diferentes nombres de parámetro:');
    console.log('   - category');
    console.log('   - cat_id');
    console.log('   - product_cat');
    console.log('3. Contactar al proveedor de la API para confirmar el filtrado');
    
    console.log('\n🔧 PRUEBA MANUAL:');
    console.log('Prueba esta URL en el navegador:');
    console.log(`${apiICenter.baseUrl}${endpointProductos.path}?location_id=2&category_id=21&search=iphone`);
    console.log('\nY compara con:');
    console.log(`${apiICenter.baseUrl}${endpointProductos.path}?location_id=2&category=21&search=iphone`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado');
  }
}

checkProductsEndpoint();
