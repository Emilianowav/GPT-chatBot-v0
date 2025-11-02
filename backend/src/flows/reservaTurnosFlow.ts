// 📅 Flujo de Reserva de Turnos
import type { Flow, FlowContext, FlowResult } from './types.js';
import { enviarMensajeWhatsAppTexto } from '../services/metaService.js';
import * as botTurnosService from '../modules/calendar/services/botTurnosService.js';

export const reservaTurnosFlow: Flow = {
  name: 'reserva_turnos',
  priority: 'normal',
  version: '1.0.0',
  
  async shouldActivate(context: FlowContext): Promise<boolean> {
    const { mensaje } = context;
    const mensajeLower = mensaje.toLowerCase().trim();
    
    // Detectar intención de reservar turno
    const keywords = [
      'turno',
      'reserva',
      'reservar',
      'agendar',
      'cita',
      'hora',
      'disponibilidad',
      'quiero un turno',
      'necesito turno',
      'sacar turno'
    ];
    
    return keywords.some(keyword => mensajeLower.includes(keyword));
  },
  
  async start(context: FlowContext): Promise<FlowResult> {
    const { telefono, mensaje, empresaId } = context;
    
    console.log(`📅 [ReservaTurnos] Iniciando flujo para ${telefono}`);
    
    try {
      // Usar el servicio existente de bot de turnos
      const respuesta = await botTurnosService.procesarMensaje(
        mensaje,
        telefono,
        empresaId
      );
      
      if (respuesta) {
        await enviarMensajeWhatsAppTexto(telefono, respuesta, context.phoneNumberId);
        
        // Verificar si necesita más interacción
        const necesitaMasInfo = respuesta.includes('¿') || 
                                respuesta.includes('elegí') ||
                                respuesta.includes('seleccioná');
        
        if (necesitaMasInfo) {
          return {
            success: true,
            nextState: 'esperando_seleccion',
            data: { paso: 'inicial' }
          };
        } else {
          // Turno completado en un paso
          return {
            success: true,
            end: true
          };
        }
      }
      
      // Si el bot no pudo procesar, pedir más información
      await enviarMensajeWhatsAppTexto(
        telefono,
        '📅 ¿Para qué día querés el turno? Podés escribir la fecha o "hoy", "mañana", etc.',
        context.phoneNumberId
      );
      
      return {
        success: true,
        nextState: 'esperando_fecha',
        data: {}
      };
    } catch (error) {
      console.error('❌ Error iniciando flujo de reserva:', error);
      return {
        success: false,
        error: String(error)
      };
    }
  },
  
  async onInput(context: FlowContext, state: string, data: Record<string, any>): Promise<FlowResult> {
    const { telefono, mensaje, empresaId } = context;
    
    console.log(`📥 [ReservaTurnos] Estado: ${state}, Mensaje: ${mensaje}`);
    
    try {
      // Procesar con el bot de turnos
      const respuesta = await botTurnosService.procesarMensaje(
        mensaje,
        telefono,
        empresaId
      );
      
      if (respuesta) {
        await enviarMensajeWhatsAppTexto(telefono, respuesta, context.phoneNumberId);
        
        // Verificar si el turno fue confirmado
        if (respuesta.includes('confirmado') || respuesta.includes('reservado')) {
          return {
            success: true,
            end: true
          };
        }
        
        // Verificar si necesita cancelar
        if (mensaje.toLowerCase().includes('cancelar') || 
            mensaje.toLowerCase().includes('salir')) {
          return {
            success: true,
            end: true
          };
        }
        
        // Continuar en el flujo
        return {
          success: true,
          nextState: 'esperando_seleccion',
          data: { ...data, ultimaRespuesta: respuesta }
        };
      }
      
      // Si el bot no respondió, algo salió mal
      await enviarMensajeWhatsAppTexto(
        telefono,
        'Hubo un problema. Escribí "turno" para intentar de nuevo.',
        context.phoneNumberId
      );
      
      return {
        success: true,
        end: true
      };
    } catch (error) {
      console.error('❌ Error procesando reserva:', error);
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        '❌ Hubo un error al procesar tu solicitud. Por favor, intentá de nuevo más tarde.',
        context.phoneNumberId
      );
      
      return {
        success: true,
        end: true
      };
    }
  },
  
  async onEnd(context: FlowContext, data: Record<string, any>): Promise<void> {
    console.log(`✅ [ReservaTurnos] Flujo finalizado para ${context.telefono}`);
  }
};
