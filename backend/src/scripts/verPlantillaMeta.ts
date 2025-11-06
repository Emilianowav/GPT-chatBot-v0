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
  
  console.log('\n📋 CONFIGURACIÓN DE PLANTILLA META:\n');
  console.log('usarPlantillaMeta:', config.notificacionDiariaAgentes?.usarPlantillaMeta);
  console.log('plantillaMeta:', JSON.stringify(config.notificacionDiariaAgentes?.plantillaMeta, null, 2));
  
  process.exit(0);
}

ver();
