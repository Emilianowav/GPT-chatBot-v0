'use client';

import { useState, useEffect } from 'react';
import { Menu, MessageSquare, GitBranch, Zap, Globe, Brain, ArrowRight, Play } from 'lucide-react';

interface FlowNode {
  _id?: string;
  id: string;
  type: string;
  name: string;
  next?: string;
  options?: Array<{ text: string; next?: string }>;
  conditions?: Array<{ next?: string }>;
  action?: { onSuccess?: string; onError?: string };
}

interface FlowVisualizerProps {
  nodes: FlowNode[];
  startNode: string;
  onSelectNode: (node: FlowNode) => void;
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
  menu: 'from-blue-500 to-blue-600',
  input: 'from-green-500 to-green-600',
  message: 'from-purple-500 to-purple-600',
  condition: 'from-yellow-500 to-yellow-600',
  action: 'from-red-500 to-red-600',
  api_call: 'from-indigo-500 to-indigo-600',
  gpt: 'from-pink-500 to-pink-600'
};

export default function FlowVisualizer({ nodes, startNode, onSelectNode }: FlowVisualizerProps) {
  const [nodeMap, setNodeMap] = useState<Map<string, FlowNode>>(new Map());
  const [connections, setConnections] = useState<Array<{ from: string; to: string; label?: string }>>([]);

  useEffect(() => {
    const map = new Map<string, FlowNode>();
    nodes.forEach(node => map.set(node.id, node));
    setNodeMap(map);

    // Calcular conexiones
    const conns: Array<{ from: string; to: string; label?: string }> = [];
    nodes.forEach(node => {
      if (node.next) {
        conns.push({ from: node.id, to: node.next });
      }
      if (node.options) {
        node.options.forEach((opt, idx) => {
          if (opt.next) {
            conns.push({ from: node.id, to: opt.next, label: opt.text });
          }
        });
      }
      if (node.conditions) {
        node.conditions.forEach((cond, idx) => {
          if (cond.next) {
            conns.push({ from: node.id, to: cond.next, label: `Condición ${idx + 1}` });
          }
        });
      }
      if (node.action) {
        if (node.action.onSuccess) {
          conns.push({ from: node.id, to: node.action.onSuccess, label: 'Éxito' });
        }
        if (node.action.onError) {
          conns.push({ from: node.id, to: node.action.onError, label: 'Error' });
        }
      }
    });
    setConnections(conns);
  }, [nodes]);

  const renderNode = (node: FlowNode, isStart: boolean = false) => {
    const Icon = nodeTypeIcons[node.type] || MessageSquare;
    const colorClass = nodeTypeColors[node.type] || 'from-slate-500 to-slate-600';

    return (
      <div
        key={node.id}
        onClick={() => onSelectNode(node)}
        className="relative group cursor-pointer"
      >
        <div className={`
          bg-gradient-to-br ${colorClass} 
          text-white rounded-2xl shadow-lg hover:shadow-2xl 
          transition-all transform hover:scale-105
          p-6 min-w-[200px] max-w-[250px]
        `}>
          {isStart && (
            <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-2 shadow-lg">
              <Play className="w-4 h-4" />
            </div>
          )}
          
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{node.name}</h4>
              <p className="text-xs opacity-80">{node.type}</p>
            </div>
          </div>

          <div className="text-xs bg-white/10 rounded px-2 py-1 font-mono truncate">
            {node.id}
          </div>

          {/* Indicadores de conexiones */}
          <div className="mt-3 flex items-center gap-2 text-xs">
            {node.options && node.options.length > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded">
                {node.options.length} opciones
              </span>
            )}
            {node.conditions && node.conditions.length > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded">
                {node.conditions.length} condiciones
              </span>
            )}
          </div>
        </div>

        {/* Conectores visuales */}
        {connections
          .filter(conn => conn.from === node.id)
          .map((conn, idx) => (
            <div key={idx} className="absolute left-full top-1/2 -translate-y-1/2 ml-2">
              <div className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-slate-400" />
                {conn.label && (
                  <span className="text-xs text-slate-600 bg-white px-2 py-1 rounded shadow">
                    {conn.label}
                  </span>
                )}
              </div>
            </div>
          ))}
      </div>
    );
  };

  const buildFlowTree = (nodeId: string, visited: Set<string> = new Set(), level: number = 0): any => {
    if (visited.has(nodeId) || level > 10) return null;
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) return null;

    const children: string[] = [];
    
    if (node.next) children.push(node.next);
    if (node.options) {
      node.options.forEach(opt => {
        if (opt.next) children.push(opt.next);
      });
    }
    if (node.conditions) {
      node.conditions.forEach(cond => {
        if (cond.next) children.push(cond.next);
      });
    }
    if (node.action) {
      if (node.action.onSuccess) children.push(node.action.onSuccess);
      if (node.action.onError) children.push(node.action.onError);
    }

    return {
      node,
      children: children.map(childId => buildFlowTree(childId, new Set(visited), level + 1)).filter(Boolean)
    };
  };

  const renderTree = (tree: any, isStart: boolean = false): JSX.Element => {
    if (!tree) return <></>;

    return (
      <div className="flex items-start gap-8">
        <div className="flex-shrink-0">
          {renderNode(tree.node, isStart)}
        </div>
        
        {tree.children.length > 0 && (
          <div className="flex flex-col gap-6 pt-4">
            {tree.children.map((child: any, idx: number) => (
              <div key={idx}>
                {renderTree(child)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (nodes.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          No hay nodos para visualizar
        </h3>
        <p className="text-slate-600">
          Crea nodos en la pestaña "Nodos" para ver el flujo visual
        </p>
      </div>
    );
  }

  if (!startNode) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <Play className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          Define un nodo inicial
        </h3>
        <p className="text-slate-600">
          Configura el nodo inicial en la pestaña "Configuración"
        </p>
      </div>
    );
  }

  const tree = buildFlowTree(startNode);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 overflow-auto">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Vista Visual del Flujo</h3>
        <p className="text-sm text-slate-600">
          Haz clic en un nodo para editarlo. Las flechas muestran las conexiones entre nodos.
        </p>
      </div>

      <div className="min-w-max">
        {tree ? renderTree(tree, true) : (
          <div className="text-center py-8">
            <p className="text-slate-500">No se pudo construir el árbol del flujo</p>
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Tipos de Nodos</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(nodeTypeColors).map(([type, color]) => {
            const Icon = nodeTypeIcons[type];
            return (
              <div key={type} className="flex items-center gap-2">
                <div className={`p-2 bg-gradient-to-br ${color} rounded-lg`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-slate-700 capitalize">{type.replace('_', ' ')}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
