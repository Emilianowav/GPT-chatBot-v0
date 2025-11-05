// Script para limpiar notificaciones de turnos pendientes
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TurnoModel } from '../modules/calendar/models/Turno.js';

dotenv.config();

async function limpiarNotificaciones() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    // Buscar turnos pendientes con notificaciones
    const turnos = await TurnoModel.find({
      empresaId: 'San Jose',
      estado: { $in: ['pendiente', 'no_confirmado'] },
      fechaInicio: {
        $gte: new Date('2025-11-06T00:00:00.000Z'),
        $lte: new Date('2025-11-06T23:59:59.999Z')
      }
    });

    console.log(`📋 Turnos pendientes encontrados: ${turnos.length}\n`);

    for (const turno of turnos) {
      const fechaInicio = new Date(turno.fechaInicio);
      const hora = `${fechaInicio.getUTCHours().toString().padStart(2, '0')}:${fechaInicio.getUTCMinutes().toString().padStart(2, '0')}`;
      
      console.log(`🔔 Turno: ${hora} - Estado: ${turno.estado}`);
      console.log(`   Notificaciones actuales: ${turno.notificaciones?.length || 0}`);
      
      if (turno.notificaciones && turno.notificaciones.length > 0) {
        turno.notificaciones.forEach((notif, index) => {
          console.log(`      ${index + 1}. Tipo: ${notif.tipo}, Enviada: ${notif.enviadaEn}`);
        });
        
        // Limpiar notificaciones
        turno.notificaciones = [];
        await turno.save();
        console.log(`   ✅ Notificaciones limpiadas\n`);
      } else {
        console.log(`   ℹ️  Sin notificaciones\n`);
      }
    }

    console.log('✅ Limpieza completada');
    console.log('\n📊 Resumen:');
    console.log(`   Total turnos procesados: ${turnos.length}`);
    console.log(`   Turnos limpiados: ${turnos.filter(t => t.notificaciones && t.notificaciones.length > 0).length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

limpiarNotificaciones();
