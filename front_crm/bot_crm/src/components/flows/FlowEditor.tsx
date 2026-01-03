'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Eye, Code, Settings, Zap } from 'lucide-react';
import NodeEditor from './NodeEditor';
import NodeList from './NodeList';
import FlowVisualizer from './FlowVisualizer';

interface Flow {
  _id?: string;
  empresaId: string;
  id: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  startNode: string;
  activo: boolean;
  variables: Record<string, any>;
}

interface FlowNode {
  _id?: string;
  empresaId: string;
  flowId: string;
  id: string;
  type: string;
  name: string;
  message?: string;
  options?: any[];
  validation?: any;
  conditions?: any[];
  action?: any;
  next?: string;
  activo: boolean;
}

interface FlowEditorProps {
  flow: Flow | null;
  empresaId: string;
  onClose: () => void;
}

export default function FlowEditor({ flow, empresaId, onClose }: FlowEditorProps) {
  const [flowData, setFlowData] = useState<Flow>(flow || {
    empresaId,
    id: '',
    nombre: '',
    descripcion: '',
    categoria: 'general',
    startNode: '',
    activo: false,
    variables: {}
  });

  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [isCreatingNode, setIsCreatingNode] = useState(false);
  const [activeTab, setActiveTab] = useState<'nodes' | 'visual' | 'settings'>('nodes');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (flow?._id) {
      loadNodes(flow.id);
    }
  }, [flow]);

  const loadNodes = async (flowId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/flows/${flowId}/nodes`);
      if (response.ok) {
        const data = await response.json();
        setNodes(data);
      }
    } catch (error) {
      console.error('Error loading nodes:', error);
    }
  };

  const handleSaveFlow = async () => {
    if (!flowData.nombre || !flowData.id) {
      alert('Por favor completa el nombre y el ID del flujo');
      return;
    }

    setSaving(true);
    try {
      const url = flow?._id 
        ? `http://localhost:4000/api/flows/${flow._id}`
        : 'http://localhost:4000/api/flows';
      
      const method = flow?._id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData)
      });

      if (response.ok) {
        alert('Flujo guardado exitosamente');
        if (!flow?._id) {
          const savedFlow = await response.json();
          setFlowData(savedFlow);
        }
      } else {
        alert('Error al guardar el flujo');
      }
    } catch (error) {
      console.error('Error saving flow:', error);
      alert('Error al guardar el flujo');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNode = () => {
    setIsCreatingNode(true);
    setSelectedNode(null);
  };

  const handleSelectNode = (node: FlowNode) => {
    setSelectedNode(node);
    setIsCreatingNode(false);
  };

  const handleSaveNode = async (nodeData: FlowNode) => {
    try {
      const url = nodeData._id
        ? `http://localhost:4000/api/nodes/${nodeData._id}`
        : 'http://localhost:4000/api/nodes';
      
      const method = nodeData._id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...nodeData, flowId: flowData.id, empresaId })
      });

      if (response.ok) {
        loadNodes(flowData.id);
        setSelectedNode(null);
        setIsCreatingNode(false);
      }
    } catch (error) {
      console.error('Error saving node:', error);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('¿Estás seguro de eliminar este nodo?')) return;

    try {
      const response = await fetch(`http://localhost:4000/api/nodes/${nodeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadNodes(flowData.id);
        setSelectedNode(null);
      }
    } catch (error) {
      console.error('Error deleting node:', error);
    }
  };

  const handleAddVariable = () => {
    const key = prompt('Nombre de la variable:');
    if (key) {
      const value = prompt('Valor de la variable:');
      setFlowData({
        ...flowData,
        variables: { ...flowData.variables, [key]: value || '' }
      });
    }
  };

  const handleRemoveVariable = (key: string) => {
    const newVars = { ...flowData.variables };
    delete newVars[key];
    setFlowData({ ...flowData, variables: newVars });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {flow ? 'Editar Flujo' : 'Nuevo Flujo'}
                </h1>
                <p className="text-sm text-slate-600">{flowData.nombre || 'Sin nombre'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveFlow}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar Flujo'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setActiveTab('nodes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'nodes'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Code className="w-4 h-4" />
              Nodos
            </button>
            <button
              onClick={() => setActiveTab('visual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'visual'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Eye className="w-4 h-4" />
              Vista Visual
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'settings'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              Configuración
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre del Flujo *
                </label>
                <input
                  type="text"
                  value={flowData.nombre}
                  onChange={(e) => setFlowData({ ...flowData, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Consulta de Libros"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ID del Flujo *
                </label>
                <input
                  type="text"
                  value={flowData.id}
                  onChange={(e) => setFlowData({ ...flowData, id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: consultar_libros"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={flowData.descripcion}
                  onChange={(e) => setFlowData({ ...flowData, descripcion: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Describe el propósito de este flujo..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Categoría
                </label>
                <select
                  value={flowData.categoria}
                  onChange={(e) => setFlowData({ ...flowData, categoria: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="general">General</option>
                  <option value="ventas">Ventas</option>
                  <option value="soporte">Soporte</option>
                  <option value="reservas">Reservas</option>
                  <option value="consultas">Consultas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nodo Inicial
                </label>
                <select
                  value={flowData.startNode}
                  onChange={(e) => setFlowData({ ...flowData, startNode: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar nodo...</option>
                  {nodes.map(node => (
                    <option key={node.id} value={node.id}>{node.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Variables Globales */}
            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Variables Globales</h3>
                <button
                  onClick={handleAddVariable}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Variable
                </button>
              </div>

              <div className="space-y-2">
                {Object.entries(flowData.variables).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <code className="flex-1 text-sm font-mono text-slate-700">
                      {key}: {String(value)}
                    </code>
                    <button
                      onClick={() => handleRemoveVariable(key)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {Object.keys(flowData.variables).length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No hay variables definidas
                  </p>
                )}
              </div>
            </div>

            {/* Estado */}
            <div className="border-t border-slate-200 pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flowData.activo}
                  onChange={(e) => setFlowData({ ...flowData, activo: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900">Flujo Activo</span>
                  <p className="text-xs text-slate-600">El flujo estará disponible para los usuarios</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'nodes' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Lista de Nodos */}
            <div className="col-span-1">
              <NodeList
                nodes={nodes}
                selectedNode={selectedNode}
                onSelectNode={handleSelectNode}
                onCreateNode={handleCreateNode}
                onDeleteNode={handleDeleteNode}
              />
            </div>

            {/* Editor de Nodo */}
            <div className="col-span-2">
              {(selectedNode || isCreatingNode) ? (
                <NodeEditor
                  node={selectedNode}
                  nodes={nodes}
                  onSave={handleSaveNode}
                  onCancel={() => {
                    setSelectedNode(null);
                    setIsCreatingNode(false);
                  }}
                />
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <Zap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Selecciona un nodo
                  </h3>
                  <p className="text-slate-600">
                    Selecciona un nodo de la lista o crea uno nuevo para comenzar
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'visual' && (
          <FlowVisualizer
            nodes={nodes}
            startNode={flowData.startNode}
            onSelectNode={handleSelectNode}
          />
        )}
      </div>
    </div>
  );
}
