import React, { memo } from 'react';
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
  onHandleClick?: (nodeId: string, handleId?: string) => void;
  onNodeClick?: (nodeId: string) => void;
  routes?: number;
  config?: {
    conditions?: Array<{
      label: string;
      condition: string;
    }>;
    opciones?: Array<{
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
    routes = 2,
    config,
  } = data;

  const color = '#f59e0b'; // Router yellow/orange
  const totalRoutes = routes || config?.conditions?.length || config?.opciones?.length || 2;

  const handleNodeClick = () => {
    if (onNodeClick) {
      onNodeClick(id);
    }
  };

  const handlePlusClick = (handleId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHandleClick) {
      onHandleClick(id, handleId);
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

      {/* Handles de salida múltiples (derecha) - distribuidos verticalmente */}
      {Array.from({ length: totalRoutes }).map((_, index) => {
        const topPosition = ((index + 1) * 100) / (totalRoutes + 1);
        const handleId = `source-${index}`;
        
        return (
          <React.Fragment key={handleId}>
            <Handle
              type="source"
              position={Position.Right}
              id={handleId}
              style={{
                top: `${topPosition}%`,
                opacity: 0,
                background: color,
              }}
            />
            
            {/* Botón + para cada salida del router */}
            <div
              className={styles.handlePlusRoute}
              style={{ 
                background: color,
                top: `${topPosition}%`,
              }}
              onClick={handlePlusClick(handleId)}
              role="button"
              tabIndex={0}
              aria-label={`Add module to route ${index + 1}`}
            >
              <Plus size={20} color="white" strokeWidth={3} />
            </div>
          </React.Fragment>
        );
      })}

      {/* Label */}
      <div className={styles.nodeLabel}>{label}</div>
      {subtitle && (
        <div className={styles.nodeSubtitle}>{subtitle}</div>
      )}
    </div>
  );
}

export default memo(RouterNode);
