// 🏪 SCRIPT PARA CREAR WORKFLOW COMPLETO DE iCenter
// Crea un workflow de 4 pasos: Sucursal > Categoría > Producto > Ticket Final

import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';

/**
 * Crea el workflow completo para iCenter
 */
async function createICenterWorkflow(): Promise<void> {
  try {
    console.log('🏪 Creando workflow completo para iCenter...\n');
    
    // Conectar a MongoDB
    await connectDB();
    
    // Buscar la API de iCenter
    const apiConfig = await ApiConfigurationModel.findOne({
      empresaId: 'iCenter',
      nombre: /iCenter/i
    });
    
    if (!apiConfig) {
      console.error('❌ No se encontró la configuración de API para iCenter');
      return;
    }
    
    console.log(`✅ API encontrada: ${apiConfig.nombre}`);
    console.log(`📋 Endpoints disponibles: ${apiConfig.endpoints?.length || 0}`);
    
    // Definir el workflow completo
    const workflowCompleto = {
      id: 'workflow-icenter-completo',
      nombre: 'Consulta de Productos iCenter',
      descripcion: 'Flujo completo para consultar productos por sucursal y categoría',
      activo: true,
      
      // Trigger de primer mensaje
      trigger: {
        tipo: 'primer_mensaje' as const,
        keywords: []
      },
      prioridad: 10,
      
      // Mensaje inicial
      mensajeInicial: '¡Hola! Te ayudo a encontrar productos en iCenter.',
      
      // Pasos del workflow
      steps: [
        // PASO 1: Ejecutar - Obtener sucursales
        {
          id: 'paso-1-sucursales',
          orden: 1,
          tipo: 'ejecutar' as const,
          nombre: 'Obtener Sucursales',
          descripcion: 'Obtiene la lista de sucursales disponibles',
          nombreVariable: 'sucursales',
          endpointId: 'endpoint-sucursales', // Debes ajustar según tu API
          mapeoParametros: {}
        },
        
        // PASO 2: Recopilar - Seleccionar sucursal
        {
          id: 'paso-2-seleccionar-sucursal',
          orden: 2,
          tipo: 'recopilar' as const,
          nombre: 'Seleccionar Sucursal',
          descripcion: 'El usuario selecciona una sucursal',
          pregunta: 'Selecciona la sucursal donde quieres buscar:',
          nombreVariable: 'sucursal_seleccionada',
          validacion: {
            tipo: 'opcion' as const,
            requerido: true,
            mensajeError: 'Por favor selecciona una sucursal válida'
          },
          endpointResponseConfig: {
            arrayPath: 'sucursales',
            idField: 'id',
            displayField: 'nombre'
          }
        },
        
        // PASO 3: Ejecutar - Obtener categorías
        {
          id: 'paso-3-categorias',
          orden: 3,
          tipo: 'ejecutar' as const,
          nombre: 'Obtener Categorías',
          descripcion: 'Obtiene categorías de la sucursal seleccionada',
          nombreVariable: 'categorias',
          endpointId: 'endpoint-categorias', // Debes ajustar según tu API
          mapeoParametros: {
            sucursal_id: 'sucursal_seleccionada'
          }
        },
        
        // PASO 4: Recopilar - Seleccionar categoría
        {
          id: 'paso-4-seleccionar-categoria',
          orden: 4,
          tipo: 'recopilar' as const,
          nombre: 'Seleccionar Categoría',
          descripcion: 'El usuario selecciona una categoría',
          pregunta: 'Selecciona la categoría de producto:',
          nombreVariable: 'categoria_seleccionada',
          validacion: {
            tipo: 'opcion' as const,
            requerido: true,
            mensajeError: 'Por favor selecciona una categoría válida'
          },
          endpointResponseConfig: {
            arrayPath: 'categorias',
            idField: 'id',
            displayField: 'nombre'
          }
        },
        
        // PASO 5: Recopilar - Nombre del producto
        {
          id: 'paso-5-nombre-producto',
          orden: 5,
          tipo: 'recopilar' as const,
          nombre: 'Nombre del Producto',
          descripcion: 'El usuario ingresa el nombre del producto que busca',
          pregunta: 'Escribe el nombre del producto que estás buscando:',
          nombreVariable: 'nombre_producto',
          validacion: {
            tipo: 'texto' as const,
            requerido: true,
            minLength: 2,
            mensajeError: 'Por favor ingresa al menos 2 caracteres para el nombre del producto'
          }
        },
        
        // PASO 6: Ejecutar - Buscar productos
        {
          id: 'paso-6-buscar-productos',
          orden: 6,
          tipo: 'ejecutar' as const,
          nombre: 'Buscar Productos',
          descripcion: 'Busca productos según los criterios seleccionados',
          nombreVariable: 'productos_encontrados',
          endpointId: 'endpoint-productos', // Debes ajustar según tu API
          mapeoParametros: {
            sucursal_id: 'sucursal_seleccionada',
            categoria_id: 'categoria_seleccionada',
            nombre: 'nombre_producto'
          }
        }
      ],
      
      // Template de respuesta final
      respuestaTemplate: `🎫 **TICKET DE CONSULTA - iCenter**

📍 **Sucursal:** {{sucursal_seleccionada}}
📂 **Categoría:** {{categoria_seleccionada}}
🔍 **Producto buscado:** {{nombre_producto}}

📦 **Resultados encontrados:**
{{productos_encontrados}}

✅ ¡Consulta completada! ¿Te ayudo con algo más?`,
      
      // Configuración adicional
      permitirAbandonar: true,
      mensajeAbandonar: 'Consulta cancelada. ¡Vuelve cuando quieras!',
      timeoutMinutos: 10
    };
    
    // Actualizar o crear el workflow en la API
    const workflowIndex = apiConfig.workflows?.findIndex(w => (w as any).id === workflowCompleto.id);
    
    if (workflowIndex !== undefined && workflowIndex >= 0) {
      // Actualizar workflow existente
      apiConfig.workflows![workflowIndex] = workflowCompleto as any;
      console.log('🔄 Actualizando workflow existente...');
    } else {
      // Agregar nuevo workflow
      if (!apiConfig.workflows) {
        apiConfig.workflows = [];
      }
      apiConfig.workflows.push(workflowCompleto as any);
      console.log('➕ Agregando nuevo workflow...');
    }
    
    // Guardar cambios
    await apiConfig.save();
    
    console.log('\n✅ WORKFLOW CREADO EXITOSAMENTE');
    console.log('📋 Detalles del workflow:');
    console.log(`   🏷️ Nombre: ${workflowCompleto.nombre}`);
    console.log(`   🔧 Pasos: ${workflowCompleto.steps.length}`);
    console.log(`   🎯 Trigger: ${workflowCompleto.trigger.tipo}`);
    console.log(`   ⚡ Activo: ${workflowCompleto.activo ? '✅' : '❌'}`);
    
    console.log('\n📝 PASOS CONFIGURADOS:');
    workflowCompleto.steps.forEach((paso, index) => {
      console.log(`   ${index + 1}. ${paso.tipo.toUpperCase()}: ${paso.nombre}`);
      if (paso.tipo === 'ejecutar') {
        console.log(`      🔗 Endpoint: ${paso.endpointId}`);
      } else if (paso.tipo === 'recopilar') {
        console.log(`      ❓ Pregunta: ${paso.pregunta}`);
      }
    });
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('   1. Verificar que los endpoints existan en la API');
    console.log('   2. Ajustar los endpointId según tu configuración');
    console.log('   3. Probar el workflow enviando un mensaje desde WhatsApp');
    console.log('   4. Revisar logs para verificar ejecución correcta');
    
  } catch (error) {
    console.error('❌ Error creando workflow:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createICenterWorkflow();
}

export { createICenterWorkflow };
