// 🔧 Script para corregir plantillas de confirmación en MongoDB
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

dotenv.config();

async function corregirPlantillas() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    // Buscar todas las configuraciones
    const configuraciones = await ConfiguracionModuloModel.find({});
    console.log(`📋 Encontradas ${configuraciones.length} configuraciones\n`);

    let actualizadas = 0;

    for (const config of configuraciones) {
      let cambios = false;

      // Revisar notificaciones
      if (config.notificaciones && config.notificaciones.length > 0) {
        for (const notif of config.notificaciones) {
          const plantillaOriginal = notif.plantillaMensaje;
          
          // Verificar si tiene variables incorrectas
          if (plantillaOriginal.includes('{turnos}') || 
              plantillaOriginal.includes('{lista_turnos}') ||
              plantillaOriginal.includes('{todos_o_el}') ||
              plantillaOriginal.includes('{un_turno}')) {
            
            console.log(`⚠️  Plantilla incorrecta encontrada en ${config.empresaId}:`);
            console.log(`   Tipo: ${notif.tipo}, Momento: ${notif.momento}`);
            console.log(`   Plantilla: ${plantillaOriginal.substring(0, 100)}...`);
            
            // Esta plantilla se procesa en el código, no usar variables aquí
            // El servicio confirmacionTurnosService.ts construye el mensaje dinámicamente
            notif.plantillaMensaje = '🚗 *Recordatorio de viaje para mañana*\n\n📍 *Origen:* {origen}\n📍 *Destino:* {destino}\n🕐 *Hora:* {hora}\n👥 *Pasajeros:* {pasajeros}\n\n¿Confirmas tu viaje? Responde *SÍ* o *NO*';
            
            console.log(`   ✅ Corregida\n`);
            cambios = true;
          }
        }
      }

      // Revisar notificaciones diarias a agentes
      if (config.notificacionDiariaAgentes?.plantillaMensaje) {
        const plantillaOriginal = config.notificacionDiariaAgentes.plantillaMensaje;
        
        // Verificar si tiene variables incorrectas
        if (plantillaOriginal.includes('{lista_turnos}') || 
            plantillaOriginal.includes('{todos_o_el}') ||
            plantillaOriginal.includes('{un_turno}')) {
          
          console.log(`⚠️  Plantilla de notificación diaria incorrecta en ${config.empresaId}:`);
          console.log(`   Plantilla: ${plantillaOriginal.substring(0, 100)}...`);
          
          // Plantilla correcta con variables válidas
          config.notificacionDiariaAgentes.plantillaMensaje = 'Buenos días {agente}! 🌅\n\nTienes *{cantidad} {turnos}* programados para hoy:\n\n{lista}\n\n¡Que tengas un excelente día! 🚗';
          
          console.log(`   ✅ Corregida\n`);
          cambios = true;
        }
      }

      if (cambios) {
        await config.save();
        actualizadas++;
        console.log(`💾 Configuración guardada para ${config.empresaId}\n`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Proceso completado`);
    console.log(`📊 Configuraciones actualizadas: ${actualizadas}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

// Ejecutar
corregirPlantillas();
