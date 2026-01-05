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
import OrbitHandleNode from '@/components/flow-builder/OrbitHandleNode';
import EmptyNode from '@/components/flow-builder/EmptyNode';
import RouterNode from '@/components/flow-builder/RouterNode';
import OrbitEdge from '@/components/flow-builder/OrbitEdge';

// Colores de apps y nodos para gradientes
const appColors: Record<string, string> = {
  'WhatsApp Business Cloud': '#25D366',
  'WhatsApp': '#25D366',
  'OpenAI (ChatGPT, Sora, DALL-E, Whisper)': '#10a37f',
  'OpenAI': '#10a37f',
  'GPT': '#10a37f',
  'WooCommerce': '#96588a',
  'MercadoPago': '#009ee3',
  'HTTP': '#0ea5e9',
  'Webhooks': '#c13584',
  'Gmail': '#ea4335',
};

const nodeColors: Record<string, string> = {
  message: '#6366f1',
  input: '#25D366',
  question: '#8b5cf6',
  condition: '#f59e0b',
  api: '#10b981',
  api_call: '#96588a',
  webhook: '#ec4899',
  email: '#3b82f6',
  delay: '#6b7280',
  validation: '#14b8a6',
  error: '#ef4444',
  gpt: '#10a37f',
};
import EdgeContextMenu from '@/components/flow-builder/EdgeContextMenu';
import FilterModal from '@/components/flow-builder/FilterModal';
import AppsModal from '@/components/flow-builder/AppsModal';
import ModuleConfigModal from '@/components/flow-builder/ModuleConfigModal';
import styles from './flow-builder.module.css';

const nodeTypes = {
  custom: OrbitHandleNode,
  empty: EmptyNode,
  router: RouterNode,
};

const edgeTypes = {
  custom: OrbitEdge,
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
  const [showModuleConfig, setShowModuleConfig] = useState(false);
  const [selectedModuleNode, setSelectedModuleNode] = useState<Node | null>(null);

  useEffect(() => {
    loadFlow();
  }, []);

  const loadFlow = async () => {
    try {
      setIsLoading(true);
      const flowId = 'veo-veo-gpt-conversacional';
      
      const response = await fetch(`http://localhost:3000/api/flows/${flowId}`);
      
      if (response.ok) {
        const data = await response.json();
        setFlowData(data.flow);
        
        if (data.nodes && data.nodes.length > 0) {
          const reactFlowNodes = data.nodes.map((node: any, index: number) => {
            // Mapear tipo de nodo a nombre de app para iconos
            let appName = '';
            if (node.type === 'input' && node.name.includes('WhatsApp')) {
              appName = 'WhatsApp';
            } else if (node.type === 'gpt') {
              appName = 'GPT';
            } else if (node.type === 'api_call' && node.name.includes('WooCommerce')) {
              appName = 'WooCommerce';
            } else if (node.type === 'message' && node.name.includes('WhatsApp')) {
              appName = 'WhatsApp';
            }
            
            return {
              id: node.id,
              type: 'custom',
              position: node.metadata?.position || { x: 100 + index * 250, y: 100 },
              data: {
                label: node.name || node.type,
                type: node.type,
                appName: appName,
                config: node,
              },
            };
          });
          
          setNodes(reactFlowNodes);
          
          const reactFlowEdges: Edge[] = [];
          data.nodes.forEach((node: any) => {
            if (node.next) {
              const nextNodes = Array.isArray(node.next) ? node.next : [node.next];
              nextNodes.forEach((nextId: string) => {
                // Obtener colores de los nodos source y target
                const sourceNode = reactFlowNodes.find((n: any) => n.id === node.id);
                const targetNode = reactFlowNodes.find((n: any) => n.id === nextId);
                
                const sourceColor = sourceNode?.data?.appName 
                  ? (appColors[sourceNode.data.appName] || '#6366f1')
                  : (nodeColors[sourceNode?.data?.type] || '#6366f1');
                
                const targetColor = targetNode?.data?.appName
                  ? (appColors[targetNode.data.appName] || '#6366f1')
                  : (nodeColors[targetNode?.data?.type] || '#6366f1');
                
                reactFlowEdges.push({
                  id: `${node.id}-${nextId}`,
                  source: node.id,
                  target: nextId,
                  type: 'custom',
                  animated: true,
                  data: {
                    sourceColor,
                    targetColor,
                    onConfigClick: (edgeId: string) => {
                      setFilterModal(edgeId);
                    }
                  }
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
    setSelectedNode(null);
    setShowModuleConfig(false); // Cerrar modal de configuración si está abierto
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Si es un nodo vacío, no hacer nada (ya tiene su propio handler)
    if (node.type === 'empty') return;
    
    // Si es un nodo real, abrir modal de configuración
    setSelectedModuleNode(node);
    setShowModuleConfig(true);
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

    // Crear nodo router en el medio de la conexión
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return;

    const routerId = `router_${Date.now()}`;
    
    // Calcular posición en el medio
    const routerX = (sourceNode.position.x + targetNode.position.x) / 2;
    const routerY = (sourceNode.position.y + targetNode.position.y) / 2;

    // Crear nodo router
    const routerNode: Node = {
      id: routerId,
      type: 'router',
      position: { x: routerX, y: routerY },
      data: {
        label: 'Router',
        routeCount: 2,
        config: {
          id: routerId,
          type: 'router',
          name: 'Router',
        },
      },
    };

    // Eliminar edge original
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));

    // Crear nuevas conexiones: source -> router -> target
    const newEdges: Edge[] = [
      {
        id: `${edge.source}-${routerId}`,
        source: edge.source,
        target: routerId,
        type: 'custom',
        animated: true,
        data: {
          onConfigClick: (edgeId: string) => setFilterModal(edgeId)
        }
      },
      {
        id: `${routerId}-${edge.target}-route1`,
        source: routerId,
        sourceHandle: 'route-1',
        target: edge.target,
        type: 'custom',
        animated: true,
        data: {
          onConfigClick: (edgeId: string) => setFilterModal(edgeId)
        }
      }
    ];

    setNodes((nds) => [...nds, routerNode]);
    setEdges((eds) => [...eds, ...newEdges]);
    setEdgeMenu(null);
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

  // const updateNodeConfig = useCallback((nodeId: string, config: any) => {
  //   setNodes((nds) =>
  //     nds.map((node) => {
  //       if (node.id === nodeId) {
  //         return {
  //           ...node,
  //           data: {
  //             ...node.data,
  //             label: config.name || config.type,
  //             config,
  //           },
  //         };
  //       }
  //       return node;
  //     })
  //   );
  // }, [setNodes]);

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
            edgeTypes={edgeTypes}
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

        {/* {selectedNode && !showAppsModal && (
          <NodeConfigPanel
            node={selectedNode}
            onUpdate={(config) => updateNodeConfig(selectedNode.id, config)}
            onClose={() => setSelectedNode(null)}
          />
        )} */}

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

        {showModuleConfig && selectedModuleNode && (
          <ModuleConfigModal
            module={{
              id: selectedModuleNode.id,
              name: selectedModuleNode.data.label || '',
              type: selectedModuleNode.data.type || '',
              appName: selectedModuleNode.data.appName || '',
            }}
            onSave={(config) => {
              // Actualizar configuración del nodo
              setNodes((nds) =>
                nds.map((node) =>
                  node.id === selectedModuleNode.id
                    ? {
                        ...node,
                        data: {
                          ...node.data,
                          config: { ...node.data.config, ...config },
                        },
                      }
                    : node
                )
              );
              setShowModuleConfig(false);
              setSelectedModuleNode(null);
            }}
            onClose={() => {
              setShowModuleConfig(false);
              setSelectedModuleNode(null);
            }}
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
