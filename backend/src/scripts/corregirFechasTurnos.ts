// Script para corregir fechas de turnos que fueron guardadas incorrectamente
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TurnoModel } from '../modules/calendar/models/Turno.js';

dotenv.config();

async function corregirFechasTurnos() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Conectado a MongoDB\n');

    const empresaId = 'San Jose';
    
    console.log(`📋 Buscando turnos de: ${empresaId}\n`);
    
    // Buscar todos los turnos pendientes
    const turnos = await TurnoModel.find({
      empresaId,
      estado: { $in: ['pendiente', 'no_confirmado'] }
    }).sort({ fechaInicio: 1 });
    
    console.log(`📊 Turnos encontrados: ${turnos.length}\n`);
    
    if (turnos.length === 0) {
      console.log('❌ No hay turnos para corregir');
      process.exit(0);
    }
    
    console.log('📅 TURNOS ACTUALES:\n');
    turnos.forEach((turno: any, index: number) => {
      console.log(`${index + 1}. Turno ${turno._id}:`);
      console.log(`   - Fecha actual (UTC): ${turno.fechaInicio.toISOString()}`);
      console.log(`   - Fecha actual (ARG): ${turno.fechaInicio.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
      console.log(`   - Estado: ${turno.estado}`);
      console.log('');
    });
    
    console.log('\n⚠️  ADVERTENCIA:');
    console.log('Este script NO corregirá las fechas automáticamente.');
    console.log('Los turnos fueron guardados con Date.UTC() que guarda la hora tal cual.');
    console.log('');
    console.log('RECOMENDACIÓN:');
    console.log('1. Elimina estos turnos desde el CRM');
    console.log('2. Crea nuevos turnos (el código ya está corregido)');
    console.log('3. Los nuevos turnos se guardarán correctamente');
    console.log('');
    console.log('O puedes editarlos manualmente desde el CRM para ajustar la fecha.');
    
    console.log('\n✅ Script completado');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

corregirFechasTurnos();
