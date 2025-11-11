// 🔔 Flujo de Confirmación de Turnos (Configurable)
import type { Flow, FlowContext, FlowResult } from './types.js';
import { flowMessageService } from '../modules/calendar/services/flowMessageService.js';
import { enviarMensajeWhatsAppTexto } from '../services/notificacionesMetaService.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { EmpresaModel } from '../models/Empresa.js';

// Helper para obtener phoneNumberId
async function getPhoneNumberId(empresaId: string): Promise<string> {
  const empresa = await EmpresaModel.findOne({ nombre: empresaId });
  return empresa?.phoneNumberId || process.env.META_PHONE_NUMBER_ID || '';
}

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
    
    if (!data?.turnosIds && !data?.turnoId) {
      return {
        success: false,
        error: 'No se proporcionaron turnos'
      };
    }
    
    try {
      // ✨ Usar FlowMessageService para enviar mensaje configurable
      await flowMessageService.enviarMensajeFlujo(
        telefono,
        empresaId,
        'confirmacion_turnos',
        'esperando_confirmacion',
        {
          turno: data.turno || 'turno'
        }
      );
      
      return {
        success: true,
        nextState: 'esperando_confirmacion',
        data: {
          turnosIds: data.turnosIds || [data.turnoId],
          clienteId: data.clienteId,
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
        const phoneNumberId = await getPhoneNumberId(empresaId);
        
        if (respuestaInteractiva.startsWith('confirmar_')) {
          const turnoId = respuestaInteractiva.replace('confirmar_', '');
          
          // Procesar confirmación a través del servicio existente
          await enviarMensajeWhatsAppTexto(
            telefono,
            '✅ ¡Perfecto! Tu turno ha sido confirmado. Te esperamos.',
            phoneNumberId
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
            phoneNumberId
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
            phoneNumberId
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
        }
        
        // ✨ Usar FlowMessageService para mensaje de confirmación
        const primerTurno = data.turnosIds?.[0] ? await TurnoModel.findById(data.turnosIds[0]) : null;
        await flowMessageService.enviarMensajeFlujo(
          telefono,
          empresaId,
          'confirmacion_turnos',
          'confirmado',
          {
            turno: primerTurno?.datos?.origen ? 'viaje' : 'turno',
            fecha: primerTurno ? new Date(primerTurno.fechaInicio) : new Date(),
            hora: primerTurno ? new Date(primerTurno.fechaInicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''
          }
        );
        
        return {
          success: true,
          end: true
        };
      }
      
      // 🔧 MODIFICAR - Respuestas de botón de plantilla Meta
      if (/^(modificar|editar|cambiar|2)$/i.test(mensajeLower)) {
        console.log('🔧 [ConfirmacionTurnos] Usuario quiere modificar');
        
        // ✨ Usar FlowMessageService para mensaje de modificación
        await flowMessageService.enviarMensajeFlujo(
          telefono,
          empresaId,
          'confirmacion_turnos',
          'modificado',
          {
            turno: 'turno'
          }
        );
        
        return {
          success: true,
          nextState: 'modificando_turno',
          data: { ...data, turnoSeleccionado: data.turnosIds?.[0] }
        };
      }
      
      // ❌ CANCELAR
      if (/^(no|cancelar|cancelo)$/i.test(mensajeLower)) {
        // ✨ Usar FlowMessageService para mensaje de cancelación
        const primerTurno = data.turnosIds?.[0] ? await TurnoModel.findById(data.turnosIds[0]) : null;
        await flowMessageService.enviarMensajeFlujo(
          telefono,
          empresaId,
          'confirmacion_turnos',
          'cancelado',
          {
            turno: primerTurno?.datos?.origen ? 'viaje' : 'turno',
            fecha: primerTurno ? new Date(primerTurno.fechaInicio) : new Date(),
            hora: primerTurno ? new Date(primerTurno.fechaInicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''
          }
        );
        
        return {
          success: true,
          end: true
        };
      }
      
      // Respuesta no reconocida
      const intentos = (data.intentos || 0) + 1;
      
      if (intentos >= 3) {
        // ✨ Usar FlowMessageService para mensaje de error
        await flowMessageService.enviarMensajeFlujo(
          telefono,
          empresaId,
          'confirmacion_turnos',
          'error',
          {}
        );
        
        return {
          success: true,
          end: true
        };
      }
      
      // Volver a enviar mensaje de confirmación
      await flowMessageService.enviarMensajeFlujo(
        telefono,
        empresaId,
        'confirmacion_turnos',
        'esperando_confirmacion',
        {
          turno: 'turno'
        }
      );
      
      return {
        success: true,
        nextState: 'esperando_confirmacion',
        data: { ...data, intentos }
      };
    }
    
    // Estado: Seleccionando turno a modificar
    if (state === 'seleccionando_turno_modificar') {
      const phoneNumberId = await getPhoneNumberId(empresaId);
      const numeroTurno = parseInt(mensaje.trim());
      
      if (isNaN(numeroTurno) || numeroTurno < 1 || numeroTurno > (data.turnosIds?.length || 0)) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          `❌ Número inválido. Por favor, escribí un número entre 1 y ${data.turnosIds?.length || 0}.`,
          phoneNumberId
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
        phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'modificando_turno',
        data: { ...data, turnoSeleccionado, numeroTurno }
      };
    }
    
    // Estado: Modificando turno
    if (state === 'modificando_turno') {
      const phoneNumberId = await getPhoneNumberId(empresaId);
      const opcion = mensaje.trim();
      
      if (opcion === '1') {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '🕐 Escribí la nueva hora en formato HH:MM (ej: 14:30)',
          phoneNumberId
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
          phoneNumberId
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
          phoneNumberId
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
          phoneNumberId
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
        phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'modificando_turno',
        data: data
      };
    }
    
    // Estados de modificación específicos
    if (state === 'modificando_hora') {
      const phoneNumberId = await getPhoneNumberId(empresaId);
      // Validar formato HH:MM
      const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      if (!horaRegex.test(mensaje.trim())) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Formato inválido. Por favor, escribí la hora en formato HH:MM (ej: 14:30)',
          phoneNumberId
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
            phoneNumberId
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
        phoneNumberId
      );
      
      return {
        success: true,
        end: true
      };
    }
    
    if (state === 'modificando_origen' || state === 'modificando_destino') {
      const phoneNumberId = await getPhoneNumberId(empresaId);
      const campo = state === 'modificando_origen' ? 'origen' : 'destino';
      
      try {
        await TurnoModel.findByIdAndUpdate(
          data.turnoSeleccionado,
          { [`datos.${campo}`]: mensaje.trim() }
        );
        
        await enviarMensajeWhatsAppTexto(
          telefono,
          `✅ ${campo.charAt(0).toUpperCase() + campo.slice(1)} actualizado. ¿Algo más que modificar?\n\n1️⃣ Sí, modificar otra cosa\n2️⃣ No, confirmar viaje`,
          phoneNumberId
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
      const phoneNumberId = await getPhoneNumberId(empresaId);
      const pasajeros = parseInt(mensaje.trim());
      
      if (isNaN(pasajeros) || pasajeros < 1) {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '❌ Número inválido. Por favor, escribí un número mayor a 0.',
          phoneNumberId
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
          phoneNumberId
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
      const phoneNumberId = await getPhoneNumberId(empresaId);
      const opcion = mensaje.trim();
      
      if (opcion === '1') {
        await enviarMensajeWhatsAppTexto(
          telefono,
          '🔧 ¿Qué querés modificar?\n\n1️⃣ Hora\n2️⃣ Origen\n3️⃣ Destino\n4️⃣ Pasajeros',
          phoneNumberId
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
            phoneNumberId
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
        phoneNumberId
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
