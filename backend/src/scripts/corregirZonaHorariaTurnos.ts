// 🕐 Script para corregir zona horaria de turnos existentes
import mongoose from 'mongoose';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import dotenv from 'dotenv';

dotenv.config();

async function corregirZonaHorariaTurnos() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '', {
      dbName: 'neural_chatbot'
    });
    console.log('✅ Conectado a MongoDB\n');

    console.log('🕐 CORRECCIÓN DE ZONA HORARIA EN TURNOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Buscar todos los turnos
    const turnos = await TurnoModel.find({});
    
    console.log(`📊 Encontrados ${turnos.length} turnos\n`);

    if (turnos.length === 0) {
      console.log('⚠️ No hay turnos para corregir\n');
      return;
    }

    let corregidos = 0;

    for (const turno of turnos) {
      const fechaOriginal = new Date(turno.fechaInicio);
      
      // Restar 3 horas para corregir de UTC a Argentina (UTC-3)
      const fechaCorregida = new Date(fechaOriginal);
      fechaCorregida.setHours(fechaCorregida.getHours() - 3);

      console.log(`Turno ${turno._id}:`);
      console.log(`   Fecha original: ${fechaOriginal.toISOString()}`);
      console.log(`   Fecha corregida: ${fechaCorregida.toISOString()}`);
      console.log(`   Diferencia: -3 horas`);
      console.log('');

      // Actualizar el turno
      await TurnoModel.updateOne(
        { _id: turno._id },
        {
          $set: {
            fechaInicio: fechaCorregida,
            fechaFin: new Date(new Date(turno.fechaFin).getTime() - 3 * 60 * 60 * 1000)
          }
        }
      );

      corregidos++;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ ${corregidos} turno(s) corregido(s)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verificar
    console.log('🔍 VERIFICACIÓN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const turnosActualizados = await TurnoModel.find({}).limit(5);
    
    turnosActualizados.forEach((turno, index) => {
      const fecha = new Date(turno.fechaInicio);
      console.log(`${index + 1}. Turno ${turno._id}`);
      console.log(`   Fecha UTC: ${fecha.toISOString()}`);
      console.log(`   Fecha local: ${fecha.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
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

corregirZonaHorariaTurnos();
