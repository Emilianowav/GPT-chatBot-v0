// ✅ SCRIPT PARA AGREGAR PASO DE CONFIRMACIÓN AL WORKFLOW

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';

dotenv.config();

async function addConfirmationStep() {
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
    console.log(`📊 Pasos actuales: ${workflow.steps.length}`);
    
    // Reordenar pasos: insertar confirmación antes del paso final
    const pasos = workflow.steps;
    
    // Encontrar el paso final (EJECUTAR)
    const pasoFinalIndex = pasos.findIndex((p: any) => p.tipo === 'ejecutar');
    
    if (pasoFinalIndex === -1) {
      console.log('❌ No se encontró paso final');
      return;
    }
    
    console.log(`\n🔍 Paso final encontrado en posición: ${pasoFinalIndex + 1}`);
    
    // Crear paso de confirmación
    const pasoConfirmacion = {
      id: 'confirmar-datos',
      orden: pasos[pasoFinalIndex].orden, // Toma el orden del paso final
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
        tipo: 'opcion',
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
    
    // Actualizar orden del paso final
    pasos[pasoFinalIndex].orden = pasos[pasoFinalIndex].orden + 1;
    
    // Insertar paso de confirmación
    pasos.splice(pasoFinalIndex, 0, pasoConfirmacion as any);
    
    // Reordenar todos los pasos
    pasos.forEach((paso: any, index: number) => {
      paso.orden = index + 1;
    });
    
    console.log('\n💾 Guardando cambios...');
    await apiICenter.save();
    
    console.log('\n✅ PASO DE CONFIRMACIÓN AGREGADO!');
    console.log('\n📋 NUEVO FLUJO:');
    pasos.forEach((paso: any) => {
      console.log(`   ${paso.orden}. ${paso.nombre} (${paso.tipo})`);
    });
    
    console.log('\n🎯 FLUJO DE CONFIRMACIÓN:');
    console.log('   Usuario elige opción 1 → Continúa a búsqueda');
    console.log('   Usuario elige opción 2-4 → Vuelve al paso correspondiente');
    console.log('   Usuario elige opción 5 → Cancela workflow');
    
    console.log('\n⚠️ NOTA: Se necesita implementar la lógica de navegación');
    console.log('   en workflowConversationalHandler.ts');
    
    console.log('\n🚀 PRÓXIMO PASO: Implementar lógica de confirmación');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado');
  }
}

addConfirmationStep();
