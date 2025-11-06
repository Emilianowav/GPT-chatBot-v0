import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

async function resetear() {
  await connectDB();
  
  const config = await ConfiguracionModuloModel.findOne({ empresaId: 'San Jose' });
  
  if (!config) {
    console.log('❌ No se encontró configuración');
    process.exit(1);
  }
  
  console.log('📋 ultimoEnvio actual:', config.notificacionDiariaAgentes?.ultimoEnvio);
  
  if (config.notificacionDiariaAgentes) {
    config.notificacionDiariaAgentes.ultimoEnvio = undefined;
    
    (config as any).markModified('notificacionDiariaAgentes');
    await config.save();
    
    console.log('✅ ultimoEnvio reseteado');
  }
  
  process.exit(0);
}

resetear();
