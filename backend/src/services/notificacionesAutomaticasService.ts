// 🔔 Servicio de Notificaciones Automáticas
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { AgenteModel } from '../modules/calendar/models/Agente.js';
import { EmpresaModel } from '../models/Empresa.js';
import { enviarMensajeWhatsAppTexto } from './metaService.js';
import { enviarNotificacionConfirmacion } from '../modules/calendar/services/confirmacionTurnosService.js';

/**
 * Procesar notificaciones programadas
 * Se ejecuta cada minuto para verificar si hay notificaciones que enviar
 * 
 * ⚠️ IMPORTANTE: La prevención de duplicados se hace a nivel de TURNO en la query de MongoDB,
 * no a nivel de notificación. Esto permite enviar notificaciones múltiples veces si hay turnos nuevos.
 */
export async function procesarNotificacionesProgramadas() {
  try {
    const ahora = new Date();
    // ⚠️ IMPORTANTE: Usar getUTCHours() para que funcione igual en local y en Render
    const horaActual = `${ahora.getUTCHours().toString().padStart(2, '0')}:${ahora.getUTCMinutes().toString().padStart(2, '0')}`;
    const diaActual = ahora.getUTCDay(); // 0 = Domingo, 6 = Sábado

    console.log(`⏰ [${horaActual}] Verificando notificaciones programadas... (UTC)`);

    // Obtener todas las configuraciones activas
    const configuraciones = await ConfiguracionModuloModel.find({ activo: true });
    console.log(`   📋 Configuraciones activas encontradas: ${configuraciones.length}`);

    for (const config of configuraciones) {
      if (!config.notificaciones || config.notificaciones.length === 0) continue;

      console.log(`   🏢 Procesando empresa: ${config.empresaId}`);

      // Procesar cada notificación activa
      for (const notif of config.notificaciones) {
        console.log(`      🔔 Notificación: ${notif.tipo} - activa: ${notif.activa} - momento: ${notif.momento} - horaEnvio: ${notif.horaEnvioDiaAntes || notif.horaEnvio}`);
        
        if (!notif.activa) {
          console.log(`      ⏭️ Saltando (inactiva)`);
          continue;
        }

        // ✅ Solo procesar notificaciones automáticas
        if (notif.ejecucion === 'manual') {
          console.log(`      ⏭️ Saltando (manual)`);
          continue; // Las manuales solo se envían con "Enviar Prueba"
        }

        // Verificar si es hora de enviar
        const debeEnviar = verificarSiDebeEnviar(notif, horaActual, diaActual);
        console.log(`      ⏰ Debe enviar: ${debeEnviar}`);

        if (debeEnviar) {
          console.log(`📨 Enviando notificación: ${notif.tipo} - ${notif.momento}`);
          
          // La prevención de duplicados se hace a nivel de TURNO (en la query de MongoDB)
          // No a nivel de notificación, para permitir múltiples envíos si hay turnos nuevos
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
  if (notif.momento === 'horas_antes_turno') {
    // Para "X horas antes del turno", siempre verificar (se ejecuta cada minuto)
    return true;
  }
  
  if (notif.momento === 'dia_antes_turno' && notif.horaEnvioDiaAntes) {
    // Para "X días antes a hora específica", verificar hora con margen de tolerancia
    // La hora configurada está en Argentina (UTC-3), pero el servidor está en UTC
    // Convertir hora de Argentina a UTC: sumar 3 horas
    const [horaArg, minArg] = notif.horaEnvioDiaAntes.split(':').map(Number);
    const horaUTC = (horaArg + 3) % 24; // Sumar 3 horas y ajustar si pasa de 24
    
    // Convertir hora actual a minutos para comparar con margen
    const [horaActualH, horaActualM] = horaActual.split(':').map(Number);
    const minutosActuales = horaActualH * 60 + horaActualM;
    const minutosConfigurados = horaUTC * 60 + minArg;
    
    // Margen de tolerancia: ±2 minutos
    const diferencia = Math.abs(minutosActuales - minutosConfigurados);
    const dentroDelMargen = diferencia <= 2;
    
    console.log(`         🕐 Hora configurada (Argentina): ${notif.horaEnvioDiaAntes}`);
    console.log(`         🌍 Hora convertida (UTC): ${horaUTC.toString().padStart(2, '0')}:${minArg.toString().padStart(2, '0')}`);
    console.log(`         ⏰ Hora actual (servidor UTC): ${horaActual}`);
    console.log(`         📊 Diferencia en minutos: ${diferencia}`);
    console.log(`         ✅ Dentro del margen (±2 min): ${dentroDelMargen}`);
    
    return dentroDelMargen;
  }
  
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
    console.log(`🔍 Buscando turnos para notificación: ${notif.tipo} - ${notif.momento}`);
    const turnos = await obtenerTurnosParaNotificacion(empresaId, notif);

    if (turnos.length === 0) {
      console.log(`ℹ️ No hay turnos para enviar notificación (${notif.tipo})`);
      return;
    }
    
    console.log(`✅ Encontrados ${turnos.length} turno(s) para notificar`);

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
        // Obtener datos del contacto
        const contacto = await ContactoEmpresaModel.findById(clienteId);
        if (!contacto || !contacto.telefono) {
          console.warn(`⚠️ Contacto ${clienteId} sin teléfono`);
          continue;
        }

        // Si es notificación de confirmación, usar el servicio especializado
        console.log(`🔍 Tipo de notificación: "${notif.tipo}"`);
        
        if (notif.tipo === 'confirmacion') {
          console.log(`📞 Usando servicio especializado de confirmación para ${contacto.telefono}`);
          const enviado = await enviarNotificacionConfirmacion(clienteId, turnosCliente, empresaId);
          
          if (enviado) {
            console.log(`✅ Enviado a ${contacto.nombre} ${contacto.apellido} (${contacto.telefono})`);
          } else {
            console.error(`❌ Error enviando a ${contacto.nombre} ${contacto.apellido}`);
          }
        } else {
          console.log(`📝 Usando método genérico para tipo: ${notif.tipo}`);
          // Para otros tipos de notificación, usar el método genérico
          const mensaje = await generarMensaje(notif, turnosCliente, contacto);

          // Enviar mensaje
          await enviarMensajeWhatsAppTexto(contacto.telefono, mensaje, phoneNumberId);
          
          console.log(`✅ Enviado a ${contacto.nombre} ${contacto.apellido} (${contacto.telefono})`);

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
  if (notif.momento === 'horas_antes_turno' && notif.horasAntesTurno) {
    // ✅ NUEVO: X horas antes de cada turno
    // Buscar turnos que empiecen en las próximas X horas (con margen de ±5 minutos)
    const horasMs = notif.horasAntesTurno * 60 * 60 * 1000;
    fechaInicio = new Date(ahora.getTime() + horasMs - 5 * 60 * 1000); // -5 min
    fechaFin = new Date(ahora.getTime() + horasMs + 5 * 60 * 1000);    // +5 min
    
    console.log(`   📅 Rango de búsqueda (${notif.horasAntesTurno}h antes):`);
    console.log(`      Desde: ${fechaInicio.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
    console.log(`      Hasta: ${fechaFin.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
    
  } else if (notif.momento === 'dia_antes_turno' && notif.diasAntes && notif.horaEnvioDiaAntes) {
    // ✅ NUEVO: X días antes a una hora específica
    // Ejemplo: 1 día antes a las 22:00
    // Si ahora son las 22:00, buscar turnos de mañana
    
    // Buscar turnos de dentro de X días
    // IMPORTANTE: Los turnos se guardan con Date.UTC() que guarda la hora tal cual
    // Ejemplo: Usuario dice "6 nov 14:00" → Se guarda como 2025-11-06T14:00:00.000Z
    // Buscamos desde 00:00 hasta 23:59 del día objetivo EN UTC
    
    // Calcular fecha objetivo (X días desde ahora)
    fechaInicio = new Date(Date.UTC(
      ahora.getUTCFullYear(),
      ahora.getUTCMonth(),
      ahora.getUTCDate() + notif.diasAntes,
      0, 0, 0, 0
    ));

    fechaFin = new Date(Date.UTC(
      ahora.getUTCFullYear(),
      ahora.getUTCMonth(),
      ahora.getUTCDate() + notif.diasAntes,
      23, 59, 59, 999
    ));
    
    console.log(`   📅 Buscando turnos de dentro de ${notif.diasAntes} día(s):`);
    console.log(`      Desde: ${fechaInicio.toISOString()}`);
    console.log(`      Hasta: ${fechaFin.toISOString()}`);
    
  } else if (notif.momento === 'noche_anterior') {
    // Turnos de mañana (mantener compatibilidad)
    // Para confirmaciones: buscar TODOS los turnos de mañana
    fechaInicio = new Date(ahora);
    fechaInicio.setDate(fechaInicio.getDate() + 1);
    fechaInicio.setHours(0, 0, 0, 0);

    fechaFin = new Date(fechaInicio);
    fechaFin.setHours(23, 59, 59, 999);
    
    console.log(`   📅 Buscando turnos de mañana (${notif.tipo}):`);
    console.log(`      Desde: ${fechaInicio.toISOString()}`);
    console.log(`      Hasta: ${fechaFin.toISOString()}`);
    
  } else if (notif.momento === 'mismo_dia' || notif.momento === 'hora_exacta') {
    // Turnos de hoy (mantener compatibilidad)
    fechaInicio = new Date(ahora);
    fechaInicio.setHours(0, 0, 0, 0);

    fechaFin = new Date(fechaInicio);
    fechaFin.setHours(23, 59, 59, 999);
    
  } else {
    return [];
  }

  // Buscar turnos
  const query: any = {
    empresaId,
    fechaInicio: { $gte: fechaInicio, $lte: fechaFin }
  };

  // ✅ FILTRO 1: Estados
  if (notif.filtros?.estados && notif.filtros.estados.length > 0) {
    query.estado = { $in: notif.filtros.estados };
  } else {
    // Default: solo turnos pendientes y no confirmados (NO incluir confirmados)
    query.estado = { $in: ['no_confirmado', 'pendiente'] };
  }

  // ✅ FILTRO 2: Solo turnos sin notificación previa del mismo tipo
  if (notif.tipo === 'confirmacion') {
    // Para confirmaciones: filtrar turnos que NO hayan recibido notificación de confirmación
    // en las últimas 12 horas (para evitar duplicados pero permitir reenvíos si es necesario)
    const hace12Horas = new Date(ahora.getTime() - 12 * 60 * 60 * 1000);
    
    query.$or = [
      // Turnos sin notificaciones
      { notificaciones: { $exists: false } },
      { notificaciones: { $size: 0 } },
      // Turnos sin notificación de confirmación reciente
      { 
        'notificaciones': {
          $not: {
            $elemMatch: {
              tipo: 'confirmacion',
              enviadaEn: { $gte: hace12Horas }
            }
          }
        }
      }
    ];
  } else if (notif.filtros?.soloSinNotificar) {
    query['notificaciones.enviada'] = { $ne: true };
  }

  // ✅ FILTRO 3: Tipo de reserva
  if (notif.filtros?.tipoReserva && notif.filtros.tipoReserva.length > 0) {
    query.tipoReserva = { $in: notif.filtros.tipoReserva };
  }

  // Filtrar por destinatario
  if (notif.destinatario === 'clientes_especificos' && notif.clientesEspecificos) {
    query.clienteId = { $in: notif.clientesEspecificos };
  } else if (notif.destinatario === 'agentes_especificos' && notif.agentesEspecificos) {
    query.agenteId = { $in: notif.agentesEspecificos };
  }

  // ✅ FILTRO 4: Agentes específicos (adicional)
  if (notif.filtros?.agenteIds && notif.filtros.agenteIds.length > 0) {
    query.agenteId = { $in: notif.filtros.agenteIds };
  }

  // Aplicar límite si está configurado
  const limite = notif.filtros?.limite || 1000;

  console.log(`   🔎 Query MongoDB:`, JSON.stringify(query, null, 2));
  console.log(`   📅 Rango de fechas:`);
  console.log(`      - fechaInicio >= ${fechaInicio.toISOString()}`);
  console.log(`      - fechaInicio <= ${fechaFin.toISOString()}`);

  let turnos = await TurnoModel.find(query)
    .populate('agenteId')
    .populate('clienteId')
    .sort({ fechaInicio: 1 })
    .limit(limite);
  
  console.log(`   📊 Turnos encontrados: ${turnos.length}`);
  
  // Debug: Mostrar TODOS los turnos de la empresa sin filtros
  const todosTurnos = await TurnoModel.find({ empresaId }).sort({ fechaInicio: 1 }).limit(10);
  console.log(`   🔍 DEBUG - Total turnos en BD para ${empresaId}: ${todosTurnos.length}`);
  todosTurnos.forEach((t: any, i: number) => {
    console.log(`      ${i + 1}. ${t._id} - Fecha: ${t.fechaInicio.toISOString()} - Estado: ${t.estado} - Notif: ${t.notificaciones?.length || 0}`);
  });
  
  if (turnos.length > 0) {
    turnos.forEach((turno: any, index: number) => {
      console.log(`      ${index + 1}. Turno ${turno._id}:`);
      console.log(`         - Fecha: ${turno.fechaInicio.toISOString()}`);
      console.log(`         - Estado: ${turno.estado}`);
      console.log(`         - Cliente: ${turno.clienteId?.nombre || 'Sin nombre'}`);
      console.log(`         - Notificaciones: ${turno.notificaciones?.length || 0}`);
    });
  }

  // ✅ FILTRO 5: Hora mínima y máxima (post-query)
  if (notif.filtros?.horaMinima || notif.filtros?.horaMaxima) {
    turnos = turnos.filter(turno => {
      const fechaTurno = new Date(turno.fechaInicio);
      const horaTurno = `${fechaTurno.getHours().toString().padStart(2, '0')}:${fechaTurno.getMinutes().toString().padStart(2, '0')}`;

      if (notif.filtros?.horaMinima && horaTurno < notif.filtros.horaMinima) {
        return false;
      }

      if (notif.filtros?.horaMaxima && horaTurno > notif.filtros.horaMaxima) {
        return false;
      }

      return true;
    });
  }

  console.log(`🔍 Filtros aplicados: ${turnos.length} turnos encontrados`);
  if (notif.filtros) {
    console.log('  - Estados:', notif.filtros.estados || 'todos');
    console.log('  - Hora:', `${notif.filtros.horaMinima || '00:00'} - ${notif.filtros.horaMaxima || '23:59'}`);
    console.log('  - Solo sin notificar:', notif.filtros.soloSinNotificar || false);
  }

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
