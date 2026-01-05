import { memo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { GitBranch, Plus } from 'lucide-react';
import styles from './RouterNode.module.css';

/**
 * ROUTER NODE - Nodo especial para múltiples salidas estilo Make.com
 * 
 * Características:
 * - Círculo 100px verde lima
 * - Icono de bifurcación en el centro
 * - Badge de ejecución arriba derecha
 * - Múltiples handles de salida
 * - Handle + para agregar más rutas
 */

interface RouterNodeData {
  label: string;
  subtitle?: string;
  executionCount?: number;
  hasConnection?: boolean;
  onHandleClick?: (nodeId: string) => void;
  onNodeClick?: (nodeId: string) => void;
  config?: {
    opciones: Array<{
      valor: string;
      label: string;
      workflowId?: string;
    }>;
  };
}

function RouterNode({ id, data, selected }: NodeProps<RouterNodeData>) {
  const {
    label,
    subtitle,
    executionCount = 1,
    hasConnection = false,
    onHandleClick,
    onNodeClick,
    config,
  } = data;

  const color = '#f59e0b'; // Router yellow/orange

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
    <div className={styles.routerNodeContainer}>
      {/* Handle invisible de entrada (izquierda) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0 }}
      />

      {/* Círculo principal del nodo */}
      <div 
        className={`${styles.routerNode} ${selected ? styles.selected : ''}`}
        style={{ background: color }}
        onClick={handleNodeClick}
        role="button"
        tabIndex={0}
        aria-label={label}
      >
        <GitBranch size={48} color="white" strokeWidth={2} />

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
          <GitBranch size={16} color="white" strokeWidth={2.5} />
        </div>
      </div>

      {/* Handles de salida múltiples (derecha) */}
      {Array.from({ length: config?.opciones?.length || 2 }).map((_, index) => (
        <Handle
          key={`output-${index}`}
          type="source"
          position={Position.Right}
          id={`output-${index}`}
          style={{
            top: `${((index + 1) * 100) / (config?.opciones?.length + 1)}%`,
            opacity: 0,
          }}
        />
      ))}

      {/* Handle visual conectado (derecha) */}
      <div className={styles.handleConnected} />

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

      {/* Label */}
      <div className={styles.nodeLabel}>{label}</div>
      {subtitle && (
        <div className={styles.nodeSubtitle}>{subtitle}</div>
      )}
    </div>
  );
}

export default memo(RouterNode);
