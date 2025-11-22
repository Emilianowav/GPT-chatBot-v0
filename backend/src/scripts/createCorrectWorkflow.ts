// 🎯 SCRIPT PARA CREAR WORKFLOW CON CONCEPTOS CORRECTOS

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';

dotenv.config();

async function createCorrectWorkflow() {
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
    
    // Obtener endpoints
    const endpointSucursales = apiICenter.endpoints?.find((e: any) => 
      e.path?.toLowerCase().includes('location')
    );
    
    const endpointCategorias = apiICenter.endpoints?.find((e: any) => 
      e.path?.toLowerCase().includes('categor')
    );
    
    const endpointProductos = apiICenter.endpoints?.find((e: any) => 
      e.path?.toLowerCase().includes('product')
    );
    
    console.log('\n📋 Endpoints:');
    console.log(`  Sucursales: ${endpointSucursales?.nombre}`);
    console.log(`  Categorías: ${endpointCategorias?.nombre}`);
    console.log(`  Productos: ${endpointProductos?.nombre}`);
    
    // WORKFLOW CON CONCEPTOS CORRECTOS:
    // - RECOPILAR: Llama API + Muestra opciones + Guarda elección
    // - EJECUTAR: Solo al final, con todos los filtros acumulados
    
    const workflowCorrecto = {
      id: 'workflow-icenter-correcto',
      nombre: 'iCenter - Búsqueda de Productos',
      descripcion: 'Workflow con conceptos correctos',
      activo: true,
      trigger: {
        tipo: 'primer_mensaje',
        keywords: []
      },
      prioridad: 25, // Máxima prioridad
      mensajeInicial: '¡Hola! Te ayudo a encontrar productos en iCenter.',
      
      steps: [
        // PASO 1: RECOPILAR - Sucursal
        // Llama a /locations, muestra opciones, guarda elección
        {
          id: 'recopilar-sucursal',
          orden: 1,
          tipo: 'recopilar',
          nombre: 'Seleccionar Sucursal',
          descripcion: 'Usuario selecciona sucursal',
          pregunta: 'Selecciona la sucursal donde quieres buscar:',
          nombreVariable: 'sucursal_id',
          endpointId: endpointSucursales?.id,
          mapeoParametros: {}, // Sin filtros en el primer paso
          validacion: {
            tipo: 'opcion',
            requerido: true,
            mensajeError: 'Por favor selecciona una sucursal válida'
          },
          endpointResponseConfig: {
            arrayPath: 'data', // No usado ahora, pero por compatibilidad
            idField: 'id',
            displayField: 'name'
          }
        },
        
        // PASO 2: RECOPILAR - Categoría
        // Llama a /categories filtrado por sucursal, muestra opciones, guarda elección
        {
          id: 'recopilar-categoria',
          orden: 2,
          tipo: 'recopilar',
          nombre: 'Seleccionar Categoría',
          descripcion: 'Usuario selecciona categoría',
          pregunta: 'Selecciona la categoría de producto:',
          nombreVariable: 'categoria_id',
          endpointId: endpointCategorias?.id,
          mapeoParametros: {
            'location_id': 'sucursal_id' // Filtrar por sucursal seleccionada
          },
          validacion: {
            tipo: 'opcion',
            requerido: true,
            mensajeError: 'Por favor selecciona una categoría válida'
          },
          endpointResponseConfig: {
            arrayPath: 'data',
            idField: 'id',
            displayField: 'name'
          }
        },
        
        // PASO 3: RECOPILAR - Nombre del producto
        // Solo texto, no llama API
        {
          id: 'recopilar-nombre',
          orden: 3,
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
        
        // PASO 4: EJECUTAR - Búsqueda final
        // Llama a /products con TODOS los filtros acumulados
        // Este es el ÚNICO paso EJECUTAR
        {
          id: 'ejecutar-busqueda-final',
          orden: 4,
          tipo: 'ejecutar',
          nombre: 'Buscar Productos',
          descripcion: 'Búsqueda final con todos los filtros',
          nombreVariable: 'resultados',
          endpointId: endpointProductos?.id,
          mapeoParametros: {
            'location_id': 'sucursal_id',
            'category_id': 'categoria_id',
            'search': 'nombre_producto'
          }
        }
      ],
      
      respuestaTemplate: `🎫 **BÚSQUEDA COMPLETADA - iCenter**

📍 **Sucursal:** {{sucursal_id}}
📂 **Categoría:** {{categoria_id}}
🔍 **Producto:** {{nombre_producto}}

📦 **Resultados:**
{{resultados}}

✅ ¡Consulta finalizada!`,
      
      mensajeFinal: '✅ ¡Búsqueda completada!',
      permitirAbandonar: true,
      mensajeAbandonar: '🚫 Búsqueda cancelada.',
      timeoutMinutos: 15
    };
    
    // Limpiar workflows anteriores
    if (!apiICenter.workflows) {
      apiICenter.workflows = [];
    }
    
    apiICenter.workflows = apiICenter.workflows.filter((w: any) => 
      !w.id?.includes('icenter')
    );
    
    // Agregar workflow correcto
    apiICenter.workflows.push(workflowCorrecto as any);
    
    console.log('\n💾 Guardando workflow...');
    await apiICenter.save();
    
    console.log('\n✅ WORKFLOW CORRECTO CREADO!');
    console.log('\n📋 CONCEPTOS CORRECTOS:');
    console.log('   ✅ RECOPILAR = Llamar API + Mostrar opciones + Guardar elección');
    console.log('   ✅ EJECUTAR = Solo al final, con todos los filtros');
    
    console.log('\n📝 FLUJO:');
    console.log('   1. RECOPILAR: Sucursal');
    console.log('      → Llama /locations');
    console.log('      → Muestra opciones');
    console.log('      → Guarda elección en "sucursal_id"');
    console.log('');
    console.log('   2. RECOPILAR: Categoría');
    console.log('      → Llama /categories?location_id={{sucursal_id}}');
    console.log('      → Muestra opciones filtradas');
    console.log('      → Guarda elección en "categoria_id"');
    console.log('');
    console.log('   3. RECOPILAR: Nombre producto');
    console.log('      → Solo texto');
    console.log('      → Guarda en "nombre_producto"');
    console.log('');
    console.log('   4. EJECUTAR: Búsqueda final');
    console.log('      → Llama /products con TODOS los filtros');
    console.log('      → Muestra resultados finales');
    
    console.log('\n🚀 REINICIA EL BACKEND Y PRUEBA!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado');
  }
}

createCorrectWorkflow();
