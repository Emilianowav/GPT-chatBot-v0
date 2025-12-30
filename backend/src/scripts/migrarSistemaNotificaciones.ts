// 🔄 Script de Migración: Sistema de Notificaciones Unificado
// Migra de sistema antiguo a nuevo sistema con plantillasMeta

import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';
import { EmpresaModel } from '../models/Empresa.js';

/**
 * Migrar configuración de notificaciones al nuevo sistema
 */
async function migrarSistemaNotificaciones() {
  try {
    console.log('\n🔄 ========================================');
    console.log('   MIGRACIÓN: Sistema de Notificaciones');
    console.log('========================================\n');

    await connectDB();
    console.log('✅ Conectado a MongoDB\n');

    // Buscar todas las configuraciones
    const configuraciones = await ConfiguracionModuloModel.find({});
    console.log(`📋 Encontradas ${configuraciones.length} configuraciones\n`);

    let migradas = 0;
    let yaActualizadas = 0;
    let errores = 0;

    for (const config of configuraciones) {
      try {

        // Verificar si ya tiene plantillasMeta
        if (config.plantillasMeta?.notificacionDiariaAgentes?.activa || 
            config.plantillasMeta?.confirmacionTurnos?.activa) {
          console.log('ℹ️  Ya tiene plantillasMeta configurado');
          yaActualizadas++;
          continue;
        }

        // Obtener empresa para phoneNumberId
        const empresa = await EmpresaModel.findOne({ nombre: config.empresaId });
        if (!empresa) {
          console.log('⚠️  Empresa no encontrada en colección Empresas');
          errores++;
          continue;
        }

        const phoneNumberId = (empresa as any).phoneNumberId;
        if (!phoneNumberId) {
          console.log('⚠️  Empresa sin phoneNumberId configurado');
          errores++;
          continue;
        }

        console.log(`✅ phoneNumberId: ${phoneNumberId}`);

        // Crear objeto plantillasMeta
        const plantillasMeta: any = {};

        // 1. NOTIFICACIÓN DIARIA AGENTES
        console.log('\n📅 Configurando notificación diaria de agentes...');
        
        // Detectar nombre de plantilla según tipo de negocio
        let nombrePlantillaAgentes = 'chofer_sanjose';
        if (config.tipoNegocio === 'consultorio') {
          nombrePlantillaAgentes = 'medico_sanjose';
        } else if (config.tipoNegocio === 'viajes') {
          nombrePlantillaAgentes = 'chofer_sanjose';
        }

        plantillasMeta.notificacionDiariaAgentes = {
          activa: true,
          nombre: nombrePlantillaAgentes,
          idioma: 'es',
          metaApiUrl: `https://graph.facebook.com/v22.0/{{phoneNumberId}}/messages`,
          metaPayload: {
            messaging_product: 'whatsapp',
            to: '{{telefono}}',
            type: 'template',
            template: {
              name: nombrePlantillaAgentes,
              language: { code: 'es' },
              components: [{
                type: 'body',
                parameters: [
                  { type: 'text', text: '{{agente}}' },
                  { type: 'text', text: '{{lista_turnos}}' }
                ]
              }]
            }
          },
          variables: {
            phoneNumberId: { origen: 'empresa', campo: 'phoneNumberId' },
            telefono: { origen: 'agente', campo: 'telefono' },
            agente: { origen: 'calculado', formula: 'agente.nombre + " " + agente.apellido' },
            lista_turnos: { origen: 'calculado', formula: 'construirListaTurnos(turnos, config)' }
          },
          programacion: {
            metodoVerificacion: 'hora_fija',
            horaEnvio: '06:00',
            frecuencia: 'diaria',
            rangoHorario: 'hoy',
            filtroEstado: ['pendiente', 'confirmado'],
            incluirDetalles: {
              origen: true,
              destino: true,
              nombreCliente: true,
              telefonoCliente: false,
              horaReserva: true,
              notasInternas: false
            }
          }
        };

        console.log(`   ✅ Plantilla: ${nombrePlantillaAgentes}`);
        console.log(`   ✅ Método: hora_fija (06:00)`);

        // 2. CONFIRMACIÓN TURNOS CLIENTES
        console.log('\n✅ Configurando confirmación de turnos...');

        let nombrePlantillaClientes = 'clientes_sanjose';
        if (config.empresaId !== 'San Jose') {
          nombrePlantillaClientes = `clientes_${config.empresaId.toLowerCase().replace(/\s+/g, '_')}`;
        }

        plantillasMeta.confirmacionTurnos = {
          activa: true,
          nombre: nombrePlantillaClientes,
          idioma: 'es',
          metaApiUrl: `https://graph.facebook.com/v22.0/{{phoneNumberId}}/messages`,
          metaPayload: {
            messaging_product: 'whatsapp',
            to: '{{telefono}}',
            type: 'template',
            template: {
              name: nombrePlantillaClientes,
              language: { code: 'es' },
              components: [{
                type: 'body',
                parameters: [
                  { type: 'text', text: '{{nombre_cliente}}' },
                  { type: 'text', text: '{{fecha_hora}}' }
                ]
              }]
            }
          },
          variables: {
            phoneNumberId: { origen: 'empresa', campo: 'phoneNumberId' },
            telefono: { origen: 'cliente', campo: 'telefono' },
            nombre_cliente: { origen: 'calculado', formula: 'cliente.nombre + " " + cliente.apellido' },
            fecha_hora: { origen: 'calculado', formula: 'construirDetallesTurnos(turnos)' }
          },
          programacion: {
            metodoVerificacion: 'hora_fija',
            horaEnvio: '22:00',
            diasAntes: 1,
            filtroEstado: ['no_confirmado', 'pendiente']
          }
        };

        console.log(`   ✅ Plantilla: ${nombrePlantillaClientes}`);
        console.log(`   ✅ Método: hora_fija (22:00, 1 día antes)`);

        // Actualizar configuración
        console.log('\n💾 Guardando cambios en MongoDB...');
        
        (config as any).plantillasMeta = plantillasMeta;
        await config.save();

        console.log('✅ Configuración migrada exitosamente');
        migradas++;

      } catch (error) {
        console.error(`❌ Error procesando ${config.empresaId}:`, error);
        errores++;
      }
    }

    // Resumen final
    console.log('\n\n📊 ========================================');
    console.log('   RESUMEN DE MIGRACIÓN');
    console.log('========================================');
    console.log(`✅ Migradas exitosamente: ${migradas}`);
    console.log(`ℹ️  Ya actualizadas: ${yaActualizadas}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📋 Total procesadas: ${configuraciones.length}`);
    console.log('========================================\n');

    if (migradas > 0) {
      console.log('🎉 ¡Migración completada!\n');
      console.log('📝 Próximos pasos:');
      console.log('   1. Verificar plantillas en Meta Business Manager:');
      console.log('      https://business.facebook.com/wa/manage/message-templates/');
      console.log('   2. Asegurarse de que las plantillas estén aprobadas');
      console.log('   3. Probar notificaciones con el endpoint:');
      console.log('      POST /api/modules/calendar/notificaciones-meta/test');
      console.log('   4. Reiniciar el servidor para aplicar cambios\n');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error en migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrarSistemaNotificaciones();
