// 🔄 Rutas para gestión de flujos
import express, { Request, Response } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { flowManager } from '../flows/FlowManager.js';
import { ConversationStateModel } from '../models/ConversationState.js';
import { Flow } from '../models/flow.model.js';

const router = express.Router();

// ============================================================================
// RUTAS PARA FLOW BUILDER (CRUD DE FLOWS VISUALES)
// ============================================================================

/**
 * GET /api/flows/:empresaId
 * Obtener todos los flows de una empresa
 */
router.get('/:empresaId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId } = req.params;
    const flows = await Flow.find({ empresaId, activo: true }).sort({ createdAt: -1 });
    res.json(flows);
  } catch (error: any) {
    console.error('Error obteniendo flows:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/flows/detail/:flowId
 * Obtener un flow específico por ID
 */
router.get('/detail/:flowId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { flowId } = req.params;
    const flow = await Flow.findById(flowId);
    
    if (!flow) {
      res.status(404).json({ error: 'Flow not found' });
      return;
    }
    
    res.json(flow);
  } catch (error: any) {
    console.error('Error obteniendo flow:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/flows
 * Crear un nuevo flow
 */
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const flowData = req.body;
    const newFlow = new Flow(flowData);
    await newFlow.save();
    res.status(201).json(newFlow);
  } catch (error: any) {
    console.error('Error creando flow:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/flows/:flowId
 * Actualizar un flow existente
 */
router.put('/:flowId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { flowId } = req.params;
    const flowData = req.body;
    const updatedFlow = await Flow.findByIdAndUpdate(
      flowId,
      { ...flowData, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updatedFlow) {
      res.status(404).json({ error: 'Flow not found' });
      return;
    }
    
    res.json(updatedFlow);
  } catch (error: any) {
    console.error('Error actualizando flow:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/flows/:flowId
 * Eliminar (desactivar) un flow
 */
router.delete('/:flowId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { flowId } = req.params;
    const deletedFlow = await Flow.findByIdAndUpdate(
      flowId,
      { activo: false, updatedAt: new Date() },
      { new: true }
    );
    
    if (!deletedFlow) {
      res.status(404).json({ error: 'Flow not found' });
      return;
    }
    
    res.status(204).send();
  } catch (error: any) {
    console.error('Error eliminando flow:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// RUTAS PARA GESTIÓN DE FLUJOS ACTIVOS (EXISTENTES)
// ============================================================================

/**
 * GET /api/flows/:empresaId/active
 * Obtener todos los flujos activos de una empresa
 */
router.get('/:empresaId/active', authenticate, async (req, res): Promise<void> => {
  try {
    const { empresaId } = req.params;
    
    // Verificar que el usuario tenga acceso a esta empresa
    if (req.user?.empresaId !== empresaId && req.user?.role !== 'superadmin') {
      res.status(403).json({ error: 'No autorizado' });
      return;
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
router.post('/:empresaId/pause', authenticate, async (req, res): Promise<void> => {
  try {
    const { empresaId } = req.params;
    const { telefono } = req.body;
    
    // Verificar que el usuario tenga acceso a esta empresa
    if (req.user?.empresaId !== empresaId && req.user?.role !== 'superadmin') {
      res.status(403).json({ error: 'No autorizado' });
      return;
    }
    
    if (!telefono) {
      res.status(400).json({ error: 'Teléfono requerido' });
      return;
    }
    
    const estado = await ConversationStateModel.findOne({ telefono, empresaId });
    
    if (!estado || !estado.flujo_activo) {
      res.status(404).json({ error: 'No hay flujo activo para este usuario' });
      return;
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
router.post('/:empresaId/resume', authenticate, async (req, res): Promise<void> => {
  try {
    const { empresaId } = req.params;
    const { telefono } = req.body;
    
    // Verificar que el usuario tenga acceso a esta empresa
    if (req.user?.empresaId !== empresaId && req.user?.role !== 'superadmin') {
      res.status(403).json({ error: 'No autorizado' });
      return;
    }
    
    if (!telefono) {
      res.status(400).json({ error: 'Teléfono requerido' });
      return;
    }
    
    const estado = await ConversationStateModel.findOne({ telefono, empresaId });
    
    if (!estado || !estado.flujo_activo) {
      res.status(404).json({ error: 'No hay flujo para este usuario' });
      return;
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
router.post('/:empresaId/cancel', authenticate, async (req, res): Promise<void> => {
  try {
    const { empresaId } = req.params;
    const { telefono } = req.body;
    
    // Verificar que el usuario tenga acceso a esta empresa
    if (req.user?.empresaId !== empresaId && req.user?.role !== 'superadmin') {
      res.status(403).json({ error: 'No autorizado' });
      return;
    }
    
    if (!telefono) {
      res.status(400).json({ error: 'Teléfono requerido' });
      return;
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
