// Script para ver configuración actual de notificaciones
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

dotenv.config();

async function verConfigNotificaciones() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    // Buscar todas las configuraciones
    const configuraciones = await ConfiguracionModuloModel.find({});

    console.log(`📋 Configuraciones encontradas: ${configuraciones.length}\n`);

    for (const config of configuraciones) {
      console.log(`🏢 Empresa: ${config.empresaId}`);
      console.log(`   Activo: ${config.activo}`);
      console.log(`   Notificaciones: ${config.notificaciones?.length || 0}\n`);
      
      if (config.notificaciones && config.notificaciones.length > 0) {
        for (const notif of config.notificaciones) {
          console.log(`   🔔 Notificación:`);
          console.log(`      Tipo: ${notif.tipo}`);
          console.log(`      Momento: ${notif.momento}`);
          console.log(`      Activa: ${notif.activa}`);
          console.log(`      Ejecución: ${notif.ejecucion}`);
          
          if (notif.momento === 'dia_antes_turno') {
            console.log(`      ⭐ diasAntes: ${notif.diasAntes}`);
            console.log(`      ⭐ horaEnvioDiaAntes: ${notif.horaEnvioDiaAntes}`);
          }
          
          if (notif.momento === 'horas_antes_turno') {
            console.log(`      ⭐ horasAntesTurno: ${notif.horasAntesTurno}`);
          }
          
          console.log('');
        }
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

verConfigNotificaciones();
