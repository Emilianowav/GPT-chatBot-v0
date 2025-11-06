import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

async function eliminar() {
  await connectDB();
  
  const config = await ConfiguracionModuloModel.findOne({ empresaId: 'San Jose' });
  
  if (!config) {
    console.log('❌ No se encontró configuración');
    process.exit(1);
  }
  
  console.log('📋 plantillaMensaje actual:', config.notificacionDiariaAgentes?.plantillaMensaje);
  
  if (config.notificacionDiariaAgentes) {
    // Eliminar el campo plantillaMensaje
    config.notificacionDiariaAgentes.plantillaMensaje = undefined;
    
    (config as any).markModified('notificacionDiariaAgentes');
    await config.save();
    
    console.log('✅ Campo plantillaMensaje eliminado');
    console.log('💡 Ahora SOLO se usará la plantilla de Meta');
  }
  
  process.exit(0);
}

eliminar();
