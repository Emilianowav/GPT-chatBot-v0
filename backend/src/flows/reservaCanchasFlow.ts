// 🏟️ Flujo de Reserva de Canchas Deportivas - Integrado con API Mis Canchas
import type { Flow, FlowContext, FlowResult } from './types.js';
import { enviarMensajeWhatsAppTexto } from '../services/metaService.js';
import { ConfiguracionBotModel } from '../modules/calendar/models/ConfiguracionBot.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { AgenteModel } from '../modules/calendar/models/Agente.js';
import { buscarOCrearContacto } from '../services/contactoService.js';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';

// Tipos para el flujo
interface DatosReserva {
  fecha?: Date;
  fechaTexto?: string;
  fechaApi?: string; // Formato YYYY-MM-DD para la API
  horaInicio?: string;
  duracion?: number;
  canchaId?: string;
  canchaNombre?: string;
  nombreCliente?: string;
  telefonoCliente?: string;
  canchasDisponibles?: Array<CanchaDisponible>;
  deporteId?: string;
  deporteNombre?: string;
  deportes?: Array<{ id: string; nombre: string; icono: string }>;
  precioTotal?: number;
  reservaId?: string; // ID de pre-reserva en Mis Canchas
  usaApiExterna?: boolean; // Flag para saber si usa API de Mis Canchas
}

interface CanchaDisponible {
  id: string;
  nombre: string;
  tipo?: string;
  horarios_disponibles?: Array<{ hora: string; duraciones: number[] }>;
  precio_hora?: number | string;
  precio_hora_y_media?: number | string;
  precio_dos_horas?: number | string;
}

interface ApiConfig {
  baseUrl: string;
  apiKey: string;
}

// Helpers

// Obtener fecha actual en zona horaria de Argentina
function obtenerFechaArgentina(): Date {
  // Crear fecha en UTC y ajustar a Argentina (UTC-3)
  const ahora = new Date();
  const offsetArgentina = -3 * 60; // Argentina es UTC-3 (en minutos)
  const offsetLocal = ahora.getTimezoneOffset(); // Offset del servidor en minutos
  const diferenciaMinutos = offsetLocal + offsetArgentina;
  
  // Ajustar la fecha
  const fechaArgentina = new Date(ahora.getTime() + diferenciaMinutos * 60 * 1000);
  return fechaArgentina;
}

function parsearFecha(texto: string): Date | null {
  const textoLower = texto.toLowerCase().trim();
  const hoy = obtenerFechaArgentina();
  
  // Resetear hora a medianoche para comparaciones de fecha
  hoy.setHours(0, 0, 0, 0);
  
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

function formatearFechaParaApi(fecha: Date): string {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ========== FUNCIONES PARA API MIS CANCHAS ==========

async function obtenerConfigApi(empresaId: string): Promise<ApiConfig | null> {
  try {
    const apiConfig = await ApiConfigurationModel.findOne({
      empresaId,
      nombre: { $regex: /mis canchas/i },
      estado: 'activo'
    });
    
    if (!apiConfig || !apiConfig.autenticacion?.configuracion?.token) {
      return null;
    }
    
    return {
      baseUrl: apiConfig.baseUrl,
      apiKey: apiConfig.autenticacion.configuracion.token
    };
  } catch (error) {
    console.error('❌ [ReservaCanchas] Error obteniendo config API:', error);
    return null;
  }
}

async function llamarApiMisCanchas<T>(
  config: ApiConfig,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: any,
  queryParams?: Record<string, string>
): Promise<T | null> {
  try {
    let url = `${config.baseUrl}${path}`;
    
    if (queryParams && Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams(queryParams);
      url += `?${params.toString()}`;
    }
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`🌐 [MisCanchasAPI] ${method} ${url}`);
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [MisCanchasAPI] Error ${response.status}: ${errorText}`);
      return null;
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error('❌ [MisCanchasAPI] Error en request:', error);
    return null;
  }
}

async function obtenerDeportesApi(config: ApiConfig): Promise<Array<{ id: string; nombre: string; icono: string }>> {
  const response = await llamarApiMisCanchas<{ success: boolean; deportes: Array<{ id: string; nombre: string; icono: string }> }>(
    config, 'GET', '/deportes'
  );
  return response?.deportes || [];
}

async function consultarDisponibilidadApi(
  config: ApiConfig,
  fecha: string,
  deporte: string,
  duracion: number
): Promise<{ success: boolean; canchas_disponibles: CanchaDisponible[] } | null> {
  return await llamarApiMisCanchas<{ success: boolean; canchas_disponibles: CanchaDisponible[] }>(
    config,
    'GET',
    '/disponibilidad',
    undefined,
    { fecha, deporte, duracion: duracion.toString() }
  );
}

async function preCrearReservaApi(
  config: ApiConfig,
  canchaId: string,
  fecha: string,
  horaInicio: string,
  duracion: number,
  cliente: { nombre: string; telefono: string }
): Promise<{
  success: boolean;
  reserva_id?: string;
  estado?: string;
  expira_en?: number;
  detalle?: {
    cancha: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    duracion: number;
    precio_total: number;
    seña_requerida: number;
  };
  error?: { code: string; message: string };
} | null> {
  return await llamarApiMisCanchas(
    config,
    'POST',
    '/reservas/pre-crear',
    {
      cancha_id: canchaId,
      fecha,
      hora_inicio: horaInicio,
      duracion,
      cliente,
      origen: 'whatsapp'
    }
  );
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
      const nombreEmpresa = configModulo?.variablesDinamicas?.nombre_empresa || 'Club Juventus';
      
      // Verificar si tiene API de Mis Canchas configurada
      const apiConfig = await obtenerConfigApi(empresaId);
      
      if (apiConfig) {
        // ===== FLUJO CON API MIS CANCHAS =====
        console.log(`🌐 [ReservaCanchas] Usando API Mis Canchas para ${empresaId}`);
        
        // Obtener deportes de la API
        const deportes = await obtenerDeportesApi(apiConfig);
        
        if (deportes.length === 0) {
          await enviarMensajeWhatsAppTexto(
            telefono,
            '❌ No hay deportes disponibles en este momento. Por favor, intentá más tarde.',
            phoneNumberId
          );
          return { success: true, end: true };
        }
        
        let mensajeBienvenida = `¡Hola! 👋\nBienvenido a *${nombreEmpresa}* 🏟️\n\nTe ayudo a reservar tu cancha en pocos pasos.\n\n🏆 *¿Qué deporte querés jugar?*\n\n`;
        
        deportes.forEach((deporte, i) => {
          mensajeBienvenida += `${i + 1}️⃣ ${deporte.icono} ${deporte.nombre}\n`;
        });
        
        mensajeBienvenida += `\nEscribí el número de la opción.`;
        
        await enviarMensajeWhatsAppTexto(telefono, mensajeBienvenida, phoneNumberId);
        
        return {
          success: true,
          nextState: 'esperando_deporte',
          data: { usaApiExterna: true, deportes }
        };
      } else {
        // ===== FLUJO LOCAL (sin API) =====
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
          data: { usaApiExterna: false }
        };
      }
    } catch (error) {
      console.error('❌ [ReservaCanchas] Error iniciando:', error);
      return { success: false, error: String(error) };
    }
  },
  
  async onInput(context: FlowContext, state: string, data: Record<string, any>): Promise<FlowResult> {
    const { telefono, mensaje, empresaId, phoneNumberId, profileName } = context;
    const reservaData = data as DatosReserva;
    
    console.log(`📥 [ReservaCanchas] Estado: ${state}, Mensaje: ${mensaje}`);
    
    // ========== ESTADO: ESPERANDO DEPORTE (API MIS CANCHAS) ==========
    if (state === 'esperando_deporte') {
      const opcion = parseInt(mensaje.trim()) - 1;
      const deportes = reservaData.deportes || [];
      
      if (opcion < 0 || opcion >= deportes.length) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Opción inválida. Por favor, elegí un número de la lista.',
          phoneNumberId
        );
        return { success: true, nextState: 'esperando_deporte', data };
      }
      
      const deporteSeleccionado = deportes[opcion];
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        `${deporteSeleccionado.icono} Perfecto, *${deporteSeleccionado.nombre}*!\n\n📅 *¿Para qué fecha querés reservar?*\n\nEscribí la fecha en formato DD/MM/AAAA\no escribí "hoy" o "mañana"`,
        phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'esperando_fecha',
        data: { 
          ...reservaData, 
          deporteId: deporteSeleccionado.id, 
          deporteNombre: deporteSeleccionado.nombre 
        }
      };
    }
    
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
      const fechaApi = formatearFechaParaApi(fecha);
      
      // Si usa API externa, preguntar duración primero (para consultar disponibilidad)
      if (reservaData.usaApiExterna) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          `Perfecto 👍\nFecha: *${fechaFormateada}*\n\n⏳ *¿Cuánto tiempo querés jugar?*\n\n1️⃣ 1 hora\n2️⃣ 1 hora 30 minutos\n3️⃣ 2 horas\n\nEscribí el número de la opción.`,
          phoneNumberId
        );
        
        return {
          success: true,
          nextState: 'esperando_duracion',
          data: { ...reservaData, fecha, fechaTexto: mensaje, fechaApi }
        };
      }
      
      // Flujo local: preguntar hora
      await enviarMensajeWhatsAppTexto(
        telefono,
        `Perfecto 👍\nFecha seleccionada: *${fechaFormateada}*\n\n⏰ *¿A qué hora querés comenzar?*\n\nEscribí la hora en formato 24hs (ej: 19:00)\nHorario disponible: 08:00 a 23:00`,
        phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'esperando_hora',
        data: { ...reservaData, fecha, fechaTexto: mensaje, fechaApi }
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
      
      const duracionTexto = duracion === 60 ? '1 hora' : duracion === 90 ? '1 hora 30 min' : '2 horas';
      
      // ===== FLUJO CON API MIS CANCHAS =====
      if (reservaData.usaApiExterna) {
        const apiConfig = await obtenerConfigApi(empresaId);
        
        if (!apiConfig) {
          await enviarMensajeWhatsAppTexto(
            telefono,
            '❌ Error de configuración. Por favor, intentá más tarde.',
            phoneNumberId
          );
          return { success: true, end: true };
        }
        
        // Consultar disponibilidad a la API
        const disponibilidad = await consultarDisponibilidadApi(
          apiConfig,
          reservaData.fechaApi!,
          reservaData.deporteId!,
          duracion
        );
        
        if (!disponibilidad || !disponibilidad.success || disponibilidad.canchas_disponibles.length === 0) {
          await enviarMensajeWhatsAppTexto(
            telefono,
            `⚠️ No hay canchas disponibles para *${reservaData.deporteNombre}* el *${formatearFecha(reservaData.fecha!)}* por *${duracionTexto}*.\n\n1️⃣ Cambiar fecha\n2️⃣ Cambiar deporte\n3️⃣ Cancelar\n\nEscribí el número de la opción.`,
            phoneNumberId
          );
          
          return {
            success: true,
            nextState: 'sin_disponibilidad_api',
            data: { ...reservaData, duracion }
          };
        }
        
        // Mostrar canchas disponibles con horarios y precios
        let mensajeCanchas = `🏟️ *Canchas disponibles para ${reservaData.deporteNombre}:*\n\n`;
        
        disponibilidad.canchas_disponibles.forEach((cancha, i) => {
          const precio = duracion === 60 ? cancha.precio_hora : 
                        duracion === 90 ? cancha.precio_hora_y_media : cancha.precio_dos_horas;
          const precioNum = typeof precio === 'string' ? parseFloat(precio) : precio;
          
          // Obtener horarios disponibles para esta duración
          const horariosDisp = cancha.horarios_disponibles
            ?.filter(h => h.duraciones.includes(duracion))
            .map(h => h.hora)
            .slice(0, 5) // Máximo 5 horarios
            .join(', ') || 'Consultar';
          
          mensajeCanchas += `${i + 1}️⃣ *${cancha.nombre}* (${cancha.tipo || 'techada'})\n`;
          mensajeCanchas += `   💰 $${precioNum?.toLocaleString('es-AR') || 'N/A'}\n`;
          mensajeCanchas += `   ⏰ ${horariosDisp}\n\n`;
        });
        
        mensajeCanchas += `Escribí el número de la cancha que querés.`;
        
        await enviarMensajeWhatsAppTexto(telefono, mensajeCanchas, phoneNumberId);
        
        return {
          success: true,
          nextState: 'esperando_cancha_api',
          data: { ...reservaData, duracion, canchasDisponibles: disponibilidad.canchas_disponibles }
        };
      }
      
      // ===== FLUJO LOCAL (sin API) =====
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
    
    // ========== ESTADO: SIN DISPONIBILIDAD API ==========
    if (state === 'sin_disponibilidad_api') {
      const opcion = mensaje.trim();
      
      if (opcion === '1') {
        // Cambiar fecha
        await enviarMensajeWhatsAppTexto(
          telefono,
          '📅 *¿Para qué fecha querés reservar?*\n\nEscribí la fecha en formato DD/MM/AAAA\no escribí "hoy" o "mañana"',
          phoneNumberId
        );
        return { success: true, nextState: 'esperando_fecha', data: { ...reservaData, fecha: undefined, fechaApi: undefined } };
      }
      
      if (opcion === '2') {
        // Cambiar deporte - volver a mostrar deportes
        const apiConfig = await obtenerConfigApi(empresaId);
        if (apiConfig) {
          const deportes = await obtenerDeportesApi(apiConfig);
          let mensajeDeportes = '🏆 *¿Qué deporte querés jugar?*\n\n';
          deportes.forEach((deporte, i) => {
            mensajeDeportes += `${i + 1}️⃣ ${deporte.icono} ${deporte.nombre}\n`;
          });
          mensajeDeportes += `\nEscribí el número de la opción.`;
          
          await enviarMensajeWhatsAppTexto(telefono, mensajeDeportes, phoneNumberId);
          return { success: true, nextState: 'esperando_deporte', data: { usaApiExterna: true, deportes } };
        }
        return { success: true, end: true };
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
      return { success: true, nextState: 'sin_disponibilidad_api', data };
    }
    
    // ========== ESTADO: ESPERANDO CANCHA API ==========
    if (state === 'esperando_cancha_api') {
      const opcion = parseInt(mensaje.trim()) - 1;
      const canchas = reservaData.canchasDisponibles || [];
      
      if (opcion < 0 || opcion >= canchas.length) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Opción inválida. Por favor, elegí un número de la lista.',
          phoneNumberId
        );
        return { success: true, nextState: 'esperando_cancha_api', data };
      }
      
      const canchaSeleccionada = canchas[opcion];
      
      // Mostrar horarios disponibles para esta cancha
      const horariosDisp = canchaSeleccionada.horarios_disponibles
        ?.filter(h => h.duraciones.includes(reservaData.duracion!))
        .map(h => h.hora) || [];
      
      if (horariosDisp.length === 0) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '⚠️ Esta cancha no tiene horarios disponibles para la duración seleccionada. Por favor, elegí otra cancha.',
          phoneNumberId
        );
        return { success: true, nextState: 'esperando_cancha_api', data };
      }
      
      let mensajeHorarios = `🎾 *${canchaSeleccionada.nombre}*\n\n⏰ *Horarios disponibles:*\n\n`;
      horariosDisp.forEach((hora, i) => {
        mensajeHorarios += `${i + 1}️⃣ ${hora}\n`;
      });
      mensajeHorarios += `\nEscribí el número del horario que querés.`;
      
      await enviarMensajeWhatsAppTexto(telefono, mensajeHorarios, phoneNumberId);
      
      // Calcular precio
      const precio = reservaData.duracion === 60 ? canchaSeleccionada.precio_hora : 
                    reservaData.duracion === 90 ? canchaSeleccionada.precio_hora_y_media : 
                    canchaSeleccionada.precio_dos_horas;
      const precioNum = typeof precio === 'string' ? parseFloat(precio) : precio;
      
      return {
        success: true,
        nextState: 'esperando_hora_api',
        data: { 
          ...reservaData, 
          canchaId: canchaSeleccionada.id, 
          canchaNombre: canchaSeleccionada.nombre,
          precioTotal: precioNum,
          horariosDisponibles: horariosDisp
        }
      };
    }
    
    // ========== ESTADO: ESPERANDO HORA API ==========
    if (state === 'esperando_hora_api') {
      const opcion = parseInt(mensaje.trim()) - 1;
      const horarios = (reservaData as any).horariosDisponibles || [];
      
      if (opcion < 0 || opcion >= horarios.length) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Opción inválida. Por favor, elegí un número de la lista.',
          phoneNumberId
        );
        return { success: true, nextState: 'esperando_hora_api', data };
      }
      
      const horaSeleccionada = horarios[opcion];
      const duracionTexto = reservaData.duracion === 60 ? '1 hora' : 
                           reservaData.duracion === 90 ? '1 hora 30 min' : '2 horas';
      
      // Calcular hora fin
      const [hora, minuto] = horaSeleccionada.split(':').map(Number);
      const horaFinMinutos = hora * 60 + minuto + reservaData.duracion!;
      const horaFin = `${Math.floor(horaFinMinutos / 60).toString().padStart(2, '0')}:${(horaFinMinutos % 60).toString().padStart(2, '0')}`;
      
      // Mostrar resumen y pedir confirmación
      const resumen = `✅ *Revisá tu reserva:*

🏆 Deporte: ${reservaData.deporteNombre}
📅 Fecha: ${formatearFecha(reservaData.fecha!)}
🕒 Horario: ${horaSeleccionada} a ${horaFin}
⏳ Duración: ${duracionTexto}
🏟️ Cancha: ${reservaData.canchaNombre}
💰 Precio: $${reservaData.precioTotal?.toLocaleString('es-AR')}

*¿Confirmamos la reserva?*

1️⃣ Sí, confirmar y pagar
2️⃣ Cambiar algo
3️⃣ Cancelar`;
      
      await enviarMensajeWhatsAppTexto(telefono, resumen, phoneNumberId);
      
      return {
        success: true,
        nextState: 'esperando_confirmacion_api',
        data: { ...reservaData, horaInicio: horaSeleccionada }
      };
    }
    
    // ========== ESTADO: ESPERANDO CONFIRMACIÓN API ==========
    if (state === 'esperando_confirmacion_api') {
      const opcion = mensaje.trim();
      
      if (opcion === '1') {
        // Confirmar - crear pre-reserva en la API
        const apiConfig = await obtenerConfigApi(empresaId);
        
        if (!apiConfig) {
          await enviarMensajeWhatsAppTexto(
            telefono,
            '❌ Error de configuración. Por favor, intentá más tarde.',
            phoneNumberId
          );
          return { success: true, end: true };
        }
        
        // Crear pre-reserva
        const preReserva = await preCrearReservaApi(
          apiConfig,
          reservaData.canchaId!,
          reservaData.fechaApi!,
          reservaData.horaInicio!,
          reservaData.duracion!,
          {
            nombre: profileName || 'Cliente WhatsApp',
            telefono: telefono
          }
        );
        
        if (!preReserva || !preReserva.success) {
          const errorMsg = preReserva?.error?.message || 'El horario ya no está disponible';
          await enviarMensajeWhatsAppTexto(
            telefono,
            `❌ No se pudo crear la reserva: ${errorMsg}\n\nPor favor, intentá con otro horario.`,
            phoneNumberId
          );
          return { success: true, nextState: 'esperando_fecha', data: { ...reservaData, fecha: undefined } };
        }
        
        // Reserva pre-creada exitosamente
        const duracionTexto = reservaData.duracion === 60 ? '1 hora' : 
                             reservaData.duracion === 90 ? '1 hora 30 min' : '2 horas';
        
        await enviarMensajeWhatsAppTexto(
          telefono,
          `🎉 *¡Reserva pre-confirmada!*

📋 *Código:* ${preReserva.reserva_id?.substring(0, 8).toUpperCase()}

🏆 ${reservaData.deporteNombre}
📅 ${formatearFecha(reservaData.fecha!)}
🕒 ${preReserva.detalle?.hora_inicio} a ${preReserva.detalle?.hora_fin}
🏟️ ${preReserva.detalle?.cancha || reservaData.canchaNombre}
💰 Total: $${preReserva.detalle?.precio_total?.toLocaleString('es-AR')}
💳 Seña: $${preReserva.detalle?.seña_requerida?.toLocaleString('es-AR')}

⏳ *Tenés ${Math.floor((preReserva.expira_en || 600) / 60)} minutos para completar el pago.*

📱 Te enviaremos el link de pago en breve.

¡Gracias por reservar en *Club Juventus*! 🏟️`,
          phoneNumberId
        );
        
        // TODO: Aquí se debería generar el link de Mercado Pago y enviarlo
        // Por ahora, guardamos la reserva localmente también
        try {
          const contacto = await buscarOCrearContacto({
            telefono,
            profileName: profileName || 'Cliente WhatsApp',
            empresaId
          });
          
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
          
          await TurnoModel.create({
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
              deporte: reservaData.deporteNombre,
              reservaIdExterno: preReserva.reserva_id,
              precioTotal: preReserva.detalle?.precio_total,
              seña: preReserva.detalle?.seña_requerida
            },
            notas: `Reservado vía WhatsApp - API Mis Canchas - ID: ${preReserva.reserva_id}`,
            creadoPor: 'bot'
          });
          
          console.log(`✅ [ReservaCanchas] Pre-reserva creada: ${preReserva.reserva_id}`);
        } catch (error) {
          console.error('❌ [ReservaCanchas] Error guardando turno local:', error);
        }
        
        return { success: true, end: true };
      }
      
      if (opcion === '2') {
        // Cambiar algo - volver al inicio
        await enviarMensajeWhatsAppTexto(
          telefono,
          '📅 *¿Para qué fecha querés reservar?*\n\nEscribí la fecha en formato DD/MM/AAAA\no escribí "hoy" o "mañana"',
          phoneNumberId
        );
        return { success: true, nextState: 'esperando_fecha', data: { usaApiExterna: true, deporteId: reservaData.deporteId, deporteNombre: reservaData.deporteNombre, deportes: reservaData.deportes } };
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
      return { success: true, nextState: 'esperando_confirmacion_api', data };
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
