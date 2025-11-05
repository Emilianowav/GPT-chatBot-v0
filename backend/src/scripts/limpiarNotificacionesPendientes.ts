// Script para limpiar notificaciones de turnos pendientes específicos
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TurnoModel } from '../modules/calendar/models/Turno.js';

dotenv.config();

async function limpiarNotificaciones() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    // IDs de los turnos pendientes que queremos limpiar
    const turnosPendientes = [
      '690aeb964a9bdd74cc297f7f', // 15:00
      '690aec1d4a9bdd74cc29801d', // 17:00
      '690acd594b94d0151a7af577', // 17:30
      '690ae9594a9bdd74cc297e3f', // 17:50
      '690ae99f4a9bdd74cc297e5e'  // 19:00
    ];

    console.log(`📋 Limpiando notificaciones de ${turnosPendientes.length} turnos...\n`);

    for (const turnoId of turnosPendientes) {
      const turno = await TurnoModel.findById(turnoId);
      
      if (!turno) {
        console.log(`❌ Turno ${turnoId} no encontrado`);
        continue;
      }

      const fechaInicio = new Date(turno.fechaInicio);
      const hora = `${fechaInicio.getUTCHours().toString().padStart(2, '0')}:${fechaInicio.getUTCMinutes().toString().padStart(2, '0')}`;
      
      console.log(`🔔 Turno: ${hora} - Estado: ${turno.estado}`);
      console.log(`   Notificaciones antes: ${turno.notificaciones?.length || 0}`);
      
      // Limpiar notificaciones
      turno.notificaciones = [];
      await turno.save();
      
      console.log(`   ✅ Notificaciones limpiadas\n`);
    }

    console.log('✅ Limpieza completada');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

limpiarNotificaciones();
