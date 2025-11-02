// 🎯 Gestor de Flujos Dinámicos
import { FlujoModel, TipoFlujo, TipoDisparador, IFlujo } from '../models/Flujo.js';
import * as confirmacionTurnosService from '../modules/calendar/services/confirmacionTurnosService.js';
import * as botTurnosService from '../modules/calendar/services/botTurnosService.js';
import { TurnoModel, EstadoTurno } from '../modules/calendar/models/Turno.js';
import { ClienteModel } from '../models/Cliente.js';

export interface ResultadoFlujo {
  procesado: boolean;
  respuesta?: string;
  flujoEjecutado?: string;
  debeEnviarRespuesta?: boolean;
}

/**
 * Procesar mensaje a través del sistema de flujos
 */
export async function procesarMensaje(
  telefono: string,
  mensaje: string,
  empresaId: string
): Promise<ResultadoFlujo> {
  
  console.log('🎯 Gestor de Flujos - Procesando mensaje:', { telefono, mensaje, empresaId });
  
  try {
    // 1. Obtener flujos activos de la empresa ordenados por prioridad
    const flujos = await FlujoModel.find({
      empresaId,
      activo: true
    }).sort({ prioridad: 1 }); // 1 = máxima prioridad
    
    console.log(`📋 Flujos activos encontrados: ${flujos.length}`);
    
    if (flujos.length === 0) {
      console.log('⚠️ No hay flujos configurados para esta empresa');
      return { procesado: false };
    }
    
    // 2. Evaluar cada flujo en orden de prioridad
    for (const flujo of flujos) {
      console.log(`🔍 Evaluando flujo: ${flujo.nombre} (prioridad: ${flujo.prioridad})`);
      
      const debeEjecutar = await evaluarDisparadores(flujo, telefono, mensaje, empresaId);
      
      if (debeEjecutar) {
        console.log(`✅ Flujo seleccionado: ${flujo.nombre}`);
        
        // 3. Ejecutar el flujo correspondiente
        const resultado = await ejecutarFlujo(flujo, telefono, mensaje, empresaId);
        
        if (resultado.procesado) {
          console.log(`✅ Flujo ${flujo.nombre} procesó el mensaje exitosamente`);
          return {
            ...resultado,
            flujoEjecutado: flujo.nombre
          };
        }
      }
    }
    
    console.log('⚠️ Ningún flujo procesó el mensaje');
    return { procesado: false };
    
  } catch (error) {
    console.error('❌ Error en gestor de flujos:', error);
    return { procesado: false };
  }
}

/**
 * Evaluar si los disparadores de un flujo se cumplen
 */
async function evaluarDisparadores(
  flujo: IFlujo,
  telefono: string,
  mensaje: string,
  empresaId: string
): Promise<boolean> {
  
  if (!flujo.disparadores || flujo.disparadores.length === 0) {
    return false;
  }
  
  // Evaluar cada disparador (OR logic - al menos uno debe cumplirse)
  for (const disparador of flujo.disparadores) {
    const cumple = await evaluarDisparador(disparador, flujo, telefono, mensaje, empresaId);
    
    if (cumple) {
      console.log(`✅ Disparador cumplido: ${disparador.tipo}`);
      return true;
    }
  }
  
  return false;
}

/**
 * Evaluar un disparador individual
 */
async function evaluarDisparador(
  disparador: any,
  flujo: IFlujo,
  telefono: string,
  mensaje: string,
  empresaId: string
): Promise<boolean> {
  
  const mensajeNormalizado = mensaje.trim().toLowerCase();
  
  switch (disparador.tipo) {
    case TipoDisparador.SESION_ACTIVA:
      // Verificar si hay una sesión activa para este flujo
      if (flujo.tipo === TipoFlujo.CONFIRMACION_TURNOS) {
        const sesion = confirmacionTurnosService.obtenerSesion(telefono);
        return sesion !== undefined;
      }
      return false;
      
    case TipoDisparador.PALABRA_CLAVE:
      // Verificar si el mensaje contiene alguna palabra clave
      const palabras = Array.isArray(disparador.valor) ? disparador.valor : [disparador.valor];
      return palabras.some((palabra: string) => 
        mensajeNormalizado.includes(palabra.toLowerCase())
      );
      
    case TipoDisparador.PATRON_REGEX:
      // Verificar si el mensaje coincide con el patrón regex
      try {
        const regex = new RegExp(disparador.valor as string, 'i');
        return regex.test(mensaje);
      } catch (error) {
        console.error('Error en regex:', error);
        return false;
      }
      
    case TipoDisparador.TURNOS_PENDIENTES:
      // Verificar si el cliente tiene turnos pendientes
      try {
        const cliente = await ClienteModel.findOne({ telefono, empresaId });
        if (!cliente) return false;
        
        const turnosPendientes = await TurnoModel.countDocuments({
          clienteId: cliente._id.toString(),
          empresaId,
          estado: { $in: [EstadoTurno.PENDIENTE, EstadoTurno.NO_CONFIRMADO] },
          fechaInicio: { $gte: new Date() }
        });
        
        return turnosPendientes > 0;
      } catch (error) {
        console.error('Error verificando turnos pendientes:', error);
        return false;
      }
      
    case TipoDisparador.HORARIO:
      // Verificar si estamos dentro del horario configurado
      if (disparador.config?.inicio && disparador.config?.fin) {
        const ahora = new Date();
        const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
        
        const [inicioH, inicioM] = disparador.config.inicio.split(':').map(Number);
        const [finH, finM] = disparador.config.fin.split(':').map(Number);
        
        const inicio = inicioH * 60 + inicioM;
        const fin = finH * 60 + finM;
        
        return horaActual >= inicio && horaActual <= fin;
      }
      return false;
      
    case TipoDisparador.SIEMPRE:
      // Siempre se ejecuta (usado para flujos fallback)
      return true;
      
    case TipoDisparador.NUNCA:
      // Nunca se ejecuta (flujo desactivado temporalmente)
      return false;
      
    default:
      return false;
  }
}

/**
 * Ejecutar el flujo seleccionado
 */
async function ejecutarFlujo(
  flujo: IFlujo,
  telefono: string,
  mensaje: string,
  empresaId: string
): Promise<ResultadoFlujo> {
  
  console.log(`🚀 Ejecutando flujo: ${flujo.tipo}`);
  
  switch (flujo.tipo) {
    case TipoFlujo.CONFIRMACION_TURNOS:
      return await ejecutarFlujoConfirmacion(telefono, mensaje, empresaId);
      
    case TipoFlujo.BOT_TURNOS:
      return await ejecutarFlujoBotTurnos(telefono, mensaje, empresaId);
      
    case TipoFlujo.OPENAI_GENERAL:
      // Este se maneja en el webhook principal
      return { procesado: false };
      
    case TipoFlujo.PERSONALIZADO:
      // Aquí se pueden agregar handlers personalizados
      return { procesado: false };
      
    default:
      return { procesado: false };
  }
}

/**
 * Ejecutar flujo de confirmación de turnos
 */
async function ejecutarFlujoConfirmacion(
  telefono: string,
  mensaje: string,
  empresaId: string
): Promise<ResultadoFlujo> {
  
  const resultado = await confirmacionTurnosService.procesarRespuestaConfirmacion(
    telefono,
    mensaje,
    empresaId
  );
  
  return {
    procesado: resultado.procesado,
    respuesta: resultado.respuesta,
    debeEnviarRespuesta: true
  };
}

/**
 * Ejecutar flujo del bot de turnos
 */
async function ejecutarFlujoBotTurnos(
  telefono: string,
  mensaje: string,
  empresaId: string
): Promise<ResultadoFlujo> {
  
  const respuesta = await botTurnosService.procesarMensaje(
    mensaje,
    telefono,
    empresaId
  );
  
  return {
    procesado: respuesta !== null,
    respuesta: respuesta || undefined,
    debeEnviarRespuesta: true
  };
}

/**
 * Inicializar flujos por defecto para una empresa
 */
export async function inicializarFlujosPorDefecto(empresaId: string): Promise<void> {
  
  console.log(`🔧 Inicializando flujos por defecto para empresa: ${empresaId}`);
  
  const flujosExistentes = await FlujoModel.countDocuments({ empresaId });
  
  if (flujosExistentes > 0) {
    console.log('✅ La empresa ya tiene flujos configurados');
    return;
  }
  
  // Flujo 1: Confirmación de Turnos (Prioridad 1 - Máxima)
  await FlujoModel.create({
    empresaId,
    nombre: 'Confirmación de Turnos',
    descripcion: 'Sistema de confirmación interactiva de turnos pendientes',
    tipo: TipoFlujo.CONFIRMACION_TURNOS,
    prioridad: 1,
    disparadores: [
      {
        tipo: TipoDisparador.SESION_ACTIVA,
        config: { descripcion: 'Cliente tiene una sesión de confirmación activa' }
      },
      {
        tipo: TipoDisparador.TURNOS_PENDIENTES,
        config: { descripcion: 'Cliente tiene turnos pendientes de confirmar' }
      }
    ],
    configuracion: {
      camposEditables: ['hora', 'origen', 'destino', 'pasajeros']
    },
    activo: true,
    creadoPor: 'sistema'
  });
  
  // Flujo 2: Bot de Turnos (Prioridad 50)
  await FlujoModel.create({
    empresaId,
    nombre: 'Bot de Reservas',
    descripcion: 'Bot interactivo para crear, consultar y cancelar turnos',
    tipo: TipoFlujo.BOT_TURNOS,
    prioridad: 50,
    disparadores: [
      {
        tipo: TipoDisparador.PALABRA_CLAVE,
        valor: ['reservar', 'turno', 'agendar', 'consultar', 'cancelar'],
        config: { descripcion: 'Palabras relacionadas con turnos' }
      },
      {
        tipo: TipoDisparador.PATRON_REGEX,
        valor: '^[1-3]$',
        config: { descripcion: 'Opciones del menú (1, 2, 3)' }
      }
    ],
    configuracion: {
      mensajeBienvenida: '¡Hola! 👋 ¿En qué puedo ayudarte?',
      opcionesMenu: ['Reservar un viaje', 'Consultar mis viajes', 'Cancelar un viaje']
    },
    activo: true,
    creadoPor: 'sistema'
  });
  
  // Flujo 3: OpenAI General (Prioridad 100 - Fallback)
  await FlujoModel.create({
    empresaId,
    nombre: 'Asistente General (OpenAI)',
    descripcion: 'Asistente conversacional general con IA',
    tipo: TipoFlujo.OPENAI_GENERAL,
    prioridad: 100,
    disparadores: [
      {
        tipo: TipoDisparador.SIEMPRE,
        config: { descripcion: 'Fallback - se ejecuta si ningún otro flujo procesa el mensaje' }
      }
    ],
    configuracion: {
      systemPrompt: 'Eres un asistente virtual amable y profesional.',
      temperatura: 0.7
    },
    activo: true,
    creadoPor: 'sistema'
  });
  
  console.log('✅ Flujos por defecto creados exitosamente');
}
