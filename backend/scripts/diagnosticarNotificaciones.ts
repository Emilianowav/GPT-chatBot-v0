// 🔍 Script de Diagnóstico Completo de Notificaciones
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../src/config/database.js';
import { TurnoModel } from '../src/modules/calendar/models/Turno.js';
import { ConfiguracionModuloModel } from '../src/modules/calendar/models/ConfiguracionModulo.js';
import { EmpresaModel } from '../src/models/Empresa.js';
import { ClienteModel } from '../src/models/Cliente.js';

const EMPRESA_ID = 'San Jose';

async function diagnosticarNotificaciones() {
  try {
    console.log('\n🔍 ========== DIAGNÓSTICO DE NOTIFICACIONES ==========\n');
    
    await connectDB();
    console.log('✅ Conectado a MongoDB\n');

    // 1. Verificar configuración del módulo
    console.log('📋 1. CONFIGURACIÓN DEL MÓDULO');
    console.log('━'.repeat(60));
    const configModulo = await ConfiguracionModuloModel.findOne({ empresaId: EMPRESA_ID });
    
    if (!configModulo) {
      console.log('❌ NO existe configuración del módulo para', EMPRESA_ID);
      process.exit(1);
    }
    
    console.log('✅ Configuración encontrada');
    console.log('   Módulo activo:', configModulo.activo);
    console.log('   Requiere confirmación:', configModulo.requiereConfirmacion);
    console.log('   Notificaciones configuradas:', configModulo.notificaciones?.length || 0);
    
    if (configModulo.notificaciones && configModulo.notificaciones.length > 0) {
      console.log('\n   📬 Notificaciones:');
      configModulo.notificaciones.forEach((notif, i) => {
        console.log(`   ${i + 1}. ${notif.tipo}`);
        console.log(`      - Activa: ${notif.activa}`);
        console.log(`      - Destinatario: ${notif.destinatario}`);
        console.log(`      - Momento: ${notif.momento}`);
        console.log(`      - Hora envío: ${notif.horaEnvio || 'N/A'}`);
        console.log(`      - Requiere confirmación: ${notif.requiereConfirmacion}`);
      });
    }

    // 2. Verificar empresa
    console.log('\n📋 2. CONFIGURACIÓN DE LA EMPRESA');
    console.log('━'.repeat(60));
    const empresa = await EmpresaModel.findOne({ nombre: EMPRESA_ID });
    
    if (!empresa) {
      console.log('❌ NO existe la empresa', EMPRESA_ID);
      process.exit(1);
    }
    
    console.log('✅ Empresa encontrada');
    console.log('   Nombre:', empresa.nombre);
    console.log('   Teléfono:', empresa.telefono);
    console.log('   Phone Number ID:', empresa.phoneNumberId || 'NO CONFIGURADO ❌');
    
    if (!empresa.phoneNumberId) {
      console.log('\n⚠️  WARNING: La empresa no tiene phoneNumberId configurado');
      console.log('   Esto es necesario para enviar mensajes de WhatsApp');
    }

    // 3. Verificar turnos próximos
    console.log('\n📋 3. TURNOS PRÓXIMOS (Mañana)');
    console.log('━'.repeat(60));
    
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    mañana.setHours(0, 0, 0, 0);
    
    const pasadoMañana = new Date(mañana);
    pasadoMañana.setDate(pasadoMañana.getDate() + 1);
    
    const turnosMañana = await TurnoModel.find({
      empresaId: EMPRESA_ID,
      fechaInicio: {
        $gte: mañana,
        $lt: pasadoMañana
      }
    }).populate('agenteId').populate('clienteId');
    
    console.log(`   Turnos encontrados: ${turnosMañana.length}`);
    
    if (turnosMañana.length === 0) {
      console.log('\n⚠️  NO hay turnos para mañana');
      console.log('   Las notificaciones solo se envían si hay turnos programados');
      
      // Buscar turnos en los próximos 7 días
      const en7Dias = new Date();
      en7Dias.setDate(en7Dias.getDate() + 7);
      
      const turnosProximos = await TurnoModel.find({
        empresaId: EMPRESA_ID,
        fechaInicio: {
          $gte: new Date(),
          $lt: en7Dias
        }
      }).populate('clienteId');
      
      console.log(`\n   Turnos en los próximos 7 días: ${turnosProximos.length}`);
      
      if (turnosProximos.length > 0) {
        console.log('\n   📅 Próximos turnos:');
        turnosProximos.forEach((turno, i) => {
          const cliente = turno.clienteId as any;
          console.log(`   ${i + 1}. ${new Date(turno.fechaInicio).toLocaleString('es-AR')}`);
          console.log(`      Cliente: ${cliente?.nombre || 'N/A'} (${cliente?.telefono || 'Sin teléfono'})`);
          console.log(`      Estado: ${turno.estado}`);
          console.log(`      Notificado: ${(turno as any).notificado ? 'SÍ' : 'NO'}`);
        });
      }
    } else {
      console.log('\n   📅 Turnos de mañana:');
      turnosMañana.forEach((turno, i) => {
        const cliente = turno.clienteId as any;
        const agente = turno.agenteId as any;
        console.log(`   ${i + 1}. ${new Date(turno.fechaInicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`);
        console.log(`      Cliente: ${cliente?.nombre || 'N/A'} (${cliente?.telefono || 'Sin teléfono'})`);
        console.log(`      Agente: ${agente?.nombre || 'N/A'}`);
        console.log(`      Estado: ${turno.estado}`);
        console.log(`      Notificado: ${(turno as any).notificado ? 'SÍ' : 'NO'}`);
        console.log(`      Origen: ${turno.datos?.origen || 'N/A'}`);
        console.log(`      Destino: ${turno.datos?.destino || 'N/A'}`);
      });
    }

    // 4. Verificar clientes con teléfonos
    console.log('\n📋 4. CLIENTES CON TELÉFONOS');
    console.log('━'.repeat(60));
    
    const clientesConTelefono = await ClienteModel.find({
      empresaId: EMPRESA_ID,
      telefono: { $exists: true, $ne: '' }
    });
    
    console.log(`   Clientes con teléfono: ${clientesConTelefono.length}`);
    
    if (clientesConTelefono.length > 0) {
      console.log('\n   📱 Primeros 5 clientes:');
      clientesConTelefono.slice(0, 5).forEach((cliente, i) => {
        console.log(`   ${i + 1}. ${cliente.nombre || 'Sin nombre'}`);
        console.log(`      Teléfono: ${cliente.telefono}`);
        console.log(`      Normalizado: ${/^[0-9]+$/.test(cliente.telefono) ? 'SÍ ✅' : 'NO ❌'}`);
      });
    }

    // 5. Verificar variables de entorno
    console.log('\n📋 5. VARIABLES DE ENTORNO');
    console.log('━'.repeat(60));
    console.log('   MODO_DEV:', process.env.MODO_DEV || 'NO CONFIGURADO');
    console.log('   META_WHATSAPP_TOKEN:', process.env.META_WHATSAPP_TOKEN ? 'CONFIGURADO ✅' : 'NO CONFIGURADO ❌');
    console.log('   TEST_PHONE_NUMBER_ID:', process.env.TEST_PHONE_NUMBER_ID || 'NO CONFIGURADO');
    console.log('   MONGODB_URI:', process.env.MONGODB_URI ? 'CONFIGURADO ✅' : 'NO CONFIGURADO ❌');

    // 6. Resumen y recomendaciones
    console.log('\n📋 6. RESUMEN Y RECOMENDACIONES');
    console.log('━'.repeat(60));
    
    const problemas = [];
    const recomendaciones = [];
    
    if (!configModulo.activo) {
      problemas.push('El módulo de calendario está DESACTIVADO');
      recomendaciones.push('Activar el módulo en la configuración');
    }
    
    const notifConfirmacion = configModulo.notificaciones?.find(n => n.tipo === 'confirmacion');
    if (!notifConfirmacion) {
      problemas.push('NO hay notificación de confirmación configurada');
      recomendaciones.push('Crear una notificación de tipo "confirmacion" en el frontend');
    } else if (!notifConfirmacion.activa) {
      problemas.push('La notificación de confirmación está DESACTIVADA');
      recomendaciones.push('Activar la notificación en el frontend');
    }
    
    if (!empresa.phoneNumberId) {
      problemas.push('La empresa NO tiene phoneNumberId configurado');
      recomendaciones.push('Configurar phoneNumberId en la empresa');
    }
    
    if (turnosMañana.length === 0) {
      problemas.push('NO hay turnos para mañana');
      recomendaciones.push('Crear turnos de prueba para mañana');
    }
    
    if (process.env.MODO_DEV === 'true') {
      problemas.push('El sistema está en MODO_DEV (simulación)');
      recomendaciones.push('Cambiar MODO_DEV=false en el archivo .env');
    }
    
    if (problemas.length === 0) {
      console.log('✅ NO se encontraron problemas evidentes');
      console.log('\n   El sistema debería estar funcionando correctamente.');
      console.log('   Si aún no llegan las notificaciones, verificar:');
      console.log('   - Que el cron job esté ejecutándose');
      console.log('   - Que los teléfonos estén normalizados');
      console.log('   - Que el token de WhatsApp sea válido');
    } else {
      console.log(`❌ Se encontraron ${problemas.length} problema(s):\n`);
      problemas.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p}`);
      });
      
      console.log('\n💡 Recomendaciones:\n');
      recomendaciones.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('Diagnóstico completado');
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en el diagnóstico:', error);
    process.exit(1);
  }
}

diagnosticarNotificaciones();
