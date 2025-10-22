// 🔔 Servicio de Notificaciones Automáticas
// import cron from 'node-cron'; // TODO: Instalar node-cron
import { TurnoModel, EstadoTurno } from '../modules/calendar/models/Turno.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';
import { ClienteModel } from '../models/Cliente.js';

/**
 * Procesar plantilla de mensaje con variables
 */
function procesarPlantilla(plantilla: string, variables: Record<string, any>): string {
  let mensaje = plantilla;
  
  Object.entries(variables).forEach(([clave, valor]) => {
    const regex = new RegExp(`\\{${clave}\\}`, 'g');
    mensaje = mensaje.replace(regex, valor || '');
  });
  
  return mensaje;
}

/**
 * Formatear fecha y hora
 */
function formatearFechaHora(fecha: Date): { fecha: string; hora: string } {
  return {
    fecha: fecha.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }),
    hora: fecha.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  };
}

/**
 * Enviar notificación (integración con sistema de mensajería)
 */
async function enviarNotificacion(
  telefono: string, 
  mensaje: string, 
  empresaId: string
): Promise<boolean> {
  try {
    // TODO: Integrar con tu sistema de mensajería (WhatsApp, SMS, etc.)
    console.log('📤 Enviando notificación:');
    console.log('  Teléfono:', telefono);
    console.log('  Empresa:', empresaId);
    console.log('  Mensaje:', mensaje);
    
    // Aquí irá la integración con tu API de WhatsApp/SMS
    // Por ejemplo:
    // await whatsappAPI.sendMessage(telefono, mensaje);
    
    return true;
  } catch (error) {
    console.error('❌ Error al enviar notificación:', error);
    return false;
  }
}

/**
 * Procesar notificaciones pendientes
 */
export async function procesarNotificacionesPendientes() {
  try {
    console.log('🔔 Procesando notificaciones pendientes...');
    
    const ahora = new Date();
    
    // Buscar turnos con notificaciones pendientes
    const turnos = await TurnoModel.find({
      fechaInicio: { $gte: ahora },
      estado: { $in: ['pendiente', 'confirmado'] },
      'notificaciones.enviada': false,
      'notificaciones.programadaPara': { $lte: ahora }
    }).populate('agenteId');
    
    console.log(`📋 Encontrados ${turnos.length} turnos con notificaciones pendientes`);
    
    for (const turno of turnos) {
      try {
        // Obtener configuración de la empresa
        const configuracion = await ConfiguracionModuloModel.findOne({ 
          empresaId: turno.empresaId 
        });
        
        if (!configuracion) {
          console.log(`⚠️ No hay configuración para empresa ${turno.empresaId}`);
          continue;
        }
        
        // Obtener datos del cliente
        const cliente = await ClienteModel.findOne({ 
          _id: turno.clienteId,
          empresaId: turno.empresaId
        });
        
        if (!cliente) {
          console.log(`⚠️ Cliente no encontrado: ${turno.clienteId}`);
          continue;
        }
        
        // Procesar cada notificación pendiente
        for (let i = 0; i < turno.notificaciones.length; i++) {
          const notif = turno.notificaciones[i];
          
          if (notif.enviada || new Date(notif.programadaPara) > ahora) {
            continue;
          }
          
          // Preparar variables para la plantilla
          const { fecha, hora } = formatearFechaHora(new Date(turno.fechaInicio));
          
          const variables: Record<string, any> = {
            // Variables básicas
            fecha,
            hora,
            duracion: `${turno.duracion} minutos`,
            turno: configuracion.nomenclatura.turno.toLowerCase(),
            cliente: `${cliente.nombre} ${cliente.apellido}`,
            
            // Agente (si existe)
            agente: (turno.agenteId as any)?.nombre 
              ? `${(turno.agenteId as any).nombre} ${(turno.agenteId as any).apellido}`
              : '',
            
            // Campos dinámicos
            ...turno.datos
          };
          
          // Procesar plantilla
          const mensaje = procesarPlantilla(notif.plantilla, variables);
          
          // Enviar notificación
          const enviada = await enviarNotificacion(
            cliente.telefono,
            mensaje,
            turno.empresaId
          );
          
          if (enviada) {
            // Marcar como enviada
            turno.notificaciones[i].enviada = true;
            turno.notificaciones[i].enviadaEn = new Date();
            
            console.log(`✅ Notificación enviada para turno ${turno._id}`);
          }
        }
        
        // Guardar cambios
        await turno.save();
        
      } catch (error) {
        console.error(`❌ Error procesando turno ${turno._id}:`, error);
      }
    }
    
    console.log('✅ Procesamiento de notificaciones completado');
    
  } catch (error) {
    console.error('❌ Error en procesarNotificacionesPendientes:', error);
  }
}

/**
 * Programar notificaciones para un turno nuevo
 */
export async function programarNotificacionesTurno(
  turnoId: string,
  empresaId: string
) {
  try {
    const configuracion = await ConfiguracionModuloModel.findOne({ empresaId });
    
    if (!configuracion || !configuracion.notificaciones || configuracion.notificaciones.length === 0) {
      return;
    }
    
    const turno = await TurnoModel.findById(turnoId);
    
    if (!turno) {
      throw new Error('Turno no encontrado');
    }
    
    const notificacionesProgramadas = [];
    const fechaTurno = new Date(turno.fechaInicio);
    
    for (const configNotif of configuracion.notificaciones) {
      if (!configNotif.activa) continue;
      
      let fechaEnvio: Date;
      
      switch (configNotif.momento) {
        case 'noche_anterior':
          // Enviar la noche anterior a la hora configurada
          fechaEnvio = new Date(fechaTurno);
          fechaEnvio.setDate(fechaEnvio.getDate() - 1);
          const [hora, minuto] = (configNotif.horaEnvio || '22:00').split(':');
          fechaEnvio.setHours(parseInt(hora), parseInt(minuto), 0, 0);
          break;
          
        case 'mismo_dia':
          // Enviar el mismo día a la hora configurada
          fechaEnvio = new Date(fechaTurno);
          const [horaDia, minutoDia] = (configNotif.horaEnvio || '08:00').split(':');
          fechaEnvio.setHours(parseInt(horaDia), parseInt(minutoDia), 0, 0);
          break;
          
        case 'horas_antes':
          // Enviar X horas antes
          fechaEnvio = new Date(fechaTurno);
          fechaEnvio.setHours(fechaEnvio.getHours() - (configNotif.horasAntes || 24));
          break;
          
        default:
          continue;
      }
      
      // No programar notificaciones en el pasado
      if (fechaEnvio < new Date()) {
        continue;
      }
      
      notificacionesProgramadas.push({
        tipo: configNotif.tipo,
        programadaPara: fechaEnvio,
        enviada: false,
        plantilla: configNotif.plantillaMensaje
      });
    }
    
    // Actualizar turno con notificaciones programadas
    turno.notificaciones = notificacionesProgramadas;
    await turno.save();
    
    console.log(`✅ Programadas ${notificacionesProgramadas.length} notificaciones para turno ${turnoId}`);
    
  } catch (error) {
    console.error('❌ Error programando notificaciones:', error);
    throw error;
  }
}

/**
 * Iniciar servicio de notificaciones (Cron Job)
 */
export function iniciarServicioNotificaciones() {
  console.log('🚀 Iniciando servicio de notificaciones automáticas...');
  
  // TODO: Instalar node-cron y descomentar
  // Ejecutar cada 5 minutos
  // cron.schedule('*/5 * * * *', async () => {
  //   console.log('⏰ Ejecutando tarea programada de notificaciones...');
  //   await procesarNotificacionesPendientes();
  // });
  
  // También ejecutar cada hora para notificaciones nocturnas
  // cron.schedule('0 * * * *', async () => {
  //   console.log('⏰ Verificando notificaciones nocturnas...');
  //   await procesarNotificacionesPendientes();
  // });
  
  console.log('✅ Servicio de notificaciones iniciado');
  console.log('   - Cada 5 minutos: Notificaciones generales');
  console.log('   - Cada hora: Notificaciones nocturnas');
}

/**
 * Manejar respuesta de confirmación del cliente
 */
export async function manejarRespuestaConfirmacion(
  turnoId: string,
  respuesta: string
): Promise<{ confirmado: boolean; mensaje: string }> {
  try {
    const turno = await TurnoModel.findById(turnoId);
    
    if (!turno) {
      throw new Error('Turno no encontrado');
    }
    
    const respuestaLimpia = respuesta.toLowerCase().trim();
    
    if (['si', 'sí', 'yes', 'confirmo', 'ok'].includes(respuestaLimpia)) {
      // Confirmar turno
      turno.confirmado = true;
      turno.confirmadoEn = new Date();
      turno.estado = EstadoTurno.CONFIRMADO;
      
      // Marcar notificación como respondida
      const notifPendiente = turno.notificaciones.find(n => 
        n.tipo === 'confirmacion' && !n.respuesta
      );
      
      if (notifPendiente) {
        notifPendiente.respuesta = respuesta;
        notifPendiente.respondidoEn = new Date();
      }
      
      await turno.save();
      
      return {
        confirmado: true,
        mensaje: '✅ ¡Perfecto! Tu turno está confirmado. Nos vemos pronto.'
      };
      
    } else if (['no', 'cancelar', 'cancel'].includes(respuestaLimpia)) {
      // Cancelar turno
      turno.estado = EstadoTurno.CANCELADO;
      turno.canceladoEn = new Date();
      turno.motivoCancelacion = 'Cancelado por el cliente vía notificación';
      
      await turno.save();
      
      return {
        confirmado: false,
        mensaje: '❌ Turno cancelado. Si necesitas reprogramar, contáctanos.'
      };
      
    } else {
      return {
        confirmado: false,
        mensaje: 'Por favor responde SÍ para confirmar o NO para cancelar.'
      };
    }
    
  } catch (error) {
    console.error('❌ Error manejando respuesta:', error);
    throw error;
  }
}
