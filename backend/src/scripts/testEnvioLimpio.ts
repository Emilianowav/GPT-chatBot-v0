import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { enviarNotificacionDiariaAgente } from '../services/notificacionesDiariasAgentes.js';

async function test() {
  console.log('🧪 TEST DE ENVÍO LIMPIO - Sin código antiguo\n');
  
  await connectDB();
  
  const empresaId = 'San Jose';
  const agenteId = '66f9b6c7f0d8a0001c8e4567'; // Reemplaza con el ID real del agente
  
  console.log('📤 Enviando notificación de prueba...\n');
  console.log('⚠️ IMPORTANTE: Este script usa SOLO el código nuevo');
  console.log('   Si recibes un mensaje con "¡Que tengas un excelente día! 💪"');
  console.log('   significa que hay OTRO proceso enviando mensajes\n');
  
  try {
    await enviarNotificacionDiariaAgente(empresaId, agenteId);
    console.log('\n✅ Notificación enviada desde código LIMPIO');
    console.log('   Verifica el mensaje recibido');
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

test();
