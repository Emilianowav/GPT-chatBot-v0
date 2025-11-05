// 🧪 Script de prueba para notificaciones diarias de agentes
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';
import { enviarNotificacionesDiariasAgentes } from '../services/notificacionesDiariasAgentes.js';

/**
 * Script para probar el envío de notificaciones diarias a agentes
 */
async function testNotificacionesDiariasAgentes() {
  try {
    console.log('🧪 Iniciando prueba de notificaciones diarias para agentes...\n');
    
    // Conectar a la base de datos
    await connectDB();
    
    // Obtener configuraciones con notificación diaria activa
    const configuraciones = await ConfiguracionModuloModel.find({
      'notificacionDiariaAgentes.activa': true
    });
    
    console.log(`📋 Empresas con notificación diaria activa: ${configuraciones.length}\n`);
    
    if (configuraciones.length === 0) {
      console.log('⚠️ No hay empresas con notificación diaria activa');
      console.log('💡 Para activar, configura notificacionDiariaAgentes en ConfiguracionModulo\n');
      process.exit(0);
    }
    
    // Mostrar configuraciones
    for (const config of configuraciones) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🏢 Empresa: ${config.empresaId}`);
      console.log(`⏰ Hora de envío: ${config.notificacionDiariaAgentes?.horaEnvio}`);
      console.log(`👥 Enviar a todos: ${config.notificacionDiariaAgentes?.enviarATodos ? 'Sí' : 'No'}`);
      console.log(`📅 Frecuencia: ${config.notificacionDiariaAgentes?.frecuencia.tipo}`);
      console.log(`📋 Plantilla: ${config.notificacionDiariaAgentes?.plantillaMensaje.substring(0, 50)}...`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
    // Preguntar si desea ejecutar
    console.log('⚠️ ATENCIÓN: Este script enviará notificaciones reales vía WhatsApp');
    console.log('📱 Se enviarán mensajes a los agentes configurados\n');
    
    console.log('🔄 Ejecutando envío de notificaciones...\n');
    
    // Ejecutar el servicio
    await enviarNotificacionesDiariasAgentes();
    
    console.log('\n✅ Prueba completada');
    console.log('💡 Revisa los logs arriba para ver el resultado del envío\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    process.exit(1);
  }
}

// Ejecutar
testNotificacionesDiariasAgentes();
