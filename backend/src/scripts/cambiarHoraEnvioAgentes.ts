import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

async function cambiar() {
  await connectDB();
  
  // Obtener hora actual + 2 minutos
  const ahora = new Date();
  const ahoraArgentina = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
  ahoraArgentina.setMinutes(ahoraArgentina.getMinutes() + 2);
  
  const hora = String(ahoraArgentina.getHours()).padStart(2, '0');
  const minuto = String(ahoraArgentina.getMinutes()).padStart(2, '0');
  const nuevaHora = `${hora}:${minuto}`;
  
  console.log(`🕐 Cambiando hora de envío a: ${nuevaHora} (Argentina)`);
  
  await ConfiguracionModuloModel.updateOne(
    { empresaId: 'San Jose' },
    { $set: { 'notificacionDiariaAgentes.horaEnvio': nuevaHora } }
  );
  
  console.log('✅ Hora actualizada');
  console.log(`⏰ La notificación se enviará en aproximadamente 2 minutos`);
  
  process.exit(0);
}

cambiar();
