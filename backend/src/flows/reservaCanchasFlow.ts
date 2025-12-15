// 🏟️ Flujo de Reserva de Canchas Deportivas
import type { Flow, FlowContext, FlowResult } from './types.js';
import { enviarMensajeWhatsAppTexto } from '../services/metaService.js';
import { ConfiguracionBotModel } from '../modules/calendar/models/ConfiguracionBot.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { AgenteModel } from '../modules/calendar/models/Agente.js';
import { buscarOCrearContacto } from '../services/contactoService.js';

// Tipos para el flujo
interface DatosReserva {
  fecha?: Date;
  fechaTexto?: string;
  horaInicio?: string;
  duracion?: number;
  canchaId?: string;
  canchaNombre?: string;
  nombreCliente?: string;
  telefonoCliente?: string;
  canchasDisponibles?: Array<{ id: string; nombre: string }>;
}

// Helpers
function parsearFecha(texto: string): Date | null {
  const textoLower = texto.toLowerCase().trim();
  const hoy = new Date();
  
  if (textoLower === 'hoy') {
    return hoy;
  }
  
  if (textoLower === 'mañana' || textoLower === 'manana') {
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    return manana;
  }
  
  // Formato DD/MM/AAAA
  const match = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, dia, mes, anio] = match;
    const fecha = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
    if (!isNaN(fecha.getTime())) {
      return fecha;
    }
  }
  
  return null;
}

function parsearHora(texto: string): { hora: number; minuto: number } | null {
  // Formato HH:MM o HHMM
  let match = texto.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    match = texto.match(/^(\d{2})(\d{2})$/);
  }
  
  if (match) {
    const hora = parseInt(match[1]);
    const minuto = parseInt(match[2]);
    if (hora >= 0 && hora <= 23 && minuto >= 0 && minuto <= 59) {
      return { hora, minuto };
    }
  }
  
  return null;
}

function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function formatearHora(hora: number, minuto: number): string {
  return `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
}

// Verificar disponibilidad de slot
async function verificarDisponibilidad(
  empresaId: string,
  fecha: Date,
  horaInicio: string,
  duracionMinutos: number
): Promise<{ disponible: boolean; canchasDisponibles: Array<{ id: string; nombre: string }> }> {
  const [hora, minuto] = horaInicio.split(':').map(Number);
  
  // Crear fecha/hora de inicio y fin
  const fechaInicio = new Date(Date.UTC(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate(),
    hora,
    minuto
  ));
  
  const fechaFin = new Date(fechaInicio);
  fechaFin.setMinutes(fechaFin.getMinutes() + duracionMinutos);
  
  // Verificar que esté dentro del horario (8:00 - 23:00)
  if (hora < 8 || hora >= 23) {
    return { disponible: false, canchasDisponibles: [] };
  }
  
  // Verificar que el fin no pase de las 23:00
  const horaFin = fechaFin.getUTCHours();
  if (horaFin > 23 || (horaFin === 23 && fechaFin.getUTCMinutes() > 0)) {
    return { disponible: false, canchasDisponibles: [] };
  }
  
  // Obtener todas las canchas activas
  const canchas = await AgenteModel.find({
    empresaId,
    activo: true
  });
  
  if (canchas.length === 0) {
    return { disponible: false, canchasDisponibles: [] };
  }
  
  // Verificar disponibilidad por día de la semana
  const diaSemana = fecha.getDay();
  
  const canchasDisponibles: Array<{ id: string; nombre: string }> = [];
  
  for (const cancha of canchas) {
    // Verificar si la cancha tiene disponibilidad para este día
    const disponibilidadDia = cancha.disponibilidad.find(
      d => d.diaSemana === diaSemana && d.activo
    );
    
    if (!disponibilidadDia) continue;
    
    // Verificar horario
    const [horaInicioCancha] = disponibilidadDia.horaInicio.split(':').map(Number);
    const [horaFinCancha] = disponibilidadDia.horaFin.split(':').map(Number);
    
    if (hora < horaInicioCancha || horaFin > horaFinCancha) continue;
    
    // Verificar que no haya turnos existentes que se superpongan
    const turnosExistentes = await TurnoModel.find({
      empresaId,
      agenteId: cancha._id,
      estado: { $nin: ['cancelado'] },
      $or: [
        {
          fechaInicio: { $lt: fechaFin },
          fechaFin: { $gt: fechaInicio }
        }
      ]
    });
    
    if (turnosExistentes.length === 0) {
      canchasDisponibles.push({
        id: cancha._id.toString(),
        nombre: `${cancha.nombre} ${cancha.apellido}`.trim()
      });
    }
  }
  
  return {
    disponible: canchasDisponibles.length > 0,
    canchasDisponibles
  };
}

// Buscar horarios alternativos
async function buscarAlternativos(
  empresaId: string,
  fecha: Date,
  horaOriginal: string,
  duracionMinutos: number
): Promise<Array<{ hora: string; canchas: number }>> {
  const alternativas: Array<{ hora: string; canchas: number }> = [];
  const [horaOrig] = horaOriginal.split(':').map(Number);
  
  // Buscar 2 horas antes y 2 horas después
  for (let offset = -2; offset <= 2; offset++) {
    if (offset === 0) continue;
    
    const nuevaHora = horaOrig + offset;
    if (nuevaHora < 8 || nuevaHora >= 23) continue;
    
    const horaStr = `${nuevaHora.toString().padStart(2, '0')}:00`;
    const resultado = await verificarDisponibilidad(empresaId, fecha, horaStr, duracionMinutos);
    
    if (resultado.disponible) {
      alternativas.push({
        hora: horaStr,
        canchas: resultado.canchasDisponibles.length
      });
    }
  }
  
  return alternativas.slice(0, 3); // Máximo 3 alternativas
}

export const reservaCanchasFlow: Flow = {
  name: 'reserva_canchas',
  priority: 'urgente',  // Mayor prioridad que menuPrincipalFlow
  version: '1.0.0',
  
  async shouldActivate(context: FlowContext): Promise<boolean> {
    const { mensaje, empresaId } = context;
    const mensajeLower = mensaje.toLowerCase().trim();
    
    // Verificar si el bot de pasos está activo para esta empresa
    const configBot = await ConfiguracionBotModel.findOne({ empresaId });
    if (!configBot || !configBot.activo) {
      return false;
    }
    
    // Verificar si es una empresa de canchas
    const configModulo = await ConfiguracionModuloModel.findOne({ empresaId });
    if (!configModulo || configModulo.tipoNegocio !== 'canchas') {
      return false;
    }
    
    // Keywords para activar el flujo
    const keywords = [
      'hola', 'menu', 'menú', 'opciones', 'ayuda',
      'reserva', 'reservar', 'cancha', 'canchas',
      'turno', 'turnos', 'agendar', 'alquilar',
      'padel', 'paddle', 'futbol', 'fútbol', 'tenis'
    ];
    
    return keywords.some(kw => mensajeLower.includes(kw));
  },
  
  async start(context: FlowContext): Promise<FlowResult> {
    const { telefono, empresaId, phoneNumberId } = context;
    
    console.log(`🏟️ [ReservaCanchas] Iniciando flujo para ${telefono}`);
    
    try {
      // Obtener configuración
      const configModulo = await ConfiguracionModuloModel.findOne({ empresaId });
      const nombreEmpresa = configModulo?.variablesDinamicas?.nombre_empresa || empresaId;
      
      const mensajeBienvenida = `¡Hola! 👋
Bienvenido a *${nombreEmpresa}* 🎾

Te ayudo a reservar tu cancha en pocos pasos.

📅 *¿Para qué fecha querés reservar?*

Escribí la fecha en formato DD/MM/AAAA
o escribí "hoy" o "mañana"`;
      
      await enviarMensajeWhatsAppTexto(telefono, mensajeBienvenida, phoneNumberId);
      
      return {
        success: true,
        nextState: 'esperando_fecha',
        data: {}
      };
    } catch (error) {
      console.error('❌ [ReservaCanchas] Error iniciando:', error);
      return { success: false, error: String(error) };
    }
  },
  
  async onInput(context: FlowContext, state: string, data: Record<string, any>): Promise<FlowResult> {
    const { telefono, mensaje, empresaId, phoneNumberId, profileName } = context;
    const reservaData = data as DatosReserva;
    
    console.log(`📥 [ReservaCanchas] Estado: ${state}, Mensaje: ${mensaje}`);
    
    // ========== ESTADO: ESPERANDO FECHA ==========
    if (state === 'esperando_fecha') {
      const fecha = parsearFecha(mensaje);
      
      if (!fecha) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Formato de fecha inválido.\n\nPor favor, usá DD/MM/AAAA o escribí "hoy" o "mañana".',
          phoneNumberId
        );
        return { success: true, nextState: 'esperando_fecha', data };
      }
      
      // Verificar que la fecha no sea pasada
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fecha < hoy) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ No podés reservar para una fecha pasada.\n\nPor favor, elegí una fecha de hoy en adelante.',
          phoneNumberId
        );
        return { success: true, nextState: 'esperando_fecha', data };
      }
      
      const fechaFormateada = formatearFecha(fecha);
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        `Perfecto 👍\nFecha seleccionada: *${fechaFormateada}*\n\n⏰ *¿A qué hora querés comenzar?*\n\nEscribí la hora en formato 24hs (ej: 19:00)\nHorario disponible: 08:00 a 23:00`,
        phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'esperando_hora',
        data: { ...reservaData, fecha, fechaTexto: mensaje }
      };
    }
    
    // ========== ESTADO: ESPERANDO HORA ==========
    if (state === 'esperando_hora') {
      const horaParseada = parsearHora(mensaje);
      
      if (!horaParseada) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Formato de hora inválido.\n\nPor favor, usá HH:MM (ej: 19:00)',
          phoneNumberId
        );
        return { success: true, nextState: 'esperando_hora', data };
      }
      
      const { hora, minuto } = horaParseada;
      
      // Verificar horario válido (8:00 - 23:00)
      if (hora < 8 || hora >= 23) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ El horario debe estar entre las 08:00 y las 23:00.\n\nPor favor, elegí otro horario.',
          phoneNumberId
        );
        return { success: true, nextState: 'esperando_hora', data };
      }
      
      const horaInicio = formatearHora(hora, minuto);
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        `⏳ *¿Cuánto tiempo querés reservar?*\n\n1️⃣ 1 hora\n2️⃣ 1 hora 30 minutos\n3️⃣ 2 horas\n\nEscribí el número de la opción.`,
        phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'esperando_duracion',
        data: { ...reservaData, horaInicio }
      };
    }
    
    // ========== ESTADO: ESPERANDO DURACIÓN ==========
    if (state === 'esperando_duracion') {
      const opcion = mensaje.trim();
      let duracion: number;
      
      switch (opcion) {
        case '1': duracion = 60; break;
        case '2': duracion = 90; break;
        case '3': duracion = 120; break;
        default:
          await enviarMensajeWhatsAppTexto(
            telefono,
            '❌ Opción inválida. Por favor, escribí 1, 2 o 3.',
            phoneNumberId
          );
          return { success: true, nextState: 'esperando_duracion', data };
      }
      
      // Verificar disponibilidad
      const resultado = await verificarDisponibilidad(
        empresaId,
        reservaData.fecha!,
        reservaData.horaInicio!,
        duracion
      );
      
      if (!resultado.disponible) {
        // Buscar alternativas
        const alternativas = await buscarAlternativos(
          empresaId,
          reservaData.fecha!,
          reservaData.horaInicio!,
          duracion
        );
        
        if (alternativas.length > 0) {
          let mensajeAlt = `⚠️ No hay disponibilidad a las *${reservaData.horaInicio}* para *${duracion} minutos*.\n\nPero tenemos estas alternativas:\n\n`;
          
          alternativas.forEach((alt, i) => {
            mensajeAlt += `${i + 1}️⃣ ${alt.hora} (${alt.canchas} cancha${alt.canchas > 1 ? 's' : ''} disponible${alt.canchas > 1 ? 's' : ''})\n`;
          });
          
          mensajeAlt += `\n4️⃣ Cambiar fecha\n5️⃣ Cancelar\n\nEscribí el número de la opción.`;
          
          await enviarMensajeWhatsAppTexto(telefono, mensajeAlt, phoneNumberId);
          
          return {
            success: true,
            nextState: 'esperando_alternativa',
            data: { ...reservaData, duracion, alternativas }
          };
        } else {
          await enviarMensajeWhatsAppTexto(
            telefono,
            `⚠️ No hay disponibilidad para esa fecha y horario.\n\n1️⃣ Cambiar fecha\n2️⃣ Cambiar hora\n3️⃣ Cancelar\n\nEscribí el número de la opción.`,
            phoneNumberId
          );
          
          return {
            success: true,
            nextState: 'sin_disponibilidad',
            data: { ...reservaData, duracion }
          };
        }
      }
      
      // Hay disponibilidad - mostrar canchas
      let mensajeCanchas = `🏟️ *Canchas disponibles:*\n\n`;
      resultado.canchasDisponibles.forEach((cancha, i) => {
        mensajeCanchas += `${i + 1}️⃣ ${cancha.nombre}\n`;
      });
      mensajeCanchas += `\nEscribí el número de la cancha que querés.`;
      
      await enviarMensajeWhatsAppTexto(telefono, mensajeCanchas, phoneNumberId);
      
      return {
        success: true,
        nextState: 'esperando_cancha',
        data: { ...reservaData, duracion, canchasDisponibles: resultado.canchasDisponibles }
      };
    }
    
    // ========== ESTADO: ESPERANDO ALTERNATIVA ==========
    if (state === 'esperando_alternativa') {
      const opcion = parseInt(mensaje.trim());
      const alternativas = (reservaData as any).alternativas || [];
      
      if (opcion >= 1 && opcion <= alternativas.length) {
        // Seleccionó una alternativa
        const altSeleccionada = alternativas[opcion - 1];
        const resultado = await verificarDisponibilidad(
          empresaId,
          reservaData.fecha!,
          altSeleccionada.hora,
          reservaData.duracion!
        );
        
        if (resultado.disponible) {
          let mensajeCanchas = `Perfecto 🙌\nHorario: *${altSeleccionada.hora}*\n\n🏟️ *Canchas disponibles:*\n\n`;
          resultado.canchasDisponibles.forEach((cancha, i) => {
            mensajeCanchas += `${i + 1}️⃣ ${cancha.nombre}\n`;
          });
          mensajeCanchas += `\nEscribí el número de la cancha que querés.`;
          
          await enviarMensajeWhatsAppTexto(telefono, mensajeCanchas, phoneNumberId);
          
          return {
            success: true,
            nextState: 'esperando_cancha',
            data: { ...reservaData, horaInicio: altSeleccionada.hora, canchasDisponibles: resultado.canchasDisponibles }
          };
        }
      }
      
      if (opcion === 4) {
        // Cambiar fecha
        await enviarMensajeWhatsAppTexto(
          telefono,
          '📅 *¿Para qué fecha querés reservar?*\n\nEscribí la fecha en formato DD/MM/AAAA',
          phoneNumberId
        );
        return { success: true, nextState: 'esperando_fecha', data: {} };
      }
      
      if (opcion === 5) {
        // Cancelar
        await enviarMensajeWhatsAppTexto(
          telefono,
          'Reserva cancelada. Si querés hacer otra reserva, escribí "reservar".',
          phoneNumberId
        );
        return { success: true, end: true };
      }
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        '❌ Opción inválida. Por favor, elegí un número de la lista.',
        phoneNumberId
      );
      return { success: true, nextState: 'esperando_alternativa', data };
    }
    
    // ========== ESTADO: SIN DISPONIBILIDAD ==========
    if (state === 'sin_disponibilidad') {
      const opcion = mensaje.trim();
      
      if (opcion === '1') {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '📅 *¿Para qué fecha querés reservar?*\n\nEscribí la fecha en formato DD/MM/AAAA',
          phoneNumberId
        );
        return { success: true, nextState: 'esperando_fecha', data: {} };
      }
      
      if (opcion === '2') {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '⏰ *¿A qué hora querés comenzar?*\n\nEscribí la hora en formato 24hs (ej: 19:00)',
          phoneNumberId
        );
        return { success: true, nextState: 'esperando_hora', data: { fecha: reservaData.fecha, fechaTexto: reservaData.fechaTexto } };
      }
      
      if (opcion === '3') {
        await enviarMensajeWhatsAppTexto(
          telefono,
          'Reserva cancelada. Si querés hacer otra reserva, escribí "reservar".',
          phoneNumberId
        );
        return { success: true, end: true };
      }
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        '❌ Opción inválida. Por favor, escribí 1, 2 o 3.',
        phoneNumberId
      );
      return { success: true, nextState: 'sin_disponibilidad', data };
    }
    
    // ========== ESTADO: ESPERANDO CANCHA ==========
    if (state === 'esperando_cancha') {
      const opcion = parseInt(mensaje.trim()) - 1;
      const canchas = reservaData.canchasDisponibles || [];
      
      if (opcion < 0 || opcion >= canchas.length) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Opción inválida. Por favor, elegí un número de la lista.',
          phoneNumberId
        );
        return { success: true, nextState: 'esperando_cancha', data };
      }
      
      const canchaSeleccionada = canchas[opcion];
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        `Excelente 🎾\nSeleccionaste: *${canchaSeleccionada.nombre}*\n\n👤 *Para finalizar, necesito tus datos.*\n\n✍️ Escribí tu nombre y apellido:`,
        phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'esperando_nombre',
        data: { ...reservaData, canchaId: canchaSeleccionada.id, canchaNombre: canchaSeleccionada.nombre }
      };
    }
    
    // ========== ESTADO: ESPERANDO NOMBRE ==========
    if (state === 'esperando_nombre') {
      const nombre = mensaje.trim();
      
      if (nombre.length < 2) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Por favor, ingresá un nombre válido.',
          phoneNumberId
        );
        return { success: true, nextState: 'esperando_nombre', data };
      }
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        '📞 Escribí tu número de teléfono:',
        phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'esperando_telefono',
        data: { ...reservaData, nombreCliente: nombre }
      };
    }
    
    // ========== ESTADO: ESPERANDO TELÉFONO ==========
    if (state === 'esperando_telefono') {
      const telefonoInput = mensaje.trim().replace(/\D/g, '');
      
      if (telefonoInput.length < 8) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Por favor, ingresá un teléfono válido.',
          phoneNumberId
        );
        return { success: true, nextState: 'esperando_telefono', data };
      }
      
      // Calcular hora fin
      const [hora, minuto] = reservaData.horaInicio!.split(':').map(Number);
      const horaFinMinutos = hora * 60 + minuto + reservaData.duracion!;
      const horaFin = `${Math.floor(horaFinMinutos / 60).toString().padStart(2, '0')}:${(horaFinMinutos % 60).toString().padStart(2, '0')}`;
      
      const fechaFormateada = formatearFecha(reservaData.fecha!);
      const duracionTexto = reservaData.duracion === 60 ? '1 hora' : 
                           reservaData.duracion === 90 ? '1 hora 30 min' : '2 horas';
      
      const resumen = `✅ *Revisá tu reserva:*

📅 Fecha: ${fechaFormateada}
🕒 Horario: ${reservaData.horaInicio} a ${horaFin}
⏳ Duración: ${duracionTexto}
🏟️ Cancha: ${reservaData.canchaNombre}
👤 Cliente: ${reservaData.nombreCliente}
📞 Teléfono: ${telefonoInput}

*¿Confirmamos la reserva?*

1️⃣ Sí, confirmar
2️⃣ Modificar algo
3️⃣ Cancelar`;
      
      await enviarMensajeWhatsAppTexto(telefono, resumen, phoneNumberId);
      
      return {
        success: true,
        nextState: 'esperando_confirmacion',
        data: { ...reservaData, telefonoCliente: telefonoInput }
      };
    }
    
    // ========== ESTADO: ESPERANDO CONFIRMACIÓN ==========
    if (state === 'esperando_confirmacion') {
      const opcion = mensaje.trim();
      
      if (opcion === '1') {
        // Confirmar reserva - crear turno
        try {
          // Buscar o crear contacto
          const contacto = await buscarOCrearContacto({
            telefono,
            profileName: reservaData.nombreCliente || profileName || 'Cliente',
            empresaId
          });
          
          // Crear fecha/hora
          const [hora, minuto] = reservaData.horaInicio!.split(':').map(Number);
          const fechaInicio = new Date(Date.UTC(
            reservaData.fecha!.getFullYear(),
            reservaData.fecha!.getMonth(),
            reservaData.fecha!.getDate(),
            hora,
            minuto
          ));
          
          const fechaFin = new Date(fechaInicio);
          fechaFin.setMinutes(fechaFin.getMinutes() + reservaData.duracion!);
          
          // Crear turno
          const nuevoTurno = await TurnoModel.create({
            empresaId,
            agenteId: reservaData.canchaId,
            clienteId: contacto._id.toString(),
            fechaInicio,
            fechaFin,
            duracion: reservaData.duracion,
            estado: 'pendiente',
            tipoReserva: 'cancha',
            datos: {
              cancha: reservaData.canchaNombre,
              telefonoCliente: reservaData.telefonoCliente
            },
            notas: 'Reservado vía WhatsApp',
            creadoPor: 'bot'
          });
          
          console.log('✅ [ReservaCanchas] Turno creado:', nuevoTurno._id);
          
          const [horaI, minI] = reservaData.horaInicio!.split(':').map(Number);
          const horaFinMinutos = horaI * 60 + minI + reservaData.duracion!;
          const horaFin = `${Math.floor(horaFinMinutos / 60).toString().padStart(2, '0')}:${(horaFinMinutos % 60).toString().padStart(2, '0')}`;
          
          await enviarMensajeWhatsAppTexto(
            telefono,
            `🎉 *¡Reserva confirmada!*

Te esperamos el *${formatearFecha(reservaData.fecha!)}* a las *${reservaData.horaInicio}*
en *${reservaData.canchaNombre}* 🎾

¡Gracias por reservar con nosotros!

Escribí "menu" si necesitás algo más.`,
            phoneNumberId
          );
          
          return { success: true, end: true };
          
        } catch (error) {
          console.error('❌ [ReservaCanchas] Error creando turno:', error);
          await enviarMensajeWhatsAppTexto(
            telefono,
            '❌ Hubo un error al crear la reserva. Por favor, intentá de nuevo.',
            phoneNumberId
          );
          return { success: true, end: true };
        }
      }
      
      if (opcion === '2') {
        // Modificar - volver al inicio
        await enviarMensajeWhatsAppTexto(
          telefono,
          '📅 *¿Para qué fecha querés reservar?*\n\nEscribí la fecha en formato DD/MM/AAAA',
          phoneNumberId
        );
        return { success: true, nextState: 'esperando_fecha', data: {} };
      }
      
      if (opcion === '3') {
        await enviarMensajeWhatsAppTexto(
          telefono,
          'Reserva cancelada. Si querés hacer otra reserva, escribí "reservar".',
          phoneNumberId
        );
        return { success: true, end: true };
      }
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        '❌ Opción inválida. Por favor, escribí 1, 2 o 3.',
        phoneNumberId
      );
      return { success: true, nextState: 'esperando_confirmacion', data };
    }
    
    return { success: false, error: 'Estado no reconocido' };
  },
  
  async onEnd(context: FlowContext, data: Record<string, any>): Promise<void> {
    console.log(`✅ [ReservaCanchas] Flujo finalizado para ${context.telefono}`);
  }
};
