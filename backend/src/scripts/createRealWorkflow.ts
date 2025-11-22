// 🎯 SCRIPT PARA CREAR WORKFLOW REAL CON CONFIGURACIÓN DEL FRONTEND

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';

dotenv.config();

async function createRealWorkflow() {
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
      apiICenter = apis[0];
    }
    
    console.log(`🎯 Usando API: ${apiICenter.nombre}`);
    console.log(`📊 Endpoints disponibles: ${apiICenter.endpoints?.length || 0}`);
    
    // Mostrar endpoints existentes
    if (apiICenter.endpoints && apiICenter.endpoints.length > 0) {
      console.log('\n📋 Endpoints encontrados:');
      apiICenter.endpoints.forEach((endpoint: any, index) => {
        console.log(`  ${index + 1}. ${endpoint.metodo} ${endpoint.nombre} (ID: ${endpoint.id})`);
        console.log(`     Path: ${endpoint.path}`);
        console.log(`     Parámetros: ${endpoint.parametros?.length || 0}`);
      });
    }
    
    // Crear workflow que use las configuraciones reales del frontend
    const workflowReal = {
      id: 'workflow-icenter-real',
      nombre: 'iCenter - Consulta Real',
      descripcion: 'Workflow que usa las configuraciones del paso 3 del formulario',
      activo: true,
      trigger: {
        tipo: 'primer_mensaje',
        keywords: []
      },
      prioridad: 20, // Máxima prioridad
      mensajeInicial: '¡Hola! Te ayudo a encontrar productos en iCenter.',
      
      steps: [
        // PASO 1: RECOPILAR - Seleccionar sucursal
        // Este paso debe tener configurado en el frontend:
        // - endpointId: ID del endpoint que devuelve sucursales
        // - endpointResponseConfig.arrayPath: ruta al array de sucursales
        // - endpointResponseConfig.idField: campo ID de la sucursal
        // - endpointResponseConfig.displayField: campo nombre de la sucursal
        {
          id: 'recopilar-sucursal-real',
          orden: 1,
          tipo: 'recopilar',
          nombre: 'Seleccionar Sucursal',
          descripcion: 'Usuario selecciona sucursal desde API',
          pregunta: 'Selecciona la sucursal donde quieres buscar:',
          nombreVariable: 'sucursal_id',
          validacion: {
            tipo: 'opcion',
            requerido: true,
            mensajeError: 'Por favor selecciona una sucursal válida'
          },
          // ESTAS CONFIGURACIONES SE DEBEN HACER EN EL FRONTEND:
          endpointId: apiICenter.endpoints?.[0]?.id || 'endpoint-sucursales',
          endpointResponseConfig: {
            arrayPath: 'data', // Ajustar según la respuesta real de tu API
            idField: 'id',     // Campo que contiene el ID de la sucursal
            displayField: 'nombre' // Campo que se muestra al usuario
          }
        },
        
        // PASO 2: RECOPILAR - Seleccionar categoría
        // Este paso debe tener configurado en el frontend:
        // - endpointId: ID del endpoint que devuelve categorías
        // - mapeoParametros: { sucursal_id: 'sucursal_id' }
        // - endpointResponseConfig para extraer opciones
        {
          id: 'recopilar-categoria-real',
          orden: 2,
          tipo: 'recopilar',
          nombre: 'Seleccionar Categoría',
          descripcion: 'Usuario selecciona categoría filtrada por sucursal',
          pregunta: 'Selecciona la categoría de producto:',
          nombreVariable: 'categoria_id',
          validacion: {
            tipo: 'opcion',
            requerido: true,
            mensajeError: 'Por favor selecciona una categoría válida'
          },
          // ESTAS CONFIGURACIONES SE DEBEN HACER EN EL FRONTEND:
          endpointId: apiICenter.endpoints?.[1]?.id || 'endpoint-categorias',
          mapeoParametros: {
            'sucursal_id': 'sucursal_id' // Variable anterior -> Parámetro del endpoint
          },
          endpointResponseConfig: {
            arrayPath: 'data',
            idField: 'id',
            displayField: 'nombre'
          }
        },
        
        // PASO 3: RECOPILAR - Nombre del producto
        {
          id: 'recopilar-producto-real',
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
        
        // PASO 4: EJECUTAR - Buscar productos (PASO FINAL)
        // Este paso debe tener configurado en el frontend:
        // - endpointId: ID del endpoint de búsqueda de productos
        // - mapeoParametros: mapeo de todas las variables anteriores
        {
          id: 'ejecutar-busqueda-real',
          orden: 4,
          tipo: 'ejecutar',
          nombre: 'Buscar Productos',
          descripcion: 'Busca productos con todos los filtros aplicados',
          nombreVariable: 'resultados_busqueda',
          // ESTAS CONFIGURACIONES SE DEBEN HACER EN EL FRONTEND:
          endpointId: apiICenter.endpoints?.[2]?.id || 'endpoint-productos',
          mapeoParametros: {
            'sucursal_id': 'sucursal_id',     // Variable -> Parámetro
            'categoria_id': 'categoria_id',   // Variable -> Parámetro
            'nombre': 'nombre_producto'       // Variable -> Parámetro
          }
        }
      ],
      
      // Template de respuesta final
      respuestaTemplate: `🎫 **CONSULTA COMPLETADA - iCenter**

📍 **Sucursal:** {{sucursal_id}}
📂 **Categoría:** {{categoria_id}}
🔍 **Producto buscado:** {{nombre_producto}}

📦 **Resultados encontrados:**
{{resultados_busqueda}}

✅ ¡Consulta finalizada! ¿Te ayudo con algo más?`,
      
      mensajeFinal: '✅ ¡Búsqueda completada!',
      permitirAbandonar: true,
      mensajeAbandonar: '🚫 Búsqueda cancelada. ¡Vuelve cuando quieras!',
      timeoutMinutos: 15
    };
    
    // Limpiar workflows anteriores de iCenter
    if (!apiICenter.workflows) {
      apiICenter.workflows = [];
    }
    
    apiICenter.workflows = apiICenter.workflows.filter((w: any) => 
      !w.id?.includes('icenter') && !w.nombre?.toLowerCase().includes('icenter')
    );
    
    // Agregar nuevo workflow
    apiICenter.workflows.push(workflowReal as any);
    
    console.log('\n💾 Guardando workflow real...');
    await apiICenter.save();
    
    console.log('\n✅ WORKFLOW REAL CREADO EXITOSAMENTE!');
    console.log('📋 Características:');
    console.log('   🔄 4 pasos (3 recopilar + 1 ejecutar final)');
    console.log('   🌐 Usa configuraciones del paso 3 del formulario');
    console.log('   🔗 Mapeo de parámetros entre pasos');
    console.log('   📱 Trigger: primer_mensaje');
    console.log('   ⚡ Prioridad: 20 (máxima)');
    
    console.log('\n📝 FLUJO CONFIGURADO:');
    console.log('   1. RECOPILAR: Sucursal (opciones desde endpoint)');
    console.log('   2. RECOPILAR: Categoría (filtrada por sucursal)');
    console.log('   3. RECOPILAR: Nombre del producto');
    console.log('   4. EJECUTAR: Búsqueda final con todos los filtros');
    
    console.log('\n🎯 CONFIGURACIÓN NECESARIA EN EL FRONTEND:');
    console.log('   1. Ir a APIs configurables → iCenter');
    console.log('   2. Editar el workflow "iCenter - Consulta Real"');
    console.log('   3. Para cada paso de RECOPILAR:');
    console.log('      - Seleccionar endpoint correcto');
    console.log('      - Configurar arrayPath, idField, displayField');
    console.log('      - Mapear variables a parámetros');
    console.log('   4. Para el paso EJECUTAR:');
    console.log('      - Seleccionar endpoint de búsqueda');
    console.log('      - Mapear todas las variables recopiladas');
    
    console.log('\n🚀 DESPUÉS DE CONFIGURAR:');
    console.log('   1. Reiniciar backend');
    console.log('   2. Probar desde WhatsApp con número nuevo');
    console.log('   3. Verificar que las opciones sean dinámicas');
    console.log('   4. Confirmar que los filtros se apliquen correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado');
  }
}

createRealWorkflow();
