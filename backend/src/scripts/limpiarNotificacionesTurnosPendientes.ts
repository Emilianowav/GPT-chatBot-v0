// Script para limpiar notificaciones de turnos pendientes de mañana
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TurnoModel } from '../modules/calendar/models/Turno.js';

dotenv.config();

async function limpiarNotificaciones() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    // Fecha de mañana (6 de noviembre)
    const manana = new Date('2025-11-06T00:00:00.000Z');
    const finManana = new Date('2025-11-06T23:59:59.999Z');

    console.log('📅 Buscando turnos pendientes para mañana...');
    console.log('   Desde:', manana.toISOString());
    console.log('   Hasta:', finManana.toISOString());
    console.log('');

    // Buscar turnos pendientes de mañana
    const turnos = await TurnoModel.find({
      empresaId: 'San Jose',
      estado: { $in: ['pendiente', 'no_confirmado'] },
      fechaInicio: {
        $gte: manana,
        $lte: finManana
      }
    }).populate('clienteId');

    console.log(`📊 Encontrados ${turnos.length} turnos pendientes\n`);

    if (turnos.length === 0) {
      console.log('⚠️ No hay turnos pendientes para limpiar');
      return;
    }

    let limpiados = 0;

    for (const turno of turnos) {
      const fechaInicio = new Date(turno.fechaInicio);
      const hora = `${fechaInicio.getUTCHours().toString().padStart(2, '0')}:${fechaInicio.getUTCMinutes().toString().padStart(2, '0')}`;
      
      const cliente = turno.clienteId as any;
      const nombreCliente = cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Sin cliente';
      
      console.log(`🔔 Turno: ${hora} - ${nombreCliente}`);
      console.log(`   ID: ${turno._id}`);
      console.log(`   Estado: ${turno.estado}`);
      console.log(`   Notificaciones antes: ${turno.notificaciones?.length || 0}`);
      
      if (turno.notificaciones && turno.notificaciones.length > 0) {
        // Limpiar notificaciones
        turno.notificaciones = [];
        await turno.save();
        limpiados++;
        console.log(`   ✅ Notificaciones limpiadas\n`);
      } else {
        console.log(`   ℹ️ Ya sin notificaciones\n`);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Limpieza completada`);
    console.log(`   Total turnos: ${turnos.length}`);
    console.log(`   Limpiados: ${limpiados}`);
    console.log(`   Sin cambios: ${turnos.length - limpiados}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

limpiarNotificaciones();
