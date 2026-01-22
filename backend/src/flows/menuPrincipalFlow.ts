// 📋 Flujo de Menú Principal - Reserva/Consulta/Cancelación
import type { Flow, FlowContext, FlowResult } from './types.js';
import { enviarMensajeWhatsAppTexto, enviarMensajeConBotones } from '../services/metaService.js';
import { ConfiguracionBotModel } from '../modules/calendar/models/ConfiguracionBot.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { AgenteModel } from '../modules/calendar/models/Agente.js';
import { buscarOCrearContacto, incrementarTurnos } from '../services/contactoService.js';

// Obtener fecha actual en zona horaria de Argentina
function obtenerFechaArgentina(): Date {
  const ahora = new Date();
  const offsetArgentina = -3 * 60; // Argentina es UTC-3 (en minutos)
  const offsetLocal = ahora.getTimezoneOffset();
  const diferenciaMinutos = offsetLocal + offsetArgentina;
  const fechaArgentina = new Date(ahora.getTime() + diferenciaMinutos * 60 * 1000);
  return fechaArgentina;
}

export const menuPrincipalFlow: Flow = {
  name: 'menu_principal',
  priority: 'normal',
  version: '1.0.0',
  
  async shouldActivate(context: FlowContext): Promise<boolean> {
    const { mensaje, empresaId } = context;
    const mensajeLower = mensaje.toLowerCase().trim();
    
    // 🔒 VERIFICAR SI EL BOT DE PASOS ESTÁ ACTIVO PARA ESTA EMPRESA
    const configBot = await ConfiguracionBotModel.findOne({ empresaId });
    
    if (!configBot || !configBot.activo) {
      console.log(`⏭️ [MenuPrincipal] Bot de pasos desactivado para ${empresaId}, no activar`);
      return false;
    }
    
    // 🏟️ NO activar para empresas de tipo "canchas" (tienen su propio flujo)
    try {
      const { ConfiguracionModuloModel } = await import('../modules/calendar/models/ConfiguracionModulo.js');
      const configModulo = await ConfiguracionModuloModel.findOne({ empresaId });
      console.log(`🔍 [MenuPrincipal] Verificando tipoNegocio para ${empresaId}: ${configModulo?.tipoNegocio}`);
      if (configModulo?.tipoNegocio === 'canchas') {
        console.log(`⏭️ [MenuPrincipal] Empresa ${empresaId} es de tipo canchas, usar workflow de API`);
        return false;
      }
    } catch (err) {
      console.error(`❌ [MenuPrincipal] Error verificando tipoNegocio:`, err);
    }
    
    // Detectar intención de interactuar con el bot
    const keywords = [
      'hola', 'menu', 'menú', 'opciones', 'ayuda',
      'turno', 'reserva', 'reservar', 'agendar',
      'consulta', 'consultar', 'ver', 'mis turnos',
      'cancelar', 'cancelación', 'eliminar'
    ];
    
    // SOLO activar si es un saludo o palabra clave
    // NO activar con números solos (pueden ser respuestas a otros flujos)
    const esIntencion = keywords.some(kw => mensajeLower.includes(kw));
    
    console.log(`🔍 [MenuPrincipal] shouldActivate para ${empresaId}: ${esIntencion} (bot activo: ${configBot.activo})`);
    
    return esIntencion;
  },
  
  async start(context: FlowContext): Promise<FlowResult> {
    const { telefono, empresaId } = context;
    
    console.log(`📋 [MenuPrincipal] Iniciando flujo para ${telefono}`);
    
    try {
      // Obtener configuración del bot
      const configBot = await ConfiguracionBotModel.findOne({ empresaId });
      
      // Si hay mensaje de bienvenida personalizado, usarlo completo
      // Si no, usar el mensaje por defecto
      const mensajeMenu = configBot?.mensajeBienvenida || 
        '¡Hola! 👋\n\n¿En qué puedo ayudarte?\n\n1️⃣ Reservar turno\n2️⃣ Consultar mis turnos\n3️⃣ Cancelar turno\n\nRespondé con el número de la opción.';
      
      await enviarMensajeWhatsAppTexto(telefono, mensajeMenu, context.phoneNumberId);
      
      return {
        success: true,
        nextState: 'esperando_opcion',
        data: {},
        response: mensajeMenu
      };
    } catch (error) {
      console.error('❌ Error iniciando menú principal:', error);
      return {
        success: false,
        error: String(error)
      };
    }
  },
  
  async onInput(context: FlowContext, state: string, data: Record<string, any>): Promise<FlowResult> {
    const { telefono, mensaje, empresaId } = context;
    
    console.log(`📥 [MenuPrincipal] Estado: ${state}, Mensaje: ${mensaje}`);
    
    if (state === 'esperando_opcion') {
      const opcion = mensaje.trim();
      
      switch (opcion) {
        case '1':
          // Reservar turno
          return await iniciarReserva(context);
          
        case '2':
          // Consultar turnos
          return await consultarTurnos(context);
          
        case '3':
          // Cancelar turno
          return await iniciarCancelacion(context);
          
        default:
          await enviarMensajeWhatsAppTexto(
            telefono,
            'Por favor, respondé con 1, 2 o 3 según la opción que desees.',
            context.phoneNumberId
          );
          return {
            success: true,
            nextState: 'esperando_opcion',
            data
          };
      }
    }
    
    // Estados de reserva - Captura dinámica de campos
    if (state === 'reserva_capturando_campos') {
      const campos = data.campos || [];
      const indiceCampo = data.indiceCampo || 0;
      const datosCapturados = data.datosCapturados || {};
      
      if (indiceCampo >= campos.length) {
        // Todos los campos capturados, crear turno
        return await crearTurnoConDatos(context, datosCapturados);
      }
      
      const campoActual = campos[indiceCampo];
      const valor = mensaje.trim();
      
      // Validar según tipo de campo
      if (campoActual.tipo === 'numero') {
        const num = parseInt(valor);
        if (isNaN(num) || (campoActual.validacion?.min && num < campoActual.validacion.min) || (campoActual.validacion?.max && num > campoActual.validacion.max)) {
          await enviarMensajeWhatsAppTexto(
            telefono,
            `❌ Por favor, ingresá un número válido${campoActual.validacion ? ` (entre ${campoActual.validacion.min} y ${campoActual.validacion.max})` : ''}.`,
            context.phoneNumberId
          );
          return {
            success: true,
            nextState: 'reserva_capturando_campos',
            data
          };
        }
      }
      
      if (campoActual.tipo === 'fecha') {
        // Validar formato DD/MM/AAAA
        const match = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (!match) {
          await enviarMensajeWhatsAppTexto(
            telefono,
            '❌ Formato de fecha inválido. Por favor, usá DD/MM/AAAA (ejemplo: 25/01/2026).',
            context.phoneNumberId
          );
          return {
            success: true,
            nextState: 'reserva_capturando_campos',
            data
          };
        }
      }
      
      // Guardar valor
      datosCapturados[campoActual.clave] = valor;
      
      // Pasar al siguiente campo
      const siguienteIndice = indiceCampo + 1;
      
      if (siguienteIndice >= campos.length) {
        // Mostrar resumen y confirmar
        let resumen = '📋 *Resumen de tu reserva:*\n\n';
        campos.forEach((campo: any) => {
          const val = datosCapturados[campo.clave];
          if (val) {
            resumen += `• ${campo.etiqueta}: ${val}\n`;
          }
        });
        resumen += '\n¿Confirmas estos datos?\n';
        resumen += '1️⃣ Sí, confirmar\n';
        resumen += '2️⃣ No, cancelar';
        
        await enviarMensajeWhatsAppTexto(telefono, resumen, context.phoneNumberId);
        
        return {
          success: true,
          nextState: 'reserva_confirmando',
          data: { ...data, datosCapturados, indiceCampo: siguienteIndice }
        };
      }
      
      // Solicitar siguiente campo
      const siguienteCampo = campos[siguienteIndice];
      let mensajeSiguiente = `📝 ${siguienteCampo.etiqueta}`;
      if (siguienteCampo.requerido) mensajeSiguiente += ' *';
      if (siguienteCampo.placeholder) mensajeSiguiente += `\n💡 ${siguienteCampo.placeholder}`;
      
      await enviarMensajeWhatsAppTexto(telefono, mensajeSiguiente, context.phoneNumberId);
      
      return {
        success: true,
        nextState: 'reserva_capturando_campos',
        data: { ...data, datosCapturados, indiceCampo: siguienteIndice }
      };
    }
    
    if (state === 'reserva_confirmando') {
      const opcion = mensaje.trim();
      
      if (opcion === '1') {
        // Confirmar y crear turno
        return await crearTurnoConDatos(context, data.datosCapturados);
      } else if (opcion === '2') {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Reserva cancelada.\n\nEscribí "menu" para volver al menú principal.',
          context.phoneNumberId
        );
        return {
          success: true,
          end: true
        };
      } else {
        await enviarMensajeWhatsAppTexto(
          telefono,
          'Por favor, respondé 1 para confirmar o 2 para cancelar.',
          context.phoneNumberId
        );
        return {
          success: true,
          nextState: 'reserva_confirmando',
          data
        };
      }
    }
    
    // DEPRECATED - Mantener por compatibilidad pero no usar
    if (state === 'reserva_esperando_hora') {
      // Este estado ya no se usa, redirigir al nuevo flujo
      await enviarMensajeWhatsAppTexto(
        telefono,
        'Por favor, escribí "menu" para empezar de nuevo.',
        context.phoneNumberId
      );
      return {
        success: true,
        end: true
      };
    }
    
    // DEPRECATED - Código antiguo comentado
    if (false) {
      const horaTexto = mensaje.trim();
      
      // Intentar parsear hora en diferentes formatos
      let match = horaTexto.match(/^(\d{1,2}):(\d{2})$/);
      if (!match) {
        // Intentar formato sin dos puntos (ej: 1230 -> 12:30)
        match = horaTexto.match(/^(\d{2})(\d{2})$/);
      }
      
      if (!match) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Formato de hora inválido. Por favor, usá HH:MM (ejemplo: 14:30 o 1430).',
          context.phoneNumberId
        );
        return {
          success: true,
          nextState: 'reserva_esperando_hora',
          data
        };
      }
      
      const [, horaStr, minutoStr] = match;
      const hora = parseInt(horaStr);
      const minuto = parseInt(minutoStr);
      
      if (hora < 0 || hora > 23 || minuto < 0 || minuto > 59) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Hora inválida. La hora debe estar entre 00:00 y 23:59.',
          context.phoneNumberId
        );
        return {
          success: true,
          nextState: 'reserva_esperando_hora',
          data
        };
      }
      
      // Crear turno en la BD
      try {
        console.log('🔍 [Reserva] Buscando o creando contacto:', { telefono, empresaId });
        
        // ✅ SISTEMA UNIFICADO: buscarOCrearContacto
        const contacto = await buscarOCrearContacto({
          telefono,
          profileName: context.profileName || 'Cliente WhatsApp',
          empresaId
        });
        
        console.log('✅ [Reserva] Contacto encontrado/creado:', {
          id: contacto._id,
          nombre: contacto.nombre,
          apellido: contacto.apellido
        });
        
        // Buscar un agente activo para asignar el turno
        console.log('🔍 [Reserva] Buscando agente activo para:', empresaId);
        const agente = await AgenteModel.findOne({
          empresaId,
          activo: true
        });
        
        if (!agente) {
          console.error('❌ [Reserva] No hay agentes activos');
          await enviarMensajeWhatsAppTexto(
            telefono,
            '❌ No hay agentes disponibles en este momento. Por favor, intentá más tarde.',
            context.phoneNumberId
          );
          return {
            success: true,
            end: true
          };
        }
        
        console.log('✅ [Reserva] Agente encontrado:', agente._id);
        
        // Crear fecha en zona horaria local (el servidor debe estar en Argentina)
        let dia: number, mes: number, anio: number;
        
        if (data.fecha instanceof Date) {
          // Si ya es un Date (ej: "mañana", "hoy")
          dia = data.fecha.getDate();
          mes = data.fecha.getMonth() + 1; // getMonth() retorna 0-11
          anio = data.fecha.getFullYear();
        } else {
          // Si es string en formato DD/MM/YYYY
          const fechaStr = data.fecha.toString();
          const partes = fechaStr.split('/');
          dia = parseInt(partes[0]);
          mes = parseInt(partes[1]);
          anio = parseInt(partes[2]);
        }
        
        // IMPORTANTE: El usuario ingresa hora de Argentina, guardamos tal cual en UTC
        // Usamos Date.UTC para crear la fecha directamente en UTC sin conversiones
        // Ejemplo: Usuario dice "21:45" → Guardamos como 21:45 UTC → Al leer con getUTCHours() muestra 21:45
        const fechaInicio = new Date(Date.UTC(anio, mes - 1, dia, hora, minuto, 0, 0));
        
        const fechaFin = new Date(fechaInicio);
        fechaFin.setMinutes(fechaFin.getMinutes() + 30); // Duración por defecto: 30 min
        
        console.log('🕐 [Reserva] Fecha creada:', {
          horaIngresada: `${hora}:${minuto}`,
          fechaInicioUTC: fechaInicio.toISOString(),
          año: anio,
          mes: mes,
          dia: dia
        });
        
        console.log('📝 [Reserva] Creando turno con datos:', {
          empresaId,
          agenteId: agente._id,
          clienteId: contacto._id.toString(),
          fechaInicio,
          fechaFin,
          datos: {
            origen: data.origen,
            destino: data.destino,
            pasajeros: data.pasajeros
          }
        });
        
        const nuevoTurno = await TurnoModel.create({
          empresaId,
          agenteId: agente._id,
          clienteId: contacto._id.toString(),
          fechaInicio,
          fechaFin,
          duracion: 30,
          estado: 'pendiente',
          tipoReserva: 'viaje',
          datos: {
            origen: data.origen,
            destino: data.destino,
            pasajeros: data.pasajeros
          },
          notas: 'Reservado vía WhatsApp',
          creadoPor: 'bot'
        });
        
        console.log('✅ Turno creado:', nuevoTurno._id);
        
        const fechaFormateada = fechaInicio.toLocaleDateString('es-AR');
        const horaFormateada = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
        
        await enviarMensajeWhatsAppTexto(
          telefono,
          `✅ Viaje reservado exitosamente\n\n📍 Origen: ${data.origen}\n📍 Destino: ${data.destino}\n👥 Pasajeros: ${data.pasajeros}\n📅 Fecha: ${fechaFormateada}\n🕐 Hora: ${horaFormateada}\n\nEscribí "menu" para volver al menú principal.`,
          context.phoneNumberId
        );
        
        return {
          success: true,
          end: true
        };
      } catch (error: any) {
        console.error('❌ [Reserva] Error creando turno:', error);
        console.error('❌ [Reserva] Error stack:', error.stack);
        console.error('❌ [Reserva] Error message:', error.message);
        
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Hubo un error al crear el turno. Por favor, intentá ingresar la hora nuevamente.\n\n¿A qué hora querés el turno? (formato HH:MM, ejemplo: 14:30)',
          context.phoneNumberId
        );
        return {
          success: true,
          nextState: 'reserva_esperando_hora',
          data
        };
      }
    }
    
    // Estados de cancelación
    if (state === 'cancelacion_esperando_seleccion') {
      const turnoIndex = parseInt(mensaje) - 1;
      const turnos = data.turnos || [];
      
      if (turnoIndex >= 0 && turnoIndex < turnos.length) {
        const turno = turnos[turnoIndex];
        
        // Cancelar turno
        await TurnoModel.findByIdAndUpdate(turno._id, {
          estado: 'cancelado',
          canceladoEn: new Date()
        });
        
        await enviarMensajeWhatsAppTexto(
          telefono,
          `✅ Turno cancelado exitosamente.\n\nEscribí "menu" para volver al menú principal.`,
          context.phoneNumberId
        );
        
        return {
          success: true,
          end: true
        };
      } else {
        await enviarMensajeWhatsAppTexto(
          telefono,
          'Número de turno inválido. Por favor, elegí un número de la lista.',
          context.phoneNumberId
        );
        return {
          success: true,
          nextState: 'cancelacion_esperando_seleccion',
          data
        };
      }
    }
    
    return {
      success: false,
      error: 'Estado no reconocido'
    };
  },
  
  async onEnd(context: FlowContext, data: Record<string, any>): Promise<void> {
    console.log(`✅ [MenuPrincipal] Flujo finalizado para ${context.telefono}`);
  }
};

/**
 * Crear turno con datos capturados dinámicamente
 */
async function crearTurnoConDatos(context: FlowContext, datosCapturados: Record<string, any>): Promise<FlowResult> {
  const { telefono, empresaId } = context;
  
  try {
    // Buscar o crear contacto
    const contacto = await buscarOCrearContacto({
      telefono,
      profileName: context.profileName || 'Cliente WhatsApp',
      empresaId
    });
    
    console.log('✅ [Reserva] Contacto encontrado/creado:', contacto._id);
    
    // Buscar agente activo (o usar el asignado al cliente)
    let agenteId;
    if (contacto.agentesAsignados && contacto.agentesAsignados.length > 0) {
      agenteId = contacto.agentesAsignados[0];
      console.log('✅ [Reserva] Usando agente asignado al cliente:', agenteId);
    } else {
      const agente = await AgenteModel.findOne({ empresaId, activo: true });
      if (!agente) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ No hay agentes disponibles. Por favor, intentá más tarde.',
          context.phoneNumberId
        );
        return { success: true, end: true };
      }
      agenteId = agente._id;
      console.log('✅ [Reserva] Usando primer agente activo:', agenteId);
    }
    
    // Parsear fecha si existe en los datos
    let fechaInicio: Date;
    if (datosCapturados.fecha) {
      const match = datosCapturados.fecha.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        const [, dia, mes, anio] = match;
        fechaInicio = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia), 10, 0, 0, 0);
      } else {
        fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() + 1);
        fechaInicio.setHours(10, 0, 0, 0);
      }
    } else {
      fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() + 1);
      fechaInicio.setHours(10, 0, 0, 0);
    }
    
    const fechaFin = new Date(fechaInicio);
    fechaFin.setMinutes(fechaFin.getMinutes() + 30);
    
    // Crear turno
    const nuevoTurno = await TurnoModel.create({
      empresaId,
      agenteId,
      clienteId: contacto._id.toString(),
      fechaInicio,
      fechaFin,
      duracion: 30,
      estado: 'pendiente',
      tipoReserva: 'viaje',
      datos: datosCapturados,
      notas: 'Reservado vía WhatsApp - Datos simplificados',
      creadoPor: 'bot'
    });
    
    console.log('✅ Turno creado:', nuevoTurno._id);
    
    // Cargar config para mensaje personalizado
    const { ConfiguracionModuloModel } = await import('../modules/calendar/models/ConfiguracionModulo.js');
    const config = await ConfiguracionModuloModel.findOne({ empresaId });
    
    let mensaje = '✅ *¡Reserva confirmada!*\n\n';
    
    // Mostrar datos capturados
    if (config?.camposPersonalizados) {
      config.camposPersonalizados.forEach((campo: any) => {
        const valor = datosCapturados[campo.clave];
        if (valor) {
          mensaje += `• ${campo.etiqueta}: ${valor}\n`;
        }
      });
    }
    
    const mensajeDatosIncompletos = (config?.mensajesFlujo as any)?.datosIncompletos || '';
    mensaje += `\n${mensajeDatosIncompletos}`;
    mensaje += '\n\nEscribí "menu" para volver al menú principal.';
    
    await enviarMensajeWhatsAppTexto(telefono, mensaje, context.phoneNumberId);
    
    return {
      success: true,
      end: true
    };
  } catch (error) {
    console.error('❌ Error creando turno:', error);
    await enviarMensajeWhatsAppTexto(
      telefono,
      '❌ Hubo un error al crear la reserva. Por favor, intentá de nuevo más tarde.',
      context.phoneNumberId
    );
    return {
      success: true,
      end: true
    };
  }
}

/**
 * Iniciar proceso de reserva
 */
async function iniciarReserva(context: FlowContext): Promise<FlowResult> {
  const { empresaId } = context;
  
  // Cargar configuración de campos personalizados
  const { ConfiguracionModuloModel } = await import('../modules/calendar/models/ConfiguracionModulo.js');
  const config = await ConfiguracionModuloModel.findOne({ empresaId });
  const campos = config?.camposPersonalizados || [];
  
  if (campos.length === 0) {
    await enviarMensajeWhatsAppTexto(
      context.telefono,
      '❌ No hay campos configurados para reservas. Contactá al administrador.',
      context.phoneNumberId
    );
    return {
      success: true,
      end: true
    };
  }
  
  // Solicitar primer campo
  const primerCampo = campos[0];
  let mensaje = `📝 ${primerCampo.etiqueta}`;
  if (primerCampo.requerido) mensaje += ' *';
  if (primerCampo.placeholder) mensaje += `\n💡 ${primerCampo.placeholder}`;
  
  await enviarMensajeWhatsAppTexto(
    context.telefono,
    mensaje,
    context.phoneNumberId
  );
  
  return {
    success: true,
    nextState: 'reserva_capturando_campos',
    data: { 
      campos,
      indiceCampo: 0,
      datosCapturados: {}
    }
  };
}

/**
 * Consultar turnos del usuario
 */
async function consultarTurnos(context: FlowContext): Promise<FlowResult> {
  const { telefono, empresaId } = context;
  
  try {
    // ✅ Buscar o crear contacto usando servicio unificado
    const contacto = await buscarOCrearContacto({
      telefono,
      profileName: context.profileName || 'Cliente WhatsApp',
      empresaId
    });
    
    console.log('✅ [Consulta] Contacto obtenido:', {
      id: contacto._id,
      nombre: contacto.nombre,
      telefono: contacto.telefono
    });
    
    // Buscar turnos activos
    const turnos = await TurnoModel.find({
      clienteId: contacto._id.toString(),
      empresaId,
      estado: { $in: ['pendiente', 'confirmado'] },
      fechaInicio: { $gte: new Date() }
    }).sort({ fechaInicio: 1 }).limit(10);
    
    if (turnos.length === 0) {
      await enviarMensajeWhatsAppTexto(
        telefono,
        'No tenés turnos próximos.\n\nEscribí "menu" para volver al menú principal.',
        context.phoneNumberId
      );
      return {
        success: true,
        end: true
      };
    }
    
    // Construir mensaje con turnos
    let mensaje = '📅 Tus próximos viajes:\n\n';
    turnos.forEach((turno, index) => {
      const fecha = new Date(turno.fechaInicio).toLocaleDateString('es-AR');
      const hora = new Date(turno.fechaInicio).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      const origen = turno.datos?.origen || 'No especificado';
      const destino = turno.datos?.destino || 'No especificado';
      const estado = turno.estado === 'confirmado' ? '✅' : '⏳';
      
      mensaje += `${index + 1}. ${estado} ${fecha} - ${hora}\n`;
      mensaje += `   📍 ${origen} → ${destino}\n\n`;
    });
    mensaje += 'Escribí "menu" para volver al menú principal.';
    
    await enviarMensajeWhatsAppTexto(telefono, mensaje, context.phoneNumberId);
    
    return {
      success: true,
      end: true
    };
  } catch (error) {
    console.error('❌ Error consultando turnos:', error);
    await enviarMensajeWhatsAppTexto(
      telefono,
      'Hubo un error al consultar tus turnos. Por favor, intentá de nuevo más tarde.',
      context.phoneNumberId
    );
    return {
      success: true,
      end: true
    };
  }
}

/**
 * Iniciar proceso de cancelación
 */
async function iniciarCancelacion(context: FlowContext): Promise<FlowResult> {
  const { telefono, empresaId } = context;
  
  try {
    // ✅ Buscar o crear contacto usando servicio unificado
    const contacto = await buscarOCrearContacto({
      telefono,
      profileName: context.profileName || 'Cliente WhatsApp',
      empresaId
    });
    
    console.log('✅ [Cancelar] Contacto obtenido:', {
      id: contacto._id,
      nombre: contacto.nombre,
      telefono: contacto.telefono
    });
    
    // Buscar turnos activos
    const turnos = await TurnoModel.find({
      clienteId: contacto._id.toString(),
      empresaId,
      estado: { $in: ['pendiente', 'confirmado'] },
      fechaInicio: { $gte: new Date() }
    }).sort({ fechaInicio: 1 }).limit(10);
    
    if (turnos.length === 0) {
      await enviarMensajeWhatsAppTexto(
        telefono,
        'No tenés turnos para cancelar.\n\nEscribí "menu" para volver al menú principal.',
        context.phoneNumberId
      );
      return {
        success: true,
        end: true
      };
    }
    
    // Construir mensaje con turnos
    let mensaje = '❌ ¿Qué turno querés cancelar?\n\n';
    turnos.forEach((turno, index) => {
      const fecha = new Date(turno.fechaInicio).toLocaleDateString('es-AR');
      const hora = new Date(turno.fechaInicio).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      mensaje += `${index + 1}. ${fecha} a las ${hora}\n`;
    });
    mensaje += '\nRespondé con el número del turno que querés cancelar.';
    
    await enviarMensajeWhatsAppTexto(telefono, mensaje, context.phoneNumberId);
    
    return {
      success: true,
      nextState: 'cancelacion_esperando_seleccion',
      data: { turnos: turnos.map(t => ({ _id: t._id })) }
    };
  } catch (error) {
    console.error('❌ Error iniciando cancelación:', error);
    await enviarMensajeWhatsAppTexto(
      telefono,
      'Hubo un error. Por favor, intentá de nuevo más tarde.',
      context.phoneNumberId
    );
    return {
      success: true,
      end: true
    };
  }
}
