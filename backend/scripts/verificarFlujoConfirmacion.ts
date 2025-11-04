// 🔍 Verificar estado del flujo de confirmación de turnos
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../src/config/database.js';
import { ConfiguracionModuloModel } from '../src/modules/calendar/models/ConfiguracionModulo.js';
import { ConfiguracionBotModel } from '../src/modules/calendar/models/ConfiguracionBot.js';

const EMPRESA_ID = 'San Jose';

async function verificarFlujoConfirmacion() {
  try {
    console.log(`🔍 Verificando flujo de confirmación para: ${EMPRESA_ID}\n`);
    await connectDB();
    
    // 1. Verificar ConfiguracionBot
    console.log('1️⃣ Verificando ConfiguracionBot...');
    const configBot = await ConfiguracionBotModel.findOne({ empresaId: EMPRESA_ID });
    
    if (!configBot) {
      console.log('   ❌ No existe ConfiguracionBot');
    } else {
      console.log(`   ✅ ConfiguracionBot encontrada`);
      console.log(`   - Bot activo: ${configBot.activo}`);
      console.log(`   - Mensaje bienvenida: "${configBot.mensajeBienvenida?.substring(0, 50)}..."`);
    }
    
    // 2. Verificar ConfiguracionModulo
    console.log('\n2️⃣ Verificando ConfiguracionModulo...');
    const configModulo = await ConfiguracionModuloModel.findOne({ empresaId: EMPRESA_ID });
    
    if (!configModulo) {
      console.log('   ❌ No existe ConfiguracionModulo');
    } else {
      console.log(`   ✅ ConfiguracionModulo encontrada`);
      console.log(`   - Módulo activo: ${configModulo.activo}`);
      console.log(`   - Tipo negocio: ${configModulo.tipoNegocio}`);
      console.log(`   - Requiere confirmación: ${configModulo.requiereConfirmacion}`);
      console.log(`   - Tiempo límite confirmación: ${configModulo.tiempoLimiteConfirmacion || 'No definido'}`);
      
      // 3. Verificar notificaciones
      console.log('\n3️⃣ Verificando notificaciones automáticas...');
      console.log(`   Total de notificaciones: ${configModulo.notificaciones?.length || 0}`);
      
      if (configModulo.notificaciones && configModulo.notificaciones.length > 0) {
        configModulo.notificaciones.forEach((notif, index) => {
          console.log(`\n   📧 Notificación ${index + 1}:`);
          console.log(`      - Tipo: ${notif.tipo}`);
          console.log(`      - Activa: ${notif.activa}`);
          console.log(`      - Destinatario: ${notif.destinatario}`);
          console.log(`      - Momento: ${notif.momento}`);
          console.log(`      - Requiere confirmación: ${notif.requiereConfirmacion}`);
          console.log(`      - Plantilla: "${notif.plantillaMensaje?.substring(0, 60)}..."`);
          
          if (notif.tipo === 'confirmacion') {
            console.log(`      ⭐ ESTA ES LA NOTIFICACIÓN DE CONFIRMACIÓN`);
          }
        });
      } else {
        console.log('   ⚠️ No hay notificaciones configuradas');
      }
    }
    
    // 4. Resumen
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (!configBot) {
      console.log('❌ ConfiguracionBot NO EXISTE');
    } else if (!configBot.activo) {
      console.log('⚠️ ConfiguracionBot existe pero está DESACTIVADO');
    } else {
      console.log('✅ ConfiguracionBot ACTIVO');
    }
    
    if (!configModulo) {
      console.log('❌ ConfiguracionModulo NO EXISTE');
    } else if (!configModulo.activo) {
      console.log('⚠️ ConfiguracionModulo existe pero está DESACTIVADO');
    } else {
      console.log('✅ ConfiguracionModulo ACTIVO');
    }
    
    const notifConfirmacion = configModulo?.notificaciones?.find(n => n.tipo === 'confirmacion');
    if (!notifConfirmacion) {
      console.log('❌ NO hay notificación de tipo "confirmacion"');
    } else if (!notifConfirmacion.activa) {
      console.log('⚠️ Notificación de confirmación existe pero está DESACTIVADA');
    } else {
      console.log('✅ Notificación de confirmación ACTIVA');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 RECOMENDACIONES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (!notifConfirmacion) {
      console.log('1. Crear una notificación de tipo "confirmacion" en ConfiguracionModulo');
      console.log('2. Configurar el momento de envío (ej: "dia_antes_turno")');
      console.log('3. Activar la notificación (activa: true)');
      console.log('4. Configurar requiereConfirmacion: true');
    } else if (!notifConfirmacion.activa) {
      console.log('1. Activar la notificación de confirmación en ConfiguracionModulo');
      console.log('2. Verificar que el momento de envío esté configurado');
    } else {
      console.log('✅ Todo está configurado correctamente');
      console.log('   El flujo de confirmación debería funcionar');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

verificarFlujoConfirmacion();
