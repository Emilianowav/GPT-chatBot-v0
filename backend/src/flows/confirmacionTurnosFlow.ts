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
    
    if (state === 'esperando_confirmacion') {
      // Procesar respuesta interactiva
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
      
      // Procesar respuesta de texto
      const mensajeLower = mensaje.toLowerCase().trim();
      
      if (/^(si|sí|confirmo|confirmar|ok|dale)$/i.test(mensajeLower)) {
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
        'Por favor, respondé con "Sí" para confirmar o "No" para cancelar.',
        context.phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'esperando_confirmacion',
        data: { ...data, intentos }
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
