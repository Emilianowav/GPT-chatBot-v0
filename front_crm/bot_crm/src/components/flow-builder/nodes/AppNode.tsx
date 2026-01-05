import { memo } from 'react';
import { NodeProps } from 'reactflow';
import { Plus, Zap } from 'lucide-react';
import styles from './AppNode.module.css';

/**
 * APP NODE - Nodo con app seleccionada estilo Make.com
 * 
 * Características:
 * - Círculo 100px con color de app
 * - Icono de app en el centro
 * - Badge de ejecución arriba derecha
 * - Badge de app abajo izquierda
 * - Handle + a la derecha (si no está conectado)
 * - Label y subtitle debajo
 */

interface AppNodeData {
  appName: string;
  appIcon?: React.ReactNode;
  color: string;
  label: string;
  subtitle?: string;
  executionCount?: number;
  hasConnection?: boolean;
  onHandleClick?: (nodeId: string) => void;
  onNodeClick?: (nodeId: string) => void;
}

function AppNode({ id, data, selected }: NodeProps<AppNodeData>) {
  const {
    appIcon,
    color,
    label,
    subtitle,
    executionCount = 1,
    hasConnection = false,
    onHandleClick,
    onNodeClick,
  } = data;

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
      {/* Círculo principal del nodo */}
      <div 
        className={`${styles.appNode} ${selected ? styles.selected : ''}`}
        style={{ 
          background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
          boxShadow: `0 8px 20px ${color}40`,
        }}
        onClick={handleNodeClick}
        role="button"
        tabIndex={0}
        aria-label={label}
      >
        {appIcon || <div className={styles.appIconPlaceholder}>?</div>}
      </div>

      {/* Badge de ejecución (arriba derecha) */}
      <div className={styles.executionBadge}>
        {executionCount}
      </div>

      {/* Badge de app (abajo izquierda) - ejemplo: rayo */}
      <div 
        className={styles.appBadge}
        style={{ background: color }}
      >
        <Zap size={16} color="white" strokeWidth={2.5} />
      </div>

      {/* Handle + a la derecha (solo si no está conectado) */}
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

      {/* Handle conectado (si está conectado) */}
      {hasConnection && (
        <div
          className={styles.handleConnected}
          style={{ background: color }}
        />
      )}

      {/* Labels */}
      <div className={styles.nodeLabel}>{label}</div>
      {subtitle && (
        <div className={styles.nodeSubtitle}>{subtitle}</div>
      )}
    </div>
  );
}

export default memo(AppNode);
