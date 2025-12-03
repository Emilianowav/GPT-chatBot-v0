// 🔍 SCRIPT PARA VERIFICAR Y CREAR WORKFLOW DE iCenter
// Verifica las APIs existentes y crea el workflow en la correcta

import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';

/**
 * Verifica y crea el workflow para iCenter
 */
async function checkAndCreateICenterWorkflow(): Promise<void> {
  try {
    console.log('🔍 Verificando APIs existentes...\n');
    
    // Conectar a MongoDB
    await connectDB();
    
    // Buscar todas las APIs
    const todasLasApis = await ApiConfigurationModel.find({});
    
    console.log(`📊 Total de APIs encontradas: ${todasLasApis.length}\n`);
    
    // Mostrar todas las APIs
    todasLasApis.forEach((api, index) => {
      console.log(`${index + 1}. API: "${api.nombre}"`);
      console.log(`   📋 Empresa: ${api.empresaId}`);
      console.log(`   🔗 Base URL: ${api.baseUrl}`);
      console.log(`   📊 Endpoints: ${api.endpoints?.length || 0}`);
      console.log(`   🔄 Workflows: ${api.workflows?.length || 0}`);
      console.log('');
    });
    
    // Buscar API de iCenter (por diferentes criterios)
    let apiICenter = await ApiConfigurationModel.findOne({
      $or: [
        { empresaId: 'iCenter' },
        { empresaId: /icenter/i },
        { nombre: /icenter/i },
        { baseUrl: /icenter/i }
      ]
    });
    
    if (!apiICenter) {
      console.log('❌ No se encontró API de iCenter. Creando una nueva...\n');
      
      // Crear API de iCenter
      apiICenter = new ApiConfigurationModel({
        nombre: 'iCenter API',
        empresaId: 'iCenter',
        baseUrl: 'https://api.icenter.com', // Ajustar según tu API real
        descripcion: 'API para consultas de productos iCenter',
        activo: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        endpoints: [
          {
            id: 'endpoint-sucursales',
            nombre: 'Obtener Sucursales',
            path: '/sucursales',
            metodo: 'GET',
            descripcion: 'Obtiene lista de sucursales disponibles',
            activo: true,
            parametros: [],
            headers: {}
          },
          {
            id: 'endpoint-categorias',
            nombre: 'Obtener Categorías',
            path: '/categorias',
            metodo: 'GET',
            descripcion: 'Obtiene categorías por sucursal',
            activo: true,
            parametros: [
              {
                nombre: 'sucursal_id',
                tipo: 'string',
                requerido: true,
                descripcion: 'ID de la sucursal'
              }
            ],
            headers: {}
          },
          {
            id: 'endpoint-productos',
            nombre: 'Buscar Productos',
            path: '/productos/buscar',
            metodo: 'GET',
            descripcion: 'Busca productos por criterios',
            activo: true,
            parametros: [
              {
                nombre: 'sucursal_id',
                tipo: 'string',
                requerido: true,
                descripcion: 'ID de la sucursal'
              },
              {
                nombre: 'categoria_id',
                tipo: 'string',
                requerido: false,
                descripcion: 'ID de la categoría'
              },
              {
                nombre: 'nombre',
                tipo: 'string',
                requerido: false,
                descripcion: 'Nombre del producto a buscar'
              }
            ],
            headers: {}
          }
        ],
        workflows: []
      });
      
      await apiICenter.save();
      console.log('✅ API de iCenter creada exitosamente');
    } else {
      console.log(`✅ API de iCenter encontrada: "${apiICenter.nombre}"`);
    }
    
    console.log('\n🔄 Creando workflow completo...\n');
    
    // Definir el workflow completo
    const workflowCompleto = {
      id: 'workflow-icenter-completo',
      nombre: 'Consulta de Productos iCenter',
      descripcion: 'Flujo completo para consultar productos por sucursal y categoría',
      activo: true,
      
      // Trigger de primer mensaje
      trigger: {
        tipo: 'primer_mensaje',
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
          tipo: 'ejecutar',
          nombre: 'Obtener Sucursales',
          descripcion: 'Obtiene la lista de sucursales disponibles',
          nombreVariable: 'sucursales',
          endpointId: 'endpoint-sucursales',
          mapeoParametros: {}
        },
        
        // PASO 2: Recopilar - Seleccionar sucursal
        {
          id: 'paso-2-seleccionar-sucursal',
          orden: 2,
          tipo: 'recopilar',
          nombre: 'Seleccionar Sucursal',
          descripcion: 'El usuario selecciona una sucursal',
          pregunta: 'Selecciona la sucursal donde quieres buscar:',
          nombreVariable: 'sucursal_seleccionada',
          validacion: {
            tipo: 'opcion',
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
          tipo: 'ejecutar',
          nombre: 'Obtener Categorías',
          descripcion: 'Obtiene categorías de la sucursal seleccionada',
          nombreVariable: 'categorias',
          endpointId: 'endpoint-categorias',
          mapeoParametros: {
            sucursal_id: 'sucursal_seleccionada'
          }
        },
        
        // PASO 4: Recopilar - Seleccionar categoría
        {
          id: 'paso-4-seleccionar-categoria',
          orden: 4,
          tipo: 'recopilar',
          nombre: 'Seleccionar Categoría',
          descripcion: 'El usuario selecciona una categoría',
          pregunta: 'Selecciona la categoría de producto:',
          nombreVariable: 'categoria_seleccionada',
          validacion: {
            tipo: 'opcion',
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
          tipo: 'recopilar',
          nombre: 'Nombre del Producto',
          descripcion: 'El usuario ingresa el nombre del producto que busca',
          pregunta: 'Escribe el nombre del producto que estás buscando:',
          nombreVariable: 'nombre_producto',
          validacion: {
            tipo: 'texto',
            requerido: true,
            minLength: 2,
            mensajeError: 'Por favor ingresa al menos 2 caracteres para el nombre del producto'
          }
        },
        
        // PASO 6: Ejecutar - Buscar productos
        {
          id: 'paso-6-buscar-productos',
          orden: 6,
          tipo: 'ejecutar',
          nombre: 'Buscar Productos',
          descripcion: 'Busca productos según los criterios seleccionados',
          nombreVariable: 'productos_encontrados',
          endpointId: 'endpoint-productos',
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
    
    // Verificar si ya existe el workflow
    const workflowExistente = apiICenter.workflows?.find((w: any) => w.id === workflowCompleto.id);
    
    if (workflowExistente) {
      console.log('🔄 Actualizando workflow existente...');
      // Actualizar workflow existente
      const index = apiICenter.workflows!.findIndex((w: any) => w.id === workflowCompleto.id);
      apiICenter.workflows![index] = workflowCompleto as any;
    } else {
      console.log('➕ Agregando nuevo workflow...');
      // Agregar nuevo workflow
      if (!apiICenter.workflows) {
        apiICenter.workflows = [];
      }
      apiICenter.workflows.push(workflowCompleto as any);
    }
    
    // Guardar cambios
    await apiICenter.save();
    
    console.log('\n✅ WORKFLOW CREADO EXITOSAMENTE EN iCenter API');
    console.log('📋 Detalles del workflow:');
    console.log(`   🏷️ Nombre: ${workflowCompleto.nombre}`);
    console.log(`   🔧 Pasos: ${workflowCompleto.steps.length}`);
    console.log(`   🎯 Trigger: ${workflowCompleto.trigger.tipo}`);
    console.log(`   ⚡ Activo: ${workflowCompleto.activo ? '✅' : '❌'}`);
    console.log(`   🆔 API ID: ${apiICenter._id}`);
    
    console.log('\n📝 PASOS CONFIGURADOS:');
    workflowCompleto.steps.forEach((paso, index) => {
      console.log(`   ${index + 1}. ${paso.tipo.toUpperCase()}: ${paso.nombre}`);
      if (paso.tipo === 'ejecutar') {
        console.log(`      🔗 Endpoint: ${paso.endpointId}`);
      } else if (paso.tipo === 'recopilar') {
        console.log(`      ❓ Pregunta: ${paso.pregunta}`);
      }
    });
    
    console.log('\n🎯 WORKFLOW LISTO PARA USAR:');
    console.log('   1. ✅ API de iCenter configurada');
    console.log('   2. ✅ Endpoints definidos');
    console.log('   3. ✅ Workflow con 6 pasos creado');
    console.log('   4. ✅ Trigger de primer mensaje activo');
    console.log('   5. 🔄 Reinicia el backend para aplicar cambios');
    console.log('   6. 📱 Prueba enviando mensaje desde WhatsApp');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  checkAndCreateICenterWorkflow();
}

export { checkAndCreateICenterWorkflow };
