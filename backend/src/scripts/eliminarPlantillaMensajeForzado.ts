import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

async function eliminar() {
  await connectDB();
  
  console.log('🔍 Buscando configuración...');
  const config = await ConfiguracionModuloModel.findOne({ empresaId: 'San Jose' });
  
  if (!config) {
    console.log('❌ No se encontró configuración');
    process.exit(1);
  }
  
  console.log('📋 plantillaMensaje actual:', config.notificacionDiariaAgentes?.plantillaMensaje);
  
  if (config.notificacionDiariaAgentes) {
    // Eliminar usando $unset para asegurar que se borre
    await ConfiguracionModuloModel.updateOne(
      { empresaId: 'San Jose' },
      { $unset: { 'notificacionDiariaAgentes.plantillaMensaje': '' } }
    );
    
    console.log('✅ Campo plantillaMensaje eliminado con $unset');
    
    // Verificar que se eliminó
    const configVerificacion = await ConfiguracionModuloModel.findOne({ empresaId: 'San Jose' });
    console.log('🔍 Verificación - plantillaMensaje después de eliminar:', configVerificacion?.notificacionDiariaAgentes?.plantillaMensaje);
    
    if (configVerificacion?.notificacionDiariaAgentes?.plantillaMensaje) {
      console.log('❌ ERROR: El campo NO se eliminó');
    } else {
      console.log('✅ CONFIRMADO: Campo eliminado exitosamente');
    }
  }
  
  process.exit(0);
}

eliminar();
