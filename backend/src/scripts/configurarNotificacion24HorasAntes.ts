// Script para configurar notificación 24 horas antes del turno
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

dotenv.config();

async function configurarNotificacion24HorasAntes() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    await mongoose.connect(MONGODB_URI, {
      dbName: 'neural_chatbot'
    });
    console.log('✅ Conectado a MongoDB\n');

    const empresaId = 'San Jose';

    // Buscar configuración actual
    const config = await ConfiguracionModuloModel.findOne({ empresaId });

    if (!config) {
      console.log('❌ No se encontró configuración para', empresaId);
      process.exit(1);
    }

    console.log('📋 Configuración actual de notificaciones:');
    config.notificaciones.forEach((notif, index) => {
      console.log(`\n${index + 1}. ${notif.tipo}`);
      console.log(`   Activa: ${notif.activa}`);
      console.log(`   Momento: ${notif.momento}`);
      console.log(`   Hora envío: ${notif.horaEnvio || 'N/A'}`);
      console.log(`   Días antes: ${notif.diasAntes || 'N/A'}`);
      console.log(`   Horas antes: ${(notif as any).horasAntesTurno || 'N/A'}`);
    });

    // Actualizar la notificación de confirmación
    const notifIndex = config.notificaciones.findIndex(n => n.tipo === 'confirmacion');

    if (notifIndex === -1) {
      console.log('\n❌ No se encontró notificación de confirmación');
      process.exit(1);
    }

    console.log('\n🔧 Actualizando configuración...');
    console.log('   Cambiando de: "noche_anterior" a "horas_antes_turno"');
    console.log('   Configurando: 24 horas antes del turno');

    // Actualizar la notificación preservando todos los campos
    const notifActual = config.notificaciones[notifIndex];
    config.notificaciones[notifIndex] = {
      tipo: notifActual.tipo,
      activa: notifActual.activa,
      destinatario: notifActual.destinatario,
      momento: 'horas_antes_turno',
      horasAntesTurno: 24,
      ejecucion: notifActual.ejecucion,
      plantillaMensaje: notifActual.plantillaMensaje,
      requiereConfirmacion: notifActual.requiereConfirmacion,
      mensajeConfirmacion: notifActual.mensajeConfirmacion,
      filtros: notifActual.filtros
    } as any;

    await config.save();

    console.log('\n✅ Configuración actualizada exitosamente!');
    console.log('\n📋 Nueva configuración:');
    const notifActualizada = config.notificaciones[notifIndex];
    console.log(`   Tipo: ${notifActualizada.tipo}`);
    console.log(`   Activa: ${notifActualizada.activa}`);
    console.log(`   Momento: ${notifActualizada.momento}`);
    console.log(`   Horas antes: ${(notifActualizada as any).horasAntesTurno}`);

    console.log('\n📌 IMPORTANTE:');
    console.log('   - Las notificaciones se enviarán exactamente 24 horas antes del turno');
    console.log('   - El cron job verifica cada minuto con margen de ±5 minutos');
    console.log('   - Ejemplo: Turno a las 20:00 → Notificación a las 20:00 del día anterior');

    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

configurarNotificacion24HorasAntes();
