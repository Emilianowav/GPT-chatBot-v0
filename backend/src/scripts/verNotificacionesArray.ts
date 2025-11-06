import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

async function ver() {
  await connectDB();
  const config = await ConfiguracionModuloModel.findOne({ empresaId: 'San Jose' });
  console.log('\n📋 Notificaciones en array notificaciones:');
  config?.notificaciones.forEach((n: any, i: number) => {
    console.log(`\n${i + 1}. Tipo: ${n.tipo}`);
    console.log(`   Destinatario: ${n.destinatario}`);
    console.log(`   Activa: ${n.activa}`);
    console.log(`   Momento: ${n.momento}`);
    console.log(`   Ejecución: ${n.ejecucion}`);
  });
  process.exit(0);
}

ver();
