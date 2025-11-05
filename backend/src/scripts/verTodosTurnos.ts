// Script para ver TODOS los turnos
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TurnoModel } from '../modules/calendar/models/Turno.js';

dotenv.config();

async function verTodosTurnos() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    // Buscar TODOS los turnos
    const turnos = await TurnoModel.find({
      empresaId: 'San Jose'
    }).populate('clienteId').sort({ fechaInicio: 1 });

    console.log(`📋 Total turnos: ${turnos.length}\n`);

    // Agrupar por fecha
    const turnosPorFecha: { [key: string]: any[] } = {};
    
    turnos.forEach(turno => {
      const fechaInicio = new Date(turno.fechaInicio);
      const fechaKey = fechaInicio.toISOString().split('T')[0];
      
      if (!turnosPorFecha[fechaKey]) {
        turnosPorFecha[fechaKey] = [];
      }
      turnosPorFecha[fechaKey].push(turno);
    });

    // Mostrar por fecha
    Object.keys(turnosPorFecha).sort().forEach(fecha => {
      console.log(`\n📅 ${fecha}`);
      console.log('━'.repeat(50));
      
      turnosPorFecha[fecha].forEach((turno, index) => {
        const fechaInicio = new Date(turno.fechaInicio);
        const hora = `${fechaInicio.getUTCHours().toString().padStart(2, '0')}:${fechaInicio.getUTCMinutes().toString().padStart(2, '0')}`;
        const cliente = turno.clienteId as any;
        
        console.log(`\n${index + 1}. ${hora} - Estado: ${turno.estado}`);
        console.log(`   Cliente: ${cliente?.nombre || 'Sin nombre'} ${cliente?.apellido || ''}`);
        console.log(`   Teléfono: ${cliente?.telefono || 'Sin teléfono'}`);
        console.log(`   Origen: ${turno.datos?.origen || 'N/A'} → Destino: ${turno.datos?.destino || 'N/A'}`);
        console.log(`   Notificaciones: ${turno.notificaciones?.length || 0}`);
        
        if (turno.notificaciones && turno.notificaciones.length > 0) {
          turno.notificaciones.forEach((notif, i) => {
            const enviadaEn = new Date(notif.enviadaEn);
            console.log(`      ${i + 1}. ${notif.tipo} - ${enviadaEn.toISOString()}`);
          });
        }
      });
    });

    // Resumen
    console.log('\n\n📊 RESUMEN:');
    console.log('━'.repeat(50));
    const pendientes = turnos.filter(t => t.estado === 'pendiente' || t.estado === 'no_confirmado');
    const confirmados = turnos.filter(t => t.estado === 'confirmado');
    const completados = turnos.filter(t => t.estado === 'completado');
    const cancelados = turnos.filter(t => t.estado === 'cancelado');
    
    console.log(`Total: ${turnos.length}`);
    console.log(`Pendientes: ${pendientes.length}`);
    console.log(`Confirmados: ${confirmados.length}`);
    console.log(`Completados: ${completados.length}`);
    console.log(`Cancelados: ${cancelados.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

verTodosTurnos();
