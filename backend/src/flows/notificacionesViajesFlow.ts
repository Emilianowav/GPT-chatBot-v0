// 🚗 Flujo de Notificaciones de Viajes
import type { Flow, FlowContext, FlowResult } from './types.js';
import { enviarMensajeWhatsAppTexto } from '../services/metaService.js';
import * as notificacionesService from '../services/notificacionesViajesService.js';

export const notificacionesViajesFlow: Flow = {
  name: 'notificaciones_viajes',
  priority: 'urgente',
  version: '1.0.0',
  
  async shouldActivate(context: FlowContext): Promise<boolean> {
    // Este flujo se activa por respuestas interactivas de notificaciones
    const { respuestaInteractiva } = context;
    
    if (!respuestaInteractiva) return false;
    
    const prefijos = [
      'confirmar_todos',
      'modificar_viaje',
      'necesito_ayuda',
      'viaje_',
      'mod_origen_',
      'mod_destino_',
      'mod_horario_',
      'cancelar_viaje_',
      'nueva_modificacion',
      'confirmar_cronograma'
    ];
    
    return prefijos.some(prefijo => respuestaInteractiva.startsWith(prefijo));
  },
  
  async start(context: FlowContext): Promise<FlowResult> {
    const { telefono, respuestaInteractiva, empresaId } = context;
    
    console.log(`🚗 [NotificacionesViajes] Iniciando flujo para ${telefono}`);
    
    if (!respuestaInteractiva) {
      return {
        success: false,
        error: 'No se proporcionó respuesta interactiva'
      };
    }
    
    try {
      // Procesar confirmación inicial
      if (['confirmar_todos', 'modificar_viaje', 'necesito_ayuda'].includes(respuestaInteractiva)) {
        await notificacionesService.procesarRespuestaConfirmacion(
          telefono,
          respuestaInteractiva,
          empresaId
        );
        
        if (respuestaInteractiva === 'modificar_viaje') {
          return {
            success: true,
            nextState: 'esperando_seleccion_viaje',
            data: {}
          };
        } else {
          return {
            success: true,
            end: true
          };
        }
      }
      
      // Selección de viaje
      if (respuestaInteractiva.startsWith('viaje_')) {
        await notificacionesService.procesarSeleccionViaje(
          telefono,
          respuestaInteractiva,
          empresaId
        );
        
        return {
          success: true,
          nextState: 'esperando_tipo_modificacion',
          data: {
            turnoId: respuestaInteractiva.replace('viaje_', '')
          }
        };
      }
      
      // Tipo de modificación
      if (respuestaInteractiva.startsWith('mod_')) {
        const partes = respuestaInteractiva.split('_');
        const accion = `${partes[0]}_${partes[1]}`;
        const turnoId = partes.slice(2).join('_');
        
        const nuevoEstado = await notificacionesService.procesarModificacionViaje(
          telefono,
          accion,
          turnoId,
          empresaId
        );
        
        return {
          success: true,
          nextState: nuevoEstado,
          data: {
            turnoId,
            campo: partes[1]
          }
        };
      }
      
      // Cancelar viaje
      if (respuestaInteractiva.startsWith('cancelar_viaje_')) {
        const turnoId = respuestaInteractiva.replace('cancelar_viaje_', '');
        
        await notificacionesService.procesarModificacionViaje(
          telefono,
          'cancelar_viaje',
          turnoId,
          empresaId
        );
        
        return {
          success: true,
          nextState: 'esperando_respuesta_final',
          data: {}
        };
      }
      
      // Respuesta final
      if (['nueva_modificacion', 'confirmar_cronograma'].includes(respuestaInteractiva)) {
        await notificacionesService.procesarRespuestaFinal(
          telefono,
          respuestaInteractiva,
          empresaId
        );
        
        if (respuestaInteractiva === 'nueva_modificacion') {
          return {
            success: true,
            nextState: 'esperando_seleccion_viaje',
            data: {}
          };
        } else {
          return {
            success: true,
            end: true
          };
        }
      }
      
      return {
        success: false,
        error: 'Respuesta interactiva no reconocida'
      };
    } catch (error) {
      console.error('❌ Error en flujo de notificaciones de viajes:', error);
      return {
        success: false,
        error: String(error)
      };
    }
  },
  
  async onInput(context: FlowContext, state: string, data: Record<string, any>): Promise<FlowResult> {
    const { telefono, mensaje, empresaId } = context;
    
    console.log(`📥 [NotificacionesViajes] Estado: ${state}, Mensaje: ${mensaje}`);
    
    try {
      // Esperando nueva dirección de origen
      if (state === 'esperando_origen' && data.turnoId) {
        await notificacionesService.actualizarDatosViaje(
          data.turnoId,
          'origin',
          mensaje,
          telefono,
          empresaId
        );
        
        return {
          success: true,
          nextState: 'esperando_respuesta_final',
          data
        };
      }
      
      // Esperando nueva dirección de destino
      if (state === 'esperando_destino' && data.turnoId) {
        await notificacionesService.actualizarDatosViaje(
          data.turnoId,
          'destination',
          mensaje,
          telefono,
          empresaId
        );
        
        return {
          success: true,
          nextState: 'esperando_respuesta_final',
          data
        };
      }
      
      // Esperando nuevo horario
      if (state === 'esperando_horario' && data.turnoId) {
        await notificacionesService.actualizarDatosViaje(
          data.turnoId,
          'horario',
          mensaje,
          telefono,
          empresaId
        );
        
        return {
          success: true,
          nextState: 'esperando_respuesta_final',
          data
        };
      }
      
      return {
        success: false,
        error: 'Estado no reconocido'
      };
    } catch (error) {
      console.error('❌ Error procesando input de viajes:', error);
      
      await enviarMensajeWhatsAppTexto(
        telefono,
        '❌ Hubo un error al procesar tu solicitud. Por favor, intentá de nuevo.',
        context.phoneNumberId
      );
      
      return {
        success: true,
        end: true
      };
    }
  },
  
  async onEnd(context: FlowContext, data: Record<string, any>): Promise<void> {
    console.log(`✅ [NotificacionesViajes] Flujo finalizado para ${context.telefono}`);
  }
};
