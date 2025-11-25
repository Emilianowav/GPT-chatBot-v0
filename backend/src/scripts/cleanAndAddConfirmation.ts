// 🔧 SCRIPT PARA LIMPIAR Y AGREGAR PASO DE CONFIRMACIÓN

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';

dotenv.config();

async function cleanAndAddConfirmation() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await connectDB();
    
    const apis = await ApiConfigurationModel.find({});
    let apiICenter = apis.find(api => 
      (api.empresaId && api.empresaId.toString().toLowerCase().includes('icenter')) || 
      (api.nombre && api.nombre.toLowerCase().includes('icenter'))
    );
    
    if (!apiICenter) {
      console.log('❌ No se encontró API de iCenter');
      return;
    }
    
    const workflow = apiICenter.workflows?.find((w: any) => 
      w.id === 'workflow-icenter-correcto'
    );
    
    if (!workflow) {
      console.log('❌ No se encontró el workflow');
      return;
    }
    
    console.log(`📋 Workflow: ${workflow.nombre}`);
    console.log(`📊 Pasos antes: ${workflow.steps.length}`);
    
    // ELIMINAR TODOS los pasos de confirmación
    workflow.steps = workflow.steps.filter((p: any) => 
      p.id !== 'confirmar-datos' && p.nombre !== 'Confirmar Datos'
    );
    
    console.log(`📊 Pasos después de limpiar: ${workflow.steps.length}`);
    
    // Encontrar el paso EJECUTAR
    const pasoEjecutarIndex = workflow.steps.findIndex((p: any) => p.tipo === 'ejecutar');
    
    if (pasoEjecutarIndex === -1) {
      console.log('❌ No se encontró paso EJECUTAR');
      return;
    }
    
    // Crear NUEVO paso de confirmación
    const pasoConfirmacion = {
      id: 'confirmar-datos',
      orden: pasoEjecutarIndex + 1,
      tipo: 'recopilar' as 'recopilar',
      nombre: 'Confirmar Datos',
      descripcion: 'Usuario confirma los datos ingresados',
      pregunta: `📋 *CONFIRMA TUS DATOS*

📍 *Sucursal:* {{sucursal_id_nombre}}
📂 *Categoría:* {{categoria_id_nombre}}
🔍 *Producto:* {{nombre_producto}}

¿Los datos son correctos?

1️⃣ Confirmar y buscar
2️⃣ Cambiar sucursal
3️⃣ Cambiar categoría  
4️⃣ Cambiar producto
5️⃣ Cancelar búsqueda`,
      nombreVariable: 'confirmacion',
      validacion: {
        tipo: 'opcion' as 'opcion',
        requerido: true,
        opciones: [
          '1: Confirmar y buscar',
          '2: Cambiar sucursal',
          '3: Cambiar categoría',
          '4: Cambiar producto',
          '5: Cancelar búsqueda'
        ],
        mensajeError: 'Por favor selecciona una opción válida (1-5)'
      }
    };
    
    // Insertar antes del paso EJECUTAR
    workflow.steps.splice(pasoEjecutarIndex, 0, pasoConfirmacion as any);
    
    // Reordenar
    workflow.steps.forEach((paso: any, index: number) => {
      paso.orden = index + 1;
    });
    
    console.log('\n💾 Guardando...');
    await apiICenter.save();
    
    console.log('\n✅ COMPLETADO!');
    console.log('\n📋 FLUJO FINAL:');
    workflow.steps.forEach((paso: any) => {
      console.log(`   ${paso.orden}. ${paso.nombre} (${paso.tipo})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado');
  }
}

cleanAndAddConfirmation();
