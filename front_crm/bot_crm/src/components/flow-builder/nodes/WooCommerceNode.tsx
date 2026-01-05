import React, { memo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { ShoppingCart, Plus } from 'lucide-react';
import styles from './AppNode.module.css';

interface WooCommerceNodeData {
  label: string;
  subtitle?: string;
  executionCount?: number;
  hasConnection?: boolean;
  onHandleClick?: (nodeId: string) => void;
  onNodeClick?: (nodeId: string) => void;
  config?: {
    apiConfigId: string;
    endpointId: string;
    parametros?: Record<string, any>;
    responseConfig?: {
      arrayPath?: string;
      idField?: string;
      displayField?: string;
      priceField?: string;
      stockField?: string;
    };
    mensajeSinResultados?: string;
  };
}

function WooCommerceNode({ id, data, selected }: NodeProps<WooCommerceNodeData>) {
  const {
    label,
    subtitle,
    executionCount = 1,
    hasConnection = false,
    onHandleClick,
    onNodeClick,
  } = data;

  const color = '#96588a'; // WooCommerce purple

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
        <ShoppingCart size={48} color="white" strokeWidth={2} />

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
          <ShoppingCart size={16} color="white" strokeWidth={2.5} />
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
      {subtitle && (
        <div className={styles.nodeSubtitle}>{subtitle}</div>
      )}
    </div>
  );
}

export default memo(WooCommerceNode);
