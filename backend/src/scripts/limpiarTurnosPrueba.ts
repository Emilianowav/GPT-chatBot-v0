// 🧹 Script para eliminar turnos de prueba
import mongoose from 'mongoose';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import dotenv from 'dotenv';

dotenv.config();

async function limpiarTurnosPrueba() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '', {
      dbName: 'neural_chatbot'
    });
    console.log('✅ Conectado a MongoDB\n');

    console.log('🧹 ELIMINANDO TURNOS DE PRUEBA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Buscar turnos con nota de TEST
    const turnosPrueba = await TurnoModel.find({
      notas: { $regex: /TEST/i }
    });

    if (turnosPrueba.length > 0) {
      console.log(`✅ Encontrados ${turnosPrueba.length} turno(s) de prueba:\n`);
      
      turnosPrueba.forEach((turno, index) => {
        console.log(`Turno ${index + 1}:`);
        console.log('   ID:', turno._id);
        console.log('   Cliente ID:', turno.clienteId);
        console.log('   Fecha:', turno.fechaInicio);
        console.log('   Estado:', turno.estado);
        console.log('   Notas:', turno.notas);
        console.log('   Origen:', turno.datos?.origen || 'N/A');
        console.log('   Destino:', turno.datos?.destino || 'N/A');
        console.log('');
      });

      // Eliminar turnos de prueba
      const result = await TurnoModel.deleteMany({
        notas: { $regex: /TEST/i }
      });

      console.log(`✅ ${result.deletedCount} turno(s) de prueba eliminado(s)\n`);
    } else {
      console.log('⚠️ No se encontraron turnos de prueba\n');
    }

    // Verificación final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Limpieza completada');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

limpiarTurnosPrueba();
