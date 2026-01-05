import { Request, Response } from 'express';
import { FlowService } from '../services/flow.service';

export class FlowController {
  private flowService: FlowService;

  constructor() {
    this.flowService = new FlowService();
  }

  getFlowsByEmpresa = async (req: Request, res: Response) => {
    try {
      const { empresaId } = req.params;
      const flows = await this.flowService.getFlowsByEmpresa(empresaId);
      res.json(flows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getFlowById = async (req: Request, res: Response) => {
    try {
      const { flowId } = req.params;
      const flow = await this.flowService.getFlowById(flowId);
      
      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }
      
      res.json(flow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  createFlow = async (req: Request, res: Response) => {
    try {
      const flowData = req.body;
      const newFlow = await this.flowService.createFlow(flowData);
      res.status(201).json(newFlow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  updateFlow = async (req: Request, res: Response) => {
    try {
      const { flowId } = req.params;
      const flowData = req.body;
      const updatedFlow = await this.flowService.updateFlow(flowId, flowData);
      
      if (!updatedFlow) {
        return res.status(404).json({ error: 'Flow not found' });
      }
      
      res.json(updatedFlow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  deleteFlow = async (req: Request, res: Response) => {
    try {
      const { flowId } = req.params;
      await this.flowService.deleteFlow(flowId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  executeFlow = async (req: Request, res: Response) => {
    try {
      const { flowId } = req.params;
      const { telefono, mensaje } = req.body;
      
      const result = await this.flowService.executeFlow(flowId, telefono, mensaje);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
