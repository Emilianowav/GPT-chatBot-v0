'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { Plus, Save, Play, Settings, Webhook, ArrowLeft, Trash2 } from 'lucide-react';
import NodeConfigPanel from '@/components/flow-builder/NodeConfigPanel';
import NodePalette from '@/components/flow-builder/NodePalette';
import CustomNode from '@/components/flow-builder/CustomNode';
import styles from './flows.module.css';

const nodeTypes = {
  custom: CustomNode,
};

interface FlowData {
  _id?: string;
  id: string;
  nombre: string;
  empresaId: string;
  activo: boolean;
  descripcion?: string;
}

interface FlowListItem {
  _id: string;
  id: string;
  nombre: string;
  activo: boolean;
  descripcion?: string;
}

export default function FlowsPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const [flowData, setFlowData] = useState<FlowData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [empresaId, setEmpresaId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [flowsList, setFlowsList] = useState<FlowListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);

  useEffect(() => {
    const storedEmpresa = localStorage.getItem('empresaId') || 'Veo Veo';
    setEmpresaId(storedEmpresa);
    loadFlowsList(storedEmpresa);
  }, []);

  const loadFlowsList = async (empresa: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/flows?empresaId=${empresa}`);
      if (response.ok) {
        const data = await response.json();
        // La API puede devolver un array directo o un objeto con propiedad flows
        const flows = Array.isArray(data) ? data : (data.flows || []);
        setFlowsList(flows);
      }
    } catch (error) {
      console.error('Error loading flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFlow = async (flowId: string) => {
    try {
      setSelectedFlowId(flowId);
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
        }
        
        setViewMode('editor');
      }
    } catch (error) {
      console.error('Error cargando flujo:', error);
    }
  };

  const createNewFlow = () => {
    const newFlowId = `flow_${Date.now()}`;
    setFlowData({
      id: newFlowId,
      nombre: 'Nuevo Flujo',
      empresaId: empresaId,
      activo: true,
    });
    setNodes([]);
    setEdges([]);
    setViewMode('editor');
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const addNewNode = useCallback((nodeType: string) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'custom',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: nodeType,
        type: nodeType,
        config: {
          id: `node_${Date.now()}`,
          type: nodeType,
          name: `Nuevo ${nodeType}`,
          message: '',
        },
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setShowPalette(false);
  }, [setNodes]);

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
        loadFlowsList(empresaId);
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

  const deleteFlow = async (flowId: string) => {
    if (!confirm('¿Estás seguro de eliminar este flujo?')) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/flows/${flowId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadFlowsList(empresaId);
      }
    } catch (error) {
      console.error('Error eliminando flujo:', error);
    }
  };

  const backToList = () => {
    setViewMode('list');
    setFlowData(null);
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setSelectedFlowId(null);
    loadFlowsList(empresaId);
  };

  if (viewMode === 'editor') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backButton} onClick={backToList}>
              <ArrowLeft size={18} />
            </button>
            <h1 className={styles.title}>
              {flowData?.nombre || 'Cargando...'}
            </h1>
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
              nodeTypes={nodeTypes}
              fitView
            >
              <Controls />
              <MiniMap />
              <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            </ReactFlow>

            <button
              className={styles.fabButton}
              onClick={() => setShowPalette(!showPalette)}
              title="Agregar nodo"
            >
              <Plus size={24} />
            </button>
          </div>

          {selectedNode && (
            <NodeConfigPanel
              node={selectedNode}
              onUpdate={(config) => updateNodeConfig(selectedNode.id, config)}
              onClose={() => setSelectedNode(null)}
            />
          )}

          {showPalette && (
            <NodePalette
              onSelectNode={addNewNode}
              onClose={() => setShowPalette(false)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      <div className={styles.listHeader}>
        <h1>Gestión de Flujos</h1>
        <button onClick={createNewFlow} className={styles.createButton}>
          <Plus size={18} />
          Crear Flujo
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando flujos...</div>
      ) : flowsList.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No hay flujos creados</h3>
          <p>Crea tu primer flujo para comenzar</p>
          <button onClick={createNewFlow} className={styles.createButton}>
            <Plus size={18} />
            Crear Primer Flujo
          </button>
        </div>
      ) : (
        <div className={styles.flowsGrid}>
          {flowsList.map((flow) => (
            <div key={flow._id} className={styles.flowCard} onClick={() => loadFlow(flow.id)}>
              <div className={styles.flowCardHeader}>
                <h3>{flow.nombre}</h3>
                <span className={`${styles.badge} ${flow.activo ? styles.badgeActive : styles.badgeInactive}`}>
                  {flow.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p>{flow.descripcion || 'Sin descripción'}</p>
              <div className={styles.flowCardActions}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFlow(flow.id);
                  }}
                  className={styles.deleteButton}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
