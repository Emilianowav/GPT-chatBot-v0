const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data?: any;
}

export interface Flow {
  _id?: string;
  nombre: string;
  descripcion?: string;
  empresaId: string;
  activo: boolean;
  nodes: FlowNode[];
  edges: FlowEdge[];
  createdAt?: Date;
  updatedAt?: Date;
}

class FlowService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error en la petición');
    }

    return response.json();
  }

  async getFlowsByEmpresa(empresaId: string): Promise<Flow[]> {
    return this.fetchWithAuth(`/api/flows/${empresaId}`);
  }

  async getFlowById(flowId: string): Promise<Flow> {
    return this.fetchWithAuth(`/api/flows/detail/${flowId}`);
  }

  async createFlow(flow: Omit<Flow, '_id' | 'createdAt' | 'updatedAt'>): Promise<Flow> {
    return this.fetchWithAuth('/api/flows', {
      method: 'POST',
      body: JSON.stringify(flow),
    });
  }

  async updateFlow(flowId: string, flow: Partial<Flow>): Promise<Flow> {
    return this.fetchWithAuth(`/api/flows/${flowId}`, {
      method: 'PUT',
      body: JSON.stringify(flow),
    });
  }

  async deleteFlow(flowId: string): Promise<void> {
    return this.fetchWithAuth(`/api/flows/${flowId}`, {
      method: 'DELETE',
    });
  }

  async executeFlow(flowId: string, telefono: string, mensaje: string): Promise<any> {
    return this.fetchWithAuth(`/api/flows/${flowId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ telefono, mensaje }),
    });
  }
}

export const flowService = new FlowService();
