// Script para verificar y corregir la configuración de notificaciones
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

dotenv.config();

async function verificarConfigNotificaciones() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Conectado a MongoDB\n');

    const empresaId = 'San Jose';
    
    console.log(`📋 Buscando configuración de: ${empresaId}`);
    const config = await ConfiguracionModuloModel.findOne({ empresaId });
    
    if (!config) {
      console.log('❌ No se encontró configuración');
      process.exit(1);
    }
    
    console.log('\n📊 CONFIGURACIÓN ACTUAL:\n');
    
    if (config.notificaciones && config.notificaciones.length > 0) {
      config.notificaciones.forEach((notif: any, index: number) => {
        console.log(`\n${index + 1}. Notificación tipo: ${notif.tipo}`);
        console.log(`   - Activa: ${notif.activa}`);
        console.log(`   - Momento: ${notif.momento}`);
        console.log(`   - Días antes: ${notif.diasAntes}`);
        console.log(`   - Hora envío día antes: ${notif.horaEnvioDiaAntes}`);
        console.log(`   - Hora envío: ${notif.horaEnvio}`);
        console.log(`   - Estados filtro: ${notif.filtros?.estados?.join(', ') || 'ninguno'}`);
        console.log(`   - Plantilla mensaje: ${notif.plantillaMensaje?.substring(0, 50)}...`);
      });
    } else {
      console.log('❌ No hay notificaciones configuradas');
    }
    
    console.log('\n\n🔧 ¿Deseas corregir la configuración? (Ctrl+C para cancelar)');
    console.log('Se actualizará a:');
    console.log('   - diasAntes: 1');
    console.log('   - momento: dia_antes_turno');
    console.log('   - filtros.estados: [pendiente, no_confirmado]');
    
    // Esperar 3 segundos antes de corregir
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🔄 Corrigiendo configuración...');
    
    // Actualizar la notificación de confirmación
    const notifIndex = config.notificaciones.findIndex((n: any) => n.tipo === 'confirmacion');
    
    if (notifIndex !== -1) {
      const notif = config.notificaciones[notifIndex];
      
      // Corregir valores
      notif.momento = 'dia_antes_turno';
      notif.diasAntes = 1;
      
      if (!notif.filtros) {
        notif.filtros = {};
      }
      notif.filtros.estados = ['pendiente', 'no_confirmado'];
      
      // Guardar
      await config.save();
      
      console.log('✅ Configuración corregida');
      console.log('\n📊 NUEVA CONFIGURACIÓN:\n');
      console.log(`   - Días antes: ${notif.diasAntes}`);
      console.log(`   - Momento: ${notif.momento}`);
      console.log(`   - Hora envío: ${notif.horaEnvioDiaAntes}`);
      console.log(`   - Estados: ${notif.filtros.estados.join(', ')}`);
    } else {
      console.log('❌ No se encontró notificación de confirmación');
    }
    
    console.log('\n✅ Script completado');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarConfigNotificaciones();
