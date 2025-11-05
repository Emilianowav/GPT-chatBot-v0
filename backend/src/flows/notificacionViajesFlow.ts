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
    console.log(`🚗 [NotificacionViajes] Data recibida:`, data);
    
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
        viajes: data.viajes,
        turnosIds: data.turnosIds || data.viajes.map((v: any) => v._id.toString())
      }
    };
  },
  
  async onInput(context: FlowContext, state: string, data: Record<string, any>): Promise<FlowResult> {
    const { telefono, mensaje, empresaId } = context;
    const mensajeTrim = mensaje.trim();
    
    console.log(`📥 [NotificacionViajes] Estado: ${state}, Mensaje: ${mensajeTrim}`);
    console.log(`📥 [NotificacionViajes] Data:`, JSON.stringify(data, null, 2));
    
    if (state === 'esperando_opcion_inicial') {
      const mensajeLower = mensajeTrim.toLowerCase();
      
      // ✅ CONFIRMAR - Detectar "1", "Confirmar", "Si", etc.
      if (mensajeTrim === '1' || /^(confirmar|si|sí|confirmo|ok|dale)$/i.test(mensajeLower)) {
        // Confirmar todos los viajes
        const viajes = data.viajes || [];
        const turnosIds = data.turnosIds || [];
        
        console.log(`✅ [NotificacionViajes] Confirmando ${viajes.length} viaje(s)`);
        console.log(`   IDs:`, turnosIds);
        
        // Actualizar todos los turnos a confirmado
        for (const turnoId of turnosIds) {
          try {
            await TurnoModel.findByIdAndUpdate(turnoId, {
              estado: 'confirmado',
              confirmadoEn: new Date()
            });
            console.log(`   ✅ Turno ${turnoId} confirmado`);
          } catch (error) {
            console.error(`   ❌ Error confirmando turno ${turnoId}:`, error);
          }
        }
        
        const mensajeConfirmacion = viajes.length === 1
          ? `✅ ¡Perfecto! Tu viaje ha sido confirmado.\n\n¡Nos vemos pronto! 🚗`
          : `✅ ¡Perfecto! Todos tus ${viajes.length} viajes han sido confirmados.\n\n¡Nos vemos pronto! 🚗`;
        
        await enviarMensajeWhatsAppTexto(
          telefono,
          mensajeConfirmacion,
          context.phoneNumberId
        );
        
        return {
          success: true,
          end: true
        };
      }
      
      // 🔧 MODIFICAR - Detectar "2", "Modificar", "Editar", etc.
      if (mensajeTrim === '2' || /^(modificar|editar|cambiar)$/i.test(mensajeLower)) {
        // Editar un viaje específico
        const viajes = data.viajes || [];
        const turnosIds = data.turnosIds || [];
        
        console.log(`🔧 [NotificacionViajes] Usuario quiere modificar`);
        console.log(`   Viajes disponibles: ${viajes.length}`);
        
        // Si hay múltiples viajes, preguntar cuál quiere modificar
        if (viajes.length > 1) {
          let mensaje = '🔧 ¿Qué viaje querés modificar?\n\n';
          viajes.forEach((viaje: any, index: number) => {
            // Formatear hora correctamente
            const fechaInicio = new Date(viaje.fechaInicio);
            const horas = String(fechaInicio.getUTCHours()).padStart(2, '0');
            const minutos = String(fechaInicio.getUTCMinutes()).padStart(2, '0');
            const hora = `${horas}:${minutos}`;
            
            const origen = viaje.datos?.origen || 'No especificado';
            const destino = viaje.datos?.destino || 'No especificado';
            
            mensaje += `${index + 1}. ${origen} → ${destino} (${hora})\n`;
          });
          mensaje += '\nRespondé con el número del viaje.';
          
          await enviarMensajeWhatsAppTexto(telefono, mensaje, context.phoneNumberId);
          
          return {
            success: true,
            nextState: 'esperando_seleccion_viaje',
            data
          };
        } else {
          // Solo un viaje, ir directo a modificar
          const turnoId = turnosIds[0];
          
          await enviarMensajeWhatsAppTexto(
            telefono,
            '🔧 ¿Qué querés modificar?\n\n1️⃣ Hora\n2️⃣ Origen\n3️⃣ Destino\n4️⃣ Pasajeros\n\nEscribí el número de la opción.',
            context.phoneNumberId
          );
          
          return {
            success: true,
            nextState: 'esperando_campo_modificar',
            data: { ...data, turnoSeleccionado: turnoId }
          };
        }
      }
      
      // Respuesta no válida
      await enviarMensajeWhatsAppTexto(
        telefono,
        'Por favor, respondé con:\n\n✅ "Confirmar" para confirmar todos\n🔧 "Modificar" para editar un viaje',
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
        
        // Formatear hora
        const fechaInicio = new Date(viaje.fechaInicio);
        const horas = String(fechaInicio.getUTCHours()).padStart(2, '0');
        const minutos = String(fechaInicio.getUTCMinutes()).padStart(2, '0');
        const hora = `${horas}:${minutos}`;
        
        let mensaje = `✏️ *Editando Viaje #${viajeIndex + 1}*\n\n`;
        mensaje += `🕐 *Hora actual:* ${hora}\n`;
        mensaje += `📍 *Origen:* ${viaje.datos?.origen || 'No especificado'}\n`;
        mensaje += `📍 *Destino:* ${viaje.datos?.destino || 'No especificado'}\n`;
        mensaje += `👥 *Cantidad de pasajeros:* ${viaje.datos?.pasajeros || '1'}\n`;
        mensaje += `🧳 *Equipaje:* ${viaje.datos?.equipaje || 'No especificado'}\n\n`;
        mensaje += `*¿Qué deseas modificar?*\n\n`;
        mensaje += `1️⃣ Cambiar hora\n`;
        mensaje += `2️⃣ Cambiar origen\n`;
        mensaje += `3️⃣ Cambiar destino\n`;
        mensaje += `4️⃣ Cambiar cantidad de pasajeros\n`;
        mensaje += `5️⃣ Cambiar equipaje\n`;
        mensaje += `6️⃣ Confirmar este viaje\n`;
        mensaje += `7️⃣ Cancelar este viaje\n`;
        mensaje += `0️⃣ Volver atrás\n\n`;
        mensaje += `Escribe el número de la opción.`;
        
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
      const viajes = data.viajes || [];
      const viajeIndex = data.viajeIndex;
      
      switch (mensajeTrim) {
        case '0':
          // Volver atrás - mostrar lista de viajes
          let mensajeVolver = '📋 *Tus viajes pendientes:*\n\n';
          viajes.forEach((v: any, i: number) => {
            const fechaV = new Date(v.fechaInicio);
            const horaV = `${String(fechaV.getUTCHours()).padStart(2, '0')}:${String(fechaV.getUTCMinutes()).padStart(2, '0')}`;
            mensajeVolver += `${i + 1}️⃣ *Viaje ${i + 1}*\n`;
            mensajeVolver += `   📍 ${v.datos?.origen || 'N/A'} → ${v.datos?.destino || 'N/A'}\n`;
            mensajeVolver += `   🕐 ${horaV}\n\n`;
          });
          mensajeVolver += '\n*¿Qué deseas hacer?*\n\n';
          mensajeVolver += `1️⃣ Confirmar ${viajes.length > 1 ? 'todos los viajes' : 'el viaje'}\n`;
          mensajeVolver += '2️⃣ Editar un viaje (escribe el número)\n';
          mensajeVolver += '0️⃣ Cancelar\n\n';
          mensajeVolver += 'Escribe el número de la opción.';
          
          await enviarMensajeWhatsAppTexto(telefono, mensajeVolver, context.phoneNumberId);
          
          return {
            success: true,
            nextState: 'esperando_opcion_inicial',
            data: { viajes }
          };
        
        case '1':
          // Cambiar hora
          await enviarMensajeWhatsAppTexto(
            telefono,
            '🕐 ¿Cuál es la nueva hora? (formato HH:MM)',
            context.phoneNumberId
          );
          return {
            success: true,
            nextState: 'esperando_nueva_hora',
            data
          };
          
        case '2':
          // Cambiar origen
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
          
        case '3':
          // Cambiar destino
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
          
        case '4':
          // Cambiar cantidad de pasajeros
          await enviarMensajeWhatsAppTexto(
            telefono,
            '👥 ¿Cuántos pasajeros serán?',
            context.phoneNumberId
          );
          return {
            success: true,
            nextState: 'esperando_nuevos_pasajeros',
            data
          };
          
        case '5':
          // Cambiar equipaje
          await enviarMensajeWhatsAppTexto(
            telefono,
            '🧳 ¿Qué tipo de equipaje llevarás? (Ej: 2 valijas grandes)',
            context.phoneNumberId
          );
          return {
            success: true,
            nextState: 'esperando_nuevo_equipaje',
            data
          };
          
        case '6':
          // Confirmar este viaje
          await TurnoModel.findByIdAndUpdate(viaje._id, {
            estado: 'confirmado',
            confirmadoEn: new Date()
          });
          
          await enviarMensajeWhatsAppTexto(
            telefono,
            '✅ ¡Perfecto! Tu viaje ha sido confirmado.\n\n¡Nos vemos pronto! 🚗',
            context.phoneNumberId
          );
          
          return {
            success: true,
            end: true
          };
          
        case '7':
          // Cancelar este viaje
          await TurnoModel.findByIdAndUpdate(viaje._id, {
            estado: 'cancelado',
            canceladoEn: new Date()
          });
          
          await enviarMensajeWhatsAppTexto(
            telefono,
            '❌ Viaje cancelado.\n\nSi necesitas reprogramar, contáctanos.',
            context.phoneNumberId
          );
          
          return {
            success: true,
            end: true
          };
          
        default:
          await enviarMensajeWhatsAppTexto(
            telefono,
            '❌ Opción inválida. Por favor selecciona un número del 0 al 7.',
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
        'datos.origen': mensajeTrim
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
        'datos.destino': mensajeTrim
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
    
    if (state === 'esperando_nueva_hora') {
      const viaje = data.viajeSeleccionado;
      
      // Validar formato HH:MM
      const horaRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (!horaRegex.test(mensajeTrim)) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Formato inválido. Por favor ingresa la hora en formato HH:MM (ej: 14:30)',
          context.phoneNumberId
        );
        return {
          success: true,
          nextState: 'esperando_nueva_hora',
          data
        };
      }
      
      // Parsear hora y actualizar fechaInicio
      // IMPORTANTE: El usuario ingresa hora en Argentina (UTC-3)
      // Debemos crear la fecha en hora local, que se guardará automáticamente en UTC
      const [horas, minutos] = mensajeTrim.split(':').map(Number);
      const fechaActual = new Date(viaje.fechaInicio);
      
      // Crear fecha en hora local de Argentina
      const fechaNueva = new Date(
        fechaActual.getUTCFullYear(),
        fechaActual.getUTCMonth(),
        fechaActual.getUTCDate(),
        horas,
        minutos,
        0,
        0
      );
      
      await TurnoModel.findByIdAndUpdate(viaje._id, {
        fechaInicio: fechaNueva
      });
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        `✅ Hora actualizada a: ${mensajeTrim}\n\n¿Querés hacer otra modificación?\n\n1️⃣ Sí\n2️⃣ No, confirmar cambios`,
        context.phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'esperando_confirmacion_final',
        data
      };
    }
    
    if (state === 'esperando_nuevos_pasajeros') {
      const viaje = data.viajeSeleccionado;
      
      // Validar que sea un número
      const numPasajeros = parseInt(mensajeTrim);
      if (isNaN(numPasajeros) || numPasajeros < 1) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Por favor ingresa un número válido de pasajeros (mínimo 1)',
          context.phoneNumberId
        );
        return {
          success: true,
          nextState: 'esperando_nuevos_pasajeros',
          data
        };
      }
      
      // Actualizar pasajeros
      await TurnoModel.findByIdAndUpdate(viaje._id, {
        'datos.pasajeros': numPasajeros
      });
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        `✅ Cantidad de pasajeros actualizada a: ${numPasajeros}\n\n¿Querés hacer otra modificación?\n\n1️⃣ Sí\n2️⃣ No, confirmar cambios`,
        context.phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'esperando_confirmacion_final',
        data
      };
    }
    
    if (state === 'esperando_nuevo_equipaje') {
      const viaje = data.viajeSeleccionado;
      
      // Actualizar equipaje
      await TurnoModel.findByIdAndUpdate(viaje._id, {
        'datos.equipaje': mensajeTrim
      });
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        `✅ Equipaje actualizado a: ${mensajeTrim}\n\n¿Querés hacer otra modificación?\n\n1️⃣ Sí\n2️⃣ No, confirmar cambios`,
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
          // Formatear hora correctamente
          const fechaInicio = new Date(viaje.fechaInicio);
          const horas = String(fechaInicio.getUTCHours()).padStart(2, '0');
          const minutos = String(fechaInicio.getUTCMinutes()).padStart(2, '0');
          const hora = `${horas}:${minutos}`;
          
          const origen = viaje.datos?.origen || 'No especificado';
          const destino = viaje.datos?.destino || 'No especificado';
          
          mensaje += `${index + 1}. ${origen} → ${destino} (${hora})\n`;
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
        // Confirmar el viaje editado
        const viaje = data.viajeSeleccionado;
        await TurnoModel.findByIdAndUpdate(viaje._id, {
          estado: 'confirmado',
          confirmadoEn: new Date()
        });
        
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
