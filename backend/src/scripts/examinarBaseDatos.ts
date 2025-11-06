import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

async function examinar() {
  await connectDB();
  
  const config = await ConfiguracionModuloModel.findOne({ empresaId: 'San Jose' }).lean();
  
  if (!config) {
    console.log('❌ No se encontró configuración');
    process.exit(1);
  }
  
  console.log('\n🔍 EXAMEN COMPLETO DE notificacionDiariaAgentes:\n');
  console.log(JSON.stringify(config.notificacionDiariaAgentes, null, 2));
  
  console.log('\n\n🔍 EXAMEN COMPLETO DE notificaciones (array):\n');
  console.log(JSON.stringify(config.notificaciones, null, 2));
  
  console.log('\n\n🔍 Buscando texto "Buenos días" en toda la configuración:\n');
  const configStr = JSON.stringify(config, null, 2);
  const lineas = configStr.split('\n');
  lineas.forEach((linea, i) => {
    if (linea.toLowerCase().includes('buenos') || linea.toLowerCase().includes('excelente')) {
      console.log(`Línea ${i}: ${linea}`);
    }
  });
  
  process.exit(0);
}

examinar();
