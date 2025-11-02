// 🔔 Servicio de Confirmación Interactiva de Turnos (Dinámico y Configurable)
import { TurnoModel, EstadoTurno } from '../models/Turno.js';
import { ClienteModel } from '../../../models/Cliente.js';
import { AgenteModel } from '../models/Agente.js';
import { enviarMensajeWhatsAppTexto } from '../../../services/metaService.js';
import { EmpresaModel } from '../../../models/Empresa.js';
import { ConfiguracionModuloModel } from '../models/ConfiguracionModulo.js';

interface SesionConfirmacion {
  clienteId: string;
  telefono: string;
  empresaId: string;
  turnos: any[];
  paso: 'inicial' | 'seleccion_turno' | 'edicion_campo';
  turnoEditando?: number;
  campoEditando?: string; // Ahora es dinámico (puede ser cualquier campo)
  camposEditables?: string[]; // Lista de campos que se pueden editar
  nomenclatura?: any; // Nomenclatura de la empresa (turno, turnos, etc.)
  timestamp: Date;
}

// Almacenamiento temporal de sesiones (en producción usar Redis)
const sesionesActivas = new Map<string, SesionConfirmacion>();

/**
 * Obtener sesión activa de un teléfono
 */
export function obtenerSesion(telefono: string): SesionConfirmacion | undefined {
  return sesionesActivas.get(telefono);
}

/**
 * Obtener configuración de campos editables de la empresa
 */
async function obtenerConfiguracionEmpresa(empresaId: string) {
  try {
    const config = await ConfiguracionModuloModel.findOne({ empresaId });
    
    if (!config) {
      // Configuración por defecto
      return {
        nomenclatura: {
          turno: 'Turno',
          turnos: 'Turnos'
        },
        camposEditables: ['origen', 'destino', 'hora'],
        camposPersonalizados: []
      };
    }

    // Extraer campos editables de los campos personalizados
    const camposEditables = ['hora']; // Hora siempre es editable
    const camposPersonalizados = config.camposPersonalizados || [];
    
    // Agregar campos personalizados que sean editables
    camposPersonalizados.forEach((campo: any) => {
      if (campo.clave && !['id', '_id', 'clienteId', 'agenteId', 'empresaId'].includes(campo.clave)) {
        camposEditables.push(campo.clave);
      }
    });

    return {
      nomenclatura: config.nomenclatura || { turno: 'Turno', turnos: 'Turnos' },
      camposEditables,
      camposPersonalizados
    };
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    return {
      nomenclatura: { turno: 'Turno', turnos: 'Turnos' },
      camposEditables: ['origen', 'destino', 'hora'],
      camposPersonalizados: []
    };
  }
}

/**
 * Procesar respuesta del cliente a notificación de confirmación
 */
export async function procesarRespuestaConfirmacion(
  telefono: string,
  mensaje: string,
  empresaId: string
): Promise<{ procesado: boolean; respuesta?: string }> {
  
  console.log('🔍 procesarRespuestaConfirmacion llamado:', { telefono, mensaje, empresaId });
  
  const mensajeNormalizado = mensaje.trim().toLowerCase();
  
  // Verificar si hay una sesión activa
  const sesion = sesionesActivas.get(telefono);
  
  console.log('🔍 Sesión encontrada:', sesion ? 'SÍ' : 'NO', sesion ? `paso: ${sesion.paso}, turnos: ${sesion.turnos.length}` : '');
  
  if (sesion) {
    console.log('✅ Procesando sesión activa');
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
      empresaId,
      turnos: turnosPendientes,
      paso: 'edicion_campo',
      turnoEditando: numeroSeleccionado - 1,
      timestamp: new Date()
    };
    sesionesActivas.set(telefono, sesion);
    
    const turno = turnosPendientes[numeroSeleccionado - 1];
    const respuesta = await generarMensajeEdicionTurno(turno, numeroSeleccionado, empresaId);
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
  
  console.log('🔍 procesarSesionActiva - paso:', sesion.paso, 'mensaje:', mensaje);
  
  // Limpiar sesiones antiguas (más de 10 minutos)
  const tiempoLimite = 10 * 60 * 1000;
  if (Date.now() - sesion.timestamp.getTime() > tiempoLimite) {
    sesionesActivas.delete(sesion.telefono);
    return { procesado: false };
  }

  // ✅ PASO INICIAL: Usuario responde a la notificación
  if (sesion.paso === 'inicial') {
    console.log('✅ Procesando paso inicial');
    
    // Opción 1: Confirmar todos
    if (mensaje === '1') {
      console.log('✅ Usuario eligió confirmar todos');
      sesionesActivas.delete(sesion.telefono);
      return await confirmarTodosTurnos(sesion.turnos, sesion.telefono, empresaId);
    }
    
    // Opción 2: Editar un turno
    if (mensaje === '2') {
      console.log('✅ Usuario eligió editar');
      if (sesion.turnos.length === 1) {
        // Si solo hay un turno, ir directo a edición
        sesion.paso = 'edicion_campo';
        sesion.turnoEditando = 0;
        sesion.timestamp = new Date();
        const respuesta = await generarMensajeEdicionTurno(sesion.turnos[0], 1, empresaId);
        return { procesado: true, respuesta };
      } else {
        // Si hay múltiples turnos, mostrar lista
        sesion.paso = 'seleccion_turno';
        sesion.timestamp = new Date();
        const respuesta = generarMensajeSeleccionTurno(sesion.turnos);
        return { procesado: true, respuesta };
      }
    }
    
    // Cancelar
    if (mensaje === '0' || mensaje === 'cancelar') {
      sesionesActivas.delete(sesion.telefono);
      return {
        procesado: true,
        respuesta: '❌ Operación cancelada. Tus turnos siguen pendientes de confirmación.'
      };
    }
    
    return {
      procesado: true,
      respuesta: '❌ Opción inválida. Por favor responde:\n1️⃣ Para confirmar\n2️⃣ Para editar\n0️⃣ Para cancelar'
    };
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
      const respuesta = await generarMensajeEdicionTurno(turno, numeroSeleccionado, sesion.empresaId);
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
        programadaPara: new Date(),
        enviada: true,
        enviadaEn: new Date(),
        plantilla: 'confirmacion_interactiva',
        respuesta: 'CONFIRMADO',
        respondidoEn: new Date()
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
 * Generar mensaje de selección de turno
 */
function generarMensajeSeleccionTurno(turnos: any[]): string {
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
  
  mensaje += '\n*Selecciona el número del viaje que deseas editar:*';
  
  return mensaje;
}

/**
 * Generar mensaje de edición de turno (DINÁMICO)
 */
async function generarMensajeEdicionTurno(turno: any, numero: number, empresaId: string): Promise<string> {
  const config = await obtenerConfiguracionEmpresa(empresaId);
  const { nomenclatura, camposEditables, camposPersonalizados } = config;
  
  const fechaInicio = new Date(turno.fechaInicio);
  const hora = fechaInicio.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  // Construir datos actuales dinámicamente
  let datosActuales = `🕐 *Hora actual:* ${hora}\n`;
  
  // Agregar campos personalizados
  camposPersonalizados.forEach((campo: any) => {
    const valor = turno.datos?.[campo.clave] || 'No especificado';
    const icono = obtenerIconoCampo(campo.clave);
    datosActuales += `${icono} *${campo.etiqueta}:* ${valor}\n`;
  });
  
  // Construir opciones de edición dinámicamente
  let opciones = '';
  let opcionNumero = 1;
  
  // Agregar opción para cada campo editable
  camposEditables.forEach((campo: string) => {
    const campoConfig = camposPersonalizados.find((c: any) => c.clave === campo);
    const etiqueta = campoConfig?.etiqueta || (campo === 'hora' ? 'Hora' : campo.charAt(0).toUpperCase() + campo.slice(1));
    opciones += `${opcionNumero}️⃣ Cambiar ${etiqueta.toLowerCase()}\n`;
    opcionNumero++;
  });
  
  // Opciones fijas
  opciones += `${opcionNumero}️⃣ Confirmar este ${nomenclatura.turno.toLowerCase()}\n`;
  opcionNumero++;
  opciones += `${opcionNumero}️⃣ Cancelar este ${nomenclatura.turno.toLowerCase()}\n`;
  opciones += `0️⃣ Volver atrás`;
  
  return `✏️ *Editando ${nomenclatura.turno} #${numero}*

${datosActuales}
*¿Qué deseas modificar?*

${opciones}

Escribe el número de la opción.`;
}

/**
 * Obtener icono según el tipo de campo
 */
function obtenerIconoCampo(campo: string): string {
  const iconos: Record<string, string> = {
    'origen': '📍',
    'destino': '📍',
    'hora': '🕐',
    'pasajeros': '👥',
    'equipaje': '🧳',
    'servicio': '📋',
    'comensales': '👥',
    'ocasion': '🎉',
    'preferencias': '🍽️',
    'motivoConsulta': '📝',
    'telefono': '📞',
    'email': '📧',
    'notas': '📝'
  };
  return iconos[campo] || '📌';
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
      
      const mensajeEdicion = await generarMensajeEdicionTurno(turno, sesion.turnoEditando! + 1, empresaId);
      return {
        procesado: true,
        respuesta: `✅ ${campo.charAt(0).toUpperCase() + campo.slice(1)} actualizado a: *${valor}*\n\n${mensajeEdicion}`
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
      
      const mensajeEdicion = await generarMensajeEdicionTurno(turno, sesion.turnoEditando! + 1, empresaId);
      return {
        procesado: true,
        respuesta: `✅ Hora actualizada a: *${valor}*\n\n${mensajeEdicion}`
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
    mensaje += `2️⃣ Editar ${turnos.length > 1 ? 'un viaje específico' : 'este viaje'}\n\n`;
    mensaje += 'Responde con el número de la opción.';

    // ✅ SIEMPRE crear sesión cuando se envía la notificación
    const sesion: SesionConfirmacion = {
      clienteId: clienteId,
      telefono: cliente.telefono,
      empresaId,
      turnos: turnos,
      paso: 'inicial',
      timestamp: new Date()
    };
    sesionesActivas.set(cliente.telefono, sesion);
    
    console.log('✅ Sesión de confirmación creada para:', cliente.telefono, 'con', turnos.length, 'turnos');

    // Obtener configuración de empresa para phoneNumberId
    // empresaId puede ser el nombre o el _id
    let empresa;
    
    // Verificar si empresaId es un ObjectId válido (24 caracteres hexadecimales)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(empresaId);
    
    if (isValidObjectId) {
      // Si es un ObjectId válido, buscar por _id o nombre
      empresa = await EmpresaModel.findOne({ 
        $or: [
          { _id: empresaId },
          { nombre: empresaId }
        ]
      });
    } else {
      // Si no es un ObjectId, buscar solo por nombre
      empresa = await EmpresaModel.findOne({ nombre: empresaId });
    }
    
    if (!empresa?.phoneNumberId) {
      console.error('No se encontró phoneNumberId para la empresa:', empresaId);
      return false;
    }

    const enviado = await enviarMensajeWhatsAppTexto(cliente.telefono, mensaje, empresa.phoneNumberId);
    
    // Marcar notificaciones como enviadas
    for (const turno of turnos) {
      if (!turno.notificaciones) turno.notificaciones = [];
      turno.notificaciones.push({
        tipo: 'confirmacion',
        programadaPara: new Date(), // Fecha programada (ahora)
        enviada: true,
        enviadaEn: new Date(),
        plantilla: 'confirmacion_interactiva'
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
