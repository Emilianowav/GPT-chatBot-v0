import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

async function ver() {
  await connectDB();
  
  const config = await ConfiguracionModuloModel.findOne({ empresaId: 'San Jose' });
  
  if (!config) {
    console.log('❌ No se encontró configuración');
    process.exit(1);
  }
  
  console.log('\n📋 CONFIGURACIÓN COMPLETA DE NOTIFICACIÓN DIARIA AGENTES:\n');
  console.log(JSON.stringify(config.notificacionDiariaAgentes, null, 2));
  
  console.log('\n🔍 CAMPO plantillaMensaje:');
  console.log('Tipo:', typeof config.notificacionDiariaAgentes?.plantillaMensaje);
  console.log('Valor:', `"${config.notificacionDiariaAgentes?.plantillaMensaje}"`);
  console.log('Longitud:', config.notificacionDiariaAgentes?.plantillaMensaje?.length);
  
  process.exit(0);
}

ver();
