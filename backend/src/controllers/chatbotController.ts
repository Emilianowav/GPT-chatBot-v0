// 🤖 Controlador de Chatbots
import { Request, Response } from 'express';
import { ChatbotModel } from '../models/Chatbot.js';

/**
 * Obtener todos los chatbots de una empresa
 */
export const getChatbots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId } = req.query;
    const { activo } = req.query;
    
    if (!empresaId) {
      res.status(400).json({
        success: false,
        message: 'empresaId es requerido'
      });
      return;
    }
    
    const filtro: any = { empresaId: empresaId.toString() };
    
    if (activo !== undefined) {
      filtro.activo = activo === 'true';
    }
    
    const chatbots = await ChatbotModel.find(filtro).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: chatbots
    });
  } catch (error: any) {
    console.error('Error al obtener chatbots:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener chatbots'
    });
  }
};

/**
 * Obtener un chatbot por ID
 */
export const getChatbotById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const chatbot = await ChatbotModel.findById(id);
    
    if (!chatbot) {
      res.status(404).json({
        success: false,
        message: 'Chatbot no encontrado'
      });
      return;
    }
    
    res.json({
      success: true,
      data: chatbot
    });
  } catch (error: any) {
    console.error('Error al obtener chatbot:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener chatbot'
    });
  }
};

/**
 * Crear un nuevo chatbot
 */
export const createChatbot = async (req: Request, res: Response): Promise<void> => {
  try {
    const chatbot = new ChatbotModel(req.body);
    await chatbot.save();
    
    res.status(201).json({
      success: true,
      data: chatbot,
      message: 'Chatbot creado exitosamente'
    });
  } catch (error: any) {
    console.error('Error al crear chatbot:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear chatbot'
    });
  }
};

/**
 * Actualizar un chatbot
 */
export const updateChatbot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const chatbot = await ChatbotModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!chatbot) {
      res.status(404).json({
        success: false,
        message: 'Chatbot no encontrado'
      });
      return;
    }
    
    res.json({
      success: true,
      data: chatbot,
      message: 'Chatbot actualizado exitosamente'
    });
  } catch (error: any) {
    console.error('Error al actualizar chatbot:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar chatbot'
    });
  }
};

/**
 * Eliminar un chatbot
 */
export const deleteChatbot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const chatbot = await ChatbotModel.findByIdAndDelete(id);
    
    if (!chatbot) {
      res.status(404).json({
        success: false,
        message: 'Chatbot no encontrado'
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Chatbot eliminado exitosamente'
    });
  } catch (error: any) {
    console.error('Error al eliminar chatbot:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar chatbot'
    });
  }
};

/**
 * Actualizar estadísticas de un chatbot
 */
export const updateEstadisticas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { campo, incremento } = req.body;
    
    const update: any = {
      'estadisticas.ultimaActividad': new Date()
    };
    
    if (campo && incremento !== undefined) {
      update[`estadisticas.${campo}`] = { $inc: incremento };
    }
    
    const chatbot = await ChatbotModel.findByIdAndUpdate(
      id,
      update,
      { new: true }
    );
    
    if (!chatbot) {
      res.status(404).json({
        success: false,
        message: 'Chatbot no encontrado'
      });
      return;
    }
    
    res.json({
      success: true,
      data: chatbot
    });
  } catch (error: any) {
    console.error('Error al actualizar estadísticas:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar estadísticas'
    });
  }
};
