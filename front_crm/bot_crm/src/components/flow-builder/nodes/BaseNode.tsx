/**
 * BASE NODE - Componente genérico para nodos de integración
 * 
 * PROPÓSITO:
 * - Evitar duplicación de código entre nodos similares
 * - Handles móviles en órbita (se mueven según conexiones)
 * - Handle plus solo en hover
 * - Click en handle para desconectar
 * 
 * USO:
 * - GPTNode, WhatsAppNode, WooCommerceNode, MercadoPagoNode, WebhookNode
 * - Todos comparten la misma estructura base
 */

import React, { memo, useState } from 'react';
import { NodeProps, Handle, Position, useReactFlow } from 'reactflow';
import { Plus } from 'lucide-react';
import styles from './BaseNode.module.css';

interface BaseNodeData {
  label: string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  color: string;
  executionCount?: number;
  onNodeClick?: (nodeId: string) => void;
  onHandleClick?: (nodeId: string) => void;
}

interface BaseNodeProps extends NodeProps<BaseNodeData> {
  nodeRadius?: number;
}

function BaseNode({ id, data, selected, nodeRadius = 40 }: BaseNodeProps) {
  const {
    label,
    subtitle,
    icon: Icon,
    color,
    executionCount = 1,
    onNodeClick,
    onHandleClick,
  } = data;

  const [isHovered, setIsHovered] = useState(false);
  const { getEdges } = useReactFlow();

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

  // Verificar si hay conexiones
  const edges = getEdges();
  const hasSourceConnection = edges.some(edge => edge.source === id);
  const hasTargetConnection = edges.some(edge => edge.target === id);

  return (
    <div 
      className={styles.baseNodeContainer}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Círculo principal del nodo */}
      <div
        className={`${styles.baseNode} ${selected ? styles.selected : ''}`}
        style={{ background: color }}
        onClick={handleNodeClick}
        role="button"
        tabIndex={0}
        aria-label={label}
      >
        <Icon size={48} color="white" strokeWidth={2} />

        {/* Badge de ejecución */}
        <div 
          className={styles.executionBadge}
          style={{ background: '#ef4444' }}
        >
          {executionCount}
        </div>

        {/* Badge de app (icono pequeño) */}
        <div 
          className={styles.appBadge}
          style={{ background: color }}
        >
          <Icon size={16} color="white" strokeWidth={2.5} />
        </div>
      </div>

      {/* Handle de entrada (izquierda) - Según documentación oficial de React Flow */}
      <Handle
        type="target"
        position={Position.Left}
        id="a"
        className={styles.handle}
        style={{
          background: hasTargetConnection ? color : '#9ca3af',
          width: '16px',
          height: '16px',
          border: '3px solid white',
          borderRadius: '50%',
          boxShadow: hasTargetConnection 
            ? `0 0 0 2px ${color}, 0 2px 8px rgba(0, 0, 0, 0.2)` 
            : '0 0 0 2px #6b7280, 0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
      />

      {/* Handle de salida (derecha) - Según documentación oficial de React Flow */}
      <Handle
        type="source"
        position={Position.Right}
        id="b"
        className={styles.handle}
        style={{
          background: hasSourceConnection ? color : '#9ca3af',
          width: '16px',
          height: '16px',
          border: '3px solid white',
          borderRadius: '50%',
          boxShadow: hasSourceConnection 
            ? `0 0 0 2px ${color}, 0 2px 8px rgba(0, 0, 0, 0.2)` 
            : '0 0 0 2px #6b7280, 0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
      />

      {/* Handle Plus - Solo visible en hover y si no hay conexión de salida */}
      {isHovered && !hasSourceConnection && (
        <div
          className={styles.handlePlus}
          style={{
            position: 'absolute',
            right: '-10px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 120,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            pointerEvents: 'auto',
          }}
          onClick={handlePlusClick}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          role="button"
          tabIndex={0}
          aria-label="Add next module"
        >
          <Plus size={16} color="white" strokeWidth={3} />
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

export default memo(BaseNode);
