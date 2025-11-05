// Script para corregir diasAntes de 24 a 1 en notificaciones
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

dotenv.config();

async function corregirDiasAntes() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    // Buscar todas las configuraciones con notificaciones
    const configuraciones = await ConfiguracionModuloModel.find({
      'notificaciones.diasAntes': 24
    });

    console.log(`📋 Configuraciones encontradas con diasAntes=24: ${configuraciones.length}\n`);

    for (const config of configuraciones) {
      console.log(`🏢 Empresa: ${config.empresaId}`);
      
      let cambios = 0;
      for (const notif of config.notificaciones) {
        if (notif.diasAntes === 24) {
          console.log(`   🔔 Notificación: ${notif.tipo} - ${notif.momento}`);
          console.log(`      ❌ ANTES: diasAntes = 24`);
          notif.diasAntes = 1;
          console.log(`      ✅ AHORA: diasAntes = 1`);
          cambios++;
        }
      }

      if (cambios > 0) {
        await config.save();
        console.log(`   💾 Guardado: ${cambios} notificación(es) corregida(s)\n`);
      }
    }

    console.log('✅ Corrección completada');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

corregirDiasAntes();
