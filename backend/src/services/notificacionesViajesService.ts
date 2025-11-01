// 🚗 Servicio de Notificaciones de Viajes para San Jose
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { enviarMensajeConBotones, enviarMensajeConLista, enviarMensajeWhatsAppTexto } from './metaService.js';
import { buscarEmpresaPorTelefono } from '../utils/empresaUtilsMongo.js';

interface ViajeInfo {
  _id: string;
  letra: string;
  origen: string;
  destino: string;
  horario: string;
  tipoUbicacion: string; // 'retiro' o 'recogida'
}

/**
 * Enviar notificación de confirmación de viajes del día siguiente
 * @param clienteTelefono Teléfono del cliente
 * @param empresaTelefono Teléfono de la empresa
 */
export async function enviarNotificacionConfirmacionViajes(
  clienteTelefono: string,
  empresaTelefono: string
): Promise<void> {
  console.log('📅 Enviando notificación de confirmación de viajes...');

  // Buscar empresa
  const empresa = await buscarEmpresaPorTelefono(empresaTelefono);
  if (!empresa) {
    console.error('❌ Empresa no encontrada');
    return;
  }

  const phoneNumberId = (empresa as any).phoneNumberId;
  if (!phoneNumberId) {
    console.error('❌ phoneNumberId no configurado para la empresa');
    return;
  }

  // Obtener turnos del cliente para mañana
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  manana.setHours(0, 0, 0, 0);

  const finDia = new Date(manana);
  finDia.setHours(23, 59, 59, 999);

  const turnos = await TurnoModel.find({
    empresaId: (empresa as any)._id?.toString() || empresa.nombre,
    clienteId: clienteTelefono, // Asumiendo que se guarda el teléfono como clienteId
    fechaInicio: {
      $gte: manana,
      $lte: finDia
    },
    estado: { $in: ['pendiente', 'confirmado'] }
  }).sort({ fechaInicio: 1 });

  if (turnos.length === 0) {
    console.log('ℹ️ No hay viajes programados para mañana');
    return;
  }

  // Construir mensaje
  const viajes: ViajeInfo[] = turnos.map((turno, index) => {
    const letra = String.fromCharCode(65 + index); // A, B, C, etc.
    const horario = new Date(turno.fechaInicio).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const origen = turno.datos?.origin || 'Origen no especificado';
    const destino = turno.datos?.destination || 'Destino no especificado';
    const tipoUbicacion = index % 2 === 0 ? 'retiro' : 'recogida';

    return {
      _id: turno._id.toString(),
      letra,
      origen,
      destino,
      horario,
      tipoUbicacion
    };
  });

  // Obtener nombre del cliente (intentar desde datos del turno o usar genérico)
  const nombreCliente = (turnos[0] as any).clienteInfo?.nombre || 'Cliente';

  // Construir mensaje
  let mensaje = `Hola ${nombreCliente}, mañana tenés programados los siguientes viajes:\n\n`;

  viajes.forEach(viaje => {
    mensaje += `${viaje.letra}. Desde ${viaje.origen} hasta ${viaje.destino} a las ${viaje.horario} (esta es la dirección de ${viaje.tipoUbicacion})\n`;
  });

  mensaje += `\n¿Confirmás todos los viajes? Si querés cancelar los viajes de mañana simplemente no contestes este mensaje y tus viajes se cancelarán automáticamente`;

  // Enviar mensaje con botones
  await enviarMensajeConBotones(
    clienteTelefono,
    mensaje,
    [
      { id: 'confirmar_todos', title: 'Sí, confirmo todos' },
      { id: 'modificar_viaje', title: 'Modificar un viaje' },
      { id: 'necesito_ayuda', title: 'Necesito ayuda' }
    ],
    phoneNumberId
  );

  console.log('✅ Notificación enviada exitosamente');
}

/**
 * Procesar respuesta de confirmación
 * @param clienteTelefono Teléfono del cliente
 * @param respuestaId ID de la respuesta del botón
 * @param empresaTelefono Teléfono de la empresa
 */
export async function procesarRespuestaConfirmacion(
  clienteTelefono: string,
  respuestaId: string,
  empresaTelefono: string
): Promise<string | null> {
  console.log('📝 Procesando respuesta de confirmación:', respuestaId);

  const empresa = await buscarEmpresaPorTelefono(empresaTelefono);
  if (!empresa) return null;

  const phoneNumberId = (empresa as any).phoneNumberId;
  if (!phoneNumberId) return null;

  switch (respuestaId) {
    case 'confirmar_todos':
      // Confirmar todos los turnos
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      manana.setHours(0, 0, 0, 0);

      const finDia = new Date(manana);
      finDia.setHours(23, 59, 59, 999);

      await TurnoModel.updateMany(
        {
          empresaId: (empresa as any)._id?.toString() || empresa.nombre,
          clienteId: clienteTelefono,
          fechaInicio: {
            $gte: manana,
            $lte: finDia
          },
          estado: 'pendiente'
        },
        {
          $set: { estado: 'confirmado' }
        }
      );

      await enviarMensajeWhatsAppTexto(
        clienteTelefono,
        '¡Tus viajes fueron confirmados! ✅',
        phoneNumberId
      );

      return 'confirmado';

    case 'modificar_viaje':
      // Mostrar lista de viajes para modificar
      await mostrarListaViajesParaModificar(clienteTelefono, empresaTelefono);
      return 'modificar';

    case 'necesito_ayuda':
      await enviarMensajeWhatsAppTexto(
        clienteTelefono,
        'Un agente se pondrá en contacto contigo a la brevedad. También podés llamarnos al [NÚMERO DE CONTACTO].',
        phoneNumberId
      );
      return 'ayuda';

    default:
      return null;
  }
}

/**
 * Mostrar lista de viajes para modificar
 */
async function mostrarListaViajesParaModificar(
  clienteTelefono: string,
  empresaTelefono: string
): Promise<void> {
  const empresa = await buscarEmpresaPorTelefono(empresaTelefono);
  if (!empresa) return;

  const phoneNumberId = (empresa as any).phoneNumberId;
  if (!phoneNumberId) return;

  // Obtener turnos del cliente para mañana
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  manana.setHours(0, 0, 0, 0);

  const finDia = new Date(manana);
  finDia.setHours(23, 59, 59, 999);

  const turnos = await TurnoModel.find({
    empresaId: (empresa as any)._id?.toString() || empresa.nombre,
    clienteId: clienteTelefono,
    fechaInicio: {
      $gte: manana,
      $lte: finDia
    },
    estado: { $in: ['pendiente', 'confirmado'] }
  }).sort({ fechaInicio: 1 });

  if (turnos.length === 0) return;

  const opciones = turnos.map((turno, index) => {
    const letra = String.fromCharCode(65 + index);
    const horario = new Date(turno.fechaInicio).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const origen = turno.datos?.origin || 'Origen';
    const destino = turno.datos?.destination || 'Destino';

    return {
      id: `viaje_${turno._id}`,
      title: `${letra}. ${horario}`,
      description: `${origen} → ${destino}`
    };
  });

  await enviarMensajeConLista(
    clienteTelefono,
    '¿Qué viaje querés modificar?',
    'Ver viajes',
    opciones,
    phoneNumberId
  );
}

/**
 * Procesar selección de viaje a modificar
 */
export async function procesarSeleccionViaje(
  clienteTelefono: string,
  viajeId: string,
  empresaTelefono: string
): Promise<void> {
  const empresa = await buscarEmpresaPorTelefono(empresaTelefono);
  if (!empresa) return;

  const phoneNumberId = (empresa as any).phoneNumberId;
  if (!phoneNumberId) return;

  // Extraer ID del turno
  const turnoId = viajeId.replace('viaje_', '');

  // Mostrar opciones de modificación
  await enviarMensajeConBotones(
    clienteTelefono,
    'Perfecto, ¿qué querés modificar?',
    [
      { id: `mod_origen_${turnoId}`, title: 'Dirección de retiro' },
      { id: `mod_destino_${turnoId}`, title: 'Dirección recogida' },
      { id: `mod_horario_${turnoId}`, title: 'Horario' }
    ],
    phoneNumberId
  );

  // Enviar segundo mensaje con opción de cancelar
  setTimeout(async () => {
    await enviarMensajeConBotones(
      clienteTelefono,
      'O también podés:',
      [
        { id: `cancelar_viaje_${turnoId}`, title: 'Cancelar este viaje' }
      ],
      phoneNumberId
    );
  }, 1000);
}

/**
 * Procesar modificación de viaje
 */
export async function procesarModificacionViaje(
  clienteTelefono: string,
  accion: string,
  turnoId: string,
  empresaTelefono: string
): Promise<string> {
  const empresa = await buscarEmpresaPorTelefono(empresaTelefono);
  if (!empresa) return '';

  const phoneNumberId = (empresa as any).phoneNumberId;
  if (!phoneNumberId) return '';

  switch (accion) {
    case 'mod_origen':
      await enviarMensajeWhatsAppTexto(
        clienteTelefono,
        'Por favor, indicanos la nueva dirección de retiro:',
        phoneNumberId
      );
      return 'esperando_origen';

    case 'mod_destino':
      await enviarMensajeWhatsAppTexto(
        clienteTelefono,
        'Por favor, indicanos la nueva dirección de recogida:',
        phoneNumberId
      );
      return 'esperando_destino';

    case 'mod_horario':
      await enviarMensajeWhatsAppTexto(
        clienteTelefono,
        'Indicanos el nuevo horario en formato 24HS (Por ej: 15:00):',
        phoneNumberId
      );
      return 'esperando_horario';

    case 'cancelar_viaje':
      // Cancelar el turno
      await TurnoModel.findByIdAndUpdate(turnoId, {
        $set: { estado: 'cancelado' }
      });

      await enviarMensajeWhatsAppTexto(
        clienteTelefono,
        'El viaje fue cancelado exitosamente. ✅',
        phoneNumberId
      );

      // Mostrar cronograma actualizado
      await mostrarCronogramaActualizado(clienteTelefono, empresaTelefono);
      return 'cancelado';

    default:
      return '';
  }
}

/**
 * Actualizar datos del viaje
 */
export async function actualizarDatosViaje(
  turnoId: string,
  campo: 'origin' | 'destination' | 'horario',
  valor: string,
  clienteTelefono: string,
  empresaTelefono: string
): Promise<void> {
  const empresa = await buscarEmpresaPorTelefono(empresaTelefono);
  if (!empresa) return;

  const phoneNumberId = (empresa as any).phoneNumberId;
  if (!phoneNumberId) return;

  if (campo === 'horario') {
    // Validar formato de horario (HH:MM)
    const horarioRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!horarioRegex.test(valor)) {
      await enviarMensajeWhatsAppTexto(
        clienteTelefono,
        'Formato de horario inválido. Por favor, usá el formato 24HS (ej: 15:00)',
        phoneNumberId
      );
      return;
    }

    // Actualizar horario del turno
    const turno = await TurnoModel.findById(turnoId);
    if (!turno) return;

    const [horas, minutos] = valor.split(':').map(Number);
    const nuevaFecha = new Date(turno.fechaInicio);
    nuevaFecha.setHours(horas, minutos, 0, 0);

    await TurnoModel.findByIdAndUpdate(turnoId, {
      $set: { fechaInicio: nuevaFecha }
    });
  } else {
    // Actualizar origen o destino
    await TurnoModel.findByIdAndUpdate(turnoId, {
      $set: { [`datos.${campo}`]: valor }
    });
  }

  await enviarMensajeWhatsAppTexto(
    clienteTelefono,
    'Perfecto! La modificación fue realizada. ✅',
    phoneNumberId
  );

  // Mostrar cronograma actualizado
  await mostrarCronogramaActualizado(clienteTelefono, empresaTelefono);
}

/**
 * Mostrar cronograma actualizado
 */
async function mostrarCronogramaActualizado(
  clienteTelefono: string,
  empresaTelefono: string
): Promise<void> {
  const empresa = await buscarEmpresaPorTelefono(empresaTelefono);
  if (!empresa) return;

  const phoneNumberId = (empresa as any).phoneNumberId;
  if (!phoneNumberId) return;

  // Obtener turnos actualizados
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  manana.setHours(0, 0, 0, 0);

  const finDia = new Date(manana);
  finDia.setHours(23, 59, 59, 999);

  const turnos = await TurnoModel.find({
    empresaId: (empresa as any)._id?.toString() || empresa.nombre,
    clienteId: clienteTelefono,
    fechaInicio: {
      $gte: manana,
      $lte: finDia
    },
    estado: { $ne: 'cancelado' }
  }).sort({ fechaInicio: 1 });

  if (turnos.length === 0) {
    await enviarMensajeWhatsAppTexto(
      clienteTelefono,
      'No tenés viajes programados para mañana.',
      phoneNumberId
    );
    return;
  }

  let mensaje = 'Tu nuevo cronograma es:\n\n';

  turnos.forEach((turno, index) => {
    const letra = String.fromCharCode(65 + index);
    const horario = new Date(turno.fechaInicio).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const origen = turno.datos?.origin || 'Origen no especificado';
    const destino = turno.datos?.destination || 'Destino no especificado';
    const tipoUbicacion = index % 2 === 0 ? 'retiro' : 'recogida';

    mensaje += `${letra}. Desde ${origen} hasta ${destino} a las ${horario} (esta es la dirección de ${tipoUbicacion})\n`;
  });

  mensaje += '\n¿Querés realizar una nueva modificación?';

  await enviarMensajeConBotones(
    clienteTelefono,
    mensaje,
    [
      { id: 'nueva_modificacion', title: 'Sí, modificar' },
      { id: 'confirmar_cronograma', title: 'No, confirmar' }
    ],
    phoneNumberId
  );
}

/**
 * Procesar respuesta final
 */
export async function procesarRespuestaFinal(
  clienteTelefono: string,
  respuestaId: string,
  empresaTelefono: string
): Promise<void> {
  const empresa = await buscarEmpresaPorTelefono(empresaTelefono);
  if (!empresa) return;

  const phoneNumberId = (empresa as any).phoneNumberId;
  if (!phoneNumberId) return;

  if (respuestaId === 'nueva_modificacion') {
    await mostrarListaViajesParaModificar(clienteTelefono, empresaTelefono);
  } else if (respuestaId === 'confirmar_cronograma') {
    // Confirmar todos los turnos
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    manana.setHours(0, 0, 0, 0);

    const finDia = new Date(manana);
    finDia.setHours(23, 59, 59, 999);

    await TurnoModel.updateMany(
      {
        empresaId: (empresa as any)._id?.toString() || empresa.nombre,
        clienteId: clienteTelefono,
        fechaInicio: {
          $gte: manana,
          $lte: finDia
        },
        estado: 'pendiente'
      },
      {
        $set: { estado: 'confirmado' }
      }
    );

    await enviarMensajeWhatsAppTexto(
      clienteTelefono,
      '¡Tu cronograma fue confirmado! Nos vemos mañana. 🚗✅',
      phoneNumberId
    );
  }
}
