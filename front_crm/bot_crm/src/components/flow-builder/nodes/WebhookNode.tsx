import React, { memo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Bell, Plus } from 'lucide-react';
import styles from './AppNode.module.css';

interface WebhookNodeData {
  label: string;
  icon?: string;
  executionCount?: number;
  hasConnection?: boolean;
  onHandleClick?: (nodeId: string) => void;
  onNodeClick?: (nodeId: string) => void;
  config?: {
    tipo: 'listener' | 'trigger';
    endpoint?: string;
    metodo?: string;
    filtros?: any;
    timeout?: number;
  };
}

function WebhookNode({ id, data, selected }: NodeProps<WebhookNodeData>) {
  const {
    label,
    executionCount = 1,
    hasConnection = false,
    onHandleClick,
    onNodeClick,
    config,
  } = data;

  const color = '#ff6b6b'; // Webhook red

  const handleNodeClick = () => {
    if (onNodeClick) {
      onNodeClick(id);
    }
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHandleClick) {
      onHandleClick(id);
    }
  };

  return (
    <div className={styles.appNodeContainer}>
      <div
        className={`${styles.appNode} ${selected ? styles.selected : ''}`}
        style={{ background: color }}
        onClick={handleNodeClick}
      >
        <Bell size={48} color="white" strokeWidth={2} />

        <div 
          className={styles.executionBadge}
          style={{ background: '#ef4444' }}
        >
          {executionCount}
        </div>

        <div 
          className={styles.appBadge}
          style={{ background: color }}
        >
          <Bell size={16} color="white" strokeWidth={2.5} />
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0 }}
      />

      {!hasConnection && (
        <div
          className={styles.handlePlus}
          style={{ background: color }}
          onClick={handlePlusClick}
          role="button"
          tabIndex={0}
          aria-label="Add next module"
        >
          <Plus size={20} color="white" strokeWidth={3} />
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0 }}
      />

      <div className={styles.nodeLabel}>{label}</div>
      {config?.tipo && (
        <div className={styles.nodeSubtitle}>
          {config.tipo === 'listener' ? 'Escuchando' : config.tipo}
        </div>
      )}
    </div>
  );
}

export default memo(WebhookNode);
