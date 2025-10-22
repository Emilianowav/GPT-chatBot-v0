// 🤖 Controlador del Bot de Turnos
import { Request, Response } from 'express';
import { ConfiguracionBotModel } from '../models/ConfiguracionBot.js';
import { ConfiguracionModuloModel } from '../models/ConfiguracionModulo.js';

/**
 * GET /api/modules/calendar/bot/configuracion/:empresaId
 * Obtener configuración del bot
 */
export async function obtenerConfiguracion(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    
    // Verificar que el usuario tenga acceso a esta empresa
    const userEmpresaId = (req as any).user?.empresaId;
    if (userEmpresaId !== empresaId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta empresa'
      });
    }
    
    // Verificar que tenga el módulo de calendario activo
    const configModulo = await ConfiguracionModuloModel.findOne({ empresaId });
    if (!configModulo) {
      return res.status(404).json({
        success: false,
        message: 'Módulo de calendario no configurado'
      });
    }
    
    // Obtener o crear configuración del bot
    let configBot = await ConfiguracionBotModel.findOne({ empresaId });
    
    if (!configBot) {
      // Crear configuración por defecto
      configBot = await ConfiguracionBotModel.create({
        empresaId,
        activo: false
      });
    }
    
    res.json({
      success: true,
      configuracion: configBot
    });
    
  } catch (error: any) {
    console.error('Error obteniendo configuración del bot:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener configuración'
    });
  }
}

/**
 * PUT /api/modules/calendar/bot/configuracion/:empresaId
 * Actualizar configuración del bot
 */
export async function actualizarConfiguracion(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const datosActualizacion = req.body;
    
    // Verificar acceso
    const userEmpresaId = (req as any).user?.empresaId;
    if (userEmpresaId !== empresaId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta empresa'
      });
    }
    
    // Verificar módulo activo
    const configModulo = await ConfiguracionModuloModel.findOne({ empresaId });
    if (!configModulo) {
      return res.status(404).json({
        success: false,
        message: 'Módulo de calendario no configurado'
      });
    }
    
    // Actualizar o crear configuración
    let configBot = await ConfiguracionBotModel.findOne({ empresaId });
    
    if (!configBot) {
      configBot = new ConfiguracionBotModel({
        empresaId,
        ...datosActualizacion
      });
    } else {
      Object.assign(configBot, datosActualizacion);
    }
    
    await configBot.save();
    
    res.json({
      success: true,
      configuracion: configBot,
      message: 'Configuración actualizada exitosamente'
    });
    
  } catch (error: any) {
    console.error('Error actualizando configuración del bot:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar configuración'
    });
  }
}

/**
 * POST /api/modules/calendar/bot/activar/:empresaId
 * Activar/Desactivar bot
 */
export async function toggleBot(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const { activo } = req.body;
    
    // Verificar acceso
    const userEmpresaId = (req as any).user?.empresaId;
    if (userEmpresaId !== empresaId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta empresa'
      });
    }
    
    const configBot = await ConfiguracionBotModel.findOne({ empresaId });
    
    if (!configBot) {
      return res.status(404).json({
        success: false,
        message: 'Configuración del bot no encontrada'
      });
    }
    
    configBot.activo = activo;
    await configBot.save();
    
    res.json({
      success: true,
      activo: configBot.activo,
      message: activo ? 'Bot activado' : 'Bot desactivado'
    });
    
  } catch (error: any) {
    console.error('Error al activar/desactivar bot:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al cambiar estado del bot'
    });
  }
}

/**
 * GET /api/modules/calendar/bot/estadisticas/:empresaId
 * Obtener estadísticas del bot
 */
export async function obtenerEstadisticas(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    
    // Verificar acceso
    const userEmpresaId = (req as any).user?.empresaId;
    if (userEmpresaId !== empresaId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta empresa'
      });
    }
    
    // TODO: Implementar estadísticas
    // - Conversaciones totales
    // - Turnos creados por bot
    // - Tasa de conversión
    // - Horarios más solicitados
    
    res.json({
      success: true,
      estadisticas: {
        conversacionesTotales: 0,
        turnosCreados: 0,
        tasaConversion: 0,
        promedioRespuesta: 0
      }
    });
    
  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener estadísticas'
    });
  }
}
