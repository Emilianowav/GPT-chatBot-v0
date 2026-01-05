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
  label?: string;
  executionCount?: number;
  outputCount?: number;
  onAddRoute?: (nodeId: string) => void;
  onNodeClick?: (nodeId: string) => void;
}

function RouterNode({ id, data, selected }: NodeProps<RouterNodeData>) {
  const {
    label = 'Router',
    executionCount = 1,
    outputCount = 2,
    onAddRoute,
    onNodeClick,
  } = data;

  const handleNodeClick = () => {
    if (onNodeClick) {
      onNodeClick(id);
    }
  };

  const handleAddRoute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddRoute) {
      onAddRoute(id);
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
        onClick={handleNodeClick}
        role="button"
        tabIndex={0}
        aria-label={label}
      >
        <GitBranch size={40} color="white" strokeWidth={2.5} />
      </div>

      {/* Badge de ejecución (arriba derecha) */}
      <div className={styles.executionBadge}>
        {executionCount}
      </div>

      {/* Handles de salida múltiples (derecha) */}
      {Array.from({ length: outputCount }).map((_, index) => (
        <Handle
          key={`output-${index}`}
          type="source"
          position={Position.Right}
          id={`output-${index}`}
          style={{
            top: `${((index + 1) * 100) / (outputCount + 1)}%`,
            opacity: 0,
          }}
        />
      ))}

      {/* Handle visual conectado (derecha) */}
      <div className={styles.handleConnected} />

      {/* Handle + para agregar ruta */}
      <div
        className={styles.handlePlus}
        onClick={handleAddRoute}
        role="button"
        tabIndex={0}
        aria-label="Add route"
      >
        <Plus size={20} color="white" strokeWidth={3} />
      </div>

      {/* Label */}
      <div className={styles.nodeLabel}>{label}</div>
    </div>
  );
}

export default memo(RouterNode);
