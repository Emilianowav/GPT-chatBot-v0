// 🎯 API CRUD para Sistema de Nodos Configurables
import express, { Request, Response } from 'express';
import { FlowModel } from '../models/Flow.js';
import { FlowNodeModel } from '../models/FlowNode.js';

const router = express.Router();

// ========== FLOWS ==========

/**
 * GET /api/flows
 * Obtener todos los flujos (con filtro opcional por empresa)
 */
router.get('/flows', async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId } = req.query;
    const query = empresaId ? { empresaId } : {};
    
    console.log('🔍 [FILTRO BACKEND] empresaId recibido:', empresaId);
    console.log('🔍 [FILTRO BACKEND] Query MongoDB:', JSON.stringify(query));
    
    const flows = await FlowModel.find(query).sort({ updatedAt: -1 });
    
    console.log('🔍 [FILTRO BACKEND] Flujos encontrados:', flows.length);
    flows.forEach((flow: any) => {
      console.log(`   - ${flow.nombre}: empresaId="${flow.empresaId}"`);
    });
    
    res.json(flows);
  } catch (error: any) {
    console.error('Error getting flows:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/flows/:id
 * Obtener un flujo específico
 */
router.get('/flows/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const flow = await FlowModel.findOne({ id: req.params.id });
    if (!flow) {
      res.status(404).json({ error: 'Flow not found' });
      return;
    }
    
    // Obtener nodos del flujo
    const nodes = await FlowNodeModel.find({ flowId: req.params.id }).sort({ createdAt: 1 });
    
    res.json({ flow, nodes });
  } catch (error: any) {
    console.error('Error getting flow:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/flows
 * Crear un nuevo flujo
 */
router.post('/flows', async (req: Request, res: Response): Promise<void> => {
  try {
    const flow = await FlowModel.create(req.body);
    res.status(201).json(flow);
  } catch (error: any) {
    console.error('Error creating flow:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/flows/:id
 * Actualizar un flujo
 */
router.put('/flows/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { flow: flowData, nodes: nodesData } = req.body;
    
    // Actualizar o crear flujo
    const flow = await FlowModel.findOneAndUpdate(
      { id: req.params.id },
      { ...flowData, id: req.params.id, updatedAt: new Date() },
      { new: true, upsert: true, runValidators: true }
    );
    
    if (!flow) {
      res.status(404).json({ error: 'Flow not found' });
      return;
    }
    
    // Actualizar nodos si se proporcionan
    if (nodesData && Array.isArray(nodesData)) {
      await FlowNodeModel.deleteMany({ flowId: req.params.id });
      await FlowNodeModel.insertMany(
        nodesData.map((node: any) => ({
          ...node,
          flowId: req.params.id,
          empresaId: flow.empresaId
        }))
      );
    }
    
    res.json(flow);
  } catch (error: any) {
    console.error('Error updating flow:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PATCH /api/flows/:id
 * Actualizar parcialmente un flujo (ej: solo activo)
 */
router.patch('/flows/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const flow = await FlowModel.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    
    if (!flow) {
      res.status(404).json({ error: 'Flow not found' });
      return;
    }
    
    res.json(flow);
  } catch (error: any) {
    console.error('Error patching flow:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/flows/:id
 * Eliminar un flujo y todos sus nodos
 */
router.delete('/flows/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const flow = await FlowModel.findOne({ id: req.params.id });
    
    if (!flow) {
      res.status(404).json({ error: 'Flow not found' });
      return;
    }
    
    // Eliminar todos los nodos del flujo
    await FlowNodeModel.deleteMany({ flowId: req.params.id });
    
    // Eliminar el flujo
    await FlowModel.deleteOne({ id: req.params.id });
    
    res.json({ success: true, message: 'Flow and nodes deleted' });
  } catch (error: any) {
    console.error('Error deleting flow:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/flows/:id/duplicate
 * Duplicar un flujo con todos sus nodos
 */
router.post('/flows/:id/duplicate', async (req: Request, res: Response): Promise<void> => {
  try {
    const originalFlow = await FlowModel.findOne({ id: req.params.id });
    
    if (!originalFlow) {
      res.status(404).json({ error: 'Flow not found' });
      return;
    }
    
    // Crear copia del flujo
    const newFlow = await FlowModel.create({
      ...originalFlow.toObject(),
      _id: undefined,
      id: `${originalFlow.id}_copy_${Date.now()}`,
      nombre: `${originalFlow.nombre} (Copia)`,
      activo: false,
      createdAt: undefined,
      updatedAt: undefined
    });
    
    // Copiar nodos
    const originalNodes = await FlowNodeModel.find({ flowId: originalFlow.id });
    
    for (const node of originalNodes) {
      await FlowNodeModel.create({
        ...node.toObject(),
        _id: undefined,
        flowId: newFlow.id,
        createdAt: undefined,
        updatedAt: undefined
      });
    }
    
    res.status(201).json(newFlow);
  } catch (error: any) {
    console.error('Error duplicating flow:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/flows/:flowId/nodes
 * Obtener todos los nodos de un flujo
 */
router.get('/flows/:flowId/nodes', async (req: Request, res: Response): Promise<void> => {
  try {
    const nodes = await FlowNodeModel.find({ flowId: req.params.flowId }).sort({ createdAt: 1 });
    res.json(nodes);
  } catch (error: any) {
    console.error('Error getting nodes:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== NODES ==========

/**
 * GET /api/nodes
 * Obtener todos los nodos (con filtro opcional)
 */
router.get('/nodes', async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId, flowId } = req.query;
    const query: any = {};
    
    if (empresaId) query.empresaId = empresaId;
    if (flowId) query.flowId = flowId;
    
    const nodes = await FlowNodeModel.find(query).sort({ createdAt: 1 });
    res.json(nodes);
  } catch (error: any) {
    console.error('Error getting nodes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/nodes/:id
 * Obtener un nodo específico
 */
router.get('/nodes/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const node = await FlowNodeModel.findById(req.params.id);
    if (!node) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }
    res.json(node);
  } catch (error: any) {
    console.error('Error getting node:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/nodes
 * Crear un nuevo nodo
 */
router.post('/nodes', async (req: Request, res: Response): Promise<void> => {
  try {
    const node = await FlowNodeModel.create(req.body);
    res.status(201).json(node);
  } catch (error: any) {
    console.error('Error creating node:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/nodes/:id
 * Actualizar un nodo
 */
router.put('/nodes/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const node = await FlowNodeModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!node) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }
    
    res.json(node);
  } catch (error: any) {
    console.error('Error updating node:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/nodes/:id
 * Eliminar un nodo
 */
router.delete('/nodes/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const node = await FlowNodeModel.findByIdAndDelete(req.params.id);
    
    if (!node) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }
    
    res.json({ success: true, message: 'Node deleted' });
  } catch (error: any) {
    console.error('Error deleting node:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/nodes/:id/duplicate
 * Duplicar un nodo
 */
router.post('/nodes/:id/duplicate', async (req: Request, res: Response): Promise<void> => {
  try {
    const originalNode = await FlowNodeModel.findById(req.params.id);
    
    if (!originalNode) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }
    
    const newNode = await FlowNodeModel.create({
      ...originalNode.toObject(),
      _id: undefined,
      id: `${originalNode.id}_copy`,
      name: `${originalNode.name} (Copia)`,
      activo: false,
      createdAt: undefined,
      updatedAt: undefined
    });
    
    res.status(201).json(newNode);
  } catch (error: any) {
    console.error('Error duplicating node:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
