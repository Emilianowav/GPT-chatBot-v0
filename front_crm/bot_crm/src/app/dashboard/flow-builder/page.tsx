'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  ControlButton,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  applyEdgeChanges,
  EdgeChange,
  OnEdgeUpdateFunc,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import AppNode from '@/components/flow-builder/nodes/AppNode';
import PlusNode from '@/components/flow-builder/nodes/PlusNode';
import RouterNode from '@/components/flow-builder/nodes/RouterNode';
import WhatsAppNode from '@/components/flow-builder/nodes/WhatsAppNode';
import WooCommerceNode from '@/components/flow-builder/nodes/WooCommerceNode';
import GPTNode from '@/components/flow-builder/nodes/GPTNode';
import MercadoPagoNode from '@/components/flow-builder/nodes/MercadoPagoNode';
import WebhookNode from '@/components/flow-builder/nodes/WebhookNode';
import HTTPNode from '@/components/flow-builder/nodes/HTTPNode';
import NoteNode from '@/components/flow-builder/nodes/NoteNode';
import AnimatedLineEdge from '@/components/flow-builder/edges/AnimatedLineEdge';
import AppsModal from '@/components/flow-builder/modals/AppsModal';
import ModuleSelectionModal from '@/components/flow-builder/modals/ModuleSelectionModal';
import WebhookConfigModal from '@/components/flow-builder/modals/WebhookConfigModal';
import GPTConfigModal from '@/components/flow-builder/modals/GPTConfigModal';
import EdgeConfigModal from '@/components/flow-builder/modals/EdgeConfigModal';
import MercadoPagoConfigModal from '@/components/flow-builder/modals/MercadoPagoConfigModal';
import MercadoPagoWebhookConfigModal from '@/components/flow-builder/modals/MercadoPagoWebhookConfigModal';
import HTTPConfigModal from '@/components/flow-builder/modals/HTTPConfigModal';
import NodeConfigPanel from '@/components/flow-builder/panels/NodeConfigPanel';
import FloatingActionBar from '@/components/flow-builder/FloatingActionBar';
import VariablesModal from '@/components/flow-builder/modals/VariablesModal';
import TopicsModal from '@/components/flow-builder/modals/TopicsModal';
import { FlowValidationPanel } from '@/components/flow-builder/FlowValidationPanel';
import { ToastProvider, useToast } from '@/components/common/ToastContainer';
import { ArrowLeft, Play, Pause, Undo, Redo } from 'lucide-react';
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
  http: HTTPNode,
  note: NoteNode,
};

const edgeTypes = {
  default: AnimatedLineEdge,
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
    category: 'TRIGGERS',
    badges: ['INSTANT', 'TRIGGER'],
  },
  {
    id: 'send-message',
    name: 'Send a Message',
    description: 'Sends a message.',
    category: 'ACTIONS',
  },
  {
    id: 'upload-media',
    name: 'Upload a Media',
    description: 'Uploads a media and retrieves its ID.',
    category: 'ACTIONS',
  },
];

const OPENAI_MODULES = [
  // CHAT - Módulos conversacionales
  {
    id: 'conversacional',
    name: 'Conversacional',
    description: 'Conversa con usuarios, responde preguntas y recopila información de manera natural.',
    category: 'CHAT',
    badges: ['GPT-4', 'GPT-3.5'],
    tipo: 'conversacional',
  },
  {
    id: 'formateador',
    name: 'Formateador',
    description: 'Transforma datos recopilados en formato específico para otros sistemas (WooCommerce, APIs, etc.).',
    category: 'DATA PROCESSING',
    badges: ['GPT-4'],
    tipo: 'formateador',
  },
  {
    id: 'procesador',
    name: 'Procesador',
    description: 'Procesa y analiza información, extrae datos clave y toma decisiones.',
    category: 'DATA PROCESSING',
    badges: ['GPT-4'],
    tipo: 'procesador',
  },
  {
    id: 'transform-structured',
    name: 'Transform text to structured data',
    description: 'Identifies information in a prompt\'s text and returns it as structured data (JSON).',
    category: 'DATA EXTRACTION',
    badges: ['Structured Output'],
    tipo: 'transform',
  },
];

const FLOW_CONTROL_MODULES = [
  {
    id: 'router',
    name: 'Router',
    description: 'Splits the scenario flow into multiple routes.',
    category: 'CONDITIONALS',
  },
];

const HTTP_MODULES = [
  {
    id: 'http-request',
    name: 'Make a Request',
    description: 'Performs an HTTP request to any URL and returns the response.',
    category: 'ACTIONS',
    badges: ['GET', 'POST', 'PUT', 'DELETE'],
  },
  {
    id: 'http-get',
    name: 'GET Request',
    description: 'Retrieves data from a specified URL.',
    category: 'ACTIONS',
  },
  {
    id: 'http-post',
    name: 'POST Request',
    description: 'Sends data to a specified URL.',
    category: 'ACTIONS',
  },
];

const WOOCOMMERCE_MODULES = [
  // PRODUCT
  {
    id: 'search-product',
    name: 'Search for a Product',
    description: 'This module helps you find a product.',
    category: 'PRODUCT',
  },
  {
    id: 'get-product',
    name: 'Get a Product',
    description: 'This module lets you retrieve a specified product by its ID.',
    category: 'PRODUCT',
  },
  {
    id: 'create-product',
    name: 'Create a Product',
    description: 'This module helps you to create a new product.',
    category: 'PRODUCT',
  },
  {
    id: 'update-product',
    name: 'Update a Product',
    description: 'This module lets you modify a product.',
    category: 'PRODUCT',
  },
  {
    id: 'delete-product',
    name: 'Delete a Product',
    description: 'This module helps you to delete a specified product.',
    category: 'PRODUCT',
  },
  // ORDER
  {
    id: 'search-order',
    name: 'Search for an Order',
    description: 'This module helps you to find an order.',
    category: 'ORDER',
  },
  {
    id: 'get-order',
    name: 'Get an Order',
    description: 'This module lets you retrieve a specified order by its ID.',
    category: 'ORDER',
  },
  {
    id: 'create-order',
    name: 'Create an Order',
    description: 'This module helps you to create a new order.',
    category: 'ORDER',
  },
  {
    id: 'update-order',
    name: 'Update an Order',
    description: 'This module lets you modify an order.',
    category: 'ORDER',
  },
  // CUSTOMER
  {
    id: 'search-customer',
    name: 'Search for a Customer',
    description: 'This module helps you to find a customer.',
    category: 'CUSTOMER',
  },
  {
    id: 'get-customer',
    name: 'Get a Customer',
    description: 'This module lets you retrieve a specified customer by its ID.',
    category: 'CUSTOMER',
  },
  {
    id: 'create-customer',
    name: 'Create a Customer',
    description: 'This module helps you to create a new customer.',
    category: 'CUSTOMER',
  },
  {
    id: 'update-customer',
    name: 'Update a Customer',
    description: 'This module helps you to modify a customer.',
    category: 'CUSTOMER',
  },
];

function FlowBuilderContent() {
  const router = useRouter();
  const toast = useToast();
  const [nodes, setNodes, onNodesChangeOriginal] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const edgeUpdateSuccessful = useRef(true);
  const [showAppsModal, setShowAppsModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showWebhookConfigModal, setShowWebhookConfigModal] = useState(false);
  const [showGPTConfigModal, setShowGPTConfigModal] = useState(false);
  const [showHTTPConfigModal, setShowHTTPConfigModal] = useState(false);
  const [showMercadoPagoConfigModal, setShowMercadoPagoConfigModal] = useState(false);
  const [showMercadoPagoWebhookModal, setShowMercadoPagoWebhookModal] = useState(false);
  const [showEdgeConfigModal, setShowEdgeConfigModal] = useState(false);
  const [appsModalPosition, setAppsModalPosition] = useState<{ x: number; y: number } | undefined>();
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [sourceNodeForConnection, setSourceNodeForConnection] = useState<string | null>(null);
  const [sourceHandleForConnection, setSourceHandleForConnection] = useState<string | undefined>(undefined);
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);
  const [flowName, setFlowName] = useState('Nuevo Flow');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [flowsList, setFlowsList] = useState<any[]>([]);
  const [showVariablesPanel, setShowVariablesPanel] = useState(false);
  const [showVariablesModal, setShowVariablesModal] = useState(false);
  const [showTopicsModal, setShowTopicsModal] = useState(false);
  const [globalVariables, setGlobalVariables] = useState<Record<string, any>>({});
  const [globalTopics, setGlobalTopics] = useState<Record<string, any>>({});
  const [currentFlowActive, setCurrentFlowActive] = useState(false);
  
  // Sistema de historial para undo/redo (máximo 5 estados)
  const [history, setHistory] = useState<Array<{ nodes: Node[], edges: Edge[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedState, setLastSavedState] = useState<string>('');

  // Trackear cambios significativos en nodes y edges (solo estructura, no DOM)
  useEffect(() => {
    // Extraer solo datos significativos de los nodos (sin handlers ni funciones)
    const significantNodes = nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        label: node.data.label,
        config: node.data.config,
      }
    }));

    // Extraer solo datos significativos de los edges
    const significantEdges = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      data: {
        label: edge.data?.label,
        condition: edge.data?.condition,
      }
    }));

    const currentState = JSON.stringify({ 
      nodes: significantNodes, 
      edges: significantEdges, 
      globalVariables, 
      globalTopics 
    });

    if (lastSavedState && currentState !== lastSavedState) {
      setHasUnsavedChanges(true);
    } else if (lastSavedState && currentState === lastSavedState) {
      setHasUnsavedChanges(false);
    }
  }, [nodes, edges, globalVariables, globalTopics, lastSavedState]);

  const handlePlusNodeClick = useCallback((nodeId: string, handleId?: string) => {
    setSourceNodeForConnection(nodeId);
    setSourceHandleForConnection(handleId);
    setShowAppsModal(true);
    setAppsModalPosition(undefined);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setNodes(currentNodes => {
      const node = currentNodes.find(n => n.id === nodeId);
      if (node) {
        // Si es un nodo HTTP, abrir modal específico
        if (node.type === 'http') {
          setSelectedNode(node);
          setShowHTTPConfigModal(true);
        }
        // Si es un nodo WhatsApp/Webhook, verificar si es webhook de MercadoPago
        else if (node.type === 'whatsapp' || node.type === 'webhook') {
          // Detectar si es webhook de MercadoPago
          const isMercadoPagoWebhook = 
            node.data?.config?.tipo === 'mercadopago_webhook' ||
            node.data?.label?.toLowerCase().includes('mercadopago') ||
            node.data?.label?.toLowerCase().includes('mercado pago') ||
            node.data?.label?.toLowerCase().includes('pedidos confirmados') ||
            node.data?.label?.toLowerCase().includes('verificar pago') ||
            node.id?.toLowerCase().includes('mercadopago') ||
            node.id?.toLowerCase().includes('verificar-pago');
          
          setSelectedNode(node);
          if (isMercadoPagoWebhook) {
            setShowMercadoPagoWebhookModal(true);
          } else {
            setShowWebhookConfigModal(true);
          }
        }
        // Si es un nodo de MercadoPago, verificar si es webhook o configuración
        else if (node.type === 'mercadopago') {
          setSelectedNode(node);
          // Si es verificar_pago, abrir modal de webhook
          if (node.data?.config?.action === 'verificar_pago' || 
              node.id === 'mercadopago-verificar-pago' ||
              node.data?.label?.toLowerCase().includes('verificar pago')) {
            setShowMercadoPagoWebhookModal(true);
          } else {
            // Si es crear_preferencia, abrir modal de configuración
            setShowMercadoPagoConfigModal(true);
          }
        } else {
          setSelectedNode(node);
          setShowConfigPanel(true);
        }
      }
      return currentNodes; // No modificar nodes
    });
  }, []);

  // Función para abrir modal de configuración desde el panel de validación
  const handleOpenNodeConfigFromValidation = useCallback((nodeId: string, nodeType: string) => {
    setNodes(currentNodes => {
      const node = currentNodes.find(n => n.id === nodeId);
      if (node) {
        setSelectedNode(node);
        
        // Abrir el modal correspondiente según el tipo de nodo
        if (nodeType === 'http') {
          setShowHTTPConfigModal(true);
        } else if (nodeType === 'whatsapp' || nodeType === 'webhook') {
          setShowWebhookConfigModal(true);
        } else if (nodeType === 'mercadopago') {
          setShowMercadoPagoConfigModal(true);
        } else if (nodeType === 'gpt') {
          setShowConfigPanel(true);
        } else {
          setShowConfigPanel(true);
        }
      }
      return currentNodes;
    });
  }, []);

  const handleSaveNodeConfig = useCallback((nodeId: string, config: any) => {
    console.log('💾 Guardando configuración de nodo:', { nodeId, config });
    setNodes(prev => {
      const updatedNodes = prev.map(node => 
        node.id === nodeId 
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                label: config.label || config.webhookName || (config.module === 'watch-events' ? 'Watch Events' : config.module === 'send-message' ? 'Send Message' : node.data.label),
                config: config 
              } 
            }
          : node
      );
      console.log('✅ Nodos después de guardar config:', {
        antes: prev.length,
        despues: updatedNodes.length,
        nodeId,
        encontrado: updatedNodes.some(n => n.id === nodeId)
      });
      return updatedNodes;
    });
    
    // Cerrar todos los modales después de guardar
    setShowWebhookConfigModal(false);
    setShowHTTPConfigModal(false);
    setShowGPTConfigModal(false);
    setShowMercadoPagoConfigModal(false);
    setShowConfigPanel(false);
    setSelectedNode(null);
  }, [setNodes]);

  // Wrapper para guardar configuración de webhook cuando se edita un nodo existente
  const handleSaveWebhookNodeConfig = useCallback((config: any) => {
    if (selectedNode) {
      // Si está configurado para capturar teléfono, guardar en variables globales
      if (config.capturePhoneNumber && config.phoneNumberVariableName) {
        setGlobalVariables(prev => ({
          ...prev,
          [config.phoneNumberVariableName]: prev[config.phoneNumberVariableName] || '' // Mantener valor existente o vacío
        }));
        console.log('📱 Variable de teléfono actualizada:', config.phoneNumberVariableName);
      }
      handleSaveNodeConfig(selectedNode.id, config);
    }
  }, [selectedNode, handleSaveNodeConfig]);

  // Wrapper para guardar configuración de HTTP cuando se edita un nodo existente
  const handleSaveHTTPNodeConfig = useCallback((config: any) => {
    // Guardar API Key como variable global si está configurado
    if (config.saveApiKeyAsVariable && config.apiKeyVariableName && config.auth?.apiKey) {
      setGlobalVariables(prev => ({ 
        ...prev, 
        [config.apiKeyVariableName]: config.auth.apiKey 
      }));
    }
    
    if (selectedNode) {
      handleSaveNodeConfig(selectedNode.id, config);
    }
  }, [selectedNode, handleSaveNodeConfig]);

  const handleEdgeConfigClick = useCallback((edgeId: string) => {
    setSelectedEdgeId(edgeId);
    setShowEdgeConfigModal(true);
  }, []);

  const handleSaveEdgeConfig = useCallback((config: any) => {
    if (selectedEdgeId) {
      setEdges(prev => prev.map(edge => 
        edge.id === selectedEdgeId
          ? {
              ...edge,
              data: {
                ...edge.data,
                label: config.label,
                condition: config.condition,
              }
            }
          : edge
      ));
    }
    setShowEdgeConfigModal(false);
    setSelectedEdgeId(null);
  }, [selectedEdgeId, setEdges]);

  // Guardar estado actual en historial
  const saveToHistory = useCallback(() => {
    const newState = { 
      nodes: JSON.parse(JSON.stringify(nodes)), 
      edges: JSON.parse(JSON.stringify(edges)) 
    };
    
    setHistory(prev => {
      // Eliminar estados futuros si estamos en medio del historial
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      
      // Mantener solo los últimos 5 estados
      if (newHistory.length > 5) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    
    setHistoryIndex(prev => {
      const newIndex = Math.min(prev + 1, 4);
      return newIndex;
    });
  }, [nodes, edges, historyIndex]);

  // Undo: volver al estado anterior
  const handleUndo = useCallback(() => {
    if (historyIndex > 0 && history.length > 0) {
      const newIndex = historyIndex - 1;
      const prevState = history[newIndex];
      if (prevState && prevState.nodes && prevState.edges) {
        setNodes(prevState.nodes);
        setEdges(prevState.edges);
        setHistoryIndex(newIndex);
      }
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Redo: avanzar al siguiente estado
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      if (nextState && nextState.nodes && nextState.edges) {
        setNodes(nextState.nodes);
        setEdges(nextState.edges);
        setHistoryIndex(newIndex);
      }
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Recalcular números de ejecución basados en posición en el flujo
  const recalculateExecutionOrder = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    const nodeOrder = new Map<string, number>();
    const nodeLetter = new Map<string, string>();
    const visited = new Set<string>();
    
    // Encontrar nodo inicial (primer nodo sin conexiones entrantes)
    const nodesWithIncoming = new Set(currentEdges.map(e => e.target));
    const startNode = currentNodes.find(n => !nodesWithIncoming.has(n.id));
    
    if (!startNode) {
      // Si no hay nodo inicial, ninguno tiene número
      return currentNodes.map(node => ({
        ...node,
        data: { ...node.data, executionCount: undefined }
      }));
    }
    
    // BFS para calcular orden
    const queue = [{ id: startNode.id, order: 1 }];
    visited.add(startNode.id);
    nodeOrder.set(startNode.id, 1);
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const outgoingEdges = currentEdges.filter(e => e.source === current.id);
      
      outgoingEdges.forEach(edge => {
        if (!visited.has(edge.target)) {
          visited.add(edge.target);
          const order = current.order + 1;
          nodeOrder.set(edge.target, order);
          queue.push({ id: edge.target, order });
        }
      });
    }
    
    // Agrupar nodos por número de orden para asignar letras
    const orderGroups = new Map<number, string[]>();
    nodeOrder.forEach((order, nodeId) => {
      if (!orderGroups.has(order)) {
        orderGroups.set(order, []);
      }
      orderGroups.get(order)!.push(nodeId);
    });
    
    // Asignar letras a nodos con el mismo número
    orderGroups.forEach((nodeIds, order) => {
      if (nodeIds.length > 1) {
        // Múltiples nodos en el mismo nivel - asignar letras
        nodeIds.sort(); // Ordenar para consistencia
        nodeIds.forEach((nodeId, index) => {
          const letter = String.fromCharCode(97 + index); // a, b, c, ...
          nodeLetter.set(nodeId, letter);
        });
      }
      // Si solo hay un nodo, no necesita letra
    });
    
    // Actualizar nodos con el orden y letra calculados
    return currentNodes.map(node => {
      const order = nodeOrder.get(node.id);
      const letter = nodeLetter.get(node.id);
      
      return {
        ...node,
        data: {
          ...node.data,
          executionCount: order ? (letter ? `${order}${letter}` : order) : undefined
        }
      };
    });
  }, []);

  // Recalcular orden cuando cambian edges o nodes
  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(() => {
        const updatedNodes = recalculateExecutionOrder(nodes, edges);
        // Solo actualizar si hay cambios en los números
        const hasChanges = updatedNodes.some((node, idx) => 
          node.data.executionCount !== nodes[idx].data.executionCount
        );
        if (hasChanges) {
          setNodes(updatedNodes);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [edges.length, nodes.length, recalculateExecutionOrder]);

  // Guardar estado cuando cambian nodes o edges (con debounce)
  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) return;
    
    const timer = setTimeout(() => {
      // Solo guardar si es diferente al último estado
      if (history.length === 0) {
        // Primer estado
        setHistory([{ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
        setHistoryIndex(0);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Listener de teclado para Delete y Ctrl+Z/Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Verificar si el usuario está escribiendo en un input, textarea o elemento editable
      const target = event.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.isContentEditable ||
                       target.closest('[contenteditable="true"]');
      
      // Delete: eliminar nodos y edges seleccionados (solo si NO está escribiendo)
      if ((event.key === 'Delete' || event.key === 'Backspace') && !isTyping) {
        event.preventDefault();
        
        // Guardar estado antes de eliminar
        saveToHistory();
        
        // Eliminar nodos seleccionados (React Flow maneja la selección)
        setNodes(prev => prev.filter(node => !node.selected));
        setEdges(prev => prev.filter(edge => !edge.selected));
      }
      
      // Ctrl+Z: Undo
      if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      }
      
      // Ctrl+Y o Ctrl+Shift+Z: Redo
      if ((event.ctrlKey && event.key === 'y') || (event.ctrlKey && event.shiftKey && event.key === 'z')) {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveToHistory, handleUndo, handleRedo, setNodes, setEdges]);

  // Custom onNodesChange para manejar eliminación de nodos y guardar historial
  const onNodesChange = useCallback((changes: any[]) => {
    // Guardar estado antes de aplicar cambios significativos (NO en selección)
    const hasSignificantChange = changes.some(c => 
      c.type === 'remove' || 
      c.type === 'add' || 
      (c.type === 'position' && c.dragging === false) // Solo cuando termina de arrastrar
    );
    
    if (hasSignificantChange) {
      // Usar setTimeout para no bloquear el evento de click
      setTimeout(() => saveToHistory(), 0);
    }
    
    onNodesChangeOriginal(changes);
    
    // Detectar si se eliminó un nodo
    const removeChange = changes.find(c => c.type === 'remove');
    if (removeChange) {
      // Después de eliminar, seleccionar el último nodo restante (sin abrir modal)
      setTimeout(() => {
        setNodes(currentNodes => {
          if (currentNodes.length > 0) {
            const lastNode = currentNodes[currentNodes.length - 1];
            setSelectedNode(lastNode);
            // NO abrir modal, solo seleccionar para poder seguir eliminando rápido
          }
          return currentNodes;
        });
      }, 0);
    }
  }, [onNodesChangeOriginal, setNodes, saveToHistory]);

  // Handler para el nodo + inicial
  const handleInitialPlusClick = useCallback(() => {
    setShowAppsModal(true);
    setAppsModalPosition(undefined);
    setSourceNodeForConnection('plus-initial'); // Identificador especial para nodo inicial
  }, []);

  // Detectar cuando nodes está vacío y agregar nodo +
  useEffect(() => {
    if (nodes.length === 0) {
      const initialNode: Node = {
        id: 'plus-initial',
        type: 'plus',
        position: { x: 400, y: 300 },
        data: {
          onAddClick: handleInitialPlusClick
        },
      };
      setNodes([initialNode]);
    }
  }, [nodes.length, setNodes, handleInitialPlusClick]);

  // Cargar lista de flujos al montar y cargar flujo desde URL
  useEffect(() => {
    const loadFlowsList = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const empresaId = localStorage.getItem('empresaId') || '';
        console.log('🔍 [FILTRO] empresaId desde localStorage:', empresaId);
        console.log('🔍 [FILTRO] URL completa:', `${apiUrl}/api/flows?empresaId=${empresaId}`);
        const response = await fetch(`${apiUrl}/api/flows?empresaId=${empresaId}`);
        const data = await response.json();
        console.log('🔍 [FILTRO] Flujos recibidos:', data);
        const flows = Array.isArray(data) ? data : (data.flows || []);
        setFlowsList(flows);
        
        // Cargar flujo desde URL si existe flowId
        const urlParams = new URLSearchParams(window.location.search);
        const flowIdFromUrl = urlParams.get('flowId');
        
        if (flowIdFromUrl) {
          console.log('🔍 Cargando flujo desde URL:', flowIdFromUrl);
          setCurrentFlowId(flowIdFromUrl);
          handleLoadFlow(flowIdFromUrl);
        } else if (flows.length > 0) {
          // Si no hay flowId en URL, cargar el primer flujo
          console.log('📋 Cargando primer flujo disponible');
          const firstFlow = flows[0];
          setCurrentFlowId(firstFlow._id);
          handleLoadFlow(firstFlow._id);
        }
      } catch (error) {
        console.error('Error loading flows list:', error);
      }
    };
    
    loadFlowsList();
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const loadVeoVeoFlow = async () => {
      try {
        // Solo cargar si hay un flowId válido (no cargar flujos hardcodeados)
        if (!currentFlowId) {
          console.log('⚠️ No hay flowId para cargar');
          return;
        }
        
        const flowId = currentFlowId;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        
        const timestamp = new Date().getTime();
        const response = await fetch(`${apiUrl}/api/flows/by-id/${flowId}?t=${timestamp}`, {
          cache: 'no-store'
        });
        const flow = await response.json();
        
        if (!isMounted) return;
        
        console.log('🔄 Flow recibido desde MongoDB:', {
          nombre: flow.nombre,
          nodos: flow.nodes?.length,
          edges: flow.edges?.length
        });
        
        if (flow && flow.nodes && flow.edges && flow.nodes.length > 0) {
          console.log('📋 IDs de nodos:', flow.nodes.map((n: Node) => n.id));
          
          // PRECALCULAR HANDLES DE ROUTERS
          console.log('🔧 Extrayendo handles de routers...');
          const routerHandles = new Map<string, string[]>();
          flow.edges.forEach((edge: any) => {
            if (edge.sourceHandle) {
              console.log(`  Edge ${edge.id}: source=${edge.source}, handle=${edge.sourceHandle}`);
              const handles = routerHandles.get(edge.source) || [];
              if (!handles.includes(edge.sourceHandle)) {
                handles.push(edge.sourceHandle);
              }
              routerHandles.set(edge.source, handles);
            }
          });
          console.log('📋 Handles por router:', Object.fromEntries(routerHandles));
          
          // Función helper para obtener color según tipo de nodo
          const getColorForNodeType = (nodeType: string): string => {
            switch (nodeType) {
              case 'whatsapp': return '#25D366';
              case 'gpt': return '#10a37f';
              case 'woocommerce': return '#96588a';
              case 'mercadopago': return '#009ee3';
              case 'router': return '#f59e0b';
              case 'webhook': return '#ff6b6b';
              default: return '#6b7280';
            }
          };

          // Agregar handlers a cada nodo
          const nodesWithHandlers = flow.nodes.map((node: Node) => {
            const processedNode = {
              ...node,
              data: {
                ...node.data,
                color: node.data.color || getColorForNodeType(node.type),
                onNodeClick: handleNodeClick,
                onHandleClick: handlePlusNodeClick,
                hasConnection: flow.edges.some((e: Edge) => e.source === node.id),
                // Pasar handles precalculados a routers
                routeHandles: node.type === 'router' ? routerHandles.get(node.id) || [] : undefined,
              }
            };
            
            // Log para routers
            if (node.type === 'router') {
              console.log(`✅ Procesando router ${node.id}:`);
              console.log(`   - Original type: "${node.type}"`);
              console.log(`   - Processed type: "${processedNode.type}"`);
              console.log(`   - Has config.routes: ${!!node.data?.config?.routes}`);
              console.log(`   - routeHandles:`, processedNode.data.routeHandles);
            }
            
            return processedNode;
          });
          
          console.log(`\n📊 NODOS PROCESADOS PARA RENDERIZAR: ${nodesWithHandlers.length}`);
          nodesWithHandlers.forEach((node: any, index: number) => {
            console.log(`   ${index + 1}. ${node.type} - ${node.data?.label || 'Sin label'} (${node.id})`);
            console.log(`      Posición: x=${node.position?.x}, y=${node.position?.y}`);
          });
          
          // Normalizar handles a IDs simples según documentación de React Flow
          const edgesWithHandlers = flow.edges.map((edge: Edge) => ({
            ...edge,
            sourceHandle: 'b', // Todos los source handles usan 'b'
            targetHandle: 'a', // Todos los target handles usan 'a'
            zIndex: 200,
            data: {
              ...edge.data,
              onConfigClick: () => {
                console.log('🔧 Configurando edge:', edge.id);
                setSelectedEdgeId(edge.id);
                setShowEdgeConfigModal(true);
              }
            }
          }));
          
          setNodes(nodesWithHandlers);
          setEdges(edgesWithHandlers);
          setFlowName(flow.nombre);
          setCurrentFlowId(flow._id);
          
          // Inicializar estado guardado para detección de cambios (solo datos significativos)
          const significantNodes = nodesWithHandlers.map((node: Node) => ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: {
              label: node.data.label,
              config: node.data.config,
            }
          }));

          const significantEdges = edgesWithHandlers.map((edge: Edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            data: {
              label: edge.data?.label,
              condition: edge.data?.condition,
            }
          }));

          const initialState = JSON.stringify({ 
            nodes: significantNodes, 
            edges: significantEdges, 
            globalVariables, 
            globalTopics 
          });
          setLastSavedState(initialState);
          setHasUnsavedChanges(false);
          
          console.log('✅ Flow cargado con handlers');
          console.log('📊 Nodos:', flow.nodes.length);
          console.log('🔗 Edges:', flow.edges.length);
        } else {
          // Si no hay nodos, mostrar nodo + inicial
          const initialNode: Node = {
            id: 'plus-initial',
            type: 'plus',
            position: { x: 400, y: 300 },
            data: {
              onAddClick: handleInitialPlusClick
            },
          };
          setNodes([initialNode]);
        }
      } catch (error) {
        console.error('❌ Error cargando flow:', error);
        if (isMounted) {
          const initialNode: Node = {
            id: 'plus-initial',
            type: 'plus',
            position: { x: 400, y: 300 },
            data: {
              onAddClick: handleInitialPlusClick
            },
          };
          setNodes([initialNode]);
        }
      }
    };
    
    loadVeoVeoFlow();
    
    return () => {
      isMounted = false;
    };
  }, [handleNodeClick, handlePlusNodeClick, handleInitialPlusClick]); // Agregar dependencias

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
    setSelectedModule(module);
    
    // Si es WhatsApp Watch Events, verificar que no exista ya
    if (selectedApp.id === 'whatsapp' && module.id === 'watch-events') {
      const watchEventsExists = nodes.some(
        n => n.type === 'whatsapp' && n.data.config?.module === 'watch-events'
      );
      
      if (watchEventsExists) {
        toast.warning('Ya existe un nodo Watch Events. Solo puede haber uno por flujo.');
        setShowModuleModal(false);
        setSelectedModule(null);
        return;
      }
      
      setShowModuleModal(false);
      setShowWebhookConfigModal(true);
      return;
    }
    
    // Si es OpenAI (cualquier tipo de GPT), mostrar modal de configuración
    if (selectedApp.id === 'openai') {
      setShowModuleModal(false);
      setShowGPTConfigModal(true);
      return;
    }
    
    // Si es HTTP, mostrar modal de configuración
    if (selectedApp.id === 'http') {
      setShowModuleModal(false);
      setShowHTTPConfigModal(true);
      return;
    }
    
    // Para otros módulos, crear nodo directamente
    setShowModuleModal(false);
    createNodeFromModule(module, {});
  };

  const handleWebhookConfigSave = (webhookConfig: any) => {
    setShowWebhookConfigModal(false);
    
    // Si está configurado para capturar teléfono, guardar en variables globales
    if (webhookConfig.capturePhoneNumber && webhookConfig.phoneNumberVariableName) {
      setGlobalVariables(prev => ({
        ...prev,
        [webhookConfig.phoneNumberVariableName]: '' // Se llenará cuando llegue un mensaje
      }));
      console.log('📱 Variable de teléfono configurada:', webhookConfig.phoneNumberVariableName);
    }
    
    createNodeFromModule(selectedModule, webhookConfig);
  };

  const handleGPTConfigSave = (gptConfig: any) => {
    setShowGPTConfigModal(false);
    createNodeFromModule(selectedModule, gptConfig);
  };

  const handleHTTPConfigSave = (httpConfig: any) => {
    // Guardar API Key como variable global si está configurado (ANTES de cerrar el modal)
    if (httpConfig.saveApiKeyAsVariable && httpConfig.apiKeyVariableName && httpConfig.auth?.apiKey) {
      setGlobalVariables(prev => ({ 
        ...prev, 
        [httpConfig.apiKeyVariableName]: httpConfig.auth.apiKey 
      }));
      console.log('💾 Variable global guardada:', httpConfig.apiKeyVariableName, '=', httpConfig.auth.apiKey);
    }
    
    setShowHTTPConfigModal(false);
    createNodeFromModule(selectedModule, httpConfig);
  };

  const handleTestHTTPRequest = async (config: any): Promise<any> => {
    try {
      // Usar testVariables si están disponibles, sino usar globalVariables
      const variablesToUse = config.testVariables || globalVariables;
      
      console.log('🧪 Testing HTTP Request con variables:', variablesToUse);
      
      // Reemplazar variables en la URL
      let finalUrl = config.url;
      Object.entries(variablesToUse).forEach(([name, value]: [string, any]) => {
        const regex = new RegExp(`{{\\s*${name}\\s*}}`, 'g');
        finalUrl = finalUrl.replace(regex, String(value));
      });

      // Construir query params con variables reemplazadas
      const finalQueryParams: Record<string, string> = {};
      if (config.queryParams) {
        Object.entries(config.queryParams).forEach(([key, value]: [string, any]) => {
          let finalValue = String(value);
          Object.entries(variablesToUse).forEach(([name, varValue]: [string, any]) => {
            const regex = new RegExp(`{{\\s*${name}\\s*}}`, 'g');
            finalValue = finalValue.replace(regex, String(varValue));
          });
          finalQueryParams[key] = finalValue;
        });
      }

      console.log('🌐 URL del test:', finalUrl);
      console.log('📊 Query params:', finalQueryParams);

      // Preparar headers
      const headers: Record<string, string> = {
        ...config.headers,
      };

      // Preparar body si existe
      let body: string | undefined = undefined;
      if (config.body && config.method !== 'GET') {
        body = config.body;
        // Reemplazar variables en el body
        Object.entries(variablesToUse).forEach(([name, value]: [string, any]) => {
          const regex = new RegExp(`{{\\s*${name}\\s*}}`, 'g');
          body = body!.replace(regex, String(value));
        });
      }

      // Usar el proxy del backend para evitar CORS
      const proxyUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/http-proxy/test-http-request`;
      
      console.log('🔄 Usando proxy:', proxyUrl);

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: finalUrl,
          method: config.method,
          headers,
          queryParams: finalQueryParams,
          body,
          timeout: config.timeout || 30000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Respuesta del test:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Error en test HTTP:', error);
      throw new Error(error.message || 'Error al ejecutar la solicitud HTTP');
    }
  };

  const handleMercadoPagoConfigSave = (mpConfig: any) => {
    if (selectedNode) {
      handleSaveNodeConfig(selectedNode.id, mpConfig);
    }
    setShowMercadoPagoConfigModal(false);
  };

  const handleMercadoPagoWebhookConfigSave = (webhookConfig: any) => {
    if (selectedNode) {
      handleSaveNodeConfig(selectedNode.id, webhookConfig);
    }
    setShowMercadoPagoWebhookModal(false);
  };

  const createNodeFromModule = (module: any, config: any) => {
    console.log('🔧 createNodeFromModule called:', {
      module: module.id,
      app: selectedApp?.id,
      config,
      sourceNodeForConnection,
      currentNodesCount: nodes.length
    });

    const sourceNode = nodes.find(n => n.id === sourceNodeForConnection);
    // Permitir crear nodo si:
    // 1. Hay un sourceNode válido
    // 2. Es el nodo inicial (plus-initial)
    // 3. Se está agregando desde la botonera (sourceNodeForConnection es null)
    if (!sourceNode && sourceNodeForConnection !== 'plus-initial' && sourceNodeForConnection !== null) {
      console.log('❌ Nodo NO creado - sourceNode no válido');
      return;
    }

    const newNodeId = `node-${Date.now()}`;
    const isRouter = module.id === 'router';
    
    // Función para determinar la categoría automáticamente
    const getNodeCategory = (appId: string, moduleId: string, isFirstNode: boolean): string => {
      // Si es el primer nodo, siempre es trigger
      if (isFirstNode) return 'trigger';
      
      // WhatsApp: trigger si es watch-events, action si es send-message
      if (appId === 'whatsapp') {
        return moduleId === 'watch-events' ? 'trigger' : 'action';
      }
      
      // OpenAI, Router, Validadores: siempre processor
      if (appId === 'openai' || appId === 'flow-control') {
        return 'processor';
      }
      
      // WooCommerce, Mercado Pago: siempre action
      if (appId === 'woocommerce' || appId === 'mercadopago') {
        return 'action';
      }
      
      // Default: processor
      return 'processor';
    };

    // Función para obtener el color según el tipo de app
    const getNodeColor = (appId: string): string => {
      switch (appId) {
        case 'whatsapp': return '#25D366';
        case 'openai': return '#10a37f';
        case 'woocommerce': return '#96588a';
        case 'mercadopago': return '#009ee3';
        case 'flow-control': return '#f59e0b';
        case 'http': return '#0ea5e9';
        default: return '#6b7280';
      }
    };
    
    let newNode: Node;
    
    if (isRouter) {
      // Crear nodo Router
      newNode = {
        id: newNodeId,
        type: 'router',
        category: 'processor', // Router siempre es processor
        position: sourceNode ? {
          x: sourceNode.position.x + 250,
          y: sourceNode.position.y,
        } : { x: 400, y: 300 },
        data: {
          label: 'Router',
          executionCount: undefined, // Se calculará después
          routes: 2, // Por defecto 2 rutas
          color: getNodeColor('flow-control'),
          onNodeClick: handleNodeClick,
          onHandleClick: handlePlusNodeClick,
          config: {
            conditions: [
              { label: 'Route 1', condition: '' },
              { label: 'Route 2', condition: '' },
            ],
          },
        },
      };
    } else {
      // Determinar tipo de nodo
      const nodeType = selectedApp.id === 'whatsapp' ? 'whatsapp' : 
                       selectedApp.id === 'openai' ? 'gpt' : 
                       selectedApp.id === 'woocommerce' ? 'woocommerce' :
                       selectedApp.id === 'http' ? 'http' :
                       selectedApp.id === 'flow-control' ? 'router' : 'app';
      
      // Determinar categoría automáticamente
      const isFirstNode = nodes.length === 0 || sourceNodeForConnection === 'plus-initial';
      const category = getNodeCategory(selectedApp.id, module.id, isFirstNode);
      
      // Crear nodo normal (WhatsApp, OpenAI, etc.)
      // Determinar label según el módulo
      let nodeLabel = selectedApp.name;
      if (selectedApp.id === 'whatsapp') {
        nodeLabel = module.id === 'watch-events' ? 'Watch Events' : 
                    module.id === 'send-message' ? 'Send Message' : 
                    selectedApp.name;
      }
      
      newNode = {
        id: newNodeId,
        type: nodeType,
        category: category, // ✅ Asignar categoría automáticamente
        position: sourceNode ? {
          x: sourceNode.position.x + 250,
          y: sourceNode.position.y,
        } : { x: 400, y: 300 },
        data: {
          label: nodeLabel,
          subtitle: module.name,
          executionCount: undefined, // Se calculará después basado en posición en flujo
          hasConnection: false,
          color: getNodeColor(selectedApp.id),
          onNodeClick: handleNodeClick,
          onHandleClick: handlePlusNodeClick,
          config: {
            module: module.id,
            ...config,
          },
        },
      };
    }

    console.log('✅ Nodo creado:', {
      id: newNode.id,
      type: newNode.type,
      label: newNode.data.label,
      position: newNode.position,
      category: newNode.category
    });

    if (sourceNodeForConnection === 'plus-initial') {
      // Reemplazar nodo + inicial con el nuevo nodo
      console.log('📍 Reemplazando nodo inicial');
      setNodes([{
        ...newNode,
        data: {
          ...newNode.data,
          hasConnection: false // Primer nodo nunca tiene conexión
        }
      }]);
    } else if (sourceNodeForConnection === null) {
      // Agregar nodo desde la botonera flotante (sin conexión)
      console.log('📍 Agregando nodo desde botonera flotante');
      setNodes(prev => {
        const newNodes = [...prev, {
          ...newNode,
          data: {
            ...newNode.data,
            hasConnection: false
          }
        }];
        console.log('📊 Total nodos después de agregar:', newNodes.length);
        return newNodes;
      });
    } else {
      // Agregar nodo conectado desde el botón + de otro nodo
      console.log('📍 Agregando nodo conectado desde otro nodo');
      // Usar IDs de handles simples según documentación de React Flow
      const sourceHandle = 'b'; // Handle de salida (source)
      const targetHandle = 'a'; // Handle de entrada (target)
      
      const newEdge: Edge = {
        id: `e${sourceNodeForConnection}-${newNodeId}`,
        source: sourceNodeForConnection,
        sourceHandle: sourceHandle,
        target: newNodeId,
        targetHandle: targetHandle,
        type: 'default',
        animated: true,
      };

      setNodes(prev => {
        const updatedNodes = [
          ...prev.map(n => 
            n.id === sourceNodeForConnection 
              ? { ...n, data: { ...n.data, hasConnection: true } }
              : n
          ),
          {
            ...newNode,
            data: {
              ...newNode.data,
              hasConnection: false // Nuevo nodo no tiene conexión aún
            }
          }
        ];
        console.log('📊 Total nodos después de agregar:', updatedNodes.length);
        return updatedNodes;
      });
      setEdges(prev => [...prev, { ...newEdge, zIndex: 200 }]);
    }

    setSourceNodeForConnection(null);
    setSourceHandleForConnection(undefined);
    setSelectedApp(null);
    setSelectedModule(null);
  };

  const handleHandlePlusClick = (nodeId: string, handleId?: string) => {
    setSourceNodeForConnection(nodeId);
    setSourceHandleForConnection(handleId);
    setShowAppsModal(true);
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setAppsModalPosition({ x: node.position.x + 150, y: node.position.y });
    }
  };

  const handleAddNote = useCallback(() => {
    const newNoteId = `note-${Date.now()}`;
    const newNote: Node = {
      id: newNoteId,
      type: 'note',
      position: { x: 400, y: 300 },
      data: {
        title: 'Nota',
        content: '',
        color: '#fef3c7',
        isMinimized: false,
        onDelete: (nodeId: string) => {
          setNodes(prev => prev.filter(n => n.id !== nodeId));
        },
        onChange: (nodeId: string, content: string, title?: string) => {
          setNodes(prev => prev.map(n => 
            n.id === nodeId 
              ? { ...n, data: { ...n.data, content, title: title || n.data.title } }
              : n
          ));
        },
        onToggleMinimize: (nodeId: string) => {
          setNodes(prev => prev.map(n => 
            n.id === nodeId 
              ? { ...n, data: { ...n.data, isMinimized: !n.data.isMinimized } }
              : n
          ));
        }
      },
      style: {
        width: 280,
        height: 200,
      }
    };
    setNodes(prev => [...prev, newNote]);
  }, [setNodes]);

  // Manejar cambios en edges con soporte para reconexión
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Guardar estado antes de cambios significativos
      const hasSignificantChange = changes.some(c => c.type === 'remove' || c.type === 'add');
      
      if (hasSignificantChange) {
        // Usar setTimeout para no bloquear eventos
        setTimeout(() => saveToHistory(), 0);
      }
      
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges, saveToHistory]
  );

  // Conectar nodos - Dejar que React Flow maneje los handles automáticamente
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ 
        ...params, 
        type: 'default', 
        zIndex: 200 
      }, eds));
    },
    [setEdges]
  );

  // Iniciar actualización de edge (reconexión)
  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  // Actualizar edge (reconectar a otro nodo)
  const onEdgeUpdate: OnEdgeUpdateFunc = useCallback(
    (oldEdge, newConnection) => {
      edgeUpdateSuccessful.current = true;
      setEdges((els) => {
        const updatedEdges = els.filter((e) => e.id !== oldEdge.id);
        return addEdge({ 
          ...newConnection, 
          type: 'default', 
          zIndex: 200 
        }, updatedEdges);
      });
    },
    [setEdges]
  );

  // Finalizar actualización de edge
  const onEdgeUpdateEnd = useCallback(
    (_: any, edge: Edge) => {
      if (!edgeUpdateSuccessful.current) {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      }
      edgeUpdateSuccessful.current = true;
    },
    [setEdges]
  );

  const getModulesForApp = () => {
    if (!selectedApp) return [];
    if (selectedApp.id === 'whatsapp') return WHATSAPP_MODULES;
    if (selectedApp.id === 'openai') return OPENAI_MODULES;
    if (selectedApp.id === 'flow-control') return FLOW_CONTROL_MODULES;
    if (selectedApp.id === 'woocommerce') return WOOCOMMERCE_MODULES;
    if (selectedApp.id === 'http') return HTTP_MODULES;
    return [];
  };

  const handleSaveFlow = async () => {
    try {
      setIsSaving(true);
      
      // Obtener empresaId del localStorage
      const empresaId = typeof window !== 'undefined' ? localStorage.getItem('empresaId') : null;
      
      // Obtener userId del localStorage o del token JWT
      let userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
      
      // Si no hay userId en localStorage, decodificar el token JWT para obtenerlo
      if (!userId && typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token) {
          try {
            // Decodificar el token JWT (sin verificar, solo para leer el payload)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);
            userId = payload.userId;
            console.log('🔑 userId extraído del token:', userId);
          } catch (e) {
            console.error('❌ Error decodificando token:', e);
          }
        }
      }
      
      // Determinar el nodo inicial (primer nodo de tipo whatsapp con module watch-events)
      const startNode = nodes.find(n => 
        n.type === 'whatsapp' && n.data?.config?.module === 'watch-events'
      )?.id || (nodes.length > 0 ? nodes[0].id : undefined);
      
      // IMPORTANTE: NO enviar _id ni id para evitar conflicto con índice único
      const flowData = {
        nombre: flowName,
        empresaId: empresaId || 'Intercapital',
        activo: currentFlowActive,
        createdBy: userId,
        startNode: startNode,
        nodes,
        edges,
        config: {
          topicos_habilitados: Object.keys(globalTopics).length > 0,
          topicos: globalTopics,
          variables_globales: globalVariables
        }
        // NO incluir _id ni id aquí
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const url = currentFlowId ? `${apiUrl}/api/flows/${currentFlowId}` : `${apiUrl}/api/flows`;
      
      // Obtener token de autenticación
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (!token) {
        toast.error('No estás autenticado. Por favor, inicia sesión nuevamente.');
        window.location.href = '/login';
        return;
      }
      
      console.log('🔑 Token encontrado:', token.substring(0, 20) + '...');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      console.log('📤 Headers con token:', { 'Content-Type': headers['Content-Type'], 'Authorization': 'Bearer ***' });
      
      const response = await fetch(url, {
        method: currentFlowId ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(flowData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const savedFlow = await response.json();
      setCurrentFlowId(savedFlow._id);
      
      // Resetear contador de cambios y actualizar estado guardado (usar mismo formato que useEffect)
      const significantNodes = nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          label: node.data.label,
          config: node.data.config,
        }
      }));

      const significantEdges = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        data: {
          label: edge.data?.label,
          condition: edge.data?.condition,
        }
      }));

      const currentState = JSON.stringify({ 
        nodes: significantNodes, 
        edges: significantEdges, 
        globalVariables, 
        globalTopics 
      });
      setLastSavedState(currentState);
      setHasUnsavedChanges(false);
      
      toast.success('Flujo guardado exitosamente');
    } catch (error) {
      console.error('Error guardando flow:', error);
      toast.error('Error al guardar el flujo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadFlow = async (flowId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const timestamp = new Date().getTime();
      const response = await fetch(`${apiUrl}/api/flows/by-id/${flowId}?t=${timestamp}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const flow = await response.json();
      
      console.log('🔄 Flow cargado desde API:', {
        nombre: flow.nombre,
        nodos: flow.nodes?.length,
        edges: flow.edges?.length
      });
      
      console.log('📋 LISTA COMPLETA DE NODOS RECIBIDOS:');
      flow.nodes?.forEach((node: any, index: number) => {
        console.log(`   ${index + 1}. ${node.data?.label || node.type} (${node.id})`);
      });
      
      if (flow && flow.nodes && flow.edges) {
        // PRECALCULAR HANDLES DE ROUTERS
        const routerHandles = new Map<string, string[]>();
        flow.edges.forEach((edge: any) => {
          if (edge.sourceHandle) {
            const handles = routerHandles.get(edge.source) || [];
            if (!handles.includes(edge.sourceHandle)) {
              handles.push(edge.sourceHandle);
            }
            routerHandles.set(edge.source, handles);
          }
        });
        
        // Función helper para obtener color según tipo de nodo
        const getColorForNodeType = (nodeType: string): string => {
          switch (nodeType) {
            case 'whatsapp': return '#25D366';
            case 'gpt': return '#10a37f';
            case 'woocommerce': return '#96588a';
            case 'mercadopago': return '#009ee3';
            case 'router': return '#f59e0b';
            case 'webhook': return '#ff6b6b';
            default: return '#6b7280';
          }
        };

        // Calcular números de ejecución basados en posición en el flujo
        const calculateExecutionOrder = (nodes: any[], edges: any[]) => {
          const nodeOrder = new Map<string, number>();
          const nodeLetter = new Map<string, string>();
          const visited = new Set<string>();
          
          // Encontrar nodo inicial (primer nodo sin conexiones entrantes)
          const nodesWithIncoming = new Set(edges.map((e: any) => e.target));
          const startNode = nodes.find((n: any) => !nodesWithIncoming.has(n.id));
          
          if (!startNode) return { nodeOrder, nodeLetter };
          
          // BFS para calcular orden
          const queue = [{ id: startNode.id, order: 1 }];
          visited.add(startNode.id);
          nodeOrder.set(startNode.id, 1);
          
          while (queue.length > 0) {
            const current = queue.shift()!;
            const outgoingEdges = edges.filter((e: any) => e.source === current.id);
            
            outgoingEdges.forEach((edge: any) => {
              if (!visited.has(edge.target)) {
                visited.add(edge.target);
                const order = current.order + 1;
                nodeOrder.set(edge.target, order);
                queue.push({ id: edge.target, order });
              }
            });
          }
          
          // Agrupar nodos por número de orden para asignar letras
          const orderGroups = new Map<number, string[]>();
          nodeOrder.forEach((order, nodeId) => {
            if (!orderGroups.has(order)) {
              orderGroups.set(order, []);
            }
            orderGroups.get(order)!.push(nodeId);
          });
          
          // Asignar letras a nodos con el mismo número
          orderGroups.forEach((nodeIds, order) => {
            if (nodeIds.length > 1) {
              // Múltiples nodos en el mismo nivel - asignar letras
              nodeIds.sort(); // Ordenar para consistencia
              nodeIds.forEach((nodeId, index) => {
                const letter = String.fromCharCode(97 + index); // a, b, c, ...
                nodeLetter.set(nodeId, letter);
              });
            }
          });
          
          return { nodeOrder, nodeLetter };
        };
        
        const { nodeOrder: executionOrder, nodeLetter: executionLetter } = calculateExecutionOrder(flow.nodes, flow.edges);

        // Agregar handlers a cada nodo
        const nodesWithHandlers = flow.nodes.map((node: any) => {
          // Determinar label correcto para nodos WhatsApp
          let nodeLabel = node.data.label;
          if (node.type === 'whatsapp' && node.data.config?.module) {
            nodeLabel = node.data.config.module === 'watch-events' ? 'Watch Events' : 
                       node.data.config.module === 'send-message' ? 'Send Message' : 
                       node.data.label;
          }
          
          const order = executionOrder.get(node.id);
          const letter = executionLetter.get(node.id);
          
          return {
            ...node,
            data: {
              ...node.data,
              label: nodeLabel,
              executionCount: order ? (letter ? `${order}${letter}` : order) : undefined,
              color: node.data.color || getColorForNodeType(node.type),
              onNodeClick: handleNodeClick,
              onPlusClick: handlePlusNodeClick,
              routeHandles: node.type === 'router' ? routerHandles.get(node.id) || [] : undefined,
              // Agregar callbacks para notas
              ...(node.type === 'note' ? {
                onDelete: (nodeId: string) => {
                  setNodes(prev => prev.filter(n => n.id !== nodeId));
                },
                onChange: (nodeId: string, content: string, title?: string) => {
                  setNodes(prev => prev.map(n => 
                    n.id === nodeId 
                      ? { ...n, data: { ...n.data, content, title: title || n.data.title } }
                      : n
                  ));
                },
                onToggleMinimize: (nodeId: string) => {
                  setNodes(prev => prev.map(n => 
                    n.id === nodeId 
                      ? { ...n, data: { ...n.data, isMinimized: !n.data.isMinimized } }
                      : n
                  ));
                }
              } : {})
            },
          };
        });
        
        const edgesWithHandlers = flow.edges.map((edge: any) => ({
          ...edge,
          sourceHandle: 'b', // Normalizar a IDs simples
          targetHandle: 'a', // Normalizar a IDs simples
          zIndex: 200,
          data: {
            ...edge.data,
            onConfigClick: handleEdgeConfigClick,
          }
        }));
        
        setNodes(nodesWithHandlers);
        setEdges(edgesWithHandlers);
        setFlowName(flow.nombre || 'Flow sin nombre');
        setCurrentFlowId(flowId);
        setCurrentFlowActive(flow.activo || false);
        
        // Cargar variables y tópicos globales
        if (flow.config) {
          setGlobalVariables(flow.config.variables_globales || {});
          setGlobalTopics(flow.config.topicos || {});
          console.log('📊 Variables cargadas:', flow.config.variables_globales);
          console.log('📚 Tópicos cargados:', flow.config.topicos);
        }
      }
    } catch (error) {
      console.error('Error cargando flow:', error);
      toast.error('Error al cargar el flujo');
    }
  };

  const toggleCurrentFlowStatus = async () => {
    if (!currentFlowId) {
      toast.warning('No hay flujo seleccionado');
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/flows/${currentFlowId}/toggle`, {
        method: 'PATCH'
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentFlowActive(data.activo);
        console.log(`${data.activo ? '▶️' : '⏸️'} Flow ${data.activo ? 'activado' : 'pausado'}`);
        
        // Recargar lista de flujos
        const empresaId = localStorage.getItem('empresaId') || 'Veo Veo';
        const listResponse = await fetch(`${apiUrl}/api/flows?empresaId=${empresaId}`);
        const listData = await listResponse.json();
        const flows = Array.isArray(listData) ? listData : (listData.flows || []);
        setFlowsList(flows);
      }
    } catch (error) {
      console.error('Error toggling flow status:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.flowBuilderContainer}>
        {/* Selector de flujos - arriba izquierda */}
        <div className={styles.floatingFlowSelectorContainer}>
          <select
            value={currentFlowId || ''}
            onChange={(e) => {
              const flowId = e.target.value;
              if (flowId) {
                setCurrentFlowId(flowId);
                handleLoadFlow(flowId);
                router.push(`/dashboard/flow-builder?flowId=${flowId}`);
              }
            }}
            className={styles.floatingFlowSelector}
          >
            <option value="">Seleccionar flujo...</option>
            {flowsList.map((flow) => (
              <option key={flow._id} value={flow._id}>
                {flow.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.flowCanvas}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeUpdate={onEdgeUpdate}
            onEdgeUpdateStart={onEdgeUpdateStart}
            onEdgeUpdateEnd={onEdgeUpdateEnd}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            snapToGrid={true}
            snapGrid={[15, 15]}
            connectionRadius={50}
            fitView
            minZoom={0.5}
            maxZoom={1.5}
            elementsSelectable={true}
            deleteKeyCode={showConfigPanel ? null : 'Delete'}
            defaultEdgeOptions={{
              type: 'default',
              animated: true,
            }}
          >
            <Controls>
              <ControlButton onClick={handleUndo} disabled={historyIndex <= 0} title="Deshacer (Ctrl+Z)">
                <Undo size={16} />
              </ControlButton>
              <ControlButton onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Rehacer (Ctrl+Y)">
                <Redo size={16} />
              </ControlButton>
            </Controls>
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={24} 
              size={0.5} 
              color="rgba(0, 0, 0, 0.04)"
            />
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

        <WebhookConfigModal
          isOpen={showWebhookConfigModal}
          onClose={() => {
            setShowWebhookConfigModal(false);
            setSelectedModule(null);
            setSelectedNode(null);
          }}
          onSave={selectedNode ? handleSaveWebhookNodeConfig : handleWebhookConfigSave}
          initialConfig={selectedNode?.data?.config}
          nodeId={selectedNode?.id || 'new-webhook'}
          allNodes={nodes}
        />

        {selectedApp && selectedModule && (
          <GPTConfigModal
            isOpen={showGPTConfigModal}
            onClose={() => {
              setShowGPTConfigModal(false);
              setSelectedModule(null);
            }}
            onSave={handleGPTConfigSave}
            moduleType={selectedModule.tipo || 'conversacional'}
            moduleName={selectedModule.name}
          />
        )}

        <HTTPConfigModal
          isOpen={showHTTPConfigModal}
          onClose={() => {
            setShowHTTPConfigModal(false);
            setSelectedModule(null);
            setSelectedNode(null);
          }}
          onSave={selectedNode ? handleSaveHTTPNodeConfig : handleHTTPConfigSave}
          initialConfig={selectedNode?.data?.config}
          globalVariables={Object.keys(globalVariables)}
          availableNodes={nodes}
          onTestRequest={handleTestHTTPRequest}
        />

        <MercadoPagoConfigModal
          isOpen={showMercadoPagoConfigModal}
          onClose={() => {
            setShowMercadoPagoConfigModal(false);
            setSelectedNode(null);
          }}
          nodeData={selectedNode}
          onSave={handleMercadoPagoConfigSave}
        />

        <MercadoPagoWebhookConfigModal
          isOpen={showMercadoPagoWebhookModal}
          onClose={() => {
            setShowMercadoPagoWebhookModal(false);
            setSelectedNode(null);
          }}
          nodeData={selectedNode}
          onSave={handleMercadoPagoWebhookConfigSave}
        />

        <EdgeConfigModal
          isOpen={showEdgeConfigModal}
          onClose={() => {
            setShowEdgeConfigModal(false);
            setSelectedEdgeId(null);
          }}
          onSave={handleSaveEdgeConfig}
          edgeId={selectedEdgeId || ''}
          sourceNodeType={(() => {
            const edge = edges.find(e => e.id === selectedEdgeId);
            if (!edge) return undefined;
            const sourceNode = nodes.find(n => n.id === edge.source);
            return sourceNode?.type;
          })()}
          currentConfig={edges.find(e => e.id === selectedEdgeId)?.data}
          allNodes={nodes}
          allEdges={edges}
          availableNodes={(() => {
            const edge = edges.find(e => e.id === selectedEdgeId);
            if (!edge) return [];
            
            const sourceNodeId = edge.source;
            const sourceNode = nodes.find(n => n.id === sourceNodeId);
            if (!sourceNode) return [];
            
            console.log('🔍 DEBUG EdgeConfig - Edge:', edge.id);
            console.log('   Source Node:', sourceNode.data.label, '(type:', sourceNode.type, ')');
            
            const upstreamNodes = new Set<string>();
            
            // Función para encontrar todos los nodos UPSTREAM (anteriores)
            const findUpstreamNodes = (nodeId: string, visited = new Set<string>()) => {
              if (visited.has(nodeId)) {
                console.log('   ⚠️  Ciclo detectado, deteniendo recursión para:', nodeId);
                return;
              }
              visited.add(nodeId);
              
              const currentNode = nodes.find(n => n.id === nodeId);
              console.log('   Buscando upstream de:', currentNode?.data.label);
              
              // Buscar edges que LLEGAN a este nodo (incoming edges)
              const incomingEdges = edges.filter(e => e.target === nodeId);
              console.log('   Incoming edges:', incomingEdges.length);
              
              for (const incomingEdge of incomingEdges) {
                const upstreamNode = nodes.find(n => n.id === incomingEdge.source);
                if (!upstreamNode) continue;
                
                // Si ya visitamos este nodo, es un ciclo - no continuar
                if (visited.has(upstreamNode.id)) {
                  console.log('     → Upstream node:', upstreamNode.data.label, '(CICLO - ignorado)');
                  continue;
                }
                
                console.log('     → Upstream node:', upstreamNode.data.label, '(type:', upstreamNode.type, ')');
                
                // Agregar nodo upstream si genera datos (no es router)
                if (upstreamNode.type !== 'router') {
                  upstreamNodes.add(upstreamNode.id);
                  console.log('       ✅ Agregado');
                } else {
                  console.log('       ❌ Excluido (router)');
                }
                
                // Continuar buscando hacia atrás
                findUpstreamNodes(upstreamNode.id, visited);
              }
            };
            
            // Si el edge sale de un Router, buscar nodos upstream del Router
            // Si no, el source node es el único disponible
            if (sourceNode.type === 'router') {
              console.log('   Es Router, buscando nodos que conectan directamente...');
              
              // Para Router: solo buscar nodos que conectan DIRECTAMENTE (1 nivel)
              // No hacer recursión profunda para evitar ciclos
              const directIncomingEdges = edges.filter(e => e.target === sourceNodeId);
              console.log('   Edges directos al Router:', directIncomingEdges.length);
              
              for (const incomingEdge of directIncomingEdges) {
                const directUpstreamNode = nodes.find(n => n.id === incomingEdge.source);
                if (directUpstreamNode && directUpstreamNode.type !== 'router') {
                  upstreamNodes.add(directUpstreamNode.id);
                  console.log('     ✅ Nodo directo agregado:', directUpstreamNode.data.label);
                }
              }
            } else {
              console.log('   No es Router, agregando source node');
              upstreamNodes.add(sourceNodeId);
              findUpstreamNodes(sourceNodeId);
            }
            
            console.log('   📊 Total upstream nodes:', upstreamNodes.size);
            
            // Retornar nodos upstream con su información
            const result = Array.from(upstreamNodes)
              .map(nodeId => {
                const node = nodes.find(n => n.id === nodeId);
                return node ? { id: node.id, label: node.data.label, type: node.type || 'default' } : null;
              })
              .filter((n): n is { id: string; label: string; type: string } => n !== null);
            
            console.log('   📋 Nodos finales:', result.map(n => n.label));
            return result;
          })()}
          globalVariables={Object.keys(globalVariables)}
        />

        {showConfigPanel && selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onClose={() => setShowConfigPanel(false)}
            onSave={handleSaveNodeConfig}
            globalVariables={globalVariables}
          />
        )}

        <FloatingActionBar
          onAddNode={() => {
            console.log('🎯 Abriendo modal de apps para agregar nodo');
            setSourceNodeForConnection(null);
            setSourceHandleForConnection(undefined);
            setShowAppsModal(true);
            setAppsModalPosition(undefined);
          }}
          onAddNote={handleAddNote}
          onOpenVariables={() => {
            console.log('📊 Abriendo modal de variables');
            setShowVariablesModal(true);
          }}
          onOpenTopics={() => {
            console.log('📚 Abriendo modal de tópicos');
            setShowTopicsModal(true);
          }}
          onSave={handleSaveFlow}
          onToggleFlowStatus={toggleCurrentFlowStatus}
          isFlowActive={currentFlowActive}
          flowId={currentFlowId}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        <VariablesModal
          isOpen={showVariablesModal}
          onClose={() => setShowVariablesModal(false)}
          variables={globalVariables}
          onSave={(vars) => {
            setGlobalVariables(vars);
            console.log('✅ Variables globales actualizadas:', vars);
          }}
        />

        <TopicsModal
          isOpen={showTopicsModal}
          onClose={() => setShowTopicsModal(false)}
          topics={globalTopics}
          onSave={(topics) => {
            setGlobalTopics(topics);
            console.log('✅ Tópicos globales actualizados:', topics);
          }}
        />

        {/* Panel de validación del flujo */}
        <FlowValidationPanel
          nodes={nodes}
          edges={edges}
          onNodeSelect={handleNodeClick}
          onOpenNodeConfig={handleOpenNodeConfigFromValidation}
        />
      </div>
    </DashboardLayout>
  );
}

export default function FlowBuilderPage() {
  return (
    <ToastProvider>
      <FlowBuilderContent />
    </ToastProvider>
  );
}
