// 🟢 Script para ACTIVAR notificaciones diarias de agentes
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

async function activarNotificacionesDiariasAgentes() {
  try {
    console.log('🟢 Activando notificaciones diarias de agentes...\n');
    
    await connectDB();
    
    const EMPRESA_ID = 'San Jose';
    
    console.log(`🏢 Empresa: ${EMPRESA_ID}\n`);
    
    const config = await ConfiguracionModuloModel.findOne({ empresaId: EMPRESA_ID });
    
    if (!config) {
      console.log('❌ No se encontró configuración para esta empresa');
      process.exit(1);
    }
    
    if (!config.notificacionDiariaAgentes) {
      console.log('❌ Esta empresa no tiene configurada la notificación diaria de agentes');
      process.exit(1);
    }
    
    const estadoAnterior = config.notificacionDiariaAgentes.activa;
    
    console.log(`📋 Estado actual: ${estadoAnterior ? '✅ ACTIVA' : '❌ INACTIVA'}`);
    
    if (estadoAnterior) {
      console.log('\nℹ️  Las notificaciones ya están activas. No hay nada que hacer.');
      process.exit(0);
    }
    
    // Activar
    config.notificacionDiariaAgentes.activa = true;
    
    // Marcar como modificado y guardar
    (config as any).markModified('notificacionDiariaAgentes');
    await config.save();
    
    console.log('\n✅ Notificaciones diarias de agentes ACTIVADAS exitosamente');
    console.log('🟢 Los mensajes automáticos se enviarán según la configuración');
    console.log(`   Hora de envío: ${config.notificacionDiariaAgentes.horaEnvio}`);
    console.log(`   Días: ${config.notificacionDiariaAgentes.frecuencia?.diasSemana?.join(', ') || 'Todos'}`);
    console.log('\n💡 Para desactivarlas, usa: npm run desactivar:notif-diaria-agentes\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

activarNotificacionesDiariasAgentes();
