'use client';

import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
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
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import AppNode from '@/components/flow-builder/nodes/AppNode';
import PlusNode from '@/components/flow-builder/nodes/PlusNode';
import RouterNode from '@/components/flow-builder/nodes/RouterNode';
import WhatsAppNode from '@/components/flow-builder/nodes/WhatsAppNode';
import WooCommerceNode from '@/components/flow-builder/nodes/WooCommerceNode';
import GPTNode from '@/components/flow-builder/nodes/GPTNode';
import MercadoPagoNode from '@/components/flow-builder/nodes/MercadoPagoNode';
import WebhookNode from '@/components/flow-builder/nodes/WebhookNode';
import SimpleEdge from '@/components/flow-builder/edges/SimpleEdge';
import AppsModal from '@/components/flow-builder/modals/AppsModal';
import ModuleSelectionModal from '@/components/flow-builder/modals/ModuleSelectionModal';
import NodeConfigPanel from '@/components/flow-builder/panels/NodeConfigPanel';
import styles from './flow-builder.module.css';

const nodeTypes = {
  app: AppNode,
  plus: PlusNode,
  router: RouterNode,
  whatsapp: WhatsAppNode,
  woocommerce: WooCommerceNode,
  gpt: GPTNode,
  mercadopago: MercadoPagoNode,
  webhook: WebhookNode,
};

const edgeTypes = {
  simple: SimpleEdge,
};

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" width="48" height="48">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const OpenAIIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" width="48" height="48">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
);

const WHATSAPP_MODULES = [
  {
    id: 'watch-events',
    name: 'Watch Events',
    description: 'Triggers when a new message is received.',
    category: 'MESSAGE',
    badges: ['INSTANT', 'ACID'],
  },
  {
    id: 'send-message',
    name: 'Send a Message',
    description: 'Sends a message.',
    category: 'MESSAGE',
  },
];

const OPENAI_MODULES = [
  {
    id: 'create-completion',
    name: 'Create a Completion',
    description: 'Creates a completion for the provided prompt.',
    category: 'COMPLETIONS',
    badges: ['GPT-4'],
  },
];

export default function FlowBuilderPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showAppsModal, setShowAppsModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [appsModalPosition, setAppsModalPosition] = useState<{ x: number; y: number } | undefined>();
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [sourceNodeForConnection, setSourceNodeForConnection] = useState<string | null>(null);
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);
  const [flowName, setFlowName] = useState('Nuevo Flow');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  const handleNodeClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      setShowConfigPanel(true);
    }
  };

  const handleSaveNodeConfig = (nodeId: string, config: any) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { 
            ...node, 
            data: { 
              ...node.data, 
              label: config.label,
              config: config 
            } 
          }
        : node
    ));
  };

  useEffect(() => {
    // Cargar flow de Veo Veo automáticamente
    const loadVeoVeoFlow = async () => {
      try {
        const flowId = '695b5802cf46dd410a91f37c'; // Consultar Libros
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/api/flows/detail/${flowId}`);
        const flow = await response.json();
        
        if (flow && flow.nodes && flow.edges) {
          // Calcular qué nodos tienen conexiones salientes
          const nodesWithConnections = new Set(flow.edges.map((e: Edge) => e.source));
          
          const nodesWithHandlers = flow.nodes.map((node: Node) => ({
            ...node,
            data: {
              ...node.data,
              hasConnection: nodesWithConnections.has(node.id),
              onNodeClick: handleNodeClick,
              onHandleClick: handlePlusNodeClick,
            }
          }));
          setNodes(nodesWithHandlers);
          setEdges(flow.edges);
          setFlowName(flow.nombre);
          setCurrentFlowId(flow._id);
          console.log('✅ Flow de Veo Veo cargado:', flow.nombre);
        }
      } catch (error) {
        console.error('❌ Error cargando flow:', error);
        // Si falla, mostrar nodo inicial
        const initialNode: Node = {
          id: 'plus-initial',
          type: 'plus',
          position: { x: 400, y: 300 },
          data: {
            onAddClick: handlePlusNodeClick,
          },
        };
        setNodes([initialNode]);
      }
    };
    
    loadVeoVeoFlow();
  }, []);

  const handlePlusNodeClick = (nodeId: string) => {
    setSourceNodeForConnection(nodeId);
    setShowAppsModal(true);
    setAppsModalPosition(undefined);
  };

  const handleAppSelect = (app: any) => {
    setSelectedApp(app);
    setShowAppsModal(false);
    setShowModuleModal(true);
  };

  const handleBackToApps = () => {
    setShowModuleModal(false);
    setShowAppsModal(true);
  };

  const handleModuleSelect = (module: any) => {
    setShowModuleModal(false);

    if (sourceNodeForConnection === 'plus-initial') {
      const appNode: Node = {
        id: 'node-1',
        type: 'app',
        position: { x: 400, y: 300 },
        data: {
          appName: selectedApp.name,
          appIcon: selectedApp.id === 'whatsapp' ? <WhatsAppIcon /> : <OpenAIIcon />,
          color: selectedApp.color,
          label: selectedApp.name,
          subtitle: module.name,
          executionCount: 1,
          hasConnection: false,
          onHandleClick: handleHandlePlusClick,
        },
      };
      setNodes([appNode]);
    } else {
      const sourceNode = nodes.find(n => n.id === sourceNodeForConnection);
      if (!sourceNode) return;

      const newNodeId = `node-${nodes.length + 1}`;
      const newNode: Node = {
        id: newNodeId,
        type: 'app',
        position: {
          x: sourceNode.position.x + 250,
          y: sourceNode.position.y,
        },
        data: {
          appName: selectedApp.name,
          appIcon: selectedApp.id === 'whatsapp' ? <WhatsAppIcon /> : <OpenAIIcon />,
          color: selectedApp.color,
          label: selectedApp.name,
          subtitle: module.name,
          executionCount: nodes.length + 1,
          hasConnection: false,
          onHandleClick: handleHandlePlusClick,
        },
      };

      const newEdge: Edge = {
        id: `${sourceNodeForConnection}-${newNodeId}`,
        source: sourceNodeForConnection,
        target: newNodeId,
        type: 'simple',
        data: {
          color: sourceNode.data.color,
        },
      };

      setNodes(prev => [
        ...prev.map(n => 
          n.id === sourceNodeForConnection 
            ? { ...n, data: { ...n.data, hasConnection: true } }
            : n
        ),
        newNode
      ]);
      setEdges(prev => [...prev, newEdge]);
    }

    setSourceNodeForConnection(null);
    setSelectedApp(null);
  };

  const handleHandlePlusClick = (nodeId: string) => {
    setSourceNodeForConnection(nodeId);
    setShowAppsModal(true);
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setAppsModalPosition({ x: node.position.x, y: node.position.y });
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const getModulesForApp = () => {
    if (!selectedApp) return [];
    if (selectedApp.id === 'whatsapp') return WHATSAPP_MODULES;
    if (selectedApp.id === 'openai') return OPENAI_MODULES;
    return [];
  };

  const handleSaveFlow = async () => {
    try {
      setIsSaving(true);
      
      const flowData = {
        nombre: flowName,
        empresaId: '6940a9a181b92bfce970fdb5', // Veo Veo
        activo: true,
        nodes,
        edges
      };

      const response = await fetch('/api/flows', {
        method: currentFlowId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentFlowId ? { ...flowData, _id: currentFlowId } : flowData)
      });

      const savedFlow = await response.json();
      setCurrentFlowId(savedFlow._id);
      
      alert('Flow guardado exitosamente');
    } catch (error) {
      console.error('Error guardando flow:', error);
      alert('Error al guardar el flow');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadFlow = async (flowId: string) => {
    try {
      const response = await fetch(`/api/flows/detail/${flowId}`);
      const flow = await response.json();
      
      setNodes(flow.nodes);
      setEdges(flow.edges);
      setFlowName(flow.nombre);
      setCurrentFlowId(flow._id);
      
      alert('Flow cargado exitosamente');
    } catch (error) {
      console.error('Error cargando flow:', error);
      alert('Error al cargar el flow');
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.flowBuilderContainer}>
        {/* Header Toolbar */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <input
              type="text"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              placeholder="Nombre del flow"
              className={styles.titleInput}
            />
          </div>
          <div className={styles.headerRight}>
            <button
              onClick={handleSaveFlow}
              disabled={isSaving}
              className={styles.btnSuccess}
            >
              {isSaving ? 'Guardando...' : '💾 Guardar'}
            </button>
            <button
              onClick={() => {
                const flowId = prompt('ID del flow a cargar:');
                if (flowId) handleLoadFlow(flowId);
              }}
              className={styles.btnPrimary}
            >
              📂 Cargar
            </button>
          </div>
        </div>
        
        <div className={styles.flowCanvas}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            minZoom={0.5}
            maxZoom={1.5}
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
          </ReactFlow>
        </div>

        <AppsModal
          isOpen={showAppsModal}
          onClose={() => setShowAppsModal(false)}
          onSelectApp={handleAppSelect}
          position={appsModalPosition}
        />

        {selectedApp && (
          <ModuleSelectionModal
            isOpen={showModuleModal}
            onClose={() => setShowModuleModal(false)}
            onBack={handleBackToApps}
            appName={selectedApp.name}
            appIcon={selectedApp.id === 'whatsapp' ? <WhatsAppIcon /> : <OpenAIIcon />}
            appColor={selectedApp.color}
            verified={true}
            modules={getModulesForApp()}
            onSelectModule={handleModuleSelect}
          />
        )}

        {showConfigPanel && selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onClose={() => setShowConfigPanel(false)}
            onSave={handleSaveNodeConfig}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
