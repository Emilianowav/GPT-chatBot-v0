'use client';

import { Plus, Menu, MessageSquare, GitBranch, Zap, Globe, Brain, Trash2 } from 'lucide-react';
import styles from './NodeList.module.css';

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

export default function NodeList({ nodes, selectedNode, onSelectNode, onCreateNode, onDeleteNode }: NodeListProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Nodos</h3>
        <button
          onClick={onCreateNode}
          className={styles.createButton}
          title="Crear nodo"
        >
          <Plus style={{ width: '1rem', height: '1rem' }} />
        </button>
      </div>

      <div className={styles.nodesList}>
        {nodes.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No hay nodos creados</p>
            <button
              onClick={onCreateNode}
              className={styles.emptyButton}
            >
              Crear primer nodo
            </button>
          </div>
        ) : (
          nodes.map((node) => {
            const Icon = nodeTypeIcons[node.type] || MessageSquare;
            const iconClass = `icon${node.type.charAt(0).toUpperCase() + node.type.slice(1).replace('_', '')}`;
            const isSelected = selectedNode?.id === node.id;

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node)}
                className={`${styles.nodeItem} ${isSelected ? styles.nodeItemSelected : ''}`}
              >
                <div className={styles.nodeContent}>
                  <div className={`${styles.nodeIcon} ${styles[iconClass]}`}>
                    <Icon style={{ width: '1rem', height: '1rem' }} />
                  </div>
                  
                  <div className={styles.nodeInfo}>
                    <h4 className={styles.nodeName}>
                      {node.name}
                    </h4>
                    <div className={styles.nodeMetadata}>
                      <span className={styles.nodeType}>{node.type}</span>
                      {!node.activo && (
                        <span className={styles.nodeInactive}>Inactivo</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (node._id) onDeleteNode(node._id);
                    }}
                    className={styles.deleteButton}
                    title="Eliminar"
                  >
                    <Trash2 style={{ width: '0.875rem', height: '0.875rem' }} />
                  </button>
                </div>

                <div className={styles.nodeId}>
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
