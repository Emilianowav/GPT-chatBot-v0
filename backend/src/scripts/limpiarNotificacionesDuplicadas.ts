// Script para limpiar notificaciones duplicadas y corregir valores
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

dotenv.config();

async function limpiarNotificaciones() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    const config = await ConfiguracionModuloModel.findOne({ empresaId: 'San Jose' });
    
    if (!config) {
      console.log('❌ No se encontró configuración para San Jose');
      return;
    }

    console.log('🏢 Empresa: San Jose');
    console.log(`📋 Notificaciones actuales: ${config.notificaciones.length}\n`);

    // Mostrar notificaciones actuales
    config.notificaciones.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.tipo} - ${notif.momento}`);
      console.log(`      diasAntes: ${notif.diasAntes}`);
      console.log(`      horasAntesTurno: ${(notif as any).horasAntesTurno}`);
      console.log(`      horaEnvioDiaAntes: ${(notif as any).horaEnvioDiaAntes}`);
      console.log(`      horaEnvio: ${notif.horaEnvio}`);
      console.log('');
    });

    // SOLUCIÓN: Eliminar notificaciones duplicadas y crear una sola correcta
    console.log('🔧 Limpiando notificaciones...\n');

    // Guardar la configuración correcta
    const notificacionCorrecta = {
      activa: true,
      tipo: 'confirmacion',
      destinatario: 'cliente',
      momento: 'dia_antes_turno',
      diasAntes: 1,  // ✅ CORREGIDO: 1 día antes
      horaEnvioDiaAntes: '01:47',  // ✅ Hora correcta
      plantillaMensaje: config.notificaciones[0].plantillaMensaje,
      requiereConfirmacion: false,
      mensajeConfirmacion: config.notificaciones[0].mensajeConfirmacion,
      clientesEspecificos: [],
      agentesEspecificos: [],
      esAgendaAgente: false,
      enviarTodosTurnosDia: false,
      esRecurrente: false,
      recurrencia: { diasSemana: [] },
      ejecucion: 'automatica',
      filtros: {
        estados: ['pendiente', 'no_confirmado'],
        agenteIds: [],
        tipoReserva: [],
        soloSinNotificar: true
      }
    };

    // Reemplazar todas las notificaciones con la correcta
    config.notificaciones = [notificacionCorrecta as any];

    await config.save();

    console.log('✅ Notificaciones limpiadas y corregidas:');
    console.log('   - Eliminadas notificaciones duplicadas');
    console.log('   - Corregido diasAntes: 24 → 1');
    console.log('   - Eliminado horasAntesTurno (no corresponde)');
    console.log('   - Eliminado horaEnvio (obsoleto)');
    console.log('   - Mantenido horaEnvioDiaAntes: 01:47');
    console.log('\n📋 Configuración final:');
    console.log('   Notificaciones: 1');
    console.log('   Tipo: confirmacion');
    console.log('   Momento: dia_antes_turno');
    console.log('   diasAntes: 1 ✅');
    console.log('   horaEnvioDiaAntes: 01:47 ✅');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

limpiarNotificaciones();
