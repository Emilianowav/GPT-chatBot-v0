// Script para crear turnos de prueba para mañana
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';

dotenv.config();

async function crearTurnosPrueba() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    // Crear turnos sin cliente asignado (se asignarán desde el CRM)
    console.log('ℹ️  Creando turnos sin cliente asignado\n');

    // Crear fecha para mañana (6 de noviembre de 2025)
    const manana = new Date('2025-11-06');
    
    // Turnos a crear
    const turnosData = [
      {
        hora: 14,
        minuto: 50,
        origen: 'Av Costanera 1515',
        destino: 'Jujuy 3030'
      },
      {
        hora: 16,
        minuto: 0,
        origen: 'Jujuy 3030',
        destino: 'Av Costanera 1515'
      }
    ];

    console.log('📝 Creando turnos...\n');

    for (const turnoData of turnosData) {
      // Crear fecha en hora local (se guardará automáticamente en UTC)
      const fechaInicio = new Date(
        manana.getFullYear(),
        manana.getMonth(),
        manana.getDate(),
        turnoData.hora,
        turnoData.minuto,
        0,
        0
      );

      const fechaFin = new Date(fechaInicio);
      fechaFin.setMinutes(fechaFin.getMinutes() + 60); // 60 minutos de duración

      const turno = new TurnoModel({
        empresaId: 'San Jose',
        clienteId: '', // Sin cliente asignado
        agenteId: null, // Sin agente asignado
        fechaInicio,
        fechaFin,
        duracion: 60,
        estado: 'pendiente',
        datos: {
          origen: turnoData.origen,
          destino: turnoData.destino,
          pasajeros: 1
        },
        notificaciones: [] // Sin notificaciones previas
      });

      await turno.save();

      const horaFormateada = `${turnoData.hora.toString().padStart(2, '0')}:${turnoData.minuto.toString().padStart(2, '0')}`;
      console.log(`✅ Turno creado: ${horaFormateada}`);
      console.log(`   ${turnoData.origen} → ${turnoData.destino}`);
      console.log(`   Estado: pendiente`);
      console.log(`   Notificaciones: 0\n`);
    }

    console.log('✅ Turnos creados exitosamente');
    console.log('\n📊 Resumen:');
    console.log(`   Fecha: 6 de noviembre de 2025`);
    console.log(`   Turnos: ${turnosData.length}`);
    console.log(`\n⚠️  IMPORTANTE: Asigna estos turnos a un cliente desde el CRM`);
    console.log(`   para que las notificaciones funcionen correctamente.`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

crearTurnosPrueba();
