/**
 * 💬 Controlador de Mensajes de Flujo
 */

import { Request, Response } from 'express';
import { ConfiguracionModuloModel } from '../models/ConfiguracionModulo.js';

/**
 * Obtener todos los mensajes de flujo de una empresa
 */
export const obtenerMensajesFlujo = async (req: Request, res: Response) => {
  try {
    const { empresaId } = req.params;
    
    const config = await ConfiguracionModuloModel.findOne({ empresaId });
    
    if (!config) {
      res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
      return;
    }
    
    res.json({
      success: true,
      data: {
        mensajesFlujo: config.mensajesFlujo || {},
        variablesDinamicas: config.variablesDinamicas || {}
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo mensajes de flujo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener mensajes de flujo'
    });
  }
};

/**
 * Actualizar mensajes de un flujo específico
 */
export const actualizarMensajesFlujo = async (req: Request, res: Response) => {
  try {
    const { empresaId, flujo } = req.params;
    const { mensajes } = req.body;
    
    const flujosValidos = ['confirmacion_turnos', 'menu_principal', 'notificacion_viajes'];
    if (!flujosValidos.includes(flujo)) {
      res.status(400).json({
        success: false,
        message: 'Flujo no válido'
      });
      return;
    }
    
    const config = await ConfiguracionModuloModel.findOne({ empresaId });
    
    if (!config) {
      res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
      return;
    }
    
    if (!config.mensajesFlujo) {
      config.mensajesFlujo = {};
    }
    
    (config.mensajesFlujo as any)[flujo] = mensajes;
    
    await config.save();
    
    res.json({
      success: true,
      message: 'Mensajes actualizados correctamente',
      data: config.mensajesFlujo
    });
    
  } catch (error) {
    console.error('❌ Error actualizando mensajes de flujo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar mensajes de flujo'
    });
  }
};

/**
 * Actualizar variables dinámicas de una empresa
 */
export const actualizarVariablesDinamicas = async (req: Request, res: Response) => {
  try {
    const { empresaId } = req.params;
    const { variables } = req.body;
    
    const config = await ConfiguracionModuloModel.findOne({ empresaId });
    
    if (!config) {
      res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
      return;
    }
    
    config.variablesDinamicas = variables;
    await config.save();
    
    res.json({
      success: true,
      message: 'Variables dinámicas actualizadas correctamente',
      data: config.variablesDinamicas
    });
    
  } catch (error) {
    console.error('❌ Error actualizando variables dinámicas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar variables dinámicas'
    });
  }
};

/**
 * Obtener campos personalizados configurados
 */
export const obtenerCamposPersonalizados = async (req: Request, res: Response) => {
  try {
    const { empresaId } = req.params;
    
    const config = await ConfiguracionModuloModel.findOne({ empresaId });
    
    if (!config) {
      res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
      return;
    }
    
    res.json({
      success: true,
      data: {
        camposPersonalizados: config.camposPersonalizados || []
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo campos personalizados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener campos personalizados'
    });
  }
};

/**
 * Actualizar campos personalizados
 */
export const actualizarCamposPersonalizados = async (req: Request, res: Response) => {
  try {
    const { empresaId } = req.params;
    const { campos } = req.body;
    
    const config = await ConfiguracionModuloModel.findOne({ empresaId });
    
    if (!config) {
      res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
      return;
    }
    
    config.camposPersonalizados = campos;
    await config.save();
    
    res.json({
      success: true,
      message: 'Campos personalizados actualizados correctamente',
      data: config.camposPersonalizados
    });
    
  } catch (error) {
    console.error('❌ Error actualizando campos personalizados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar campos personalizados'
    });
  }
};

/**
 * Previsualizar mensaje con variables reemplazadas
 */
export const previsualizarMensaje = async (req: Request, res: Response) => {
  try {
    const { empresaId } = req.params;
    const { mensaje, variables } = req.body;
    
    const config = await ConfiguracionModuloModel.findOne({ empresaId });
    
    if (!config) {
      res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
      return;
    }
    
    let resultado = mensaje;
    
    if (config.variablesDinamicas) {
      for (const [key, value] of Object.entries(config.variablesDinamicas)) {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        resultado = resultado.replace(regex, String(value));
      }
    }
    
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        resultado = resultado.replace(regex, String(value));
      }
    }
    
    res.json({
      success: true,
      data: {
        mensajeOriginal: mensaje,
        mensajePreview: resultado
      }
    });
    
  } catch (error) {
    console.error('❌ Error previsualizando mensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al previsualizar mensaje'
    });
  }
};
