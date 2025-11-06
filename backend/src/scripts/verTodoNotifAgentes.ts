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
  
  console.log('\n\n📋 TODAS LAS NOTIFICACIONES EN EL ARRAY:\n');
  config.notificaciones?.forEach((notif, index) => {
    console.log(`\n${index + 1}. Tipo: ${notif.tipo}`);
    console.log(`   Activa: ${notif.activa}`);
    console.log(`   Momento: ${notif.momento}`);
    console.log(`   plantillaMensaje: "${notif.plantillaMensaje?.substring(0, 100)}..."`);
    console.log(`   usarPlantillaMeta: ${notif.usarPlantillaMeta}`);
    console.log(`   plantillaMeta:`, notif.plantillaMeta);
  });
  
  process.exit(0);
}

ver();
