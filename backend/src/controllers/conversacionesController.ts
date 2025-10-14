// 💬 Controlador de Conversaciones
import type { Request, Response } from 'express';
import { UsuarioModel } from '../models/Usuario.js';

/**
 * GET /api/conversaciones/:empresaId
 * Obtiene todas las conversaciones (usuarios) de una empresa
 */
export const getConversaciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId } = req.params;
    
    // Verificar que el usuario autenticado pertenece a esta empresa
    if (req.user && req.user.empresaId !== empresaId) {
      res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta empresa'
      });
      return;
    }

    // Obtener usuarios con historial de mensajes
    const usuarios = await UsuarioModel.find({ 
      empresaId,
      historial: { $exists: true, $ne: [] }
    }).sort({ ultimaInteraccion: -1 });

    const conversaciones = usuarios.map(usuario => {
      const ultimoMensaje = usuario.historial && usuario.historial.length > 0 
        ? usuario.historial[usuario.historial.length - 1]
        : null;

      // Parsear el último mensaje si es string JSON
      let mensajeParsed = null;
      if (ultimoMensaje) {
        try {
          mensajeParsed = typeof ultimoMensaje === 'string' ? JSON.parse(ultimoMensaje) : ultimoMensaje;
        } catch (e) {
          mensajeParsed = { content: ultimoMensaje, role: 'user', timestamp: usuario.ultimaInteraccion };
        }
      }

      return {
        id: usuario._id,
        nombre: usuario.nombre || 'Sin nombre',
        numero: usuario.numero,
        avatar: usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U',
        ultimoMensaje: mensajeParsed ? {
          texto: mensajeParsed.content || mensajeParsed,
          rol: mensajeParsed.role || 'user',
          fecha: mensajeParsed.timestamp || usuario.ultimaInteraccion
        } : null,
        ultimaInteraccion: usuario.ultimaInteraccion,
        interacciones: usuario.interacciones || 0,
        noLeidos: 0 // TODO: implementar contador de no leídos
      };
    });

    res.status(200).json({
      success: true,
      conversaciones
    });
  } catch (error) {
    console.error('❌ Error al obtener conversaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener conversaciones'
    });
  }
};

/**
 * GET /api/conversaciones/:empresaId/:usuarioId
 * Obtiene el historial completo de mensajes de un usuario
 */
export const getHistorialUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId, usuarioId } = req.params;
    
    // Verificar que el usuario autenticado pertenece a esta empresa
    if (req.user && req.user.empresaId !== empresaId) {
      res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta empresa'
      });
      return;
    }

    const usuario = await UsuarioModel.findById(usuarioId);
    
    if (!usuario) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    if (usuario.empresaId !== empresaId) {
      res.status(403).json({
        success: false,
        message: 'Este usuario no pertenece a tu empresa'
      });
      return;
    }

    // Formatear mensajes
    const mensajes = (usuario.historial || []).map((msg: any, index: number) => {
      // Parsear mensaje si es string JSON
      let mensajeParsed: any = msg;
      if (typeof msg === 'string') {
        try {
          mensajeParsed = JSON.parse(msg);
        } catch (e) {
          mensajeParsed = { content: msg, role: 'user', timestamp: new Date().toISOString() };
        }
      }

      return {
        id: mensajeParsed._id || `${usuario._id}-msg-${index}`,
        contenido: mensajeParsed.content || msg,
        rol: mensajeParsed.role || 'user', // 'user' o 'assistant'
        fecha: mensajeParsed.timestamp || usuario.ultimaInteraccion,
        leido: true
      };
    });

    res.status(200).json({
      success: true,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre || 'Sin nombre',
        numero: usuario.numero,
        avatar: usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U',
        ultimaInteraccion: usuario.ultimaInteraccion,
        interacciones: usuario.interacciones
      },
      mensajes
    });
  } catch (error) {
    console.error('❌ Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial'
    });
  }
};

/**
 * GET /api/conversaciones/:empresaId/buscar?q=query
 * Busca conversaciones por nombre o número
 */
export const buscarConversaciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId } = req.params;
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Parámetro de búsqueda requerido'
      });
      return;
    }

    // Verificar que el usuario autenticado pertenece a esta empresa
    if (req.user && req.user.empresaId !== empresaId) {
      res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta empresa'
      });
      return;
    }

    const usuarios = await UsuarioModel.find({
      empresaId,
      $or: [
        { nombre: { $regex: q, $options: 'i' } },
        { numero: { $regex: q, $options: 'i' } }
      ]
    }).sort({ ultimaInteraccion: -1 }).limit(20);

    const conversaciones = usuarios.map(usuario => {
      const ultimoMensaje = usuario.historial && usuario.historial.length > 0 
        ? usuario.historial[usuario.historial.length - 1]
        : null;

      // Parsear el último mensaje si es string JSON
      let mensajeParsed = null;
      if (ultimoMensaje) {
        try {
          mensajeParsed = typeof ultimoMensaje === 'string' ? JSON.parse(ultimoMensaje) : ultimoMensaje;
        } catch (e) {
          mensajeParsed = { content: ultimoMensaje, role: 'user', timestamp: usuario.ultimaInteraccion };
        }
      }

      return {
        id: usuario._id,
        nombre: usuario.nombre || 'Sin nombre',
        numero: usuario.numero,
        avatar: usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U',
        ultimoMensaje: mensajeParsed ? {
          texto: mensajeParsed.content || mensajeParsed,
          rol: mensajeParsed.role || 'user',
          fecha: mensajeParsed.timestamp || usuario.ultimaInteraccion
        } : null,
        ultimaInteraccion: usuario.ultimaInteraccion,
        interacciones: usuario.interacciones || 0
      };
    });

    res.status(200).json({
      success: true,
      conversaciones
    });
  } catch (error) {
    console.error('❌ Error al buscar conversaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar conversaciones'
    });
  }
};
