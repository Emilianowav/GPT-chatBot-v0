// 💬 Controlador de Conversaciones
import type { Request, Response } from 'express';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';

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

    // Obtener contactos con historial de mensajes
    const contactos = await ContactoEmpresaModel.find({ 
      empresaId,
      'conversaciones.historial': { $exists: true, $ne: [] }
    }).sort({ 'metricas.ultimaInteraccion': -1 });

    const conversaciones = contactos.map(contacto => {
      const historial = contacto.conversaciones?.historial || [];
      const ultimoMensaje = historial.length > 0 ? historial[historial.length - 1] : null;
      
      // Determinar el rol del último mensaje (par = user, impar = assistant)
      const ultimoRol = historial.length > 0 && historial.length % 2 === 0 ? 'assistant' : 'user';

      return {
        id: contacto._id,
        nombre: `${contacto.nombre} ${contacto.apellido}`.trim() || 'Sin nombre',
        numero: contacto.telefono,
        avatar: contacto.nombre ? contacto.nombre.charAt(0).toUpperCase() : 'U',
        ultimoMensaje: ultimoMensaje ? {
          texto: ultimoMensaje,
          rol: ultimoRol,
          fecha: contacto.conversaciones?.ultimaConversacion || contacto.metricas.ultimaInteraccion
        } : null,
        ultimaInteraccion: contacto.metricas.ultimaInteraccion,
        interacciones: contacto.metricas.interacciones || 0,
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

    const contacto = await ContactoEmpresaModel.findById(usuarioId);
    
    if (!contacto) {
      res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
      return;
    }

    if (contacto.empresaId !== empresaId) {
      res.status(403).json({
        success: false,
        message: 'Este contacto no pertenece a tu empresa'
      });
      return;
    }

    // Formatear mensajes del historial
    const historial = contacto.conversaciones?.historial || [];
    const mensajes = historial.map((msg: string, index: number) => {
      // Determinar el rol: índice par = user, índice impar = assistant
      const rol = index % 2 === 0 ? 'user' : 'assistant';

      return {
        id: `${contacto._id}-msg-${index}`,
        contenido: msg,
        rol: rol, // 'user' o 'assistant'
        fecha: contacto.conversaciones?.ultimaConversacion || contacto.metricas.ultimaInteraccion,
        leido: true
      };
    });

    res.status(200).json({
      success: true,
      usuario: {
        id: contacto._id,
        nombre: `${contacto.nombre} ${contacto.apellido}`.trim() || 'Sin nombre',
        numero: contacto.telefono,
        avatar: contacto.nombre ? contacto.nombre.charAt(0).toUpperCase() : 'U',
        ultimaInteraccion: contacto.metricas.ultimaInteraccion,
        interacciones: contacto.metricas.interacciones
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

    const contactos = await ContactoEmpresaModel.find({
      empresaId,
      $or: [
        { nombre: { $regex: q, $options: 'i' } },
        { apellido: { $regex: q, $options: 'i' } },
        { telefono: { $regex: q, $options: 'i' } }
      ]
    }).sort({ 'metricas.ultimaInteraccion': -1 }).limit(20);

    const conversaciones = contactos.map(contacto => {
      const historial = contacto.conversaciones?.historial || [];
      const ultimoMensaje = historial.length > 0 ? historial[historial.length - 1] : null;
      
      // Determinar el rol del último mensaje (par = user, impar = assistant)
      const ultimoRol = historial.length > 0 && historial.length % 2 === 0 ? 'assistant' : 'user';

      return {
        id: contacto._id,
        nombre: `${contacto.nombre} ${contacto.apellido}`.trim() || 'Sin nombre',
        numero: contacto.telefono,
        avatar: contacto.nombre ? contacto.nombre.charAt(0).toUpperCase() : 'U',
        ultimoMensaje: ultimoMensaje ? {
          texto: ultimoMensaje,
          rol: ultimoRol,
          fecha: contacto.conversaciones?.ultimaConversacion || contacto.metricas.ultimaInteraccion
        } : null,
        ultimaInteraccion: contacto.metricas.ultimaInteraccion,
        interacciones: contacto.metricas.interacciones || 0
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
