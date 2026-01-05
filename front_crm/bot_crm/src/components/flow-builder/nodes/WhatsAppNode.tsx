import React, { memo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { MessageCircle, Plus } from 'lucide-react';
import styles from './AppNode.module.css';

interface WhatsAppNodeData {
  label: string;
  subtitle?: string;
  executionCount?: number;
  hasConnection?: boolean;
  onHandleClick?: (nodeId: string) => void;
  onNodeClick?: (nodeId: string) => void;
  config?: {
    tipo: 'trigger' | 'input' | 'send_message';
    pregunta?: string;
    nombreVariable?: string;
    validacion?: {
      tipo: 'texto' | 'numero' | 'opcion';
      requerido?: boolean;
      opciones?: string[];
      min?: number;
      max?: number;
      mensajeError?: string;
    };
  };
}

function WhatsAppNode({ id, data, selected }: NodeProps<WhatsAppNodeData>) {
  const {
    label,
    subtitle,
    executionCount = 1,
    hasConnection = false,
    onHandleClick,
    onNodeClick,
  } = data;

  const color = '#25D366'; // WhatsApp green

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
        <MessageCircle size={48} color="white" strokeWidth={2} />

        {/* Badge de ejecución (arriba derecha) */}
        <div 
          className={styles.executionBadge}
          style={{ background: '#ef4444' }}
        >
          {executionCount}
        </div>

        {/* Badge de WhatsApp (abajo izquierda) */}
        <div 
          className={styles.appBadge}
          style={{ background: color }}
        >
          <MessageCircle size={16} color="white" strokeWidth={2.5} />
        </div>
      </div>

      {/* Handle invisible de ReactFlow (posición estándar Left) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0 }}
      />

      {/* Handle + para agregar siguiente nodo */}
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

      {/* Handle invisible de ReactFlow (posición estándar Right) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0 }}
      />

      {/* Labels */}
      <div className={styles.nodeLabel}>{label}</div>
      {subtitle && (
        <div className={styles.nodeSubtitle}>{subtitle}</div>
      )}
    </div>
  );
}

export default memo(WhatsAppNode);
