// 🚀 SCRIPT SIMPLE PARA CREAR WORKFLOW DE iCenter

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';

// Cargar variables de entorno
dotenv.config();

async function createSimpleWorkflow() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await connectDB();
    
    console.log('📋 Buscando APIs...');
    const apis = await ApiConfigurationModel.find({});
    
    console.log(`✅ Encontradas ${apis.length} APIs:`);
    apis.forEach((api, i) => {
      console.log(`  ${i+1}. ${api.nombre} (${api.empresaId})`);
    });
    
    // Buscar o crear API de iCenter
    let apiICenter = apis.find(api => 
      (api.empresaId && api.empresaId.toString().toLowerCase().includes('icenter')) || 
      (api.nombre && api.nombre.toLowerCase().includes('icenter'))
    );
    
    if (!apiICenter) {
      console.log('❌ No encontré API de iCenter. Usando la primera API disponible...');
      apiICenter = apis[0];
      if (!apiICenter) {
        console.log('❌ No hay APIs disponibles');
        return;
      }
    }
    
    console.log(`🎯 Usando API: ${apiICenter.nombre} (ID: ${apiICenter._id})`);
    
    // Crear workflow simple
    const workflow = {
      id: 'workflow-icenter-simple',
      nombre: 'iCenter - Consulta Productos',
      descripcion: 'Flujo para consultar productos',
      activo: true,
      trigger: {
        tipo: 'primer_mensaje',
        keywords: []
      },
      prioridad: 10,
      mensajeInicial: '¡Hola! Te ayudo a encontrar productos en iCenter.',
      steps: [
        {
          id: 'paso-1',
          orden: 1,
          tipo: 'recopilar',
          nombre: 'Seleccionar Sucursal',
          pregunta: 'Selecciona una sucursal:\n\n1. Centro\n2. Norte\n3. Sur',
          nombreVariable: 'sucursal',
          validacion: {
            tipo: 'opcion',
            opciones: ['1', '2', '3'],
            requerido: true
          }
        },
        {
          id: 'paso-2',
          orden: 2,
          tipo: 'recopilar',
          nombre: 'Seleccionar Categoría',
          pregunta: 'Selecciona una categoría:\n\n1. Electrónicos\n2. Ropa\n3. Hogar',
          nombreVariable: 'categoria',
          validacion: {
            tipo: 'opcion',
            opciones: ['1', '2', '3'],
            requerido: true
          }
        },
        {
          id: 'paso-3',
          orden: 3,
          tipo: 'recopilar',
          nombre: 'Nombre del Producto',
          pregunta: 'Escribe el nombre del producto que buscas:',
          nombreVariable: 'producto',
          validacion: {
            tipo: 'texto',
            requerido: true
          }
        }
      ],
      respuestaTemplate: `🎫 **CONSULTA iCenter**

📍 Sucursal: {{sucursal}}
📂 Categoría: {{categoria}}
🔍 Producto: {{producto}}

✅ ¡Consulta registrada!`,
      permitirAbandonar: true
    };
    
    // Agregar workflow
    if (!apiICenter.workflows) {
      apiICenter.workflows = [];
    }
    
    // Remover workflow existente si existe
    apiICenter.workflows = apiICenter.workflows.filter((w: any) => w.id !== workflow.id);
    
    // Agregar nuevo workflow
    apiICenter.workflows.push(workflow as any);
    
    console.log('💾 Guardando workflow...');
    await apiICenter.save();
    
    console.log('✅ WORKFLOW CREADO EXITOSAMENTE!');
    console.log(`📋 API: ${apiICenter.nombre}`);
    console.log(`🔄 Workflows totales: ${apiICenter.workflows.length}`);
    console.log(`🎯 Workflow: ${workflow.nombre}`);
    console.log(`⚡ Activo: ${workflow.activo}`);
    console.log(`🔥 Trigger: ${workflow.trigger.tipo}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado');
  }
}

createSimpleWorkflow();
