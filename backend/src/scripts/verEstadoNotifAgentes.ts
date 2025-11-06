// 📋 Ver estado de notificación diaria de agentes
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

async function verEstado() {
  try {
    await connectDB();
    
    const config = await ConfiguracionModuloModel.findOne({ empresaId: 'San Jose' });
    
    if (!config) {
      console.log('❌ No se encontró configuración para San Jose');
      process.exit(1);
    }
    
    console.log('\n📊 ESTADO ACTUAL:\n');
    console.log('notificacionDiariaAgentes:', JSON.stringify(config.notificacionDiariaAgentes, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verEstado();
