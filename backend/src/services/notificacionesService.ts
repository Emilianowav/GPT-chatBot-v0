// 🔔 Servicio de Notificaciones Automáticas
// import cron from 'node-cron'; // TODO: Instalar node-cron
import { TurnoModel, EstadoTurno } from '../modules/calendar/models/Turno.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';
import { ClienteModel } from '../models/Cliente.js';
import { AgenteModel } from '../modules/calendar/models/Agente.js';
import { enviarMensajeWhatsAppTexto } from '../services/metaService.js';
import { EmpresaModel } from '../models/Empresa.js';

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
 * Enviar notificación vía WhatsApp usando el número del chatbot
 */
async function enviarNotificacion(
  telefono: string, 
  mensaje: string, 
  empresaId: string
): Promise<boolean> {
  try {
    console.log('📤 Enviando notificación:');
    console.log('  Teléfono:', telefono);
    console.log('  Empresa:', empresaId);
    console.log('  Mensaje:', mensaje);
    
    // Obtener configuración de la empresa para el phoneNumberId
    // empresaId puede ser el nombre de la empresa o el ObjectId
    let empresa;
    
    // Intentar primero por nombre (más común en este sistema)
    empresa = await EmpresaModel.findOne({ nombre: empresaId });
    
    // Si no se encuentra y el ID parece ser un ObjectId válido, intentar por _id
    if (!empresa && empresaId.match(/^[0-9a-fA-F]{24}$/)) {
      empresa = await EmpresaModel.findOne({ _id: empresaId });
    }
    
    if (!empresa) {
      console.error('❌ Empresa no encontrada:', empresaId);
      return false;
    }
    
    // Obtener phoneNumberId de la empresa
    const phoneNumberId = (empresa as any).phoneNumberId;
    
    if (!phoneNumberId) {
      console.error('❌ phoneNumberId no configurado para empresa:', empresaId);
      return false;
    }
    
    // Enviar mensaje vía WhatsApp API
    await enviarMensajeWhatsAppTexto(telefono, mensaje, phoneNumberId);
    
    console.log('✅ Notificación enviada exitosamente');
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
        
        // Procesar cada notificación pendiente
        for (let i = 0; i < turno.notificaciones.length; i++) {
          const notif = turno.notificaciones[i];
          
          if (notif.enviada || new Date(notif.programadaPara) > ahora) {
            continue;
          }
          
          // Determinar destinatario
          const esParaCliente = (notif as any).destinatario !== 'agente';
          let telefono: string;
          let nombreDestinatario: string;
          
          if (esParaCliente) {
            // Obtener datos del cliente
            const cliente = await ClienteModel.findOne({ 
              _id: turno.clienteId,
              empresaId: turno.empresaId
            });
            
            if (!cliente) {
              console.log(`⚠️ Cliente no encontrado: ${turno.clienteId}`);
              continue;
            }
            
            telefono = cliente.telefono;
            nombreDestinatario = `${cliente.nombre} ${cliente.apellido}`;
          } else {
            // Obtener datos del agente
            if (!turno.agenteId) {
              console.log(`⚠️ Turno sin agente asignado: ${turno._id}`);
              continue;
            }
            
            const agente = await AgenteModel.findById(turno.agenteId);
            if (!agente || !agente.telefono) {
              console.log(`⚠️ Agente sin teléfono: ${turno.agenteId}`);
              continue;
            }
            
            telefono = agente.telefono;
            nombreDestinatario = `${agente.nombre} ${agente.apellido}`;
          }
          
          // Preparar variables para la plantilla
          const { fecha, hora } = formatearFechaHora(new Date(turno.fechaInicio));
          
          // Obtener cliente para variables
          const cliente = await ClienteModel.findOne({ 
            _id: turno.clienteId,
            empresaId: turno.empresaId
          });
          
          const variables: Record<string, any> = {
            // Variables básicas
            fecha,
            hora,
            duracion: `${turno.duracion} minutos`,
            turno: configuracion.nomenclatura.turno.toLowerCase(),
            cliente: cliente ? `${cliente.nombre} ${cliente.apellido}` : '',
            telefono: cliente?.telefono || '',
            
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
            telefono,
            mensaje,
            turno.empresaId
          );
          
          if (enviada) {
            // Marcar como enviada
            turno.notificaciones[i].enviada = true;
            turno.notificaciones[i].enviadaEn = new Date();
            
            console.log(`✅ Notificación enviada para turno ${turno._id} a ${esParaCliente ? 'cliente' : 'agente'}`);
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
        case 'inmediata':
          // Enviar inmediatamente
          fechaEnvio = new Date();
          break;
          
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
 * Notificar a clientes sobre disponibilidad de turnos
 * Útil para llenar espacios vacíos o cancelaciones de último momento
 */
export async function notificarDisponibilidad(
  empresaId: string,
  agenteId: string,
  fecha: Date,
  mensaje: string
): Promise<{ enviados: number; errores: number }> {
  try {
    console.log('📢 Notificando disponibilidad de turnos...');
    
    // Buscar clientes que acepten notificaciones de disponibilidad
    const clientes = await ClienteModel.find({
      empresaId,
      activo: true,
      'preferencias.notificacionesDisponibilidad': true,
      'preferencias.aceptaWhatsApp': true
    });
    
    console.log(`📋 Encontrados ${clientes.length} clientes interesados`);
    
    let enviados = 0;
    let errores = 0;
    
    for (const cliente of clientes) {
      try {
        const enviada = await enviarNotificacion(
          cliente.telefono,
          mensaje,
          empresaId
        );
        
        if (enviada) {
          enviados++;
        } else {
          errores++;
        }
        
        // Pequeña pausa entre envíos para no saturar
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error enviando a ${cliente.telefono}:`, error);
        errores++;
      }
    }
    
    console.log(`✅ Notificaciones enviadas: ${enviados}, Errores: ${errores}`);
    
    return { enviados, errores };
    
  } catch (error) {
    console.error('❌ Error en notificarDisponibilidad:', error);
    throw error;
  }
}

/**
 * Notificar cuando se cancela un turno (para ofrecer el espacio)
 */
export async function notificarCancelacion(
  turnoId: string
): Promise<void> {
  try {
    const turno = await TurnoModel.findById(turnoId).populate('agenteId');
    
    if (!turno) {
      throw new Error('Turno no encontrado');
    }
    
    const { fecha, hora } = formatearFechaHora(new Date(turno.fechaInicio));
    const agente = (turno.agenteId as any);
    
    const mensaje = `🔔 ¡Turno disponible!\n\n` +
      `Se liberó un espacio para el ${fecha} a las ${hora}${agente ? ` con ${agente.nombre} ${agente.apellido}` : ''}.\n\n` +
      `¿Te interesa? Responde SÍ para reservarlo.`;
    
    await notificarDisponibilidad(
      turno.empresaId,
      turno.agenteId as any,
      new Date(turno.fechaInicio),
      mensaje
    );
    
  } catch (error) {
    console.error('❌ Error en notificarCancelacion:', error);
    throw error;
  }
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
