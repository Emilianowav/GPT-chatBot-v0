// 🔴 Script para DESACTIVAR notificaciones diarias de agentes
// Este script desactiva las notificaciones automáticas en la base de datos
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

async function desactivarNotificacionesDiariasAgentes() {
  try {
    console.log('🔴 Desactivando notificaciones diarias de agentes...\n');
    
    // Conectar a la base de datos
    await connectDB();
    
    // Empresa a desactivar
    const EMPRESA_ID = 'San Jose';
    
    console.log(`🏢 Empresa: ${EMPRESA_ID}\n`);
    
    // Obtener configuración
    const config = await ConfiguracionModuloModel.findOne({ empresaId: EMPRESA_ID });
    
    if (!config) {
      console.log('❌ No se encontró configuración para esta empresa');
      process.exit(1);
    }
    
    if (!config.notificacionDiariaAgentes) {
      console.log('ℹ️  Esta empresa no tiene configurada la notificación diaria de agentes');
      process.exit(0);
    }
    
    const estadoAnterior = config.notificacionDiariaAgentes.activa;
    
    console.log(`📋 Estado actual: ${estadoAnterior ? '✅ ACTIVA' : '❌ INACTIVA'}`);
    
    if (!estadoAnterior) {
      console.log('\nℹ️  Las notificaciones ya están desactivadas. No hay nada que hacer.');
      process.exit(0);
    }
    
    // Desactivar
    config.notificacionDiariaAgentes.activa = false;
    
    // Marcar como modificado y guardar
    (config as any).markModified('notificacionDiariaAgentes');
    await config.save();
    
    console.log('\n✅ Notificaciones diarias de agentes DESACTIVADAS exitosamente');
    console.log('🔴 Los mensajes automáticos ya NO se enviarán más');
    console.log('\n💡 Para reactivarlas, cambia "activa: true" en MongoDB o usa el CRM\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar
desactivarNotificacionesDiariasAgentes();
