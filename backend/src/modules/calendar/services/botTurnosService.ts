// 🤖 Servicio del Bot de Turnos - Sistema de Puntos
import { ConfiguracionBotModel } from '../models/ConfiguracionBot.js';
import { ConversacionBotModel, IConversacionBot } from '../models/ConversacionBot.js';
import { ConfiguracionModuloModel } from '../models/ConfiguracionModulo.js';
import { TurnoModel, EstadoTurno } from '../models/Turno.js';
import { ClienteModel } from '../../../models/Cliente.js';
import { AgenteModel } from '../models/Agente.js';
import * as turnoService from './turnoService.js';
import { normalizarTelefono } from '../../../utils/telefonoUtils.js';

/**
 * Procesar mensaje del cliente
 */
export async function procesarMensaje(
  mensaje: string,
  telefono: string,
  empresaId: string
): Promise<string | null> {
  try {
    // 1. Verificar que el bot esté activo
    const configBot = await ConfiguracionBotModel.findOne({ empresaId });
    
    if (!configBot || !configBot.activo) {
      return null; // Bot desactivado
    }
    
    // 2. Verificar horarios de atención
    if (configBot.horariosAtencion?.activo) {
      const dentroHorario = verificarHorarioAtencion(configBot.horariosAtencion);
      if (!dentroHorario) {
        return configBot.horariosAtencion.mensajeFueraHorario
          .replace('{inicio}', configBot.horariosAtencion.inicio)
          .replace('{fin}', configBot.horariosAtencion.fin);
      }
    }
    
    // 3. Obtener o crear conversación
    let conversacion = await ConversacionBotModel.findOne({
      empresaId,
      clienteTelefono: telefono,
      activa: true
    });
    
    // Verificar timeout
    if (conversacion) {
      const minutosInactivo = (Date.now() - conversacion.ultimaInteraccion.getTime()) / 60000;
      if (minutosInactivo > configBot.timeoutMinutos) {
        // Timeout - reiniciar conversación
        conversacion.activa = false;
        conversacion.completada = false;
        conversacion.finalizadaEn = new Date();
        await conversacion.save();
        conversacion = null;
      }
    }
    
    // Crear nueva conversación si no existe
    if (!conversacion) {
      conversacion = new ConversacionBotModel({
        empresaId,
        clienteTelefono: telefono,
        flujoActivo: 'menu_principal',
        pasoActual: 'inicio'
      });
    }
    
    // 4. Agregar mensaje del usuario al historial
    conversacion.historial.push({
      tipo: 'usuario',
      mensaje,
      timestamp: new Date()
    });
    
    // 5. Procesar según el flujo actual
    let respuesta: string;
    
    if (conversacion.pasoActual === 'inicio') {
      // Mostrar menú principal
      respuesta = configBot.mensajeBienvenida;
      conversacion.pasoActual = 'menu_principal';
    } else {
      // Procesar respuesta según flujo
      respuesta = await procesarRespuesta(
        mensaje,
        conversacion,
        configBot,
        empresaId
      );
    }
    
    // 6. Agregar respuesta del bot al historial
    conversacion.historial.push({
      tipo: 'bot',
      mensaje: respuesta,
      timestamp: new Date()
    });
    conversacion.ultimaInteraccion = new Date();
    
    // 7. Guardar conversación
    await conversacion.save();
    
    return respuesta;
    
  } catch (error) {
    console.error('❌ Error procesando mensaje del bot:', error);
    return '❌ Ocurrió un error. Por favor intenta nuevamente.';
  }
}

/**
 * Procesar respuesta del usuario según el flujo actual
 */
async function procesarRespuesta(
  mensaje: string,
  conversacion: any,
  configBot: any,
  empresaId: string
): Promise<string> {
  const mensajeLimpio = mensaje.trim();
  
  // Menú principal
  if (conversacion.pasoActual === 'menu_principal') {
    switch (mensajeLimpio) {
      case '1':
        conversacion.flujoActivo = 'crear_turno';
        conversacion.pasoActual = 'seleccionar_fecha';
        return await iniciarCreacionTurno(empresaId);
        
      case '2':
        conversacion.flujoActivo = 'consultar_turnos';
        return await consultarTurnos(conversacion.clienteTelefono, empresaId);
        
      case '3':
        if (configBot.permiteCancelacion) {
          conversacion.flujoActivo = 'cancelar_turno';
          return await iniciarCancelacion(conversacion.clienteTelefono, empresaId);
        } else {
          return '❌ La cancelación de turnos no está disponible. Por favor contacta directamente.';
        }
        
      default:
        return configBot.mensajeError + '\n\n' + configBot.mensajeBienvenida;
    }
  }
  
  // Flujo: Crear turno
  if (conversacion.flujoActivo === 'crear_turno') {
    return await procesarCreacionTurno(
      mensajeLimpio,
      conversacion,
      configBot,
      empresaId
    );
  }
  
  // Flujo: Cancelar turno
  if (conversacion.flujoActivo === 'cancelar_turno') {
    return await procesarCancelacion(
      mensajeLimpio,
      conversacion,
      empresaId
    );
  }
  
  return configBot.mensajeError;
}

/**
 * Iniciar flujo de creación de turno
 */
async function iniciarCreacionTurno(empresaId: string): Promise<string> {
  const config = await ConfiguracionModuloModel.findOne({ empresaId });
  
  let mensaje = `📅 Perfecto! Vamos a agendar tu ${config?.nomenclatura.turno || 'turno'}.\n\n`;
  mensaje += '📆 Por favor, envíame la fecha deseada en formato DD/MM/AAAA\n';
  mensaje += 'Ejemplo: 25/10/2025';
  
  return mensaje;
}

/**
 * Procesar creación de turno paso a paso
 */
async function procesarCreacionTurno(
  mensaje: string,
  conversacion: any,
  configBot: any,
  empresaId: string
): Promise<string> {
  const config = await ConfiguracionModuloModel.findOne({ empresaId });
  
  switch (conversacion.pasoActual) {
    case 'seleccionar_fecha':
      // Validar y guardar fecha
      const fecha = parsearFecha(mensaje);
      if (!fecha) {
        return '❌ Fecha inválida. Por favor usa el formato DD/MM/AAAA\nEjemplo: 25/10/2025';
      }
      
      if (fecha < new Date()) {
        return '❌ La fecha no puede ser en el pasado. Por favor elige una fecha futura.';
      }
      
      conversacion.datosCapturados.set('fecha', fecha.toISOString());
      conversacion.markModified('datosCapturados');
      conversacion.pasoActual = 'seleccionar_hora';
      
      return '🕐 Excelente! Ahora dime la hora deseada en formato HH:MM\nEjemplo: 14:30';
      
    case 'seleccionar_hora':
      // Validar y guardar hora
      const hora = parsearHora(mensaje);
      if (!hora) {
        return '❌ Hora inválida. Por favor usa el formato HH:MM\nEjemplo: 14:30';
      }
      
      conversacion.datosCapturados.set('hora', hora);
      conversacion.markModified('datosCapturados');
      
      // Si hay agentes, preguntar por agente
      if (config?.usaAgentes) {
        conversacion.pasoActual = 'seleccionar_agente';
        return await listarAgentes(empresaId, config);
      } else {
        // Si no usa agentes, pasar a campos personalizados
        conversacion.pasoActual = 'campos_personalizados';
        return await solicitarCamposPersonalizados(empresaId, config, 0);
      }
      
    case 'seleccionar_agente':
      // Validar y guardar agente
      const agentes = await AgenteModel.find({ empresaId, activo: true });
      const numeroAgente = parseInt(mensaje);
      
      if (isNaN(numeroAgente) || numeroAgente < 1 || numeroAgente > agentes.length) {
        return '❌ Opción inválida. Por favor elige un número de la lista.';
      }
      
      const agenteSeleccionado = agentes[numeroAgente - 1];
      conversacion.datosCapturados.set('agenteId', agenteSeleccionado._id.toString());
      conversacion.markModified('datosCapturados');
      
      // Pasar a campos personalizados
      conversacion.pasoActual = 'campos_personalizados';
      conversacion.datosCapturados.set('indiceCampo', 0);
      conversacion.markModified('datosCapturados');
      return await solicitarCamposPersonalizados(empresaId, config, 0);
      
    case 'campos_personalizados':
      // Capturar campos personalizados uno por uno
      return await capturarCampoPersonalizado(mensaje, conversacion, empresaId, config);
      
    case 'confirmacion':
      // Confirmar y crear turno
      if (mensaje === '1') {
        return await crearTurnoFinal(conversacion, empresaId, config);
      } else if (mensaje === '2') {
        // Cancelar
        conversacion.activa = false;
        conversacion.completada = false;
        conversacion.finalizadaEn = new Date();
        return '❌ Turno cancelado.\n\n' + configBot.mensajeBienvenida;
      } else {
        return '❌ Por favor responde 1 para confirmar o 2 para cancelar.';
      }
      
    default:
      return '❌ Ocurrió un error. Volvamos al inicio.\n\n' + configBot.mensajeBienvenida;
  }
}

/**
 * Listar agentes disponibles
 */
async function listarAgentes(empresaId: string, config: any): Promise<string> {
  const agentes = await AgenteModel.find({ empresaId, activo: true });
  
  if (agentes.length === 0) {
    return '❌ No hay agentes disponibles en este momento.';
  }
  
  let mensaje = `👤 Selecciona un ${config.nomenclatura.agente || 'agente'}:\n\n`;
  
  agentes.forEach((agente, index) => {
    mensaje += `${index + 1}️⃣ ${agente.nombre} ${agente.apellido}`;
    if (agente.especialidad) {
      mensaje += ` - ${agente.especialidad}`;
    }
    mensaje += '\n';
  });
  
  mensaje += '\nEscribe el número de tu elección.';
  
  return mensaje;
}

/**
 * Solicitar campos personalizados
 */
async function solicitarCamposPersonalizados(
  empresaId: string,
  config: any,
  indice: number
): Promise<string> {
  const campos = config?.camposPersonalizados || [];
  
  if (campos.length === 0 || indice >= campos.length) {
    // No hay más campos, pasar a confirmación
    return '✅ Perfecto! Ahora voy a mostrarte un resumen.';
  }
  
  const campo = campos[indice];
  let mensaje = `📝 ${campo.etiqueta}`;
  
  if (campo.requerido) {
    mensaje += ' *';
  }
  
  if (campo.placeholder) {
    mensaje += `\n💡 ${campo.placeholder}`;
  }
  
  return mensaje;
}

/**
 * Capturar campo personalizado
 */
async function capturarCampoPersonalizado(
  mensaje: string,
  conversacion: any,
  empresaId: string,
  config: any
): Promise<string> {
  const campos = config?.camposPersonalizados || [];
  const indice = conversacion.datosCapturados.get('indiceCampo') || 0;
  
  if (indice >= campos.length) {
    // Todos los campos capturados, mostrar confirmación
    conversacion.pasoActual = 'confirmacion';
    return await mostrarResumen(conversacion, config);
  }
  
  const campo = campos[indice];
  
  // Validar según tipo de campo
  const valorValido = validarCampo(mensaje, campo);
  
  if (!valorValido.valido) {
    return `❌ ${valorValido.error}\n\nPor favor intenta nuevamente.`;
  }
  
  // Guardar valor
  conversacion.datosCapturados.set(`campo_${campo.clave}`, valorValido.valor);
  conversacion.markModified('datosCapturados');
  
  // Pasar al siguiente campo
  const siguienteIndice = indice + 1;
  conversacion.datosCapturados.set('indiceCampo', siguienteIndice);
  conversacion.markModified('datosCapturados');
  
  if (siguienteIndice >= campos.length) {
    // Todos los campos capturados
    conversacion.pasoActual = 'confirmacion';
    return await mostrarResumen(conversacion, config);
  }
  
  // Solicitar siguiente campo
  return await solicitarCamposPersonalizados(empresaId, config, siguienteIndice);
}

/**
 * Mostrar resumen para confirmación
 */
async function mostrarResumen(conversacion: any, config: any): Promise<string> {
  const datos = conversacion.datosCapturados;
  
  let mensaje = '📋 *Resumen de tu turno:*\n\n';
  
  // Fecha y hora
  const fecha = new Date(datos.get('fecha'));
  mensaje += `📅 Fecha: ${fecha.toLocaleDateString('es-AR')}\n`;
  mensaje += `🕐 Hora: ${datos.get('hora')}\n`;
  
  // Agente (si aplica)
  if (datos.get('agenteId')) {
    const agente = await AgenteModel.findById(datos.get('agenteId'));
    if (agente) {
      mensaje += `👤 ${config.nomenclatura.agente}: ${agente.nombre} ${agente.apellido}\n`;
    }
  }
  
  // Campos personalizados
  const campos = config?.camposPersonalizados || [];
  if (campos.length > 0) {
    mensaje += '\n📝 *Detalles:*\n';
    campos.forEach((campo: any) => {
      const valor = datos.get(`campo_${campo.clave}`);
      if (valor) {
        mensaje += `• ${campo.etiqueta}: ${valor}\n`;
      }
    });
  }
  
  mensaje += '\n¿Confirmas estos datos?\n';
  mensaje += '1️⃣ Sí, confirmar\n';
  mensaje += '2️⃣ No, cancelar';
  
  return mensaje;
}

/**
 * Crear turno final
 */
async function crearTurnoFinal(
  conversacion: any,
  empresaId: string,
  config: any
): Promise<string> {
  try {
    const datos = conversacion.datosCapturados;
    
    // ⚠️ CRÍTICO: Normalizar teléfono (sin +, espacios, guiones)
    const telefonoNormalizado = normalizarTelefono(conversacion.clienteTelefono);
    
    console.log('🔍 Buscando/creando cliente:');
    console.log('  Teléfono original:', conversacion.clienteTelefono);
    console.log('  Teléfono normalizado:', telefonoNormalizado);
    console.log('  Empresa:', empresaId);
    
    // Buscar o crear cliente con teléfono normalizado
    let cliente = await ClienteModel.findOne({
      telefono: telefonoNormalizado,
      empresaId
    });
    
    if (!cliente) {
      console.log('📝 Cliente no encontrado, creando nuevo...');
      // Crear cliente temporal con teléfono normalizado
      cliente = await ClienteModel.create({
        empresaId,
        nombre: 'Cliente',
        apellido: 'WhatsApp',
        telefono: telefonoNormalizado,  // ✅ Guardar normalizado
        origen: 'chatbot'
      });
      console.log('✅ Cliente creado:', cliente._id);
    } else {
      console.log('✅ Cliente encontrado:', cliente._id);
    }
    
    // Construir fecha completa
    const fecha = new Date(datos.get('fecha'));
    const [horas, minutos] = datos.get('hora').split(':');
    fecha.setHours(parseInt(horas), parseInt(minutos), 0, 0);
    
    // Construir datos dinámicos
    const datosDinamicos: any = {};
    const campos = config?.camposPersonalizados || [];
    campos.forEach((campo: any) => {
      const valor = datos.get(`campo_${campo.clave}`);
      if (valor) {
        datosDinamicos[campo.clave] = valor;
      }
    });
    
    // Crear turno
    const turno = await turnoService.crearTurno({
      empresaId,
      agenteId: datos.get('agenteId'),
      clienteId: cliente._id.toString(),
      fechaInicio: fecha,
      duracion: 30, // Por defecto
      datos: datosDinamicos,
      notas: 'Creado por bot de WhatsApp',
      creadoPor: 'bot'
    });
    
    // Finalizar conversación
    conversacion.activa = false;
    conversacion.completada = true;
    conversacion.finalizadaEn = new Date();
    
    let mensaje = `✅ *¡Listo!* Tu ${config.nomenclatura.turno} ha sido agendado.\n\n`;
    mensaje += `📅 ${fecha.toLocaleDateString('es-AR')} a las ${datos.get('hora')}\n`;
    mensaje += `\n📱 Recibirás una confirmación antes de tu ${config.nomenclatura.turno}.`;
    mensaje += `\n\n¡Hasta pronto! 👋`;
    
    return mensaje;
    
  } catch (error) {
    console.error('Error creando turno:', error);
    return '❌ Ocurrió un error al crear el turno. Por favor contacta directamente.';
  }
}

/**
 * Consultar turnos del cliente
 */
async function consultarTurnos(telefono: string, empresaId: string): Promise<string> {
  try {
    const cliente = await ClienteModel.findOne({ telefono, empresaId });
    
    if (!cliente) {
      return '❌ No encontré turnos asociados a este número.';
    }
    
    const turnos = await TurnoModel.find({
      empresaId,
      clienteId: cliente._id,
      fechaInicio: { $gte: new Date() },
      estado: { $in: ['pendiente', 'confirmado'] }
    }).sort({ fechaInicio: 1 }).limit(5);
    
    if (turnos.length === 0) {
      return '📅 No tienes turnos próximos agendados.';
    }
    
    let mensaje = '📅 *Tus próximos turnos:*\n\n';
    
    turnos.forEach((turno, index) => {
      const fecha = new Date(turno.fechaInicio);
      mensaje += `${index + 1}️⃣ ${fecha.toLocaleDateString('es-AR')} - ${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}\n`;
      mensaje += `   Estado: ${turno.estado}\n\n`;
    });
    
    return mensaje;
    
  } catch (error) {
    console.error('Error consultando turnos:', error);
    return '❌ Ocurrió un error al consultar tus turnos.';
  }
}

/**
 * Iniciar cancelación de turno
 */
async function iniciarCancelacion(telefono: string, empresaId: string): Promise<string> {
  const cliente = await ClienteModel.findOne({ telefono, empresaId });
  
  if (!cliente) {
    return '❌ No encontré turnos asociados a este número.';
  }
  
  const turnos = await TurnoModel.find({
    empresaId,
    clienteId: cliente._id,
    fechaInicio: { $gte: new Date() },
    estado: { $in: ['pendiente', 'confirmado'] }
  }).sort({ fechaInicio: 1 });
  
  if (turnos.length === 0) {
    return '📅 No tienes turnos próximos para cancelar.';
  }
  
  let mensaje = '❌ *Cancelar turno*\n\nSelecciona el turno que deseas cancelar:\n\n';
  
  turnos.forEach((turno, index) => {
    const fecha = new Date(turno.fechaInicio);
    mensaje += `${index + 1}️⃣ ${fecha.toLocaleDateString('es-AR')} - ${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}\n`;
  });
  
  mensaje += '\nEscribe el número del turno a cancelar.';
  
  return mensaje;
}

/**
 * Procesar cancelación
 */
async function procesarCancelacion(
  mensaje: string,
  conversacion: any,
  empresaId: string
): Promise<string> {
  const numero = parseInt(mensaje);
  
  if (isNaN(numero)) {
    return '❌ Por favor escribe el número del turno a cancelar.';
  }
  
  const cliente = await ClienteModel.findOne({
    telefono: conversacion.clienteTelefono,
    empresaId
  });
  
  if (!cliente) {
    return '❌ Error al buscar tus turnos.';
  }
  
  const turnos = await TurnoModel.find({
    empresaId,
    clienteId: cliente._id,
    fechaInicio: { $gte: new Date() },
    estado: { $in: ['pendiente', 'confirmado'] }
  }).sort({ fechaInicio: 1 });
  
  if (numero < 1 || numero > turnos.length) {
    return '❌ Número de turno inválido.';
  }
  
  const turno = turnos[numero - 1];
  turno.estado = EstadoTurno.CANCELADO;
  turno.canceladoEn = new Date();
  turno.motivoCancelacion = 'Cancelado por el cliente vía bot';
  await turno.save();
  
  conversacion.activa = false;
  conversacion.completada = true;
  conversacion.finalizadaEn = new Date();
  
  return '✅ Turno cancelado exitosamente.\n\n¡Hasta pronto! 👋';
}

// ============ UTILIDADES ============

function verificarHorarioAtencion(horarios: any): boolean {
  const ahora = new Date();
  const diaActual = ahora.getDay();
  const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
  
  if (!horarios.diasSemana.includes(diaActual)) {
    return false;
  }
  
  const [horaInicio, minutosInicio] = horarios.inicio.split(':').map(Number);
  const [horaFin, minutosFin] = horarios.fin.split(':').map(Number);
  
  const minutosInicioTotal = horaInicio * 60 + minutosInicio;
  const minutosFinTotal = horaFin * 60 + minutosFin;
  
  return horaActual >= minutosInicioTotal && horaActual <= minutosFinTotal;
}

function parsearFecha(texto: string): Date | null {
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = texto.match(regex);
  
  if (!match) return null;
  
  const [, dia, mes, anio] = match;
  const fecha = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
  
  if (isNaN(fecha.getTime())) return null;
  
  return fecha;
}

function parsearHora(texto: string): string | null {
  const regex = /^(\d{1,2}):(\d{2})$/;
  const match = texto.match(regex);
  
  if (!match) return null;
  
  const [, horas, minutos] = match;
  const h = parseInt(horas);
  const m = parseInt(minutos);
  
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function validarCampo(valor: string, campo: any): { valido: boolean; valor?: any; error?: string } {
  switch (campo.tipo) {
    case 'numero':
      const num = parseInt(valor);
      if (isNaN(num)) {
        return { valido: false, error: 'Debe ser un número válido' };
      }
      if (campo.validacion?.min && num < campo.validacion.min) {
        return { valido: false, error: `El valor mínimo es ${campo.validacion.min}` };
      }
      if (campo.validacion?.max && num > campo.validacion.max) {
        return { valido: false, error: `El valor máximo es ${campo.validacion.max}` };
      }
      return { valido: true, valor: num };
      
    case 'fecha':
      const fecha = parsearFecha(valor);
      if (!fecha) {
        return { valido: false, error: 'Formato de fecha inválido. Usa DD/MM/AAAA' };
      }
      return { valido: true, valor: fecha.toISOString() };
      
    case 'hora':
      const hora = parsearHora(valor);
      if (!hora) {
        return { valido: false, error: 'Formato de hora inválido. Usa HH:MM' };
      }
      return { valido: true, valor: hora };
      
    default:
      if (campo.requerido && !valor.trim()) {
        return { valido: false, error: 'Este campo es requerido' };
      }
      return { valido: true, valor: valor.trim() };
  }
}
