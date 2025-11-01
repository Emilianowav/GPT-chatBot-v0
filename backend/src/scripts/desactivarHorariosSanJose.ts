// 🔧 Script para desactivar horarios de atención - Funcionamiento 24/7
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { ConfiguracionBotModel } from '../modules/calendar/models/ConfiguracionBot.js';

async function desactivarHorarios() {
  try {
    console.log('🚀 Desactivando horarios de atención para San Jose...\n');
    console.log('🔌 Conectando a MongoDB...');
    await connectDB();
    console.log('✅ Conectado a MongoDB\n');
    
    // Buscar configuración del bot
    const configBot = await ConfiguracionBotModel.findOne({ 
      empresaId: 'San Jose' 
    });
    
    if (!configBot) {
      console.log('❌ No se encontró la configuración del bot para San Jose');
      process.exit(1);
    }
    
    console.log('📋 Configuración actual:');
    console.log(`   Horarios activos: ${configBot.horariosAtencion?.activo ? 'SÍ' : 'NO'}`);
    if (configBot.horariosAtencion?.activo) {
      console.log(`   Horario: ${configBot.horariosAtencion.inicio} - ${configBot.horariosAtencion.fin}`);
    }
    console.log('');
    
    // Actualizar configuración
    configBot.horariosAtencion = {
      activo: false, // Desactivado para funcionamiento 24/7
      inicio: '00:00',
      fin: '23:59',
      diasSemana: [0, 1, 2, 3, 4, 5, 6], // Todos los días
      mensajeFueraHorario: '' // Vacío porque no se usará
    };
    
    await configBot.save();
    
    console.log('✅ Horarios de atención desactivados exitosamente!');
    console.log('');
    console.log('🎉 El bot ahora funciona 24/7 sin restricciones de horario');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  }
}

// Ejecutar
desactivarHorarios();
