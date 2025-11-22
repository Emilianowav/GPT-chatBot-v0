// 🚀 SCRIPT PARA CREAR WORKFLOW DINÁMICO CON APIs

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';

// Cargar variables de entorno
dotenv.config();

async function createDynamicWorkflow() {
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
    
    // Crear endpoints si no existen
    if (!apiICenter.endpoints) {
      apiICenter.endpoints = [];
    }
    
    // Verificar y crear endpoints necesarios
    const endpointsNecesarios = [
      {
        id: 'get-sucursales',
        nombre: 'Obtener Sucursales',
        path: '/sucursales',
        metodo: 'GET',
        descripcion: 'Obtiene lista de sucursales',
        activo: true,
        parametros: [],
        headers: {}
      },
      {
        id: 'get-categorias',
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
        id: 'buscar-productos',
        nombre: 'Buscar Productos',
        path: '/productos/buscar',
        metodo: 'GET',
        descripcion: 'Busca productos',
        activo: true,
        parametros: [
          {
            nombre: 'sucursal_id',
            tipo: 'string',
            requerido: true
          },
          {
            nombre: 'categoria_id',
            tipo: 'string',
            requerido: false
          },
          {
            nombre: 'nombre',
            tipo: 'string',
            requerido: false
          }
        ],
        headers: {}
      }
    ];
    
    // Agregar endpoints que no existen
    endpointsNecesarios.forEach(endpoint => {
      const existe = apiICenter.endpoints!.find((e: any) => e.id === endpoint.id);
      if (!existe) {
        apiICenter.endpoints!.push(endpoint as any);
        console.log(`➕ Endpoint agregado: ${endpoint.nombre}`);
      }
    });
    
    // Crear workflow dinámico completo
    const workflowDinamico = {
      id: 'workflow-icenter-dinamico',
      nombre: 'iCenter - Consulta Dinámica',
      descripcion: 'Flujo completo con APIs dinámicas',
      activo: true,
      trigger: {
        tipo: 'primer_mensaje',
        keywords: []
      },
      prioridad: 15, // Mayor prioridad que el anterior
      mensajeInicial: '¡Hola! Te ayudo a encontrar productos en iCenter.',
      
      steps: [
        // PASO 1: EJECUTAR - Obtener sucursales de la API
        {
          id: 'ejecutar-sucursales',
          orden: 1,
          tipo: 'ejecutar',
          nombre: 'Cargar Sucursales',
          descripcion: 'Obtiene sucursales desde la API',
          nombreVariable: 'sucursales_data',
          endpointId: 'get-sucursales',
          mapeoParametros: {}
        },
        
        // PASO 2: RECOPILAR - Seleccionar sucursal (dinámico)
        {
          id: 'recopilar-sucursal',
          orden: 2,
          tipo: 'recopilar',
          nombre: 'Seleccionar Sucursal',
          descripcion: 'Usuario selecciona sucursal',
          pregunta: 'Selecciona la sucursal donde quieres buscar:',
          nombreVariable: 'sucursal_seleccionada',
          validacion: {
            tipo: 'opcion',
            requerido: true,
            mensajeError: 'Por favor selecciona una sucursal válida'
          },
          endpointResponseConfig: {
            arrayPath: 'sucursales_data',
            idField: 'id',
            displayField: 'nombre'
          }
        },
        
        // PASO 3: EJECUTAR - Obtener categorías
        {
          id: 'ejecutar-categorias',
          orden: 3,
          tipo: 'ejecutar',
          nombre: 'Cargar Categorías',
          descripcion: 'Obtiene categorías de la sucursal',
          nombreVariable: 'categorias_data',
          endpointId: 'get-categorias',
          mapeoParametros: {
            sucursal_id: 'sucursal_seleccionada'
          }
        },
        
        // PASO 4: RECOPILAR - Seleccionar categoría (dinámico)
        {
          id: 'recopilar-categoria',
          orden: 4,
          tipo: 'recopilar',
          nombre: 'Seleccionar Categoría',
          descripcion: 'Usuario selecciona categoría',
          pregunta: 'Selecciona la categoría de producto:',
          nombreVariable: 'categoria_seleccionada',
          validacion: {
            tipo: 'opcion',
            requerido: true,
            mensajeError: 'Por favor selecciona una categoría válida'
          },
          endpointResponseConfig: {
            arrayPath: 'categorias_data',
            idField: 'id',
            displayField: 'nombre'
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
        
        // PASO 6: EJECUTAR - Buscar productos
        {
          id: 'ejecutar-busqueda',
          orden: 6,
          tipo: 'ejecutar',
          nombre: 'Buscar Productos',
          descripcion: 'Busca productos con filtros',
          nombreVariable: 'productos_encontrados',
          endpointId: 'buscar-productos',
          mapeoParametros: {
            sucursal_id: 'sucursal_seleccionada',
            categoria_id: 'categoria_seleccionada',
            nombre: 'nombre_producto'
          }
        }
      ],
      
      // Template de respuesta final con variables
      respuestaTemplate: `🎫 **CONSULTA COMPLETADA - iCenter**

📍 **Sucursal:** {{sucursal_seleccionada}}
📂 **Categoría:** {{categoria_seleccionada}}
🔍 **Producto buscado:** {{nombre_producto}}

📦 **Resultados:**
{{productos_encontrados}}

✅ ¡Consulta finalizada! ¿Te ayudo con algo más?`,
      
      mensajeFinal: '✅ ¡Consulta completada exitosamente!',
      permitirAbandonar: true,
      mensajeAbandonar: '🚫 Consulta cancelada. ¡Vuelve cuando quieras!',
      timeoutMinutos: 15
    };
    
    // Remover workflows anteriores de iCenter
    if (!apiICenter.workflows) {
      apiICenter.workflows = [];
    }
    
    apiICenter.workflows = apiICenter.workflows.filter((w: any) => 
      !w.id?.includes('icenter') && !w.nombre?.toLowerCase().includes('icenter')
    );
    
    // Agregar nuevo workflow dinámico
    apiICenter.workflows.push(workflowDinamico as any);
    
    console.log('💾 Guardando workflow dinámico...');
    await apiICenter.save();
    
    console.log('\n✅ WORKFLOW DINÁMICO CREADO EXITOSAMENTE!');
    console.log('📋 Características:');
    console.log('   🔄 6 pasos (3 ejecutar + 3 recopilar)');
    console.log('   🌐 Opciones dinámicas desde APIs');
    console.log('   🔗 Filtros acumulativos entre pasos');
    console.log('   📱 Trigger: primer_mensaje');
    console.log('   ⚡ Prioridad: 15 (mayor que workflows anteriores)');
    
    console.log('\n📝 FLUJO CONFIGURADO:');
    console.log('   1. EJECUTAR: Cargar sucursales desde API');
    console.log('   2. RECOPILAR: Usuario selecciona sucursal (opciones dinámicas)');
    console.log('   3. EJECUTAR: Cargar categorías filtradas por sucursal');
    console.log('   4. RECOPILAR: Usuario selecciona categoría (opciones dinámicas)');
    console.log('   5. RECOPILAR: Usuario ingresa nombre de producto');
    console.log('   6. EJECUTAR: Buscar productos con todos los filtros');
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('   1. Reiniciar backend para cargar nuevo workflow');
    console.log('   2. Probar desde WhatsApp con número nuevo');
    console.log('   3. Verificar que las opciones sean dinámicas');
    console.log('   4. Confirmar que el flujo continúe hasta el final');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado');
  }
}

createDynamicWorkflow();
