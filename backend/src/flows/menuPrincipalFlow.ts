// 📋 Flujo de Menú Principal - Reserva/Consulta/Cancelación
import type { Flow, FlowContext, FlowResult } from './types.js';
import { enviarMensajeWhatsAppTexto, enviarMensajeConBotones } from '../services/metaService.js';
import { ConfiguracionBotModel } from '../modules/calendar/models/ConfiguracionBot.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { AgenteModel } from '../modules/calendar/models/Agente.js';
import { buscarOCrearContacto, incrementarTurnos } from '../services/contactoService.js';

export const menuPrincipalFlow: Flow = {
  name: 'menu_principal',
  priority: 'normal',
  version: '1.0.0',
  
  async shouldActivate(context: FlowContext): Promise<boolean> {
    const { mensaje } = context;
    const mensajeLower = mensaje.toLowerCase().trim();
    
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
        data: {}
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
    
    // Estados de reserva
    if (state === 'reserva_esperando_origen') {
      const origen = mensaje.trim();
      
      if (origen.length < 2) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Por favor, ingresá un origen válido.',
          context.phoneNumberId
        );
        return {
          success: true,
          nextState: 'reserva_esperando_origen',
          data
        };
      }
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        '📍 ¿A dónde vas? (Destino del viaje)',
        context.phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'reserva_esperando_destino',
        data: { ...data, origen }
      };
    }
    
    if (state === 'reserva_esperando_destino') {
      const destino = mensaje.trim();
      
      if (destino.length < 2) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Por favor, ingresá un destino válido.',
          context.phoneNumberId
        );
        return {
          success: true,
          nextState: 'reserva_esperando_destino',
          data
        };
      }
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        '👥 ¿Cuántos pasajeros son? (Ingresá un número)',
        context.phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'reserva_esperando_pasajeros',
        data: { ...data, destino }
      };
    }
    
    if (state === 'reserva_esperando_pasajeros') {
      const pasajeros = parseInt(mensaje.trim());
      
      if (isNaN(pasajeros) || pasajeros < 1 || pasajeros > 50) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Por favor, ingresá un número válido de pasajeros (entre 1 y 50).',
          context.phoneNumberId
        );
        return {
          success: true,
          nextState: 'reserva_esperando_pasajeros',
          data
        };
      }
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        '📅 ¿Para qué día querés reservar? (formato DD/MM/AAAA o "hoy", "mañana")',
        context.phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'reserva_esperando_fecha',
        data: { ...data, pasajeros }
      };
    }
    
    if (state === 'reserva_esperando_fecha') {
      const fechaTexto = mensaje.trim().toLowerCase();
      let fecha: Date;
      
      // Procesar fecha
      if (fechaTexto === 'hoy') {
        fecha = new Date();
      } else if (fechaTexto === 'mañana' || fechaTexto === 'manana') {
        fecha = new Date();
        fecha.setDate(fecha.getDate() + 1);
      } else {
        // Intentar parsear DD/MM/AAAA
        const match = fechaTexto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (!match) {
          await enviarMensajeWhatsAppTexto(
            telefono,
            '❌ Formato de fecha inválido. Por favor, usá DD/MM/AAAA o escribí "hoy" o "mañana".',
            context.phoneNumberId
          );
          return {
            success: true,
            nextState: 'reserva_esperando_fecha',
            data
          };
        }
        
        const [, dia, mes, anio] = match;
        fecha = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
        
        if (isNaN(fecha.getTime())) {
          await enviarMensajeWhatsAppTexto(
            telefono,
            '❌ Fecha inválida. Por favor, verificá el formato DD/MM/AAAA.',
            context.phoneNumberId
          );
          return {
            success: true,
            nextState: 'reserva_esperando_fecha',
            data
          };
        }
      }
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        '¿A qué hora querés el turno? (formato HH:MM, ejemplo: 14:30)',
        context.phoneNumberId
      );
      return {
        success: true,
        nextState: 'reserva_esperando_hora',
        data: { ...data, fecha, fechaTexto: mensaje }
      };
    }
    
    if (state === 'reserva_esperando_hora') {
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
        
        const fechaInicio = new Date(data.fecha);
        fechaInicio.setHours(hora, minuto, 0, 0);
        
        const fechaFin = new Date(fechaInicio);
        fechaFin.setMinutes(fechaFin.getMinutes() + 30); // Duración por defecto: 30 min
        
        console.log('📝 [Reserva] Creando turno con datos:', {
          empresaId,
          agenteId: agente._id,
          contactoId: contacto._id.toString(),
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
          contactoId: contacto._id.toString(),
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
 * Iniciar proceso de reserva
 */
async function iniciarReserva(context: FlowContext): Promise<FlowResult> {
  await enviarMensajeWhatsAppTexto(
    context.telefono,
    '📍 ¿Desde dónde salís? (Origen del viaje)',
    context.phoneNumberId
  );
  
  return {
    success: true,
    nextState: 'reserva_esperando_origen',
    data: {}
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
      contactoId: contacto._id.toString(),
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
    let mensaje = '📅 Tus próximos turnos:\n\n';
    turnos.forEach((turno, index) => {
      const fecha = new Date(turno.fechaInicio).toLocaleDateString('es-AR');
      const hora = new Date(turno.fechaInicio).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      mensaje += `${index + 1}. ${fecha} a las ${hora}\n`;
    });
    mensaje += '\nEscribí "menu" para volver al menú principal.';
    
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
      contactoId: contacto._id.toString(),
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
