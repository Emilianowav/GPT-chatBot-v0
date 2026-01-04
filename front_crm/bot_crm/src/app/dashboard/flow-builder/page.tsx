'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Play, Settings, Webhook, Edit2, Check, X } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import NodeConfigPanel from '@/components/flow-builder/NodeConfigPanel';
import CustomNode from '@/components/flow-builder/CustomNode';
import EmptyNode from '@/components/flow-builder/EmptyNode';
import EdgeContextMenu from '@/components/flow-builder/EdgeContextMenu';
import FilterModal from '@/components/flow-builder/FilterModal';
import AppsModal from '@/components/flow-builder/AppsModal';
import styles from './flow-builder.module.css';

const nodeTypes = {
  custom: CustomNode,
  empty: EmptyNode,
};

interface FlowData {
  id: string;
  nombre: string;
  empresaId: string;
  activo: boolean;
}

export default function FlowBuilderPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showAppsModal, setShowAppsModal] = useState(false);
  const [appsModalPosition, setAppsModalPosition] = useState<{ x: number; y: number } | undefined>();
  const [selectedNodeForAdd, setSelectedNodeForAdd] = useState<string | null>(null);
  const [flowData, setFlowData] = useState<FlowData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [edgeMenu, setEdgeMenu] = useState<{ x: number; y: number; edgeId: string } | null>(null);
  const [filterModal, setFilterModal] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFlow();
  }, []);

  const loadFlow = async () => {
    try {
      setIsLoading(true);
      const flowId = 'veo-veo-completo';
      
      const response = await fetch(`http://localhost:3000/api/flows/${flowId}`);
      
      if (response.ok) {
        const data = await response.json();
        setFlowData(data.flow);
        
        if (data.nodes && data.nodes.length > 0) {
          const reactFlowNodes = data.nodes.map((node: any, index: number) => ({
            id: node.id,
            type: 'custom',
            position: node.metadata?.position || { x: 100 + index * 250, y: 100 },
            data: {
              label: node.name || node.type,
              type: node.type,
              config: node,
            },
          }));
          
          setNodes(reactFlowNodes);
          
          const reactFlowEdges: Edge[] = [];
          data.nodes.forEach((node: any) => {
            if (node.next) {
              const nextNodes = Array.isArray(node.next) ? node.next : [node.next];
              nextNodes.forEach((nextId: string) => {
                reactFlowEdges.push({
                  id: `${node.id}-${nextId}`,
                  source: node.id,
                  target: nextId,
                  animated: true,
                });
              });
            }
          });
          
          setEdges(reactFlowEdges);
        } else {
          // Si no hay nodos, crear nodo inicial vacío
          createInitialNode();
        }
      } else {
        // Si no existe el flujo, crear uno nuevo con nodo inicial
        createInitialNode();
      }
    } catch (error) {
      console.error('Error cargando flujo:', error);
      createInitialNode();
    } finally {
      setIsLoading(false);
    }
  };

  const createInitialNode = () => {
    const initialNode: Node = {
      id: 'start_node',
      type: 'empty',
      position: { x: 400, y: 200 },
      data: {
        onAddClick: () => handleEmptyNodeClick('start_node'),
      },
    };
    setNodes([initialNode]);
  };

  const handleEmptyNodeClick = (nodeId: string) => {
    setSelectedNodeForAdd(nodeId);
    setShowAppsModal(true);
    setSelectedNode(null); // Cerrar panel de configuración si está abierto
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setEdgeMenu({
      x: event.clientX,
      y: event.clientY,
      edgeId: edge.id,
    });
  }, []);

  const handleSetFilter = (edgeId: string) => {
    setFilterModal(edgeId);
  };

  const handleUnlink = (edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  };

  const handleAddRouter = (edgeId: string) => {
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return;

    const newNode: Node = {
      id: `router_${Date.now()}`,
      type: 'custom',
      position: { x: 400, y: 300 },
      data: {
        label: 'Router',
        type: 'router',
        config: {
          id: `router_${Date.now()}`,
          type: 'router',
          name: 'Router',
        },
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [
      ...eds.filter((e) => e.id !== edgeId),
      { ...edge, target: newNode.id, id: `${edge.source}-${newNode.id}` },
      { id: `${newNode.id}-${edge.target}`, source: newNode.id, target: edge.target, animated: true },
    ]);
  };

  const handleAddModule = (edgeId: string) => {
    setShowAppsModal(true);
  };

  const handleAddNote = (edgeId: string) => {
    console.log('Add note:', edgeId);
  };

  const handleSaveFilter = (edgeId: string, filter: any) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? {
              ...edge,
              data: { ...edge.data, filter },
              label: filter.label,
              style: { ...edge.style, stroke: '#8b5cf6', strokeWidth: 3 },
            }
          : edge
      )
    );
  };

  const handleSelectModule = useCallback((moduleType: string, moduleName: string, appName: string) => {
    if (!selectedNodeForAdd) return;

    const selectedNode = nodes.find(n => n.id === selectedNodeForAdd);
    if (!selectedNode) return;

    const newNodeId = `node_${Date.now()}`;
    const newEmptyNodeId = `empty_${Date.now()}`;

    // Convertir nodo vacío en nodo real
    const updatedNode: Node = {
      ...selectedNode,
      type: 'custom',
      data: {
        label: moduleName,
        type: moduleType,
        appName: appName,
        config: {
          id: selectedNode.id,
          type: moduleType,
          name: moduleName,
          message: '',
        },
      },
    };

    // Crear nuevo nodo vacío conectado
    const newEmptyNode: Node = {
      id: newEmptyNodeId,
      type: 'empty',
      position: {
        x: selectedNode.position.x,
        y: selectedNode.position.y + 150,
      },
      data: {
        onAddClick: () => handleEmptyNodeClick(newEmptyNodeId),
      },
    };

    // Actualizar nodos
    setNodes((nds) => [
      ...nds.filter(n => n.id !== selectedNodeForAdd),
      updatedNode,
      newEmptyNode,
    ]);

    // Crear conexión
    setEdges((eds) => [
      ...eds,
      {
        id: `${selectedNode.id}-${newEmptyNodeId}`,
        source: selectedNode.id,
        target: newEmptyNodeId,
        animated: true,
        style: { stroke: '#d1d5db', strokeWidth: 2, strokeDasharray: '5,5' },
      },
    ]);

    setShowAppsModal(false);
    setSelectedNodeForAdd(null);
  }, [selectedNodeForAdd, nodes, setNodes, setEdges]);

  const handleTitleEdit = () => {
    setEditedTitle(flowData?.nombre || 'Nuevo Flujo');
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const handleTitleSave = () => {
    if (editedTitle.trim() && flowData) {
      setFlowData({ ...flowData, nombre: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
    setEditedTitle('');
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const updateNodeConfig = useCallback((nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: config.name || config.type,
              config,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const saveFlow = async () => {
    if (!flowData) return;
    
    setIsSaving(true);
    
    try {
      const backendNodes = nodes.map((node) => ({
        ...node.data.config,
        metadata: {
          ...node.data.config.metadata,
          position: node.position,
        },
        next: edges
          .filter((edge) => edge.source === node.id)
          .map((edge) => edge.target),
      }));

      const payload = {
        flow: flowData,
        nodes: backendNodes,
      };

      const response = await fetch(`http://localhost:3000/api/flows/${flowData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('✅ Flujo guardado correctamente');
      } else {
        const error = await response.json();
        alert(`❌ Error guardando flujo: ${error.message}`);
      }
    } catch (error) {
      console.error('Error guardando flujo:', error);
      alert('❌ Error guardando flujo');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando flujo Veo Veo...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {isEditingTitle ? (
              <div className={styles.titleEdit}>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  className={styles.titleInput}
                />
                <button onClick={handleTitleSave} className={styles.titleBtn}>
                  <Check size={16} />
                </button>
                <button onClick={handleTitleCancel} className={styles.titleBtn}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className={styles.titleContainer} onClick={handleTitleEdit}>
                <h1 className={styles.title}>
                  {flowData?.nombre || 'Nuevo Flujo'}
                </h1>
                <Edit2 size={16} className={styles.titleEditIcon} />
              </div>
            )}
            <span className={styles.badge}>
              {flowData?.activo ? '🟢 Activo' : '🔴 Inactivo'}
            </span>
          </div>
        
        <div className={styles.headerRight}>
          <button className={styles.btnSecondary} title="Configuración del flujo">
            <Settings size={18} />
            Configuración
          </button>
          
          <button className={styles.btnSecondary} title="Webhook">
            <Webhook size={18} />
            Webhook
          </button>
          
          <button 
            className={styles.btnPrimary}
            onClick={saveFlow}
            disabled={isSaving}
          >
            <Save size={18} />
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
          
          <button className={styles.btnSuccess} title="Ejecutar flujo">
            <Play size={18} />
            Ejecutar
          </button>
        </div>
        </div>

        <div className={styles.content}>
          <div className={styles.canvas}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeContextMenu={onEdgeContextMenu}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { 
                stroke: '#d1d5db',
                strokeWidth: 2,
                strokeDasharray: '5,5'
              }
            }}
            fitView
          >
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                const colors: Record<string, string> = {
                  message: '#25D366',
                  question: '#25D366',
                  condition: '#A3E635',
                  webhook: '#C13584',
                };
                return colors[node.data?.type] || '#25D366';
              }}
            />
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={16} 
              size={1}
              color="#e5e7eb"
            />
          </ReactFlow>

        </div>

        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onUpdate={(config) => updateNodeConfig(selectedNode.id, config)}
            onClose={() => setSelectedNode(null)}
          />
        )}

        {showAppsModal && (
          <AppsModal
            onClose={() => {
              setShowAppsModal(false);
              setSelectedNodeForAdd(null);
            }}
            onSelectModule={handleSelectModule}
            position={appsModalPosition}
          />
        )}

        {edgeMenu && (
          <EdgeContextMenu
            x={edgeMenu.x}
            y={edgeMenu.y}
            edgeId={edgeMenu.edgeId}
            onSetFilter={handleSetFilter}
            onUnlink={handleUnlink}
            onAddRouter={handleAddRouter}
            onAddModule={handleAddModule}
            onAddNote={handleAddNote}
            onClose={() => setEdgeMenu(null)}
          />
        )}

          {filterModal && (
            <FilterModal
              edgeId={filterModal}
              onSave={handleSaveFilter}
              onClose={() => setFilterModal(null)}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
