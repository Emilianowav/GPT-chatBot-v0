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

    // Obtener contactos con interacciones recientes (incluye los que aún no tienen historial guardado)
    const contactos = await ContactoEmpresaModel.find({ 
      empresaId,
      $or: [
        { 'conversaciones.historial': { $exists: true, $ne: [] } },
        { 'metricas.interacciones': { $gt: 0 } },
        { 'metricas.ultimaInteraccion': { $exists: true } }
      ]
    }).sort({ 'metricas.ultimaInteraccion': -1 }).limit(100);

    const conversaciones = contactos.map(contacto => {
      const historial = contacto.conversaciones?.historial || [];
      const ultimoMensaje = historial.length > 0 ? historial[historial.length - 1] : null;
      
      // Parsear último mensaje si es JSON string (formato antiguo)
      let textoUltimoMensaje = ultimoMensaje;
      let rolUltimoMensaje = historial.length > 0 && historial.length % 2 === 0 ? 'assistant' : 'user';
      
      if (ultimoMensaje && typeof ultimoMensaje === 'string') {
        try {
          const parsed = JSON.parse(ultimoMensaje);
          if (parsed.content) {
            textoUltimoMensaje = parsed.content;
            rolUltimoMensaje = parsed.role || rolUltimoMensaje;
          }
        } catch (e) {
          // No es JSON, usar como está
        }
      }

      return {
        id: contacto._id,
        nombre: `${contacto.nombre} ${contacto.apellido}`.trim() || 'Sin nombre',
        numero: contacto.telefono,
        avatar: contacto.nombre ? contacto.nombre.charAt(0).toUpperCase() : 'U',
        ultimoMensaje: ultimoMensaje ? {
          texto: textoUltimoMensaje,
          rol: rolUltimoMensaje,
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
      let rol = 'user';
      let contenido = msg;
      
      // Detectar rol por prefijo del mensaje
      if (typeof msg === 'string') {
        // Mensajes de operador (intervención manual)
        if (msg.startsWith('Operador (') || msg.startsWith('Operador:')) {
          rol = 'assistant';
          // Remover prefijo "Operador (username): " del contenido
          contenido = msg.replace(/^Operador\s*\([^)]*\):\s*/, '').replace(/^Operador:\s*/, '');
        }
        // Mensajes del cliente (intervención)
        else if (msg.startsWith('Cliente:')) {
          rol = 'user';
          contenido = msg.replace(/^Cliente:\s*/, '');
        }
        // Mensajes del bot/asistente
        else if (msg.startsWith('Bot:') || msg.startsWith('Asistente:')) {
          rol = 'assistant';
          contenido = msg.replace(/^(Bot|Asistente):\s*/, '');
        }
        // Intentar parsear JSON (formato antiguo)
        else {
          try {
            const parsed = JSON.parse(msg);
            if (parsed.content) {
              contenido = parsed.content;
              rol = parsed.role || 'user';
            }
          } catch (e) {
            // No es JSON - usar heurística de índice como fallback
            rol = index % 2 === 0 ? 'user' : 'assistant';
          }
        }
      }

      return {
        id: `${contacto._id}-msg-${index}`,
        contenido: contenido,
        rol: rol,
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
      
      // Parsear último mensaje si es JSON string (formato antiguo)
      let textoUltimoMensaje = ultimoMensaje;
      let rolUltimoMensaje = historial.length > 0 && historial.length % 2 === 0 ? 'assistant' : 'user';
      
      if (ultimoMensaje && typeof ultimoMensaje === 'string') {
        try {
          const parsed = JSON.parse(ultimoMensaje);
          if (parsed.content) {
            textoUltimoMensaje = parsed.content;
            rolUltimoMensaje = parsed.role || rolUltimoMensaje;
          }
        } catch (e) {
          // No es JSON, usar como está
        }
      }

      return {
        id: contacto._id,
        nombre: `${contacto.nombre} ${contacto.apellido}`.trim() || 'Sin nombre',
        numero: contacto.telefono,
        avatar: contacto.nombre ? contacto.nombre.charAt(0).toUpperCase() : 'U',
        ultimoMensaje: ultimoMensaje ? {
          texto: textoUltimoMensaje,
          rol: rolUltimoMensaje,
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
