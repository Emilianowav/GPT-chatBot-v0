// 📋 Flujo de Menú Principal - Reserva/Consulta/Cancelación
import type { Flow, FlowContext, FlowResult } from './types.js';
import { enviarMensajeWhatsAppTexto, enviarMensajeConBotones } from '../services/metaService.js';
import { ConfiguracionBotModel } from '../modules/calendar/models/ConfiguracionBot.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { ClienteModel } from '../models/Cliente.js';

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
      
      const mensajeBienvenida = configBot?.mensajeBienvenida || 
        '¡Hola! ¿En qué puedo ayudarte?';
      
      const mensajeMenu = `${mensajeBienvenida}\n\nSeleccioná una opción:\n\n1️⃣ Reservar turno\n2️⃣ Consultar mis turnos\n3️⃣ Cancelar turno\n\nRespondé con el número de la opción.`;
      
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
    if (state === 'reserva_esperando_fecha') {
      // TODO: Procesar fecha
      await enviarMensajeWhatsAppTexto(
        telefono,
        '¿A qué hora querés el turno? (formato HH:MM)',
        context.phoneNumberId
      );
      return {
        success: true,
        nextState: 'reserva_esperando_hora',
        data: { ...data, fecha: mensaje }
      };
    }
    
    if (state === 'reserva_esperando_hora') {
      // TODO: Crear turno
      await enviarMensajeWhatsAppTexto(
        telefono,
        `✅ Turno reservado para ${data.fecha} a las ${mensaje}.\n\nEscribí "menu" para volver al menú principal.`,
        context.phoneNumberId
      );
      return {
        success: true,
        end: true
      };
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
    '📅 ¿Para qué día querés reservar? (formato DD/MM/AAAA o "hoy", "mañana")',
    context.phoneNumberId
  );
  
  return {
    success: true,
    nextState: 'reserva_esperando_fecha',
    data: {}
  };
}

/**
 * Consultar turnos del usuario
 */
async function consultarTurnos(context: FlowContext): Promise<FlowResult> {
  const { telefono, empresaId } = context;
  
  try {
    // Buscar cliente
    const cliente = await ClienteModel.findOne({
      telefono,
      empresaId
    });
    
    if (!cliente) {
      await enviarMensajeWhatsAppTexto(
        telefono,
        'No tenés turnos registrados.\n\nEscribí "menu" para volver al menú principal.',
        context.phoneNumberId
      );
      return {
        success: true,
        end: true
      };
    }
    
    // Buscar turnos activos
    const turnos = await TurnoModel.find({
      clienteId: cliente._id.toString(),
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
    // Buscar cliente
    const cliente = await ClienteModel.findOne({
      telefono,
      empresaId
    });
    
    if (!cliente) {
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
    
    // Buscar turnos activos
    const turnos = await TurnoModel.find({
      clienteId: cliente._id.toString(),
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
