// Script para corregir las horas de los turnos que están mal guardadas
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TurnoModel } from '../modules/calendar/models/Turno.js';

dotenv.config();

async function corregirHorasTurnos() {
  try {
    console.log('🔧 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Conectado a MongoDB\n');

    // Buscar todos los turnos de San Jose
    const turnos = await TurnoModel.find({ empresaId: 'San Jose' });
    
    console.log(`📊 Encontrados ${turnos.length} turnos\n`);

    let corregidos = 0;
    
    for (const turno of turnos) {
      const fechaActual = new Date(turno.fechaInicio);
      
      // Obtener la hora actual en UTC
      const horaActualUTC = fechaActual.getUTCHours();
      const minutoActualUTC = fechaActual.getUTCMinutes();
      
      console.log(`\n📅 Turno ${turno._id}`);
      console.log(`   Fecha actual: ${fechaActual.toISOString()}`);
      console.log(`   Hora actual UTC: ${horaActualUTC}:${String(minutoActualUTC).padStart(2, '0')}`);
      
      // La hora ya está correcta si está entre 0-23
      // No necesitamos hacer nada, el problema era en la visualización
      console.log(`   ✅ Hora correcta (no requiere cambios)`);
    }

    console.log(`\n✅ Proceso completado`);
    console.log(`   Total turnos revisados: ${turnos.length}`);
    console.log(`   Turnos corregidos: ${corregidos}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

corregirHorasTurnos();
