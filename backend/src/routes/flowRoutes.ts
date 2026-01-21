// 🔄 Rutas para gestión de flujos
import express, { Request, Response } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { flowManager } from '../flows/FlowManager.js';
import { ConversationStateModel } from '../models/ConversationState.js';
import { FlowModel } from '../models/Flow.js';
import mongoose from 'mongoose';

const router = express.Router();

// ============================================================================
// RUTAS PARA FLOW BUILDER (CRUD DE FLOWS VISUALES)
// ============================================================================

/**
 * GET /api/flows/by-id/:flowId
 * Obtener un flow específico por _id de MongoDB
 * CRÍTICO: Usa MongoDB driver directamente para evitar caché de Mongoose
 * IMPORTANTE: Esta ruta debe estar ANTES de /:empresaId para evitar conflictos
 */
router.get('/by-id/:flowId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { flowId } = req.params;
    
    console.log(`\n🔍 REQUEST /api/flows/by-id/${flowId}`);
    
    // Usar MongoDB driver directamente, NO Mongoose
    const db = mongoose.connection.db;
    console.log(`📊 Base de datos: ${db.databaseName}`);
    
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(flowId) 
    });
    
    console.log(`🔍 Query ejecutado: { _id: ObjectId("${flowId}") }`);
    
    if (!flow) {
      console.log('❌ Flow no encontrado en MongoDB');
      res.status(404).json({ error: 'Flow not found' });
      return;
    }
    
    console.log(`✅ Flow encontrado en MongoDB:`);
    console.log(`   Nombre: ${flow.nombre}`);
    console.log(`   Nodos: ${flow.nodes?.length}`);
    console.log(`   IDs de nodos: ${flow.nodes?.map((n: any) => n.id).join(', ')}`);
    
    // Verificar qué se va a enviar
    const responseData = flow;
    console.log(`📤 Enviando al cliente: ${responseData.nodes?.length} nodos`);
    
    res.json(responseData);
  } catch (error: any) {
    console.error('❌ Error obteniendo flow:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/flows/:flowId/toggle
 * Pausar o activar un flow (toggle activo)
 * IMPORTANTE: Esta ruta debe estar ANTES de /:empresaId para evitar conflictos
 */
router.patch('/:flowId/toggle', async (req: Request, res: Response): Promise<void> => {
  try {
    const { flowId } = req.params;
    
    console.log(`🔄 Toggle flow: ${flowId}`);
    
    // Obtener el flow actual solo para leer el estado
    const flow = await FlowModel.findById(flowId).lean();
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      res.status(404).json({ error: 'Flow not found' });
      return;
    }
    
    // Toggle el estado activo usando updateOne para evitar validación
    const newActivo = !flow.activo;
    await FlowModel.updateOne(
      { _id: flowId },
      { 
        $set: { 
          activo: newActivo,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`${newActivo ? '▶️' : '⏸️'} Flow ${newActivo ? 'activado' : 'pausado'}: ${flow.nombre}`);
    
    res.json({
      success: true,
      activo: newActivo,
      message: `Flow ${newActivo ? 'activado' : 'pausado'} exitosamente`
    });
  } catch (error: any) {
    console.error('Error toggling flow:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/flows
 * Obtener todos los flows (con filtro opcional por empresa)
 * IMPORTANTE: Esta ruta debe estar ANTES de /:empresaId
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId } = req.query;
    const query = empresaId ? { empresaId } : {};
    
    console.log('🔍 [FILTRO BACKEND] empresaId recibido:', empresaId);
    console.log('🔍 [FILTRO BACKEND] Query MongoDB:', JSON.stringify(query));
    
    const flows = await FlowModel.find(query).sort({ createdAt: -1 });
    
    console.log('🔍 [FILTRO BACKEND] Flujos encontrados:', flows.length);
    flows.forEach((flow: any) => {
      console.log(`   - ${flow.nombre}: empresaId="${flow.empresaId}"`);
    });
    
    res.json(flows);
  } catch (error: any) {
    console.error('Error obteniendo flows:', error);
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
    
    // Si no tiene id, generar uno único para flujos visuales
    if (!flowData.id) {
      flowData.id = `visual-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }
    
    const newFlow = new FlowModel({ ...flowData, botType: 'visual' });
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
 * NOTA: Sin autenticación para permitir edición desde flow builder
 */
router.put('/:flowId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { flowId } = req.params;
    const flowData = req.body;
    
    console.log(`\n📝 PUT /api/flows/${flowId}`);
    console.log(`📊 Datos recibidos:`, {
      nombre: flowData.nombre,
      empresaId: flowData.empresaId,
      nodos: flowData.nodes?.length,
      edges: flowData.edges?.length,
      config: flowData.config ? 'presente' : 'ausente'
    });
    
    // IMPORTANTE: No sobrescribir el campo 'id' para evitar conflicto con índice único
    const { id, _id, ...updateData } = flowData;
    
    // Obtener el flujo actual para verificar si tiene id
    const currentFlow = await FlowModel.findById(flowId);
    if (!currentFlow) {
      console.log('❌ Flow no encontrado');
      res.status(404).json({ error: 'Flow not found' });
      return;
    }
    
    // Si el flujo no tiene id, asignarle uno basado en su _id
    let finalId = currentFlow.id;
    if (!finalId || finalId === null) {
      finalId = `visual-${flowId}`;
      console.log(`🔧 Asignando id automático: ${finalId}`);
    }
    
    const updatedFlow = await FlowModel.findByIdAndUpdate(
      flowId,
      { 
        ...updateData,
        id: finalId,
        updatedAt: new Date()
      },
      { new: true, runValidators: false }
    );
    
    if (!updatedFlow) {
      console.log('❌ Flow no encontrado');
      res.status(404).json({ error: 'Flow not found' });
      return;
    }
    
    console.log('✅ Flow actualizado exitosamente');
    res.json(updatedFlow);
  } catch (error: any) {
    console.error('❌ Error actualizando flow:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message, details: error.stack });
  }
});

/**
 * DELETE /api/flows/:flowId
 * Eliminar (desactivar) un flow
 */
router.delete('/:flowId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { flowId } = req.params;
    const deletedFlow = await FlowModel.findByIdAndUpdate(
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

/**
 * GET /api/flows/:empresaId
 * Obtener todos los flows de una empresa específica
 * IMPORTANTE: Esta ruta debe estar AL FINAL para no capturar rutas específicas
 */
router.get('/:empresaId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId } = req.params;
    const flows = await FlowModel.find({ empresaId, activo: true, botType: 'visual' }).sort({ createdAt: -1 });
    console.log(`📋 Obteniendo flows de empresa ${empresaId}: ${flows.length} encontrados`);
    res.json(flows);
  } catch (error: any) {
    console.error('Error obteniendo flows:', error);
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
