// 🔄 Rutas para gestión de flujos
import express, { Request, Response } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { flowManager } from '../flows/FlowManager.js';
import { ConversationStateModel } from '../models/ConversationState.js';

const router = express.Router();

/**
 * GET /api/flows/:empresaId/active
 * Obtener todos los flujos activos de una empresa
 */
router.get('/:empresaId/active', authenticate, async (req, res) => {
  try {
    const { empresaId } = req.params;
    
    // Verificar que el usuario tenga acceso a esta empresa
    if (req.user?.empresaId !== empresaId && req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    const estados = await ConversationStateModel.find({
      empresaId,
      flujo_activo: { $ne: null }
    }).sort({ ultima_interaccion: -1 });
    
    const flujosActivos = estados.map(estado => ({
      telefono: estado.telefono,
      flujo: estado.flujo_activo,
      estado: estado.estado_actual,
      prioridad: estado.prioridad,
      pausado: estado.pausado || false,
      ultimaInteraccion: estado.ultima_interaccion,
      data: estado.data
    }));
    
    res.json(flujosActivos);
  } catch (error) {
    console.error('Error obteniendo flujos activos:', error);
    res.status(500).json({ error: 'Error al obtener flujos activos' });
  }
});

/**
 * POST /api/flows/:empresaId/pause
 * Pausar un flujo activo
 */
router.post('/:empresaId/pause', authenticate, async (req, res) => {
  try {
    const { empresaId } = req.params;
    const { telefono } = req.body;
    
    // Verificar que el usuario tenga acceso a esta empresa
    if (req.user?.empresaId !== empresaId && req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    if (!telefono) {
      return res.status(400).json({ error: 'Teléfono requerido' });
    }
    
    const estado = await ConversationStateModel.findOne({ telefono, empresaId });
    
    if (!estado || !estado.flujo_activo) {
      return res.status(404).json({ error: 'No hay flujo activo para este usuario' });
    }
    
    estado.pausado = true;
    await estado.save();
    
    console.log(`⏸️ Flujo pausado: ${estado.flujo_activo} para ${telefono}`);
    
    res.json({
      success: true,
      message: 'Flujo pausado exitosamente',
      flujo: estado.flujo_activo,
      telefono
    });
  } catch (error) {
    console.error('Error pausando flujo:', error);
    res.status(500).json({ error: 'Error al pausar flujo' });
  }
});

/**
 * POST /api/flows/:empresaId/resume
 * Reanudar un flujo pausado
 */
router.post('/:empresaId/resume', authenticate, async (req, res) => {
  try {
    const { empresaId } = req.params;
    const { telefono } = req.body;
    
    // Verificar que el usuario tenga acceso a esta empresa
    if (req.user?.empresaId !== empresaId && req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    if (!telefono) {
      return res.status(400).json({ error: 'Teléfono requerido' });
    }
    
    const estado = await ConversationStateModel.findOne({ telefono, empresaId });
    
    if (!estado || !estado.flujo_activo) {
      return res.status(404).json({ error: 'No hay flujo para este usuario' });
    }
    
    estado.pausado = false;
    await estado.save();
    
    console.log(`▶️ Flujo reanudado: ${estado.flujo_activo} para ${telefono}`);
    
    res.json({
      success: true,
      message: 'Flujo reanudado exitosamente',
      flujo: estado.flujo_activo,
      telefono
    });
  } catch (error) {
    console.error('Error reanudando flujo:', error);
    res.status(500).json({ error: 'Error al reanudar flujo' });
  }
});

/**
 * POST /api/flows/:empresaId/cancel
 * Cancelar un flujo activo
 */
router.post('/:empresaId/cancel', authenticate, async (req, res) => {
  try {
    const { empresaId } = req.params;
    const { telefono } = req.body;
    
    // Verificar que el usuario tenga acceso a esta empresa
    if (req.user?.empresaId !== empresaId && req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    if (!telefono) {
      return res.status(400).json({ error: 'Teléfono requerido' });
    }
    
    await flowManager.cancelFlow(telefono, empresaId);
    
    console.log(`🚫 Flujo cancelado para ${telefono}`);
    
    res.json({
      success: true,
      message: 'Flujo cancelado exitosamente',
      telefono
    });
  } catch (error) {
    console.error('Error cancelando flujo:', error);
    res.status(500).json({ error: 'Error al cancelar flujo' });
  }
});

export default router;
