import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

async function cambiar() {
  await connectDB();
  
  const config = await ConfiguracionModuloModel.findOne({ empresaId: 'San Jose' });
  
  if (!config) {
    console.log('❌ No se encontró configuración');
    process.exit(1);
  }
  
  console.log('📋 Configuración actual:');
  console.log('   rangoHorario:', config.notificacionDiariaAgentes?.rangoHorario);
  
  // Cambiar a "manana" para que busque turnos del día siguiente
  if (config.notificacionDiariaAgentes) {
    config.notificacionDiariaAgentes.rangoHorario = {
      activo: true,
      tipo: 'manana'
    };
    
    (config as any).markModified('notificacionDiariaAgentes');
    await config.save();
    
    console.log('\n✅ Configuración actualizada:');
    console.log('   rangoHorario:', config.notificacionDiariaAgentes.rangoHorario);
    console.log('\n💡 Ahora buscará turnos de MAÑANA en lugar de HOY');
  }
  
  process.exit(0);
}

cambiar();
