// 🔔 Flujo de Confirmación de Turnos (Configurable)
import type { Flow, FlowContext, FlowResult } from './types.js';
import { enviarMensajeWhatsAppTexto, enviarMensajeConBotones } from '../services/metaService.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';

export const confirmacionTurnosFlow: Flow = {
  name: 'confirmacion_turnos',
  priority: 'urgente',
  version: '1.0.0',
  
  async shouldActivate(context: FlowContext): Promise<boolean> {
    // Este flujo se activa programáticamente desde notificaciones
    return false;
  },
  
  async start(context: FlowContext): Promise<FlowResult> {
    const { telefono, empresaId, data } = context;
    
    console.log(`🔔 [ConfirmacionTurnos] Iniciando flujo para ${telefono}`);
    
    if (!data?.turnoId) {
      return {
        success: false,
        error: 'No se proporcionó turnoId'
      };
    }
    
    try {
      // Enviar mensaje de confirmación con botones
      const mensaje = data.mensaje || '¿Confirmás tu turno?';
      
      await enviarMensajeConBotones(
        telefono,
        mensaje,
        [
          { id: `confirmar_${data.turnoId}`, title: '✅ Confirmar' },
          { id: `cancelar_${data.turnoId}`, title: '❌ Cancelar' },
          { id: `reprogramar_${data.turnoId}`, title: '🔄 Reprogramar' }
        ],
        context.phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'esperando_confirmacion',
        data: {
          turnoId: data.turnoId,
          intentos: 0
        }
      };
    } catch (error) {
      console.error('❌ Error iniciando flujo de confirmación:', error);
      return {
        success: false,
        error: String(error)
      };
    }
  },
  
  async onInput(context: FlowContext, state: string, data: Record<string, any>): Promise<FlowResult> {
    const { telefono, mensaje, respuestaInteractiva, empresaId } = context;
    
    console.log(`📥 [ConfirmacionTurnos] Estado: ${state}, Mensaje: ${mensaje}`);
    console.log(`📥 [ConfirmacionTurnos] Respuesta interactiva: ${respuestaInteractiva}`);
    console.log(`📥 [ConfirmacionTurnos] Data:`, data);
    
    if (state === 'esperando_confirmacion') {
      // Procesar respuesta interactiva (botones de plantilla Meta)
      if (respuestaInteractiva) {
        if (respuestaInteractiva.startsWith('confirmar_')) {
          const turnoId = respuestaInteractiva.replace('confirmar_', '');
          
          // Procesar confirmación a través del servicio existente
          await enviarMensajeWhatsAppTexto(
            telefono,
            '✅ ¡Perfecto! Tu turno ha sido confirmado. Te esperamos.',
            context.phoneNumberId
          );
          
          return {
            success: true,
            end: true
          };
        }
        
        if (respuestaInteractiva.startsWith('cancelar_')) {
          await enviarMensajeWhatsAppTexto(
            telefono,
            '✅ Tu turno ha sido cancelado. Podés reservar otro cuando quieras.',
            context.phoneNumberId
          );
          
          return {
            success: true,
            end: true
          };
        }
        
        if (respuestaInteractiva.startsWith('reprogramar_')) {
          await enviarMensajeWhatsAppTexto(
            telefono,
            '📅 Para reprogramar tu turno, escribí "quiero un turno" y te ayudaré a elegir uno nuevo.',
            context.phoneNumberId
          );
          
          return {
            success: true,
            end: true
          };
        }
      }
      
      // Procesar respuesta de texto (de botones de plantilla Meta o texto libre)
      const mensajeLower = mensaje.toLowerCase().trim();
      
      // ✅ CONFIRMAR - Respuestas de botón de plantilla Meta
      if (/^(confirmar|si|sí|confirmo|ok|dale|1)$/i.test(mensajeLower)) {
        console.log('✅ [ConfirmacionTurnos] Usuario confirmó los turnos');
        
        // Si hay múltiples turnos, confirmar todos
        if (data.turnosIds && Array.isArray(data.turnosIds)) {
          console.log(`   Confirmando ${data.turnosIds.length} turnos...`);
          
          // Actualizar estado de todos los turnos a 'confirmado'
          for (const turnoId of data.turnosIds) {
            try {
              await TurnoModel.findByIdAndUpdate(turnoId, { estado: 'confirmado' });
              console.log(`   ✅ Turno ${turnoId} confirmado`);
            } catch (error) {
              console.error(`   ❌ Error confirmando turno ${turnoId}:`, error);
            }
          }
          
          await enviarMensajeWhatsAppTexto(
            telefono,
            `✅ ¡Perfecto! Todos tus ${data.turnosIds.length} viajes han sido confirmados. Te esperamos.`,
            context.phoneNumberId
          );
        } else {
          await enviarMensajeWhatsAppTexto(
            telefono,
            '✅ ¡Perfecto! Tu viaje ha sido confirmado. Te esperamos.',
            context.phoneNumberId
          );
        }
        
        return {
          success: true,
          end: true
        };
      }
      
      // 🔧 MODIFICAR - Respuestas de botón de plantilla Meta
      if (/^(modificar|editar|cambiar|2)$/i.test(mensajeLower)) {
        console.log('🔧 [ConfirmacionTurnos] Usuario quiere modificar');
        
        // Si hay múltiples turnos, preguntar cuál quiere modificar
        if (data.turnosIds && Array.isArray(data.turnosIds) && data.turnosIds.length > 1) {
          await enviarMensajeWhatsAppTexto(
            telefono,
            `🔧 ¿Qué viaje querés modificar?\n\nEscribí el número del viaje (1, 2, 3, etc.)`,
            context.phoneNumberId
          );
          
          return {
            success: true,
            nextState: 'seleccionando_turno_modificar',
            data: data
          };
        } else {
          // Solo un turno, ir directo a modificar
          await enviarMensajeWhatsAppTexto(
            telefono,
            '🔧 ¿Qué querés modificar?\n\n1️⃣ Hora\n2️⃣ Origen\n3️⃣ Destino\n4️⃣ Pasajeros\n\nEscribí el número de la opción.',
            context.phoneNumberId
          );
          
          return {
            success: true,
            nextState: 'modificando_turno',
            data: { ...data, turnoSeleccionado: data.turnosIds?.[0] }
          };
        }
      }
      
      // ❌ CANCELAR
      if (/^(no|cancelar|cancelo)$/i.test(mensajeLower)) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '✅ Tu turno ha sido cancelado. Podés reservar otro cuando quieras.',
          context.phoneNumberId
        );
        
        return {
          success: true,
          end: true
        };
      }
      
      // Respuesta no reconocida
      const intentos = (data.intentos || 0) + 1;
      
      if (intentos >= 3) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          'No pude entender tu respuesta. Por favor, contactá con nosotros directamente.',
          context.phoneNumberId
        );
        
        return {
          success: true,
          end: true
        };
      }
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        'Por favor, respondé con:\n\n✅ "Confirmar" para confirmar\n🔧 "Modificar" para editar',
        context.phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'esperando_confirmacion',
        data: { ...data, intentos }
      };
    }
    
    // Estado: Seleccionando turno a modificar
    if (state === 'seleccionando_turno_modificar') {
      const numeroTurno = parseInt(mensaje.trim());
      
      if (isNaN(numeroTurno) || numeroTurno < 1 || numeroTurno > (data.turnosIds?.length || 0)) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          `❌ Número inválido. Por favor, escribí un número entre 1 y ${data.turnosIds?.length || 0}.`,
          context.phoneNumberId
        );
        
        return {
          success: true,
          nextState: 'seleccionando_turno_modificar',
          data: data
        };
      }
      
      const turnoSeleccionado = data.turnosIds[numeroTurno - 1];
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        `🔧 ¿Qué querés modificar del viaje ${numeroTurno}?\n\n1️⃣ Hora\n2️⃣ Origen\n3️⃣ Destino\n4️⃣ Pasajeros\n\nEscribí el número de la opción.`,
        context.phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'modificando_turno',
        data: { ...data, turnoSeleccionado, numeroTurno }
      };
    }
    
    // Estado: Modificando turno
    if (state === 'modificando_turno') {
      const opcion = mensaje.trim();
      
      if (opcion === '1') {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '🕐 Escribí la nueva hora en formato HH:MM (ej: 14:30)',
          context.phoneNumberId
        );
        
        return {
          success: true,
          nextState: 'modificando_hora',
          data: data
        };
      }
      
      if (opcion === '2') {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '📍 Escribí la nueva dirección de origen',
          context.phoneNumberId
        );
        
        return {
          success: true,
          nextState: 'modificando_origen',
          data: data
        };
      }
      
      if (opcion === '3') {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '📍 Escribí la nueva dirección de destino',
          context.phoneNumberId
        );
        
        return {
          success: true,
          nextState: 'modificando_destino',
          data: data
        };
      }
      
      if (opcion === '4') {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '👥 Escribí la nueva cantidad de pasajeros',
          context.phoneNumberId
        );
        
        return {
          success: true,
          nextState: 'modificando_pasajeros',
          data: data
        };
      }
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        '❌ Opción inválida. Por favor, escribí 1, 2, 3 o 4.',
        context.phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'modificando_turno',
        data: data
      };
    }
    
    // Estados de modificación específicos
    if (state === 'modificando_hora') {
      // Validar formato HH:MM
      const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      if (!horaRegex.test(mensaje.trim())) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Formato inválido. Por favor, escribí la hora en formato HH:MM (ej: 14:30)',
          context.phoneNumberId
        );
        
        return {
          success: true,
          nextState: 'modificando_hora',
          data: data
        };
      }
      
      // Actualizar turno
      try {
        const [horas, minutos] = mensaje.trim().split(':').map(Number);
        const turno = await TurnoModel.findById(data.turnoSeleccionado);
        
        if (turno) {
          const nuevaFecha = new Date(turno.fechaInicio);
          nuevaFecha.setUTCHours(horas, minutos, 0, 0);
          
          turno.fechaInicio = nuevaFecha;
          await turno.save();
          
          await enviarMensajeWhatsAppTexto(
            telefono,
            `✅ Hora actualizada a ${mensaje.trim()}. ¿Algo más que modificar?\n\n1️⃣ Sí, modificar otra cosa\n2️⃣ No, confirmar viaje`,
            context.phoneNumberId
          );
          
          return {
            success: true,
            nextState: 'confirmando_modificacion',
            data: data
          };
        }
      } catch (error) {
        console.error('❌ Error actualizando hora:', error);
      }
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        '❌ Error actualizando la hora. Por favor, intentá de nuevo.',
        context.phoneNumberId
      );
      
      return {
        success: true,
        end: true
      };
    }
    
    if (state === 'modificando_origen' || state === 'modificando_destino') {
      const campo = state === 'modificando_origen' ? 'origen' : 'destino';
      
      try {
        await TurnoModel.findByIdAndUpdate(
          data.turnoSeleccionado,
          { [`datos.${campo}`]: mensaje.trim() }
        );
        
        await enviarMensajeWhatsAppTexto(
          telefono,
          `✅ ${campo.charAt(0).toUpperCase() + campo.slice(1)} actualizado. ¿Algo más que modificar?\n\n1️⃣ Sí, modificar otra cosa\n2️⃣ No, confirmar viaje`,
          context.phoneNumberId
        );
        
        return {
          success: true,
          nextState: 'confirmando_modificacion',
          data: data
        };
      } catch (error) {
        console.error(`❌ Error actualizando ${campo}:`, error);
      }
      
      return {
        success: true,
        end: true
      };
    }
    
    if (state === 'modificando_pasajeros') {
      const pasajeros = parseInt(mensaje.trim());
      
      if (isNaN(pasajeros) || pasajeros < 1) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Número inválido. Por favor, escribí un número mayor a 0.',
          context.phoneNumberId
        );
        
        return {
          success: true,
          nextState: 'modificando_pasajeros',
          data: data
        };
      }
      
      try {
        await TurnoModel.findByIdAndUpdate(
          data.turnoSeleccionado,
          { 'datos.pasajeros': pasajeros.toString() }
        );
        
        await enviarMensajeWhatsAppTexto(
          telefono,
          `✅ Cantidad de pasajeros actualizada a ${pasajeros}. ¿Algo más que modificar?\n\n1️⃣ Sí, modificar otra cosa\n2️⃣ No, confirmar viaje`,
          context.phoneNumberId
        );
        
        return {
          success: true,
          nextState: 'confirmando_modificacion',
          data: data
        };
      } catch (error) {
        console.error('❌ Error actualizando pasajeros:', error);
      }
      
      return {
        success: true,
        end: true
      };
    }
    
    if (state === 'confirmando_modificacion') {
      const opcion = mensaje.trim();
      
      if (opcion === '1') {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '🔧 ¿Qué querés modificar?\n\n1️⃣ Hora\n2️⃣ Origen\n3️⃣ Destino\n4️⃣ Pasajeros',
          context.phoneNumberId
        );
        
        return {
          success: true,
          nextState: 'modificando_turno',
          data: data
        };
      }
      
      if (opcion === '2') {
        // Confirmar el turno modificado
        try {
          await TurnoModel.findByIdAndUpdate(data.turnoSeleccionado, { estado: 'confirmado' });
          
          await enviarMensajeWhatsAppTexto(
            telefono,
            '✅ ¡Perfecto! Tu viaje ha sido confirmado con las modificaciones. Te esperamos.',
            context.phoneNumberId
          );
          
          return {
            success: true,
            end: true
          };
        } catch (error) {
          console.error('❌ Error confirmando turno:', error);
        }
      }
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        '❌ Opción inválida. Por favor, escribí 1 o 2.',
        context.phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'confirmando_modificacion',
        data: data
      };
    }
    
    return {
      success: false,
      error: 'Estado no reconocido'
    };
  },
  
  async onEnd(context: FlowContext, data: Record<string, any>): Promise<void> {
    console.log(`✅ [ConfirmacionTurnos] Flujo finalizado para ${context.telefono}`);
  }
};
