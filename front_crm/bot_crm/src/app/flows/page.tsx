'use client';

import { useState, useEffect } from 'react';
import { Plus, Bot, Workflow, Settings, Play, Pause, Trash2, Copy, Edit3 } from 'lucide-react';
import FlowEditor from '@/components/flows/FlowEditor';
import FlowList from '@/components/flows/FlowList';

interface Flow {
  _id: string;
  empresaId: string;
  id: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  startNode: string;
  activo: boolean;
  variables: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string>('');

  useEffect(() => {
    // Obtener empresa del usuario actual
    const storedEmpresa = localStorage.getItem('empresaId') || 'Veo Veo';
    setEmpresaId(storedEmpresa);
    loadFlows(storedEmpresa);
  }, []);

  const loadFlows = async (empresa: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:4000/api/flows?empresaId=${empresa}`);
      if (response.ok) {
        const data = await response.json();
        setFlows(data);
      }
    } catch (error) {
      console.error('Error loading flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlow = () => {
    setIsCreating(true);
    setSelectedFlow(null);
  };

  const handleSelectFlow = (flow: Flow) => {
    setSelectedFlow(flow);
    setIsCreating(false);
  };

  const handleCloseEditor = () => {
    setSelectedFlow(null);
    setIsCreating(false);
    loadFlows(empresaId);
  };

  const handleToggleActive = async (flowId: string, currentState: boolean) => {
    try {
      const response = await fetch(`http://localhost:4000/api/flows/${flowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !currentState })
      });
      
      if (response.ok) {
        loadFlows(empresaId);
      }
    } catch (error) {
      console.error('Error toggling flow:', error);
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    if (!confirm('¿Estás seguro de eliminar este flujo?')) return;
    
    try {
      const response = await fetch(`http://localhost:4000/api/flows/${flowId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadFlows(empresaId);
      }
    } catch (error) {
      console.error('Error deleting flow:', error);
    }
  };

  const handleDuplicateFlow = async (flow: Flow) => {
    try {
      const response = await fetch(`http://localhost:4000/api/flows/${flow._id}/duplicate`, {
        method: 'POST'
      });
      
      if (response.ok) {
        loadFlows(empresaId);
      }
    } catch (error) {
      console.error('Error duplicating flow:', error);
    }
  };

  if (selectedFlow || isCreating) {
    return (
      <FlowEditor
        flow={selectedFlow}
        empresaId={empresaId}
        onClose={handleCloseEditor}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Workflow className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Gestión de Flujos</h1>
                <p className="text-slate-600 mt-1">Administra los flujos conversacionales de tu bot</p>
              </div>
            </div>
            
            <button
              onClick={handleCreateFlow}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Crear Flujo
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : flows.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6">
              <Bot className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No hay flujos creados</h3>
            <p className="text-slate-600 mb-6">Crea tu primer flujo para comenzar</p>
            <button
              onClick={handleCreateFlow}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Crear Primer Flujo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flows.map((flow) => (
              <div
                key={flow._id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border border-slate-200 overflow-hidden group"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">{flow.nombre}</h3>
                      <p className="text-sm text-slate-600 line-clamp-2">{flow.descripcion || 'Sin descripción'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      flow.activo 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {flow.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Workflow className="w-4 h-4" />
                      {flow.categoria}
                    </span>
                    <span className="flex items-center gap-1">
                      <Settings className="w-4 h-4" />
                      {flow.startNode}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-slate-50 flex items-center justify-between">
                  <button
                    onClick={() => handleSelectFlow(flow)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(flow._id, flow.activo)}
                      className={`p-2 rounded-lg transition-colors ${
                        flow.activo
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-slate-400 hover:bg-slate-100'
                      }`}
                      title={flow.activo ? 'Desactivar' : 'Activar'}
                    >
                      {flow.activo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleDuplicateFlow(flow)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Duplicar"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteFlow(flow._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
