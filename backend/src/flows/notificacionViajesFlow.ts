// 🚗 Flujo de Notificaciones de Viajes
import type { Flow, FlowContext, FlowResult } from './types.js';
import { enviarMensajeWhatsAppTexto } from '../services/metaService.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';

export const notificacionViajesFlow: Flow = {
  name: 'notificacion_viajes',
  priority: 'urgente',
  version: '1.0.0',
  
  async shouldActivate(context: FlowContext): Promise<boolean> {
    // Este flujo se activa programáticamente desde notificaciones
    // O cuando el usuario responde a una notificación de viajes
    
    // Detectar si es respuesta a notificación (números 1 o 2)
    const mensaje = context.mensaje.trim();
    
    // Solo activar si es exactamente "1" o "2" y NO hay otro flujo activo
    // Esto se manejará mejor en el FlowManager
    return false; // Se activa programáticamente
  },
  
  async start(context: FlowContext): Promise<FlowResult> {
    const { telefono, data } = context;
    
    console.log(`🚗 [NotificacionViajes] Iniciando flujo para ${telefono}`);
    
    if (!data?.viajes || data.viajes.length === 0) {
      return {
        success: false,
        error: 'No se proporcionaron viajes'
      };
    }
    
    // El mensaje ya fue enviado por el servicio de notificaciones
    // Solo guardamos el estado
    return {
      success: true,
      nextState: 'esperando_opcion_inicial',
      data: {
        viajes: data.viajes
      }
    };
  },
  
  async onInput(context: FlowContext, state: string, data: Record<string, any>): Promise<FlowResult> {
    const { telefono, mensaje, empresaId } = context;
    const mensajeTrim = mensaje.trim();
    
    console.log(`📥 [NotificacionViajes] Estado: ${state}, Mensaje: ${mensajeTrim}`);
    
    if (state === 'esperando_opcion_inicial') {
      if (mensajeTrim === '1') {
        // Confirmar todos los viajes
        const viajes = data.viajes || [];
        
        // Actualizar todos los turnos a confirmado
        for (const viaje of viajes) {
          await TurnoModel.findByIdAndUpdate(viaje._id, {
            estado: 'confirmado',
            confirmadoEn: new Date()
          });
        }
        
        await enviarMensajeWhatsAppTexto(
          telefono,
          '✅ ¡Perfecto! Todos tus viajes han sido confirmados. Te esperamos mañana.',
          context.phoneNumberId
        );
        
        return {
          success: true,
          end: true
        };
      }
      
      if (mensajeTrim === '2') {
        // Editar un viaje específico
        const viajes = data.viajes || [];
        
        let mensaje = '¿Qué viaje querés editar?\n\n';
        viajes.forEach((viaje: any, index: number) => {
          mensaje += `${index + 1}. ${viaje.origen} → ${viaje.destino} (${viaje.horario})\n`;
        });
        mensaje += '\nRespondé con el número del viaje.';
        
        await enviarMensajeWhatsAppTexto(telefono, mensaje, context.phoneNumberId);
        
        return {
          success: true,
          nextState: 'esperando_seleccion_viaje',
          data
        };
      }
      
      // Respuesta no válida
      await enviarMensajeWhatsAppTexto(
        telefono,
        'Por favor, respondé con 1 para confirmar todos o 2 para editar un viaje.',
        context.phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'esperando_opcion_inicial',
        data
      };
    }
    
    if (state === 'esperando_seleccion_viaje') {
      const viajeIndex = parseInt(mensajeTrim) - 1;
      const viajes = data.viajes || [];
      
      if (viajeIndex >= 0 && viajeIndex < viajes.length) {
        const viaje = viajes[viajeIndex];
        
        const mensaje = `Viaje seleccionado:\n📍 ${viaje.origen} → ${viaje.destino}\n🕐 ${viaje.horario}\n\n¿Qué querés modificar?\n\n1️⃣ Origen\n2️⃣ Destino\n3️⃣ Horario\n4️⃣ Cancelar este viaje\n\nRespondé con el número.`;
        
        await enviarMensajeWhatsAppTexto(telefono, mensaje, context.phoneNumberId);
        
        return {
          success: true,
          nextState: 'esperando_tipo_modificacion',
          data: {
            ...data,
            viajeSeleccionado: viaje,
            viajeIndex
          }
        };
      } else {
        await enviarMensajeWhatsAppTexto(
          telefono,
          'Número de viaje inválido. Por favor, elegí un número de la lista.',
          context.phoneNumberId
        );
        return {
          success: true,
          nextState: 'esperando_seleccion_viaje',
          data
        };
      }
    }
    
    if (state === 'esperando_tipo_modificacion') {
      const viaje = data.viajeSeleccionado;
      
      switch (mensajeTrim) {
        case '1':
          await enviarMensajeWhatsAppTexto(
            telefono,
            '📍 ¿Cuál es el nuevo origen?',
            context.phoneNumberId
          );
          return {
            success: true,
            nextState: 'esperando_nuevo_origen',
            data
          };
          
        case '2':
          await enviarMensajeWhatsAppTexto(
            telefono,
            '📍 ¿Cuál es el nuevo destino?',
            context.phoneNumberId
          );
          return {
            success: true,
            nextState: 'esperando_nuevo_destino',
            data
          };
          
        case '3':
          await enviarMensajeWhatsAppTexto(
            telefono,
            '🕐 ¿Cuál es el nuevo horario? (formato HH:MM)',
            context.phoneNumberId
          );
          return {
            success: true,
            nextState: 'esperando_nuevo_horario',
            data
          };
          
        case '4':
          // Cancelar viaje
          await TurnoModel.findByIdAndUpdate(viaje._id, {
            estado: 'cancelado',
            canceladoEn: new Date()
          });
          
          await enviarMensajeWhatsAppTexto(
            telefono,
            '✅ Viaje cancelado exitosamente.',
            context.phoneNumberId
          );
          
          return {
            success: true,
            end: true
          };
          
        default:
          await enviarMensajeWhatsAppTexto(
            telefono,
            'Por favor, respondé con un número del 1 al 4.',
            context.phoneNumberId
          );
          return {
            success: true,
            nextState: 'esperando_tipo_modificacion',
            data
          };
      }
    }
    
    if (state === 'esperando_nuevo_origen') {
      const viaje = data.viajeSeleccionado;
      
      // Actualizar origen
      await TurnoModel.findByIdAndUpdate(viaje._id, {
        'datos.origin': mensajeTrim
      });
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        `✅ Origen actualizado a: ${mensajeTrim}\n\n¿Querés hacer otra modificación?\n\n1️⃣ Sí\n2️⃣ No, confirmar cambios`,
        context.phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'esperando_confirmacion_final',
        data
      };
    }
    
    if (state === 'esperando_nuevo_destino') {
      const viaje = data.viajeSeleccionado;
      
      // Actualizar destino
      await TurnoModel.findByIdAndUpdate(viaje._id, {
        'datos.destination': mensajeTrim
      });
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        `✅ Destino actualizado a: ${mensajeTrim}\n\n¿Querés hacer otra modificación?\n\n1️⃣ Sí\n2️⃣ No, confirmar cambios`,
        context.phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'esperando_confirmacion_final',
        data
      };
    }
    
    if (state === 'esperando_nuevo_horario') {
      const viaje = data.viajeSeleccionado;
      
      // Actualizar horario
      // TODO: Parsear horario y actualizar fechaInicio
      await enviarMensajeWhatsAppTexto(
        telefono,
        `✅ Horario actualizado a: ${mensajeTrim}\n\n¿Querés hacer otra modificación?\n\n1️⃣ Sí\n2️⃣ No, confirmar cambios`,
        context.phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'esperando_confirmacion_final',
        data
      };
    }
    
    if (state === 'esperando_confirmacion_final') {
      if (mensajeTrim === '1') {
        // Volver a seleccionar viaje
        const viajes = data.viajes || [];
        
        let mensaje = '¿Qué viaje querés editar?\n\n';
        viajes.forEach((viaje: any, index: number) => {
          mensaje += `${index + 1}. ${viaje.origen} → ${viaje.destino} (${viaje.horario})\n`;
        });
        mensaje += '\nRespondé con el número del viaje.';
        
        await enviarMensajeWhatsAppTexto(telefono, mensaje, context.phoneNumberId);
        
        return {
          success: true,
          nextState: 'esperando_seleccion_viaje',
          data
        };
      }
      
      if (mensajeTrim === '2') {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '✅ ¡Perfecto! Tus cambios han sido guardados. Te esperamos mañana.',
          context.phoneNumberId
        );
        
        return {
          success: true,
          end: true
        };
      }
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        'Por favor, respondé con 1 o 2.',
        context.phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'esperando_confirmacion_final',
        data
      };
    }
    
    return {
      success: false,
      error: 'Estado no reconocido'
    };
  },
  
  async onEnd(context: FlowContext, data: Record<string, any>): Promise<void> {
    console.log(`✅ [NotificacionViajes] Flujo finalizado para ${context.telefono}`);
  }
};
