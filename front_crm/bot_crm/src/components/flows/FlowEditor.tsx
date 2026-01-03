'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, Code, Settings } from 'lucide-react';
import NodeEditor from './NodeEditor';
import NodeList from './NodeList';
import FlowVisualizer from './FlowVisualizer';
import styles from './FlowEditor.module.css';

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
      const response = await fetch(`http://localhost:3000/api/flows/${flowId}/nodes`);
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
        ? `http://localhost:3000/api/flows/${flow._id}`
        : 'http://localhost:3000/api/flows';
      
      const method = flow?._id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData)
      });

      if (response.ok) {
        alert('Flujo guardado exitosamente');
        if (!flow?._id) {
          const newFlow = await response.json();
          setFlowData(newFlow);
        }
      }
    } catch (error) {
      console.error('Error saving flow:', error);
      alert('Error al guardar el flujo');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNode = async (node: FlowNode) => {
    try {
      const url = node._id
        ? `http://localhost:3000/api/flows/${flowData.id}/nodes/${node._id}`
        : `http://localhost:3000/api/flows/${flowData.id}/nodes`;
      
      const method = node._id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...node, empresaId, flowId: flowData.id })
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
    if (!confirm('¿Eliminar este nodo?')) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/flows/${flowData.id}/nodes/${nodeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadNodes(flowData.id);
      }
    } catch (error) {
      console.error('Error deleting node:', error);
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerTop}>
            <div className={styles.headerLeft}>
              <button onClick={onClose} className={styles.backButton}>
                <ArrowLeft style={{ width: '20px', height: '20px' }} />
              </button>
              <div>
                <h1 className={styles.headerTitle}>
                  {flow ? 'Editar Flujo' : 'Nuevo Flujo'}
                </h1>
                <p className={styles.headerSubtitle}>
                  {flowData.nombre || 'Sin nombre'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleSaveFlow} 
              disabled={saving}
              className={styles.saveButton}
            >
              <Save style={{ width: '18px', height: '18px' }} />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>

          <div className={styles.tabs}>
            <button
              onClick={() => setActiveTab('nodes')}
              className={`${styles.tab} ${activeTab === 'nodes' ? styles.tabActive : ''}`}
            >
              <Code style={{ width: '18px', height: '18px' }} />
              Nodos
            </button>
            <button
              onClick={() => setActiveTab('visual')}
              className={`${styles.tab} ${activeTab === 'visual' ? styles.tabActive : ''}`}
            >
              <Eye style={{ width: '18px', height: '18px' }} />
              Visualizar
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`${styles.tab} ${activeTab === 'settings' ? styles.tabActive : ''}`}
            >
              <Settings style={{ width: '18px', height: '18px' }} />
              Configuración
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === 'settings' && (
          <div className={styles.settingsPanel}>
            <div className={styles.settingsGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>ID del Flujo</label>
                <input
                  type="text"
                  value={flowData.id}
                  onChange={(e) => setFlowData({ ...flowData, id: e.target.value })}
                  className={styles.input}
                  placeholder="ej: consultar-libros"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre</label>
                <input
                  type="text"
                  value={flowData.nombre}
                  onChange={(e) => setFlowData({ ...flowData, nombre: e.target.value })}
                  className={styles.input}
                  placeholder="ej: Consultar Libros"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Categoría</label>
                <select
                  value={flowData.categoria}
                  onChange={(e) => setFlowData({ ...flowData, categoria: e.target.value })}
                  className={styles.select}
                >
                  <option value="general">General</option>
                  <option value="ventas">Ventas</option>
                  <option value="soporte">Soporte</option>
                  <option value="consultas">Consultas</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nodo Inicial</label>
                <select
                  value={flowData.startNode}
                  onChange={(e) => setFlowData({ ...flowData, startNode: e.target.value })}
                  className={styles.select}
                >
                  <option value="">Seleccionar...</option>
                  {nodes.map(node => (
                    <option key={node.id} value={node.id}>{node.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Descripción</label>
              <textarea
                value={flowData.descripcion}
                onChange={(e) => setFlowData({ ...flowData, descripcion: e.target.value })}
                className={styles.textarea}
                placeholder="Describe el propósito de este flujo..."
              />
            </div>

            <div className={styles.checkbox}>
              <input
                type="checkbox"
                checked={flowData.activo}
                onChange={(e) => setFlowData({ ...flowData, activo: e.target.checked })}
                className={styles.checkboxInput}
              />
              <div>
                <label className={styles.checkboxLabel}>Flujo Activo</label>
                <p className={styles.checkboxDescription}>
                  El flujo estará disponible para los usuarios
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'nodes' && (
          <div className={styles.nodesGrid}>
            <NodeList
              nodes={nodes}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              onCreateNode={() => {
                setIsCreatingNode(true);
                setSelectedNode(null);
              }}
              onDeleteNode={handleDeleteNode}
            />
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
              <div className={styles.emptyPlaceholder}>
                <Code className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>Selecciona un nodo</h3>
                <p className={styles.emptyText}>
                  Elige un nodo de la lista o crea uno nuevo para comenzar
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'visual' && (
          <FlowVisualizer
            nodes={nodes}
            startNode={flowData.startNode}
            onSelectNode={setSelectedNode}
          />
        )}
      </div>
    </div>
  );
}
