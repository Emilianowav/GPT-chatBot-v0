// 🔍 Script de Verificación: Sistema de Notificaciones
// Verifica que la configuración esté correcta y lista para usar

import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';
import { EmpresaModel } from '../models/Empresa.js';
import { AgenteModel } from '../modules/calendar/models/Agente.js';

async function verificarConfiguracion() {
  try {
    console.log('\n🔍 ========================================');
    console.log('   VERIFICACIÓN: Sistema de Notificaciones');
    console.log('========================================\n');

    await connectDB();
    console.log('✅ Conectado a MongoDB\n');

    const configuraciones = await ConfiguracionModuloModel.find({});
    console.log(`📋 Encontradas ${configuraciones.length} configuraciones\n`);

    for (const config of configuraciones) {
      console.log(`\n🏢 ${config.empresaId}`);
      console.log('═══════════════════════════════════════\n');

      // 1. Verificar empresa
      const empresa = await EmpresaModel.findOne({ nombre: config.empresaId });
      if (!empresa) {
        console.log('❌ Empresa no encontrada en colección Empresas');
        continue;
      }

      const phoneNumberId = (empresa as any).phoneNumberId;
      console.log(`📱 Phone Number ID: ${phoneNumberId ? '✅ ' + phoneNumberId : '❌ No configurado'}`);

      // 2. Verificar plantillasMeta
      if (!config.plantillasMeta) {
        console.log('❌ No tiene plantillasMeta configurado');
        console.log('   👉 Ejecutar: npm run migrate:notificaciones\n');
        continue;
      }

      // 3. Verificar notificación diaria agentes
      console.log('\n📅 Notificación Diaria Agentes:');
      const notifAgentes = config.plantillasMeta.notificacionDiariaAgentes;
      
      if (!notifAgentes) {
        console.log('   ❌ No configurada');
      } else {
        console.log(`   Estado: ${notifAgentes.activa ? '✅ Activa' : '⚠️  Inactiva'}`);
        console.log(`   Plantilla: ${notifAgentes.nombre || '❌ No definida'}`);
        console.log(`   Idioma: ${notifAgentes.idioma || '❌ No definido'}`);
        
        if (notifAgentes.programacion) {
          console.log(`   Método: ${notifAgentes.programacion.metodoVerificacion || '❌ No definido'}`);
          
          if (notifAgentes.programacion.metodoVerificacion === 'hora_fija') {
            console.log(`   Hora envío: ${notifAgentes.programacion.horaEnvio || '❌ No definida'}`);
          } else if (notifAgentes.programacion.metodoVerificacion === 'inicio_jornada_agente') {
            console.log(`   Minutos antes: ${notifAgentes.programacion.minutosAntes || '❌ No definido'}`);
          }
          
          console.log(`   Filtro estados: ${notifAgentes.programacion.filtroEstado?.join(', ') || '❌ No definido'}`);
        } else {
          console.log('   ❌ Sin programación configurada');
        }

        // Verificar si hay agentes
        const agentes = await AgenteModel.find({ empresaId: config.empresaId, activo: true });
        console.log(`   Agentes activos: ${agentes.length}`);
        
        if (agentes.length > 0) {
          const agentesConTelefono = agentes.filter(a => a.telefono);
          console.log(`   Agentes con teléfono: ${agentesConTelefono.length}`);
          
          if (agentesConTelefono.length > 0) {
            console.log(`   Ejemplo: ${agentesConTelefono[0].nombre} ${agentesConTelefono[0].apellido} - ${agentesConTelefono[0].telefono}`);
          }
        }
      }

      // 4. Verificar confirmación turnos
      console.log('\n✅ Confirmación de Turnos:');
      const notifClientes = config.plantillasMeta.confirmacionTurnos;
      
      if (!notifClientes) {
        console.log('   ❌ No configurada');
      } else {
        console.log(`   Estado: ${notifClientes.activa ? '✅ Activa' : '⚠️  Inactiva'}`);
        console.log(`   Plantilla: ${notifClientes.nombre || '❌ No definida'}`);
        console.log(`   Idioma: ${notifClientes.idioma || '❌ No definido'}`);
        
        if (notifClientes.programacion) {
          console.log(`   Método: ${notifClientes.programacion.metodoVerificacion || '❌ No definido'}`);
          
          if (notifClientes.programacion.metodoVerificacion === 'hora_fija') {
            console.log(`   Hora envío: ${notifClientes.programacion.horaEnvio || '❌ No definida'}`);
            console.log(`   Días antes: ${notifClientes.programacion.diasAntes || '❌ No definido'}`);
          } else if (notifClientes.programacion.metodoVerificacion === 'horas_antes_turno') {
            console.log(`   Horas antes: ${notifClientes.programacion.horasAntes || '❌ No definido'}`);
          }
          
          console.log(`   Filtro estados: ${notifClientes.programacion.filtroEstado?.join(', ') || '❌ No definido'}`);
        } else {
          console.log('   ❌ Sin programación configurada');
        }
      }

      // 5. Resumen de estado
      console.log('\n📊 Resumen:');
      const todoOk = phoneNumberId && 
                     notifAgentes?.activa && 
                     notifAgentes?.nombre && 
                     notifClientes?.activa && 
                     notifClientes?.nombre;
      
      if (todoOk) {
        console.log('   ✅ Configuración completa y lista para usar');
      } else {
        console.log('   ⚠️  Configuración incompleta');
        
        if (!phoneNumberId) {
          console.log('      - Falta phoneNumberId en Empresa');
        }
        if (!notifAgentes?.activa || !notifAgentes?.nombre) {
          console.log('      - Notificación de agentes incompleta');
        }
        if (!notifClientes?.activa || !notifClientes?.nombre) {
          console.log('      - Confirmación de turnos incompleta');
        }
      }
    }

    console.log('\n\n📝 ========================================');
    console.log('   ENDPOINTS DISPONIBLES');
    console.log('========================================');
    console.log('POST /api/modules/calendar/notificaciones-meta/test');
    console.log('Body: {');
    console.log('  "tipo": "agente" | "cliente",');
    console.log('  "empresaId": "San Jose",');
    console.log('  "telefono": "+543794946066"');
    console.log('}\n');

    console.log('🔗 Meta Business Manager:');
    console.log('https://business.facebook.com/wa/manage/message-templates/\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error en verificación:', error);
    process.exit(1);
  }
}

verificarConfiguracion();
