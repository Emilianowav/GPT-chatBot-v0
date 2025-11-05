// 🧪 Script de prueba DIRECTO para notificaciones diarias de agentes
// Este script envía las notificaciones SIN verificar la hora configurada
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';
import { AgenteModel } from '../modules/calendar/models/Agente.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { EmpresaModel } from '../models/Empresa.js';
import { enviarMensajeWhatsAppTexto } from '../services/metaService.js';

/**
 * Formatear fecha y hora
 */
function formatearFechaHora(fecha: Date) {
  const opciones: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires'
  };
  
  const fechaFormateada = fecha.toLocaleDateString('es-AR', opciones);
  const hora = fecha.toLocaleTimeString('es-AR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires'
  });
  
  return { fecha: fechaFormateada, hora };
}

/**
 * Procesar plantilla con variables
 */
function procesarPlantilla(plantilla: string, variables: Record<string, any>): string {
  let resultado = plantilla;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    resultado = resultado.replace(regex, value);
  }
  
  return resultado;
}

/**
 * Script para probar el envío DIRECTO de notificaciones diarias a agentes
 */
async function testNotificacionesDiariasAgentesDirecto() {
  try {
    console.log('🧪 Iniciando prueba DIRECTA de notificaciones diarias para agentes...\n');
    
    // Conectar a la base de datos
    await connectDB();
    
    // Empresa a probar
    const EMPRESA_ID = 'San Jose'; // Cambiar por tu empresa
    
    console.log(`🏢 Probando con empresa: ${EMPRESA_ID}\n`);
    
    // Obtener configuración
    const config = await ConfiguracionModuloModel.findOne({ empresaId: EMPRESA_ID });
    
    if (!config) {
      console.log('❌ No se encontró configuración para esta empresa');
      process.exit(1);
    }
    
    if (!config.notificacionDiariaAgentes) {
      console.log('❌ Esta empresa no tiene configurada la notificación diaria de agentes');
      console.log('💡 Ejecuta: npm run config:notif-diaria-agentes');
      process.exit(1);
    }
    
    const notifConfig = config.notificacionDiariaAgentes;
    
    console.log('📋 Configuración encontrada:');
    console.log(`   ⏰ Hora de envío: ${notifConfig.horaEnvio}`);
    console.log(`   🔔 Activa: ${notifConfig.activa ? 'Sí' : 'No'}`);
    console.log(`   👥 Enviar a todos: ${notifConfig.enviarATodos ? 'Sí' : 'Solo con turnos'}`);
    console.log(`   📝 Plantilla: ${notifConfig.plantillaMensaje.substring(0, 50)}...`);
    console.log(`\n📋 Detalles a incluir:`);
    console.log(`   Origen: ${notifConfig.incluirDetalles.origen ? '✅' : '❌'}`);
    console.log(`   Destino: ${notifConfig.incluirDetalles.destino ? '✅' : '❌'}`);
    console.log(`   Nombre Cliente: ${notifConfig.incluirDetalles.nombreCliente ? '✅' : '❌'}`);
    console.log(`   Teléfono Cliente: ${notifConfig.incluirDetalles.telefonoCliente ? '✅' : '❌'}`);
    console.log(`   Hora Reserva: ${notifConfig.incluirDetalles.horaReserva ? '✅' : '❌'}`);
    console.log(`   Notas Internas: ${notifConfig.incluirDetalles.notasInternas ? '✅' : '❌'}`);
    console.log('\n');
    
    // Calcular rango de fechas (hoy)
    const ahora = new Date();
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0);
    const fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
    
    console.log(`📅 Buscando turnos de hoy: ${inicio.toLocaleDateString('es-AR')} - ${fin.toLocaleDateString('es-AR')}\n`);
    
    // Buscar agentes
    let agentes;
    if (notifConfig.enviarATodos) {
      agentes = await AgenteModel.find({ empresaId: EMPRESA_ID, activo: true });
    } else {
      const agentesConTurnos = await TurnoModel.distinct('agenteId', {
        empresaId: EMPRESA_ID,
        fechaInicio: { $gte: inicio, $lt: fin },
        estado: { $in: ['pendiente', 'confirmado'] }
      });
      
      agentes = await AgenteModel.find({
        _id: { $in: agentesConTurnos },
        empresaId: EMPRESA_ID,
        activo: true
      });
    }
    
    console.log(`👥 Agentes encontrados: ${agentes.length}\n`);
    
    if (agentes.length === 0) {
      console.log('⚠️ No hay agentes para notificar');
      process.exit(0);
    }
    
    // Enviar a cada agente
    for (const agente of agentes) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📤 Procesando agente: ${agente.nombre} ${agente.apellido}`);
      console.log(`📞 Teléfono: ${agente.telefono}`);
      
      // Buscar turnos del agente
      const query: any = {
        empresaId: EMPRESA_ID,
        agenteId: agente._id,
        fechaInicio: { $gte: inicio, $lt: fin }
      };
      
      if (notifConfig.filtroEstado && notifConfig.filtroEstado.activo) {
        query.estado = { $in: notifConfig.filtroEstado.estados };
      } else {
        query.estado = { $in: ['pendiente', 'confirmado'] };
      }
      
      const turnos = await TurnoModel.find(query)
        .populate('clienteId')
        .sort({ fechaInicio: 1 });
      
      console.log(`📋 Turnos encontrados: ${turnos.length}`);
      
      // Construir mensaje
      let mensaje = procesarPlantilla(notifConfig.plantillaMensaje, {
        agente: `${agente.nombre} ${agente.apellido}`,
        turnos: config.nomenclatura.turnos.toLowerCase(),
        cantidad: turnos.length
      });
      
      mensaje += '\n\n';
      
      if (turnos.length === 0) {
        mensaje += `No tienes ${config.nomenclatura.turnos.toLowerCase()} programados para hoy. 🎉`;
      } else {
        mensaje += `📋 *${turnos.length} ${turnos.length === 1 ? config.nomenclatura.turno : config.nomenclatura.turnos}:*\n\n`;
        
        for (let i = 0; i < turnos.length; i++) {
          const turno = turnos[i];
          const { hora } = formatearFechaHora(new Date(turno.fechaInicio));
          
          mensaje += `${i + 1}. 🕐 ${hora}`;
          
          // Obtener contacto
          const contacto = await ContactoEmpresaModel.findOne({
            _id: turno.clienteId,
            empresaId: EMPRESA_ID
          });
          
          const detalles: string[] = [];
          
          if (notifConfig.incluirDetalles.nombreCliente && contacto) {
            detalles.push(`${contacto.nombre} ${contacto.apellido}`);
          }
          
          if (notifConfig.incluirDetalles.telefonoCliente && contacto) {
            detalles.push(`📞 ${contacto.telefono}`);
          }
          
          if (notifConfig.incluirDetalles.origen && turno.datos?.origen) {
            detalles.push(`📍 Origen: ${turno.datos.origen}`);
          }
          
          if (notifConfig.incluirDetalles.destino && turno.datos?.destino) {
            detalles.push(`🎯 Destino: ${turno.datos.destino}`);
          }
          
          if (notifConfig.incluirDetalles.notasInternas && turno.notasInternas) {
            detalles.push(`📝 ${turno.notasInternas}`);
          }
          
          if (detalles.length > 0) {
            mensaje += '\n   ' + detalles.join('\n   ');
          }
          
          mensaje += '\n\n';
        }
      }
      
      mensaje += '¡Que tengas un excelente día! 💪';
      
      console.log('\n📝 Mensaje a enviar:');
      console.log('─────────────────────────────────────────');
      console.log(mensaje);
      console.log('─────────────────────────────────────────\n');
      
      // Enviar mensaje
      try {
        // Obtener phoneNumberId de la empresa
        const empresa = await EmpresaModel.findById(EMPRESA_ID);
        if (!empresa || !empresa.phoneNumberId) {
          console.error(`❌ No se encontró phoneNumberId para la empresa ${EMPRESA_ID}`);
          continue;
        }
        
        await enviarMensajeWhatsAppTexto(agente.telefono, mensaje, empresa.phoneNumberId);
        console.log(`✅ Notificación enviada a ${agente.nombre} ${agente.apellido}`);
      } catch (error) {
        console.error(`❌ Error enviando a ${agente.nombre}:`, error);
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
    console.log('\n✅ Prueba completada\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    process.exit(1);
  }
}

// Ejecutar
testNotificacionesDiariasAgentesDirecto();
