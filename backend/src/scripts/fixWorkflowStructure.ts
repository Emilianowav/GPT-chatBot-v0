// 🔧 SCRIPT PARA ARREGLAR LA ESTRUCTURA DEL WORKFLOW

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';

dotenv.config();

async function fixWorkflowStructure() {
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
    
    // Obtener IDs de endpoints
    const endpointSucursales = apiICenter.endpoints?.find((e: any) => 
      e.nombre?.toLowerCase().includes('sucursal') || 
      e.path?.toLowerCase().includes('location')
    );
    
    const endpointCategorias = apiICenter.endpoints?.find((e: any) => 
      e.nombre?.toLowerCase().includes('categor') || 
      e.path?.toLowerCase().includes('categor')
    );
    
    const endpointProductos = apiICenter.endpoints?.find((e: any) => 
      e.nombre?.toLowerCase().includes('producto') || 
      e.path?.toLowerCase().includes('product')
    );
    
    console.log('\n📋 Endpoints encontrados:');
    console.log(`  Sucursales: ${endpointSucursales?.nombre} (${endpointSucursales?.id})`);
    console.log(`  Categorías: ${endpointCategorias?.nombre} (${endpointCategorias?.id})`);
    console.log(`  Productos: ${endpointProductos?.nombre} (${endpointProductos?.id})`);
    
    // Crear workflow con estructura correcta: EJECUTAR -> RECOPILAR
    const workflowCorregido = {
      id: 'workflow-icenter-real',
      nombre: 'iCenter - Consulta Real',
      descripcion: 'Workflow con estructura correcta: ejecutar antes de recopilar',
      activo: true,
      trigger: {
        tipo: 'primer_mensaje',
        keywords: []
      },
      prioridad: 20,
      mensajeInicial: '¡Hola! Te ayudo a encontrar productos en iCenter.',
      
      steps: [
        // PASO 1: EJECUTAR - Obtener sucursales de la API
        {
          id: 'ejecutar-sucursales',
          orden: 1,
          tipo: 'ejecutar',
          nombre: 'Cargar Sucursales',
          descripcion: 'Obtiene lista de sucursales desde la API',
          nombreVariable: 'sucursales_data',
          endpointId: endpointSucursales?.id || 'endpoint-sucursales',
          mapeoParametros: {}
        },
        
        // PASO 2: RECOPILAR - Usuario selecciona sucursal
        {
          id: 'recopilar-sucursal',
          orden: 2,
          tipo: 'recopilar',
          nombre: 'Seleccionar Sucursal',
          descripcion: 'Usuario selecciona sucursal de las opciones dinámicas',
          pregunta: 'Selecciona la sucursal donde quieres buscar:',
          nombreVariable: 'sucursal_id',
          validacion: {
            tipo: 'opcion',
            requerido: true,
            mensajeError: 'Por favor selecciona una sucursal válida'
          },
          endpointResponseConfig: {
            arrayPath: 'sucursales_data', // Nombre de la variable del paso anterior
            idField: 'id',
            displayField: 'name'
          }
        },
        
        // PASO 3: EJECUTAR - Obtener categorías filtradas por sucursal
        {
          id: 'ejecutar-categorias',
          orden: 3,
          tipo: 'ejecutar',
          nombre: 'Cargar Categorías',
          descripcion: 'Obtiene categorías de la sucursal seleccionada',
          nombreVariable: 'categorias_data',
          endpointId: endpointCategorias?.id || 'endpoint-categorias',
          mapeoParametros: {
            'location_id': 'sucursal_id' // Parámetro del endpoint <- Variable recopilada
          }
        },
        
        // PASO 4: RECOPILAR - Usuario selecciona categoría
        {
          id: 'recopilar-categoria',
          orden: 4,
          tipo: 'recopilar',
          nombre: 'Seleccionar Categoría',
          descripcion: 'Usuario selecciona categoría',
          pregunta: 'Selecciona la categoría de producto:',
          nombreVariable: 'categoria_id',
          validacion: {
            tipo: 'opcion',
            requerido: true,
            mensajeError: 'Por favor selecciona una categoría válida'
          },
          endpointResponseConfig: {
            arrayPath: 'categorias_data',
            idField: 'id',
            displayField: 'name'
          }
        },
        
        // PASO 5: RECOPILAR - Nombre del producto
        {
          id: 'recopilar-producto',
          orden: 5,
          tipo: 'recopilar',
          nombre: 'Nombre del Producto',
          descripcion: 'Usuario ingresa nombre del producto',
          pregunta: 'Escribe el nombre del producto que buscas:',
          nombreVariable: 'nombre_producto',
          validacion: {
            tipo: 'texto',
            requerido: true,
            minLength: 2,
            mensajeError: 'Ingresa al menos 2 caracteres'
          }
        },
        
        // PASO 6: EJECUTAR - Buscar productos con todos los filtros
        {
          id: 'ejecutar-busqueda',
          orden: 6,
          tipo: 'ejecutar',
          nombre: 'Buscar Productos',
          descripcion: 'Busca productos con todos los filtros',
          nombreVariable: 'resultados',
          endpointId: endpointProductos?.id || 'endpoint-productos',
          mapeoParametros: {
            'location_id': 'sucursal_id',
            'category_id': 'categoria_id',
            'search': 'nombre_producto'
          }
        }
      ],
      
      respuestaTemplate: `🎫 **CONSULTA COMPLETADA - iCenter**

📍 **Sucursal:** {{sucursal_id}}
📂 **Categoría:** {{categoria_id}}
🔍 **Producto buscado:** {{nombre_producto}}

📦 **Resultados:**
{{resultados}}

✅ ¡Consulta finalizada!`,
      
      mensajeFinal: '✅ ¡Búsqueda completada!',
      permitirAbandonar: true,
      mensajeAbandonar: '🚫 Búsqueda cancelada.',
      timeoutMinutos: 15
    };
    
    // Reemplazar workflow
    if (!apiICenter.workflows) {
      apiICenter.workflows = [];
    }
    
    // Eliminar workflow anterior
    apiICenter.workflows = apiICenter.workflows.filter((w: any) => 
      w.id !== 'workflow-icenter-real'
    );
    
    // Agregar workflow corregido
    apiICenter.workflows.push(workflowCorregido as any);
    
    console.log('\n💾 Guardando workflow corregido...');
    await apiICenter.save();
    
    console.log('\n✅ WORKFLOW CORREGIDO EXITOSAMENTE!');
    console.log('📋 Estructura correcta:');
    console.log('   1. EJECUTAR: Cargar sucursales desde API');
    console.log('   2. RECOPILAR: Usuario selecciona sucursal (opciones dinámicas)');
    console.log('   3. EJECUTAR: Cargar categorías filtradas');
    console.log('   4. RECOPILAR: Usuario selecciona categoría (opciones dinámicas)');
    console.log('   5. RECOPILAR: Usuario ingresa nombre de producto');
    console.log('   6. EJECUTAR: Buscar productos con todos los filtros');
    
    console.log('\n🎯 IMPORTANTE:');
    console.log('   - El arrayPath en endpointResponseConfig debe ser el NOMBRE DE LA VARIABLE');
    console.log('   - No la ruta dentro del JSON de la API');
    console.log('   - Ejemplo: "sucursales_data" (nombre de variable del paso ejecutar)');
    
    console.log('\n🚀 REINICIA EL BACKEND Y PRUEBA DE NUEVO');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado');
  }
}

fixWorkflowStructure();
