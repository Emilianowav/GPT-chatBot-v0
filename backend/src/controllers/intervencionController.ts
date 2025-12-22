// 🎯 Controlador de Intervención de Conversaciones
import type { Request, Response } from 'express';
import {
  pausarChatbot,
  reanudarChatbot,
  enviarMensajeManual,
  obtenerEstadoIntervencion
} from '../services/intervencionService.js';

/**
 * POST /api/intervencion/:contactoId/pausar
 * Pausar el chatbot para un contacto
 */
export const pausarChatbotController = async (req: Request, res: Response) => {
  try {
    const { contactoId } = req.params;
    const empresaId = req.user?.empresaId;
    const usuario = req.user?.username || 'Operador';

    if (!empresaId) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (!contactoId) {
      res.status(400).json({ error: 'contactoId es requerido' });
      return;
    }

    const contacto = await pausarChatbot(contactoId, empresaId, usuario);

    res.json({
      success: true,
      message: 'Chatbot pausado correctamente',
      contacto: {
        id: contacto._id,
        nombre: `${contacto.nombre} ${contacto.apellido}`,
        chatbotPausado: contacto.chatbotPausado,
        pausadoPor: contacto.chatbotPausadoPor,
        pausadoEn: contacto.chatbotPausadoEn
      }
    });
  } catch (error: any) {
    console.error('❌ Error pausando chatbot:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/intervencion/:contactoId/reanudar
 * Reanudar el chatbot para un contacto
 */
export const reanudarChatbotController = async (req: Request, res: Response) => {
  try {
    const { contactoId } = req.params;
    const empresaId = req.user?.empresaId;

    if (!empresaId) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (!contactoId) {
      res.status(400).json({ error: 'contactoId es requerido' });
      return;
    }

    const contacto = await reanudarChatbot(contactoId, empresaId);

    res.json({
      success: true,
      message: 'Chatbot reanudado correctamente',
      contacto: {
        id: contacto._id,
        nombre: `${contacto.nombre} ${contacto.apellido}`,
        chatbotPausado: contacto.chatbotPausado
      }
    });
  } catch (error: any) {
    console.error('❌ Error reanudando chatbot:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/intervencion/:contactoId/mensaje
 * Enviar mensaje manual desde el CRM
 */
export const enviarMensajeController = async (req: Request, res: Response) => {
  try {
    const { contactoId } = req.params;
    const { mensaje } = req.body;
    const empresaId = req.user?.empresaId;
    const usuario = req.user?.username || 'Operador';

    if (!empresaId) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (!contactoId) {
      res.status(400).json({ error: 'contactoId es requerido' });
      return;
    }

    if (!mensaje || !mensaje.trim()) {
      res.status(400).json({ error: 'El mensaje no puede estar vacío' });
      return;
    }

    const result = await enviarMensajeManual(contactoId, empresaId, mensaje.trim(), usuario);

    res.json({
      success: true,
      message: 'Mensaje enviado correctamente',
      messageId: result.messageId
    });
  } catch (error: any) {
    console.error('❌ Error enviando mensaje:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/intervencion/:contactoId/estado
 * Obtener estado de intervención de un contacto
 */
export const obtenerEstadoController = async (req: Request, res: Response) => {
  try {
    const { contactoId } = req.params;
    const empresaId = req.user?.empresaId;

    if (!empresaId) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (!contactoId) {
      res.status(400).json({ error: 'contactoId es requerido' });
      return;
    }

    const estado = await obtenerEstadoIntervencion(contactoId, empresaId);

    res.json({
      success: true,
      ...estado
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo estado:', error);
    res.status(500).json({ error: error.message });
  }
};
