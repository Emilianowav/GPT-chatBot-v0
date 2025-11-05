// Script para ver todos los turnos de hoy
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TurnoModel } from '../modules/calendar/models/Turno.js';

dotenv.config();

async function verTurnosHoy() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    // Buscar TODOS los turnos del 6 de noviembre
    const turnos = await TurnoModel.find({
      empresaId: 'San Jose',
      fechaInicio: {
        $gte: new Date('2025-11-06T00:00:00.000Z'),
        $lte: new Date('2025-11-06T23:59:59.999Z')
      }
    }).populate('clienteId');

    console.log(`📋 Total turnos del 6/11: ${turnos.length}\n`);

    turnos.forEach((turno, index) => {
      const fechaInicio = new Date(turno.fechaInicio);
      const hora = `${fechaInicio.getUTCHours().toString().padStart(2, '0')}:${fechaInicio.getUTCMinutes().toString().padStart(2, '0')}`;
      const cliente = turno.clienteId as any;
      
      console.log(`${index + 1}. ${hora} - Estado: ${turno.estado}`);
      console.log(`   Cliente: ${cliente?.nombre || 'Sin nombre'} ${cliente?.apellido || ''}`);
      console.log(`   Teléfono: ${cliente?.telefono || 'Sin teléfono'}`);
      console.log(`   Origen: ${turno.datos?.origen || 'N/A'}`);
      console.log(`   Destino: ${turno.datos?.destino || 'N/A'}`);
      console.log(`   Notificaciones: ${turno.notificaciones?.length || 0}`);
      
      if (turno.notificaciones && turno.notificaciones.length > 0) {
        turno.notificaciones.forEach((notif, i) => {
          console.log(`      ${i + 1}. ${notif.tipo} - Enviada: ${notif.enviadaEn}`);
        });
      }
      
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

verTurnosHoy();
