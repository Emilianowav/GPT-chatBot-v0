'use client';

import { Plus, Menu, MessageSquare, GitBranch, Zap, Globe, Brain, Trash2 } from 'lucide-react';

interface FlowNode {
  _id?: string;
  id: string;
  type: string;
  name: string;
  activo: boolean;
}

interface NodeListProps {
  nodes: FlowNode[];
  selectedNode: FlowNode | null;
  onSelectNode: (node: FlowNode) => void;
  onCreateNode: () => void;
  onDeleteNode: (nodeId: string) => void;
}

const nodeTypeIcons: Record<string, any> = {
  menu: Menu,
  input: MessageSquare,
  message: MessageSquare,
  condition: GitBranch,
  action: Zap,
  api_call: Globe,
  gpt: Brain
};

const nodeTypeColors: Record<string, string> = {
  menu: 'bg-blue-100 text-blue-700',
  input: 'bg-green-100 text-green-700',
  message: 'bg-purple-100 text-purple-700',
  condition: 'bg-yellow-100 text-yellow-700',
  action: 'bg-red-100 text-red-700',
  api_call: 'bg-indigo-100 text-indigo-700',
  gpt: 'bg-pink-100 text-pink-700'
};

export default function NodeList({ nodes, selectedNode, onSelectNode, onCreateNode, onDeleteNode }: NodeListProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 h-[calc(100vh-16rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Nodos</h3>
        <button
          onClick={onCreateNode}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          title="Crear nodo"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {nodes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">No hay nodos creados</p>
            <button
              onClick={onCreateNode}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Crear primer nodo
            </button>
          </div>
        ) : (
          nodes.map((node) => {
            const Icon = nodeTypeIcons[node.type] || MessageSquare;
            const colorClass = nodeTypeColors[node.type] || 'bg-slate-100 text-slate-700';
            const isSelected = selectedNode?.id === node.id;

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node)}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50 border-2 border-blue-500 shadow-md'
                    : 'bg-slate-50 border-2 border-transparent hover:border-slate-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 truncate">
                      {node.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">{node.type}</span>
                      {!node.activo && (
                        <span className="text-xs text-red-600">Inactivo</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (node._id) onDeleteNode(node._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-red-600 hover:bg-red-50 rounded transition-all"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-2 text-xs text-slate-600 font-mono bg-white px-2 py-1 rounded">
                  ID: {node.id}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
