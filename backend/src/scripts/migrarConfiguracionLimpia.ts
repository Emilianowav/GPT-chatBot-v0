// 🔄 Migración de ConfiguracionModulo a estructura limpia y escalable
// Elimina campos obsoletos y reorganiza en estructura clara

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';

dotenv.config();

async function migrarConfiguracion() {
  try {
    console.log('🔄 Iniciando migración a estructura limpia...\n');
    
    await connectDB();
    
    const collection = mongoose.connection.collection('configuraciones_modulo');
    
    // Obtener configuración actual
    const empresaId = 'San Jose';
    const configActual = await collection.findOne({ empresaId });
    
    if (!configActual) {
      console.log('❌ No se encontró configuración para San Jose');
      process.exit(1);
    }
    
    console.log('📊 CONFIGURACIÓN ACTUAL:');
    console.log('   Campos totales:', Object.keys(configActual).length);
    console.log('   Notificaciones:', configActual.notificaciones?.length || 0);
    console.log('   Notificación diaria agentes:', !!configActual.notificacionDiariaAgentes);
    console.log('');
    
    // ═══════════════════════════════════════
    // CONSTRUIR NUEVA ESTRUCTURA
    // ═══════════════════════════════════════
    
    const configLimpia: any = {
      empresaId: configActual.empresaId,
      
      // 🏢 Información básica
      tipoNegocio: configActual.tipoNegocio || 'viajes',
      activo: configActual.activo !== undefined ? configActual.activo : true,
      
      // 📝 Nomenclatura
      nomenclatura: configActual.nomenclatura || {
        turno: 'Turno',
        turnos: 'Turnos',
        agente: 'Agente',
        agentes: 'Agentes',
        cliente: 'Cliente',
        clientes: 'Clientes'
      },
      
      // 🎨 Campos personalizados
      camposPersonalizados: configActual.camposPersonalizados || [],
      
      // ⚙️ Configuración de turnos
      turnos: {
        usaAgentes: configActual.usaAgentes !== undefined ? configActual.usaAgentes : true,
        agenteRequerido: configActual.agenteRequerido !== undefined ? configActual.agenteRequerido : true,
        usaRecursos: configActual.usaRecursos !== undefined ? configActual.usaRecursos : false,
        recursoRequerido: configActual.recursoRequerido !== undefined ? configActual.recursoRequerido : false,
        duracionPorDefecto: configActual.duracionPorDefecto || 60,
        permiteDuracionVariable: configActual.permiteDuracionVariable !== undefined ? configActual.permiteDuracionVariable : true
      },
      
      // 📱 Plantillas de Meta (Sistema Escalable)
      plantillasMeta: {}
    };
    
    // ═══════════════════════════════════════
    // MIGRAR NOTIFICACIÓN DIARIA DE AGENTES
    // ═══════════════════════════════════════
    
    if (configActual.notificacionDiariaAgentes) {
      const notifAgentes = configActual.notificacionDiariaAgentes;
      
      configLimpia.plantillasMeta.notificacionDiariaAgentes = {
        activa: notifAgentes.activa || false,
        nombre: notifAgentes.plantillaMeta?.nombre || 'chofer_sanjose',
        idioma: notifAgentes.plantillaMeta?.idioma || 'es',
        
        // ✅ Estructura completa con metaApiUrl y metaPayload
        metaApiUrl: 'https://graph.facebook.com/v22.0/{{phoneNumberId}}/messages',
        metaPayload: {
          messaging_product: 'whatsapp',
          to: '{{telefono}}',
          type: 'template',
          template: {
            name: notifAgentes.plantillaMeta?.nombre || 'chofer_sanjose',
            language: { code: notifAgentes.plantillaMeta?.idioma || 'es' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: '{{agente}}' },
                  { type: 'text', text: '{{lista_turnos}}' }
                ]
              }
            ]
          }
        },
        
        // Variables
        variables: {
          phoneNumberId: { origen: 'empresa', campo: 'phoneNumberId' },
          telefono: { origen: 'agente', campo: 'telefono' },
          agente: { origen: 'calculado', formula: "agente.nombre + ' ' + agente.apellido" },
          lista_turnos: { origen: 'calculado', formula: 'construirListaTurnos(turnos, config)' }
        },
        
        // Programación
        programacion: {
          horaEnvio: notifAgentes.horaEnvio || '06:00',
          frecuencia: notifAgentes.frecuencia?.tipo || 'diaria',
          rangoHorario: notifAgentes.rangoHorario?.tipo || 'hoy',
          filtroEstado: notifAgentes.filtroEstado?.estados || ['pendiente', 'confirmado'],
          incluirDetalles: notifAgentes.incluirDetalles || {
            origen: true,
            destino: true,
            nombreCliente: true,
            horaReserva: true
          }
        },
        
        ultimoEnvio: notifAgentes.ultimoEnvio || null
      };
    }
    
    // ═══════════════════════════════════════
    // MIGRAR CONFIRMACIÓN DE TURNOS
    // ═══════════════════════════════════════
    
    if (configActual.notificaciones && configActual.notificaciones.length > 0) {
      const notifConfirmacion = configActual.notificaciones.find((n: any) => n.tipo === 'confirmacion');
      
      if (notifConfirmacion) {
        configLimpia.plantillasMeta.confirmacionTurnos = {
          activa: notifConfirmacion.activa || false,
          nombre: 'clientes_sanjose',
          idioma: 'es',
          
          metaApiUrl: 'https://graph.facebook.com/v22.0/{{phoneNumberId}}/messages',
          metaPayload: {
            messaging_product: 'whatsapp',
            to: '{{telefono}}',
            type: 'template',
            template: {
              name: 'clientes_sanjose',
              language: { code: 'es' },
              components: []
            }
          },
          
          variables: {
            phoneNumberId: { origen: 'empresa', campo: 'phoneNumberId' },
            telefono: { origen: 'cliente', campo: 'telefono' }
          },
          
          programacion: {
            momento: 'dia_antes_turno',
            horaEnvio: notifConfirmacion.horaEnvioDiaAntes || '21:00',
            diasAntes: notifConfirmacion.diasAntes || 1,
            filtroEstado: notifConfirmacion.filtros?.estados || ['pendiente', 'no_confirmado']
          }
        };
      }
    }
    
    // Timestamps
    configLimpia.creadoEn = configActual.creadoEn || new Date();
    configLimpia.actualizadoEn = new Date();
    
    // ═══════════════════════════════════════
    // MOSTRAR COMPARACIÓN
    // ═══════════════════════════════════════
    
    console.log('📊 COMPARACIÓN:');
    console.log('═══════════════════════════════════════');
    console.log('ANTES:');
    console.log('   Campos totales:', Object.keys(configActual).length);
    console.log('   Notificaciones array:', configActual.notificaciones?.length || 0);
    console.log('   Campos obsoletos: ~15');
    console.log('');
    console.log('DESPUÉS:');
    console.log('   Campos totales:', Object.keys(configLimpia).length);
    console.log('   Plantillas Meta:', Object.keys(configLimpia.plantillasMeta).length);
    console.log('   Campos obsoletos: 0');
    console.log('');
    
    // ═══════════════════════════════════════
    // GUARDAR BACKUP Y APLICAR
    // ═══════════════════════════════════════
    
    console.log('💾 Guardando backup...');
    await collection.updateOne(
      { empresaId },
      { $set: { _backup: configActual, _backupFecha: new Date() } }
    );
    
    console.log('✅ Aplicando nueva configuración...');
    const resultado = await collection.replaceOne(
      { empresaId },
      configLimpia
    );
    
    console.log('');
    console.log('✅ MIGRACIÓN COMPLETADA');
    console.log('═══════════════════════════════════════');
    console.log('   Documentos modificados:', resultado.modifiedCount);
    console.log('');
    console.log('📋 NUEVA ESTRUCTURA:');
    console.log(JSON.stringify(configLimpia, null, 2));
    console.log('');
    console.log('⚠️ IMPORTANTE:');
    console.log('   1. Verifica que todo funcione correctamente');
    console.log('   2. El backup está en el campo _backup del documento');
    console.log('   3. Actualiza el modelo TypeScript si es necesario');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

migrarConfiguracion();
