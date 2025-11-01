// 🔔 Servicio de Notificaciones Automáticas
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';
import { ClienteModel } from '../models/Cliente.js';
import { AgenteModel } from '../modules/calendar/models/Agente.js';
import { EmpresaModel } from '../models/Empresa.js';
import { enviarMensajeWhatsAppTexto } from './metaService.js';

/**
 * Procesar notificaciones programadas
 * Se ejecuta cada minuto para verificar si hay notificaciones que enviar
 */
export async function procesarNotificacionesProgramadas() {
  try {
    const ahora = new Date();
    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;
    const diaActual = ahora.getDay(); // 0 = Domingo, 6 = Sábado

    console.log(`⏰ [${horaActual}] Verificando notificaciones programadas...`);

    // Obtener todas las configuraciones activas
    const configuraciones = await ConfiguracionModuloModel.find({ activo: true });

    for (const config of configuraciones) {
      if (!config.notificaciones || config.notificaciones.length === 0) continue;

      // Procesar cada notificación activa
      for (const notif of config.notificaciones) {
        if (!notif.activa) continue;

        // Verificar si es hora de enviar
        const debeEnviar = verificarSiDebeEnviar(notif, horaActual, diaActual);

        if (debeEnviar) {
          console.log(`📨 Enviando notificación: ${notif.tipo} - ${notif.momento}`);
          await enviarNotificacion(config.empresaId, notif);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error al procesar notificaciones programadas:', error);
  }
}

/**
 * Verificar si una notificación debe enviarse en este momento
 */
function verificarSiDebeEnviar(
  notif: any,
  horaActual: string,
  diaActual: number
): boolean {
  // Si es recurrente, verificar configuración de recurrencia
  if (notif.esRecurrente && notif.recurrencia) {
    const { tipo, horaEnvio, diasSemana, intervalo, fechaInicio, fechaFin } = notif.recurrencia;

    // Verificar hora
    if (horaEnvio !== horaActual) return false;

    // Verificar rango de fechas
    const ahora = new Date();
    if (fechaInicio && ahora < new Date(fechaInicio)) return false;
    if (fechaFin && ahora > new Date(fechaFin)) return false;

    // Verificar tipo de recurrencia
    if (tipo === 'semanal') {
      // Verificar si hoy es uno de los días configurados
      if (!diasSemana || !diasSemana.includes(diaActual)) return false;
      
      // TODO: Verificar intervalo (cada X semanas)
      // Por ahora asumimos intervalo = 1
      return true;
    }

    if (tipo === 'mensual') {
      // TODO: Implementar lógica mensual
      return false;
    }
  }

  // Si no es recurrente, verificar momento de envío
  if (notif.momento === 'noche_anterior' || notif.momento === 'hora_exacta') {
    return notif.horaEnvio === horaActual;
  }

  return false;
}

/**
 * Enviar notificación a los destinatarios correspondientes
 */
async function enviarNotificacion(empresaId: string, notif: any) {
  try {
    // Obtener empresa y phoneNumberId
    const empresa = await EmpresaModel.findOne({ nombre: empresaId });
    if (!empresa) {
      console.error(`❌ Empresa no encontrada: ${empresaId}`);
      return;
    }

    const phoneNumberId = (empresa as any).phoneNumberId;
    if (!phoneNumberId) {
      console.error(`❌ Empresa ${empresaId} sin phoneNumberId configurado`);
      return;
    }

    // Obtener turnos según el momento
    const turnos = await obtenerTurnosParaNotificacion(empresaId, notif);

    if (turnos.length === 0) {
      console.log(`ℹ️ No hay turnos para enviar notificación`);
      return;
    }

    // Agrupar turnos por cliente
    const turnosPorCliente = new Map<string, any[]>();
    
    for (const turno of turnos) {
      const clienteId = turno.clienteId;
      if (!turnosPorCliente.has(clienteId)) {
        turnosPorCliente.set(clienteId, []);
      }
      turnosPorCliente.get(clienteId)!.push(turno);
    }

    console.log(`📊 Enviando a ${turnosPorCliente.size} clientes`);

    // Enviar a cada cliente
    for (const [clienteId, turnosCliente] of turnosPorCliente.entries()) {
      try {
        // Obtener datos del cliente
        const cliente = await ClienteModel.findById(clienteId);
        if (!cliente || !cliente.telefono) {
          console.warn(`⚠️ Cliente ${clienteId} sin teléfono`);
          continue;
        }

        // Generar mensaje
        const mensaje = await generarMensaje(notif, turnosCliente, cliente);

        // Enviar mensaje
        await enviarMensajeWhatsAppTexto(cliente.telefono, mensaje, phoneNumberId);
        
        console.log(`✅ Enviado a ${cliente.nombre} ${cliente.apellido} (${cliente.telefono})`);

        // Marcar notificación como enviada en el turno
        for (const turno of turnosCliente) {
          await TurnoModel.findByIdAndUpdate(turno._id, {
            $push: {
              notificaciones: {
                tipo: notif.tipo,
                programadaPara: new Date(),
                enviada: true,
                enviadaEn: new Date(),
                plantilla: notif.plantillaMensaje
              }
            }
          });
        }

        // Esperar 500ms entre envíos
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Error al enviar a cliente ${clienteId}:`, error);
      }
    }

  } catch (error) {
    console.error('❌ Error al enviar notificación:', error);
  }
}

/**
 * Obtener turnos para notificación según el momento configurado
 */
async function obtenerTurnosParaNotificacion(empresaId: string, notif: any) {
  const ahora = new Date();
  let fechaInicio: Date;
  let fechaFin: Date;

  // Determinar rango de fechas según el momento
  if (notif.momento === 'noche_anterior') {
    // Turnos de mañana
    fechaInicio = new Date(ahora);
    fechaInicio.setDate(fechaInicio.getDate() + 1);
    fechaInicio.setHours(0, 0, 0, 0);

    fechaFin = new Date(fechaInicio);
    fechaFin.setHours(23, 59, 59, 999);
  } else if (notif.momento === 'mismo_dia' || notif.momento === 'hora_exacta') {
    // Turnos de hoy
    fechaInicio = new Date(ahora);
    fechaInicio.setHours(0, 0, 0, 0);

    fechaFin = new Date(fechaInicio);
    fechaFin.setHours(23, 59, 59, 999);
  } else if (notif.momento === 'horas_antes' && notif.horasAntes) {
    // Turnos en X horas
    fechaInicio = new Date(ahora.getTime() + notif.horasAntes * 60 * 60 * 1000);
    fechaInicio.setMinutes(0, 0, 0);

    fechaFin = new Date(fechaInicio);
    fechaFin.setMinutes(59, 59, 999);
  } else {
    return [];
  }

  // Buscar turnos
  const query: any = {
    empresaId,
    fechaInicio: { $gte: fechaInicio, $lte: fechaFin },
    estado: { $in: ['no_confirmado', 'pendiente', 'confirmado'] }
  };

  // Filtrar por destinatario
  if (notif.destinatario === 'clientes_especificos' && notif.clientesEspecificos) {
    query.clienteId = { $in: notif.clientesEspecificos };
  } else if (notif.destinatario === 'agentes_especificos' && notif.agentesEspecificos) {
    query.agenteId = { $in: notif.agentesEspecificos };
  }

  const turnos = await TurnoModel.find(query)
    .populate('agenteId')
    .populate('clienteId')
    .sort({ fechaInicio: 1 });

  return turnos;
}

/**
 * Generar mensaje personalizado con variables
 */
async function generarMensaje(notif: any, turnos: any[], cliente: any): Promise<string> {
  let mensaje = '';

  // Encabezado si hay múltiples turnos
  if (turnos.length > 1) {
    mensaje = `🚗 *Estos son tus viajes de mañana*\n\n`;
  }

  // Agregar cada turno
  for (const turno of turnos) {
    let mensajeTurno = notif.plantillaMensaje;

    // Obtener datos del agente
    const agente = turno.agenteId;
    const fechaInicio = new Date(turno.fechaInicio);
    const hora = fechaInicio.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // Variables básicas
    const variables: Record<string, string> = {
      cliente: `${cliente.nombre} ${cliente.apellido}`,
      agente: agente ? `${agente.nombre} ${agente.apellido}` : '',
      fecha: fechaInicio.toLocaleDateString('es-AR'),
      hora: hora,
      duracion: `${turno.duracion} minutos`,
      turno: 'viaje',
      telefono: cliente.telefono || '',
      documento: cliente.documento || '',
      // Agregar campos personalizados del turno
      ...turno.datos
    };

    // Reemplazar variables
    Object.entries(variables).forEach(([clave, valor]) => {
      const regex = new RegExp(`\\{${clave}\\}`, 'g');
      mensajeTurno = mensajeTurno.replace(regex, valor || '');
    });

    mensaje += mensajeTurno + '\n\n';
  }

  return mensaje.trim();
}
