import { Router, Request, Response } from 'express';
import { FlowModel } from '../models/Flow.js';
import { FlowNodeModel } from '../models/FlowNode.js';

const router = Router();

/**
 * GET /api/flows/:flowId
 * Obtener un flujo con todos sus nodos
 */
router.get('/:flowId', async (req: Request, res: Response) => {
  try {
    const { flowId } = req.params;
    
    // Buscar el flujo
    const flow = await FlowModel.findOne({ id: flowId });
    
    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'Flujo no encontrado'
      });
    }
    
    // Buscar todos los nodos del flujo
    const nodes = await FlowNodeModel.find({
      flowId: flowId,
      empresaId: flow.empresaId
    }).sort({ 'metadata.position.y': 1 });
    
    res.json({
      success: true,
      flow,
      nodes
    });
    
  } catch (error: any) {
    console.error('Error obteniendo flujo:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo flujo',
      error: error.message
    });
  }
});

/**
 * PUT /api/flows/:flowId
 * Guardar o actualizar un flujo con sus nodos
 */
router.put('/:flowId', async (req: Request, res: Response) => {
  try {
    const { flowId } = req.params;
    const { flow: flowData, nodes: nodesData } = req.body;
    
    if (!flowData || !nodesData) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos'
      });
    }
    
    // Actualizar o crear el flujo
    const flow = await FlowModel.findOneAndUpdate(
      { id: flowId },
      {
        ...flowData,
        id: flowId,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    // Eliminar nodos antiguos
    await FlowNodeModel.deleteMany({
      flowId: flowId,
      empresaId: flow.empresaId
    });
    
    // Crear nuevos nodos
    const nodes = await FlowNodeModel.insertMany(
      nodesData.map((node: any) => ({
        ...node,
        flowId: flowId,
        empresaId: flow.empresaId,
        activo: true
      }))
    );
    
    res.json({
      success: true,
      message: 'Flujo guardado correctamente',
      flow,
      nodes
    });
    
  } catch (error: any) {
    console.error('Error guardando flujo:', error);
    res.status(500).json({
      success: false,
      message: 'Error guardando flujo',
      error: error.message
    });
  }
});

/**
 * GET /api/flows
 * Listar todos los flujos de una empresa
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { empresaId } = req.query;
    
    if (!empresaId) {
      return res.status(400).json({
        success: false,
        message: 'empresaId requerido'
      });
    }
    
    const flows = await FlowModel.find({ empresaId }).sort({ nombre: 1 });
    
    res.json({
      success: true,
      flows
    });
    
  } catch (error: any) {
    console.error('Error listando flujos:', error);
    res.status(500).json({
      success: false,
      message: 'Error listando flujos',
      error: error.message
    });
  }
});

/**
 * DELETE /api/flows/:flowId
 * Eliminar un flujo y todos sus nodos
 */
router.delete('/:flowId', async (req: Request, res: Response) => {
  try {
    const { flowId } = req.params;
    
    const flow = await FlowModel.findOne({ id: flowId });
    
    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'Flujo no encontrado'
      });
    }
    
    // Eliminar nodos
    await FlowNodeModel.deleteMany({
      flowId: flowId,
      empresaId: flow.empresaId
    });
    
    // Eliminar flujo
    await FlowModel.deleteOne({ id: flowId });
    
    res.json({
      success: true,
      message: 'Flujo eliminado correctamente'
    });
    
  } catch (error: any) {
    console.error('Error eliminando flujo:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando flujo',
      error: error.message
    });
  }
});

export default router;
