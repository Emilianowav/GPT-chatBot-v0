// Script para limpiar notificaciones de TODOS los turnos pendientes
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TurnoModel } from '../modules/calendar/models/Turno.js';

dotenv.config();

async function limpiarNotificaciones() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    console.log('📍 URI:', process.env.MONGODB_URI?.substring(0, 50) + '...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    console.log('📅 Buscando TODOS los turnos pendientes...');

    // Buscar TODOS los turnos pendientes (sin filtro de fecha)
    const turnos = await TurnoModel.find({
      empresaId: 'San Jose',
      estado: { $in: ['pendiente', 'no_confirmado'] }
    }).populate('clienteId').sort({ fechaInicio: 1 });

    console.log(`📊 Encontrados ${turnos.length} turnos pendientes\n`);

    if (turnos.length === 0) {
      console.log('⚠️ No hay turnos pendientes para limpiar');
      return;
    }

    let limpiados = 0;
    const turnosPorFecha: Record<string, any[]> = {};

    // Agrupar por fecha
    for (const turno of turnos) {
      const fechaInicio = new Date(turno.fechaInicio);
      const fechaStr = fechaInicio.toISOString().split('T')[0];
      
      if (!turnosPorFecha[fechaStr]) {
        turnosPorFecha[fechaStr] = [];
      }
      
      turnosPorFecha[fechaStr].push(turno);
    }

    // Mostrar por fecha
    for (const [fecha, turnosDia] of Object.entries(turnosPorFecha)) {
      console.log(`\n📅 ${fecha} (${turnosDia.length} turnos)`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      for (const turno of turnosDia) {
        const fechaInicio = new Date(turno.fechaInicio);
        const hora = `${fechaInicio.getUTCHours().toString().padStart(2, '0')}:${fechaInicio.getUTCMinutes().toString().padStart(2, '0')}`;
        
        const cliente = turno.clienteId as any;
        const nombreCliente = cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Sin cliente';
        
        console.log(`\n  🔔 ${hora} - ${nombreCliente}`);
        console.log(`     ID: ${turno._id}`);
        console.log(`     Estado: ${turno.estado}`);
        console.log(`     Notificaciones: ${turno.notificaciones?.length || 0}`);
        
        if (turno.notificaciones && turno.notificaciones.length > 0) {
          // Mostrar detalles de notificaciones
          turno.notificaciones.forEach((notif: any, i: number) => {
            console.log(`       ${i + 1}. ${notif.tipo} - Enviada: ${notif.enviada}`);
          });
          
          // Limpiar notificaciones
          turno.notificaciones = [];
          await turno.save();
          limpiados++;
          console.log(`     ✅ Notificaciones limpiadas`);
        } else {
          console.log(`     ℹ️ Sin notificaciones`);
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
