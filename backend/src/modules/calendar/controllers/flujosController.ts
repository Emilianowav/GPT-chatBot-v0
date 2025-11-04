// 🔄 Controlador para gestión completa de flujos
import { Request, Response } from 'express';
import { ConfiguracionModuloModel } from '../models/ConfiguracionModulo.js';

/**
 * Obtener todos los flujos disponibles (menú + notificaciones)
 */
export const obtenerTodosLosFlujos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId } = req.params;

    // Obtener configuración del módulo (notificaciones)
    const configModulo = await ConfiguracionModuloModel.findOne({ empresaId });

    if (!configModulo) {
      res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
      return;
    }

    // Construir respuesta con TODOS los flujos
    const flujos = {

      // FLUJOS DE NOTIFICACIONES AUTOMÁTICAS
      notificaciones: configModulo.notificaciones.map((notif: any) => ({
        id: notif._id?.toString() || notif.tipo,
        tipo: notif.tipo,
        nombre: notif.tipo === 'confirmacion' ? 'Confirmación de Turnos' : 'Recordatorio de Viajes',
        activa: notif.activa,
        
        // Configuración de envío
        envio: {
          momento: notif.momento,
          horasAntesTurno: (notif as any).horasAntesTurno,
          diasAntes: notif.diasAntes,
          horaEnvio: notif.horaEnvio,
          ejecucion: notif.ejecucion
        },

        // Filtros
        filtros: {
          estados: notif.filtros?.estados || ['pendiente', 'no_confirmado'],
          soloSinNotificar: notif.filtros?.soloSinNotificar ?? true,
          tipoReserva: notif.filtros?.tipoReserva || [],
          horaMinima: notif.filtros?.horaMinima,
          horaMaxima: notif.filtros?.horaMaxima
        },

        // Mensajes
        mensajes: {
          plantilla: notif.plantillaMensaje,
          requiereConfirmacion: notif.requiereConfirmacion,
          mensajeConfirmacion: notif.mensajeConfirmacion,
          opcionesRespuesta: notif.requiereConfirmacion ? [
            '1️⃣ Confirmar todos los viajes',
            '2️⃣ Editar un viaje específico'
          ] : []
        },

        // Flujo de conversación (si requiere confirmación)
        flujoConversacion: notif.requiereConfirmacion ? {
          pasos: [
            {
              numero: 1,
              nombre: 'Mensaje Inicial',
              descripcion: 'Envía el recordatorio con los datos del turno',
              editable: true
            },
            {
              numero: 2,
              nombre: 'Opciones del Usuario',
              descripcion: 'Presenta las opciones: Confirmar o Editar',
              editable: false
            },
            {
              numero: 3,
              nombre: 'Confirmación',
              descripcion: 'Si elige "1" - Confirma todos los viajes',
              editable: true
            },
            {
              numero: 4,
              nombre: 'Edición',
              descripcion: 'Si elige "2" - Permite editar origen, destino, horario o cancelar',
              editable: false,
              subpasos: [
                'Seleccionar viaje',
                'Elegir qué modificar',
                'Ingresar nuevo valor',
                'Confirmar cambios'
              ]
            }
          ]
        } : null
      })),

      // FLUJOS ESPECIALES
      especiales: [
        {
          id: 'gpt_fallback',
          nombre: 'GPT Conversacional',
          descripcion: 'Responde con IA cuando no hay flujo específico',
          activo: true,
          prioridad: 'baja',
          configuracion: {
            modelo: 'gpt-3.5-turbo',
            temperatura: 0.7,
            maxTokens: 500
          }
        }
      ],

      // ESTADÍSTICAS
      estadisticas: {
        totalNotificaciones: configModulo.notificaciones.length,
        notificacionesActivas: configModulo.notificaciones.filter(n => n.activa).length,
        ultimaActualizacion: (configModulo as any).updatedAt || new Date()
      }
    };

    res.json({
      success: true,
      flujos
    });

  } catch (error: any) {
    console.error('❌ Error al obtener flujos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener flujos',
      error: error.message
    });
  }
};

/**
 * Actualizar configuración de un flujo específico
 */
export const actualizarFlujo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId, flujoId } = req.params;
    const { tipo, configuracion } = req.body;

    if (tipo === 'notificacion') {
      // Actualizar notificación
      const configModulo = await ConfiguracionModuloModel.findOne({ empresaId });
      if (!configModulo) {
        res.status(404).json({ success: false, message: 'Configuración no encontrada' });
        return;
      }

      const notifIndex = configModulo.notificaciones.findIndex((n: any) => n._id?.toString() === flujoId || n.tipo === flujoId);
      if (notifIndex === -1) {
        res.status(404).json({ success: false, message: 'Notificación no encontrada' });
        return;
      }

      configModulo.notificaciones[notifIndex] = {
        ...configModulo.notificaciones[notifIndex],
        ...configuracion
      } as any;

      await configModulo.save();

      res.json({
        success: true,
        message: 'Notificación actualizada',
        flujo: configModulo.notificaciones[notifIndex]
      });

    } else {
      res.status(400).json({ success: false, message: 'Tipo de flujo inválido' });
    }

  } catch (error: any) {
    console.error('❌ Error al actualizar flujo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar flujo',
      error: error.message
    });
  }
};

/**
 * Activar/Desactivar un flujo
 */
export const toggleFlujo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId, flujoId } = req.params;
    const { tipo, activo } = req.body;

    if (tipo === 'notificacion') {
      const configModulo = await ConfiguracionModuloModel.findOne({ empresaId });
      if (!configModulo) {
        res.status(404).json({ success: false, message: 'Configuración no encontrada' });
        return;
      }

      const notifIndex = configModulo.notificaciones.findIndex((n: any) => n._id?.toString() === flujoId || n.tipo === flujoId);
      if (notifIndex !== -1) {
        configModulo.notificaciones[notifIndex].activa = activo;
        await configModulo.save();
      }

      res.json({ success: true, message: `Notificación ${activo ? 'activada' : 'desactivada'}` });
    }

  } catch (error: any) {
    console.error('❌ Error al toggle flujo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del flujo',
      error: error.message
    });
  }
};
