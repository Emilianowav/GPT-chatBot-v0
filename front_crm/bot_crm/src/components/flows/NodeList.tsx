'use client';

import { Plus, Trash2, Menu, MessageSquare, GitBranch, Zap, Globe, Brain } from 'lucide-react';
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
  const getIconClass = (type: string) => {
    const classMap: Record<string, string> = {
      menu: styles.iconMenu,
      input: styles.iconInput,
      message: styles.iconMessage,
      condition: styles.iconCondition,
      action: styles.iconAction,
      api_call: styles.iconApiCall,
      gpt: styles.iconGpt
    };
    return classMap[type] || styles.iconMenu;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Nodos</h3>
        <button onClick={onCreateNode} className={styles.createButton}>
          <Plus style={{ width: '18px', height: '18px' }} />
        </button>
      </div>

      <div className={styles.nodesList}>
        {nodes.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No hay nodos creados</p>
            <button onClick={onCreateNode} className={styles.emptyButton}>
              Crear primer nodo
            </button>
          </div>
        ) : (
          nodes.map((node) => {
            const Icon = nodeTypeIcons[node.type] || MessageSquare;
            const isSelected = selectedNode?.id === node.id;

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node)}
                className={`${styles.nodeItem} ${isSelected ? styles.nodeItemSelected : ''}`}
              >
                <div className={styles.nodeContent}>
                  <div className={`${styles.nodeIcon} ${getIconClass(node.type)}`}>
                    <Icon style={{ width: '18px', height: '18px' }} />
                  </div>
                  <div className={styles.nodeInfo}>
                    <div className={styles.nodeName}>{node.name}</div>
                    <div className={styles.nodeMetadata}>
                      <span className={styles.nodeType}>{node.type}</span>
                      {!node.activo && (
                        <span className={styles.nodeInactive}>INACTIVO</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNode(node._id || node.id);
                    }}
                    className={styles.deleteButton}
                  >
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
                <div className={styles.nodeId}>ID: {node.id}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
