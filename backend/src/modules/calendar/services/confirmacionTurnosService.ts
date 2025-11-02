// 🔔 Servicio de Confirmación Interactiva de Turnos
import TurnoModel, { EstadoTurno } from '../models/Turno';
import { ClienteModel } from '../../../models/Cliente';
import { AgenteModel } from '../models/Agente';
import { enviarMensajeWhatsAppTexto } from '../../../services/metaService';
import { EmpresaModel } from '../../../models/Empresa';

interface SesionConfirmacion {
  clienteId: string;
  telefono: string;
  turnos: any[];
  paso: 'inicial' | 'seleccion_turno' | 'edicion_campo';
  turnoEditando?: number;
  campoEditando?: 'origen' | 'destino' | 'hora';
  timestamp: Date;
}

// Almacenamiento temporal de sesiones (en producción usar Redis)
const sesionesActivas = new Map<string, SesionConfirmacion>();

/**
 * Procesar respuesta del cliente a notificación de confirmación
 */
export async function procesarRespuestaConfirmacion(
  telefono: string,
  mensaje: string,
  empresaId: string
): Promise<{ procesado: boolean; respuesta?: string }> {
  
  const mensajeNormalizado = mensaje.trim().toLowerCase();
  
  // Verificar si hay una sesión activa
  const sesion = sesionesActivas.get(telefono);
  
  if (sesion) {
    return await procesarSesionActiva(sesion, mensajeNormalizado, empresaId);
  }
  
  // Si no hay sesión, buscar turnos pendientes de confirmación
  const cliente = await ClienteModel.findOne({ telefono, empresaId });
  if (!cliente) {
    return { procesado: false };
  }

  const turnosPendientes = await TurnoModel.find({
    clienteId: cliente._id.toString(),
    empresaId,
    estado: { $in: [EstadoTurno.PENDIENTE, EstadoTurno.NO_CONFIRMADO] },
    fechaInicio: { $gte: new Date() }
  })
  .populate('agenteId')
  .sort({ fechaInicio: 1 })
  .limit(10);

  if (turnosPendientes.length === 0) {
    return { procesado: false };
  }

  // Respuestas rápidas: "si", "sí", "confirmar", "1"
  if (['si', 'sí', 'yes', 'confirmar', '1'].includes(mensajeNormalizado)) {
    return await confirmarTodosTurnos(turnosPendientes, telefono, empresaId);
  }

  // Si el mensaje es un número entre 1-10, podría ser selección de turno
  const numeroSeleccionado = parseInt(mensajeNormalizado);
  if (!isNaN(numeroSeleccionado) && numeroSeleccionado >= 1 && numeroSeleccionado <= turnosPendientes.length) {
    // Crear sesión para editar este turno
    const sesion: SesionConfirmacion = {
      clienteId: cliente._id.toString(),
      telefono,
      turnos: turnosPendientes,
      paso: 'edicion_campo',
      turnoEditando: numeroSeleccionado - 1,
      timestamp: new Date()
    };
    sesionesActivas.set(telefono, sesion);
    
    const turno = turnosPendientes[numeroSeleccionado - 1];
    const respuesta = generarMensajeEdicionTurno(turno, numeroSeleccionado);
    return { procesado: true, respuesta };
  }

  return { procesado: false };
}

/**
 * Procesar sesión activa de confirmación
 */
async function procesarSesionActiva(
  sesion: SesionConfirmacion,
  mensaje: string,
  empresaId: string
): Promise<{ procesado: boolean; respuesta?: string }> {
  
  // Limpiar sesiones antiguas (más de 10 minutos)
  const tiempoLimite = 10 * 60 * 1000;
  if (Date.now() - sesion.timestamp.getTime() > tiempoLimite) {
    sesionesActivas.delete(sesion.telefono);
    return { procesado: false };
  }

  if (sesion.paso === 'seleccion_turno') {
    const numeroSeleccionado = parseInt(mensaje);
    
    if (mensaje === 'cancelar' || mensaje === '0') {
      sesionesActivas.delete(sesion.telefono);
      return {
        procesado: true,
        respuesta: '❌ Operación cancelada. Tus turnos siguen pendientes de confirmación.'
      };
    }
    
    if (!isNaN(numeroSeleccionado) && numeroSeleccionado >= 1 && numeroSeleccionado <= sesion.turnos.length) {
      sesion.paso = 'edicion_campo';
      sesion.turnoEditando = numeroSeleccionado - 1;
      sesion.timestamp = new Date();
      
      const turno = sesion.turnos[numeroSeleccionado - 1];
      const respuesta = generarMensajeEdicionTurno(turno, numeroSeleccionado);
      return { procesado: true, respuesta };
    }
    
    return {
      procesado: true,
      respuesta: '❌ Número inválido. Por favor selecciona un número de la lista o escribe "cancelar".'
    };
  }
  
  if (sesion.paso === 'edicion_campo') {
    return await procesarEdicionCampo(sesion, mensaje, empresaId);
  }

  return { procesado: false };
}

/**
 * Confirmar todos los turnos
 */
async function confirmarTodosTurnos(
  turnos: any[],
  telefono: string,
  empresaId: string
): Promise<{ procesado: boolean; respuesta: string }> {
  
  let confirmados = 0;
  
  for (const turno of turnos) {
    try {
      turno.estado = EstadoTurno.CONFIRMADO;
      turno.confirmado = true;
      turno.fechaConfirmacion = new Date();
      
      // Agregar registro de confirmación
      if (!turno.notificaciones) turno.notificaciones = [];
      turno.notificaciones.push({
        tipo: 'confirmacion',
        enviada: true,
        fechaEnvio: new Date(),
        respuesta: 'CONFIRMADO',
        fechaRespuesta: new Date()
      });
      
      await turno.save();
      confirmados++;
    } catch (error) {
      console.error('Error confirmando turno:', error);
    }
  }

  const respuesta = confirmados === turnos.length
    ? `✅ ¡Perfecto! Todos tus ${confirmados} ${confirmados === 1 ? 'viaje ha sido confirmado' : 'viajes han sido confirmados'}.\n\n¡Nos vemos pronto! 🚗`
    : `✅ Se confirmaron ${confirmados} de ${turnos.length} viajes.\n\nSi necesitas ayuda, contáctanos.`;

  return { procesado: true, respuesta };
}

/**
 * Generar mensaje de edición de turno
 */
function generarMensajeEdicionTurno(turno: any, numero: number): string {
  const fechaInicio = new Date(turno.fechaInicio);
  const hora = fechaInicio.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const origen = turno.datos?.origen || 'No especificado';
  const destino = turno.datos?.destino || 'No especificado';
  
  return `✏️ *Editando Viaje #${numero}*

📍 *Origen actual:* ${origen}
📍 *Destino actual:* ${destino}
🕐 *Hora actual:* ${hora}

¿Qué deseas modificar?

1️⃣ Cambiar origen
2️⃣ Cambiar destino
3️⃣ Cambiar hora
4️⃣ Confirmar este viaje
5️⃣ Cancelar este viaje
0️⃣ Volver atrás

Escribe el número de la opción.`;
}

/**
 * Procesar edición de campo
 */
async function procesarEdicionCampo(
  sesion: SesionConfirmacion,
  mensaje: string,
  empresaId: string
): Promise<{ procesado: boolean; respuesta: string }> {
  
  const turno = sesion.turnos[sesion.turnoEditando!];
  
  // Si está editando un campo específico
  if (sesion.campoEditando) {
    return await guardarCampoEditado(sesion, mensaje, empresaId);
  }
  
  // Selección de qué editar
  switch (mensaje) {
    case '1':
      sesion.campoEditando = 'origen';
      sesion.timestamp = new Date();
      return {
        procesado: true,
        respuesta: '📍 *Nuevo origen*\n\nEscribe la dirección de origen del viaje:'
      };
      
    case '2':
      sesion.campoEditando = 'destino';
      sesion.timestamp = new Date();
      return {
        procesado: true,
        respuesta: '📍 *Nuevo destino*\n\nEscribe la dirección de destino del viaje:'
      };
      
    case '3':
      sesion.campoEditando = 'hora';
      sesion.timestamp = new Date();
      return {
        procesado: true,
        respuesta: '🕐 *Nueva hora*\n\nEscribe la hora en formato HH:MM (ej: 14:30):'
      };
      
    case '4':
      // Confirmar este turno
      try {
        turno.estado = EstadoTurno.CONFIRMADO;
        turno.confirmado = true;
        turno.fechaConfirmacion = new Date();
        await turno.save();
        
        sesionesActivas.delete(sesion.telefono);
        
        return {
          procesado: true,
          respuesta: '✅ ¡Viaje confirmado exitosamente!\n\n¿Necesitas confirmar o editar otro viaje? Escribe el número del viaje.'
        };
      } catch (error) {
        return {
          procesado: true,
          respuesta: '❌ Error al confirmar el viaje. Por favor intenta nuevamente.'
        };
      }
      
    case '5':
      // Cancelar este turno
      try {
        turno.estado = EstadoTurno.CANCELADO;
        turno.motivoCancelacion = 'Cancelado por el cliente vía WhatsApp';
        await turno.save();
        
        sesionesActivas.delete(sesion.telefono);
        
        return {
          procesado: true,
          respuesta: '❌ Viaje cancelado.\n\nSi necesitas reprogramar, contáctanos.'
        };
      } catch (error) {
        return {
          procesado: true,
          respuesta: '❌ Error al cancelar el viaje. Por favor intenta nuevamente.'
        };
      }
      
    case '0':
      sesion.paso = 'seleccion_turno';
      sesion.turnoEditando = undefined;
      sesion.campoEditando = undefined;
      sesion.timestamp = new Date();
      
      return {
        procesado: true,
        respuesta: generarMensajeListaTurnos(sesion.turnos)
      };
      
    default:
      return {
        procesado: true,
        respuesta: '❌ Opción inválida. Por favor selecciona un número del 0 al 5.'
      };
  }
}

/**
 * Guardar campo editado
 */
async function guardarCampoEditado(
  sesion: SesionConfirmacion,
  valor: string,
  empresaId: string
): Promise<{ procesado: boolean; respuesta: string }> {
  
  const turno = sesion.turnos[sesion.turnoEditando!];
  const campo = sesion.campoEditando!;
  
  try {
    if (campo === 'origen' || campo === 'destino') {
      if (!turno.datos) turno.datos = {};
      turno.datos[campo] = valor;
      await turno.save();
      
      sesion.campoEditando = undefined;
      sesion.timestamp = new Date();
      
      return {
        procesado: true,
        respuesta: `✅ ${campo.charAt(0).toUpperCase() + campo.slice(1)} actualizado a: *${valor}*\n\n${generarMensajeEdicionTurno(turno, sesion.turnoEditando! + 1)}`
      };
    }
    
    if (campo === 'hora') {
      // Validar formato HH:MM
      const regex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (!regex.test(valor)) {
        return {
          procesado: true,
          respuesta: '❌ Formato de hora inválido. Usa HH:MM (ej: 14:30)'
        };
      }
      
      const [horas, minutos] = valor.split(':').map(Number);
      const fechaInicio = new Date(turno.fechaInicio);
      fechaInicio.setHours(horas, minutos, 0, 0);
      
      turno.fechaInicio = fechaInicio;
      
      // Recalcular fechaFin
      const fechaFin = new Date(fechaInicio);
      fechaFin.setMinutes(fechaFin.getMinutes() + turno.duracion);
      turno.fechaFin = fechaFin;
      
      await turno.save();
      
      sesion.campoEditando = undefined;
      sesion.timestamp = new Date();
      
      return {
        procesado: true,
        respuesta: `✅ Hora actualizada a: *${valor}*\n\n${generarMensajeEdicionTurno(turno, sesion.turnoEditando! + 1)}`
      };
    }
    
  } catch (error) {
    console.error('Error guardando campo:', error);
    return {
      procesado: true,
      respuesta: '❌ Error al guardar los cambios. Por favor intenta nuevamente.'
    };
  }
  
  return { procesado: false, respuesta: '' };
}

/**
 * Generar mensaje con lista de turnos
 */
function generarMensajeListaTurnos(turnos: any[]): string {
  let mensaje = '📋 *Tus viajes pendientes:*\n\n';
  
  turnos.forEach((turno, index) => {
    const fechaInicio = new Date(turno.fechaInicio);
    const hora = fechaInicio.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const origen = turno.datos?.origen || 'No especificado';
    const destino = turno.datos?.destino || 'No especificado';
    
    mensaje += `${index + 1}️⃣ *Viaje ${index + 1}*\n`;
    mensaje += `   📍 ${origen} → ${destino}\n`;
    mensaje += `   🕐 ${hora}\n\n`;
  });
  
  mensaje += '\n*¿Qué deseas hacer?*\n\n';
  mensaje += '1️⃣ Confirmar todos los viajes\n';
  mensaje += '2️⃣ Editar un viaje (escribe el número)\n';
  mensaje += '0️⃣ Cancelar\n\n';
  mensaje += 'Escribe el número de la opción.';
  
  return mensaje;
}

/**
 * Enviar notificación de confirmación con opciones
 */
export async function enviarNotificacionConfirmacion(
  clienteId: string,
  turnos: any[],
  empresaId: string
): Promise<boolean> {
  
  try {
    const cliente = await ClienteModel.findById(clienteId);
    if (!cliente || !cliente.telefono) {
      console.error('Cliente sin teléfono');
      return false;
    }

    let mensaje = `🚗 *Recordatorio de ${turnos.length > 1 ? 'viajes' : 'viaje'} para mañana*\n\n`;
    
    turnos.forEach((turno, index) => {
      const fechaInicio = new Date(turno.fechaInicio);
      const hora = fechaInicio.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      const origen = turno.datos?.origen || 'No especificado';
      const destino = turno.datos?.destino || 'No especificado';
      const pasajeros = turno.datos?.pasajeros || '1';
      
      if (turnos.length > 1) {
        mensaje += `━━━━━━━━━━━━━━━━━━\n`;
        mensaje += `*Viaje ${index + 1}*\n\n`;
      }
      
      mensaje += `📍 *Origen:* ${origen}\n`;
      mensaje += `📍 *Destino:* ${destino}\n`;
      mensaje += `🕐 *Hora:* ${hora}\n`;
      mensaje += `👥 *Pasajeros:* ${pasajeros}\n\n`;
    });
    
    mensaje += `━━━━━━━━━━━━━━━━━━\n\n`;
    mensaje += `*¿Qué deseas hacer?*\n\n`;
    mensaje += `1️⃣ Confirmar ${turnos.length > 1 ? 'todos los viajes' : 'el viaje'}\n`;
    if (turnos.length > 1) {
      mensaje += `2️⃣ Editar un viaje específico\n`;
    } else {
      mensaje += `2️⃣ Editar este viaje\n`;
    }
    mensaje += `\nResponde con el número de la opción.`;

    // Crear sesión si hay múltiples turnos
    if (turnos.length > 1) {
      const sesion: SesionConfirmacion = {
        clienteId: clienteId,
        telefono: cliente.telefono,
        turnos: turnos,
        paso: 'inicial',
        timestamp: new Date()
      };
      sesionesActivas.set(cliente.telefono, sesion);
    }

    // Obtener configuración de empresa para phoneNumberId
    const empresa = await EmpresaModel.findOne({ _id: empresaId });
    if (!empresa?.phoneNumberId) {
      console.error('No se encontró phoneNumberId para la empresa');
      return false;
    }

    const enviado = await enviarMensajeWhatsAppTexto(cliente.telefono, mensaje, empresa.phoneNumberId);
    
    // Marcar notificaciones como enviadas
    for (const turno of turnos) {
      if (!turno.notificaciones) turno.notificaciones = [];
      turno.notificaciones.push({
        tipo: 'confirmacion',
        enviada: true,
        fechaEnvio: new Date()
      });
      await turno.save();
    }
    
    return enviado;
    
  } catch (error) {
    console.error('Error enviando notificación de confirmación:', error);
    return false;
  }
}

/**
 * Limpiar sesiones antiguas (ejecutar periódicamente)
 */
export function limpiarSesionesAntiguas() {
  const tiempoLimite = 10 * 60 * 1000; // 10 minutos
  const ahora = Date.now();
  
  for (const [telefono, sesion] of sesionesActivas.entries()) {
    if (ahora - sesion.timestamp.getTime() > tiempoLimite) {
      sesionesActivas.delete(telefono);
    }
  }
}

// Limpiar sesiones cada 5 minutos
setInterval(limpiarSesionesAntiguas, 5 * 60 * 1000);
