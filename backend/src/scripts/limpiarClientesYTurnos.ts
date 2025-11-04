// 🧹 Script para limpiar TODOS los clientes y turnos
// ⚠️ USAR CON PRECAUCIÓN - Borra datos permanentemente
import mongoose from 'mongoose';
import { ClienteModel } from '../models/Cliente.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { ConversationStateModel } from '../models/ConversationState.js';
import { ConversacionBotModel } from '../modules/calendar/models/ConversacionBot.js';
import dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

// Crear interfaz para leer input del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function pregunta(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function limpiarTodo() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    // Mostrar estadísticas antes de borrar
    console.log('📊 ========== ESTADÍSTICAS ACTUALES ==========');
    const countClientes = await ClienteModel.countDocuments({});
    const countTurnos = await TurnoModel.countDocuments({});
    const countStates = await ConversationStateModel.countDocuments({});
    const countConversaciones = await ConversacionBotModel.countDocuments({});

    console.log(`👥 Clientes: ${countClientes}`);
    console.log(`📅 Turnos: ${countTurnos}`);
    console.log(`💬 Conversation States: ${countStates}`);
    console.log(`🤖 Conversaciones Bot: ${countConversaciones}`);
    console.log('');

    if (countClientes === 0 && countTurnos === 0 && countStates === 0 && countConversaciones === 0) {
      console.log('✅ No hay datos para borrar. La base de datos ya está limpia.');
      rl.close();
      await mongoose.disconnect();
      return;
    }

    // Confirmación de seguridad
    console.log('⚠️  ========== ADVERTENCIA ==========');
    console.log('⚠️  Este script borrará PERMANENTEMENTE:');
    console.log('⚠️  - Todos los clientes');
    console.log('⚠️  - Todos los turnos');
    console.log('⚠️  - Todos los estados de conversación');
    console.log('⚠️  - Todas las conversaciones del bot');
    console.log('⚠️  ====================================\n');

    const respuesta1 = await pregunta('¿Estás SEGURO que deseas continuar? (escribe "SI" para confirmar): ');
    
    if (respuesta1.toUpperCase() !== 'SI') {
      console.log('❌ Operación cancelada por el usuario.');
      rl.close();
      await mongoose.disconnect();
      return;
    }

    const respuesta2 = await pregunta('\n⚠️  ÚLTIMA CONFIRMACIÓN: ¿Borrar TODOS los datos? (escribe "BORRAR" para confirmar): ');
    
    if (respuesta2.toUpperCase() !== 'BORRAR') {
      console.log('❌ Operación cancelada por el usuario.');
      rl.close();
      await mongoose.disconnect();
      return;
    }

    rl.close();

    console.log('\n🗑️  Iniciando limpieza...\n');

    // 1. Borrar Clientes
    console.log('🗑️  Borrando clientes...');
    const resultClientes = await ClienteModel.deleteMany({});
    console.log(`✅ Clientes eliminados: ${resultClientes.deletedCount}`);

    // 2. Borrar Turnos
    console.log('🗑️  Borrando turnos...');
    const resultTurnos = await TurnoModel.deleteMany({});
    console.log(`✅ Turnos eliminados: ${resultTurnos.deletedCount}`);

    // 3. Borrar Conversation States
    console.log('🗑️  Borrando estados de conversación...');
    const resultStates = await ConversationStateModel.deleteMany({});
    console.log(`✅ Estados eliminados: ${resultStates.deletedCount}`);

    // 4. Borrar Conversaciones del Bot
    console.log('🗑️  Borrando conversaciones del bot...');
    const resultConversaciones = await ConversacionBotModel.deleteMany({});
    console.log(`✅ Conversaciones eliminadas: ${resultConversaciones.deletedCount}`);

    // Resumen final
    console.log('\n📊 ========== RESUMEN DE LIMPIEZA ==========');
    console.log(`👥 Clientes eliminados: ${resultClientes.deletedCount}`);
    console.log(`📅 Turnos eliminados: ${resultTurnos.deletedCount}`);
    console.log(`💬 Estados eliminados: ${resultStates.deletedCount}`);
    console.log(`🤖 Conversaciones eliminadas: ${resultConversaciones.deletedCount}`);
    console.log('');

    // Verificar que todo esté limpio
    const verificarClientes = await ClienteModel.countDocuments({});
    const verificarTurnos = await TurnoModel.countDocuments({});
    const verificarStates = await ConversationStateModel.countDocuments({});
    const verificarConversaciones = await ConversacionBotModel.countDocuments({});

    console.log('🔍 ========== VERIFICACIÓN FINAL ==========');
    console.log(`👥 Clientes restantes: ${verificarClientes}`);
    console.log(`📅 Turnos restantes: ${verificarTurnos}`);
    console.log(`💬 Estados restantes: ${verificarStates}`);
    console.log(`🤖 Conversaciones restantes: ${verificarConversaciones}`);
    console.log('');

    if (verificarClientes === 0 && verificarTurnos === 0 && verificarStates === 0 && verificarConversaciones === 0) {
      console.log('✅ ¡Limpieza completada exitosamente!');
      console.log('✅ La base de datos está lista para testear flujos desde cero.');
      console.log('');
      console.log('📝 Próximos pasos:');
      console.log('   1. Reiniciar el backend: npm run dev');
      console.log('   2. Enviar mensaje desde WhatsApp para iniciar flujo');
      console.log('   3. Verificar logs para debugging');
    } else {
      console.log('⚠️  Advertencia: Algunos registros no se eliminaron completamente.');
    }

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar script
limpiarTodo();
