// 🔄 Servicio de Flujo de Notificaciones de Viajes
import * as notificacionesService from './notificacionesViajesService.js';

// Estado temporal de conversaciones (en producción usar Redis o MongoDB)
interface EstadoConversacion {
  estado: string;
  turnoId?: string;
  campo?: string;
  timestamp: number;
}

const estadosConversacion = new Map<string, EstadoConversacion>();

/**
 * Procesar mensaje en el flujo de notificaciones
 * @param clienteTelefono Teléfono del cliente
 * @param mensaje Mensaje del cliente
 * @param respuestaInteractiva ID de respuesta interactiva (si aplica)
 * @param empresaTelefono Teléfono de la empresa
 * @returns true si el mensaje fue procesado por el flujo, false si debe continuar con flujo normal
 */
export async function procesarMensajeFlujoNotificaciones(
  clienteTelefono: string,
  mensaje: string,
  respuestaInteractiva: string | undefined,
  empresaTelefono: string
): Promise<boolean> {
  const clave = `${clienteTelefono}_${empresaTelefono}`;
  const estadoActual = estadosConversacion.get(clave);

  console.log('🔄 Procesando flujo de notificaciones:', {
    clienteTelefono,
    respuestaInteractiva,
    estadoActual: estadoActual?.estado
  });

  // Si hay respuesta interactiva, procesarla
  if (respuestaInteractiva) {
    return await procesarRespuestaInteractiva(
      clienteTelefono,
      respuestaInteractiva,
      empresaTelefono,
      clave
    );
  }

  // Si hay un estado activo, procesar según el estado
  if (estadoActual) {
    return await procesarSegunEstado(
      clienteTelefono,
      mensaje,
      estadoActual,
      empresaTelefono,
      clave
    );
  }

  // No hay estado activo ni respuesta interactiva
  return false;
}

/**
 * Procesar respuesta interactiva (botón o lista)
 */
async function procesarRespuestaInteractiva(
  clienteTelefono: string,
  respuestaId: string,
  empresaTelefono: string,
  clave: string
): Promise<boolean> {
  // Respuestas de confirmación inicial
  if (['confirmar_todos', 'modificar_viaje', 'necesito_ayuda'].includes(respuestaId)) {
    await notificacionesService.procesarRespuestaConfirmacion(
      clienteTelefono,
      respuestaId,
      empresaTelefono
    );

    if (respuestaId === 'modificar_viaje') {
      estadosConversacion.set(clave, {
        estado: 'esperando_seleccion_viaje',
        timestamp: Date.now()
      });
    } else {
      estadosConversacion.delete(clave);
    }

    return true;
  }

  // Selección de viaje para modificar
  if (respuestaId.startsWith('viaje_')) {
    await notificacionesService.procesarSeleccionViaje(
      clienteTelefono,
      respuestaId,
      empresaTelefono
    );

    estadosConversacion.set(clave, {
      estado: 'esperando_tipo_modificacion',
      turnoId: respuestaId.replace('viaje_', ''),
      timestamp: Date.now()
    });

    return true;
  }

  // Tipo de modificación
  if (respuestaId.startsWith('mod_origen_') || 
      respuestaId.startsWith('mod_destino_') || 
      respuestaId.startsWith('mod_horario_')) {
    const partes = respuestaId.split('_');
    const accion = `${partes[0]}_${partes[1]}`; // mod_origen, mod_destino, mod_horario
    const turnoId = partes.slice(2).join('_');

    const nuevoEstado = await notificacionesService.procesarModificacionViaje(
      clienteTelefono,
      accion,
      turnoId,
      empresaTelefono
    );

    estadosConversacion.set(clave, {
      estado: nuevoEstado,
      turnoId,
      campo: partes[1], // origen, destino, horario
      timestamp: Date.now()
    });

    return true;
  }

  // Cancelar viaje
  if (respuestaId.startsWith('cancelar_viaje_')) {
    const turnoId = respuestaId.replace('cancelar_viaje_', '');

    await notificacionesService.procesarModificacionViaje(
      clienteTelefono,
      'cancelar_viaje',
      turnoId,
      empresaTelefono
    );

    estadosConversacion.set(clave, {
      estado: 'esperando_respuesta_final',
      timestamp: Date.now()
    });

    return true;
  }

  // Respuesta final (nueva modificación o confirmar)
  if (['nueva_modificacion', 'confirmar_cronograma'].includes(respuestaId)) {
    await notificacionesService.procesarRespuestaFinal(
      clienteTelefono,
      respuestaId,
      empresaTelefono
    );

    if (respuestaId === 'nueva_modificacion') {
      estadosConversacion.set(clave, {
        estado: 'esperando_seleccion_viaje',
        timestamp: Date.now()
      });
    } else {
      estadosConversacion.delete(clave);
    }

    return true;
  }

  return false;
}

/**
 * Procesar según el estado actual
 */
async function procesarSegunEstado(
  clienteTelefono: string,
  mensaje: string,
  estadoActual: EstadoConversacion,
  empresaTelefono: string,
  clave: string
): Promise<boolean> {
  const { estado, turnoId, campo } = estadoActual;

  // Esperando nueva dirección de origen
  if (estado === 'esperando_origen' && turnoId) {
    await notificacionesService.actualizarDatosViaje(
      turnoId,
      'origin',
      mensaje,
      clienteTelefono,
      empresaTelefono
    );

    estadosConversacion.set(clave, {
      estado: 'esperando_respuesta_final',
      timestamp: Date.now()
    });

    return true;
  }

  // Esperando nueva dirección de destino
  if (estado === 'esperando_destino' && turnoId) {
    await notificacionesService.actualizarDatosViaje(
      turnoId,
      'destination',
      mensaje,
      clienteTelefono,
      empresaTelefono
    );

    estadosConversacion.set(clave, {
      estado: 'esperando_respuesta_final',
      timestamp: Date.now()
    });

    return true;
  }

  // Esperando nuevo horario
  if (estado === 'esperando_horario' && turnoId) {
    await notificacionesService.actualizarDatosViaje(
      turnoId,
      'horario',
      mensaje,
      clienteTelefono,
      empresaTelefono
    );

    estadosConversacion.set(clave, {
      estado: 'esperando_respuesta_final',
      timestamp: Date.now()
    });

    return true;
  }

  return false;
}

/**
 * Limpiar estados antiguos (más de 1 hora)
 */
export function limpiarEstadosAntiguos(): void {
  const ahora = Date.now();
  const unaHora = 60 * 60 * 1000;

  for (const [clave, estado] of estadosConversacion.entries()) {
    if (ahora - estado.timestamp > unaHora) {
      estadosConversacion.delete(clave);
      console.log('🧹 Estado antiguo eliminado:', clave);
    }
  }
}

// Limpiar estados cada 15 minutos
setInterval(limpiarEstadosAntiguos, 15 * 60 * 1000);
