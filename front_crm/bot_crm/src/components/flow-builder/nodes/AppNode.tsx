import React, { memo } from 'react';
import { NodeProps, Handle, Position, useEdges, useNodes } from 'reactflow';
import { Plus, Zap } from 'lucide-react';
import styles from './AppNode.module.css';
import { NODE_RADIUS, HANDLE_ORBIT_RADIUS } from '../constants';

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

  const edges = useEdges();
  const nodes = useNodes();

  // Calcular conexiones
  const outgoingEdges = edges.filter(edge => edge.source === id);
  const incomingEdges = edges.filter(edge => edge.target === id);
  const hasOutgoingConnection = outgoingEdges.length > 0;

  // Obtener nodo actual
  const currentNode = nodes.find(n => n.id === id);
  if (!currentNode) return null;

  // Función para calcular posición del handle en órbita
  const calculateHandlePosition = (targetNodeId: string) => {
    const targetNode = nodes.find(n => n.id === targetNodeId);
    if (!targetNode) return { x: 0, y: 0 };

    // Centros de nodos
    const sourceCenterX = currentNode.position.x + NODE_RADIUS;
    const sourceCenterY = currentNode.position.y + NODE_RADIUS;
    const targetCenterX = targetNode.position.x + NODE_RADIUS;
    const targetCenterY = targetNode.position.y + NODE_RADIUS;

    // Ángulo entre centros
    const dx = targetCenterX - sourceCenterX;
    const dy = targetCenterY - sourceCenterY;
    const angle = Math.atan2(dy, dx);

    // Posición en órbita
    return {
      x: Math.cos(angle) * HANDLE_ORBIT_RADIUS,
      y: Math.sin(angle) * HANDLE_ORBIT_RADIUS,
    };
  };

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

      {/* Handles visuales de entrada */}
      {incomingEdges.map((edge) => {
        const pos = calculateHandlePosition(edge.source);
        return (
          <div
            key={`input-${edge.id}`}
            className={styles.handleOrbit}
            style={{
              background: color,
              left: `calc(50% + ${pos.x}px)`,
              top: `calc(50% + ${pos.y}px)`,
            }}
          />
        );
      })}

      {/* Handles visuales de salida */}
      {hasOutgoingConnection ? (
        outgoingEdges.map((edge) => {
          const pos = calculateHandlePosition(edge.target);
          return (
            <div
              key={`output-${edge.id}`}
              className={styles.handleOrbit}
              style={{
                background: color,
                left: `calc(50% + ${pos.x}px)`,
                top: `calc(50% + ${pos.y}px)`,
              }}
            />
          );
        })
      ) : (
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

      {/* Handles invisibles ReactFlow */}
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      {/* Labels */}
      <div className={styles.nodeLabel}>{label}</div>
      {subtitle && (
        <div className={styles.nodeSubtitle}>{subtitle}</div>
      )}
    </div>
  );
}

export default memo(AppNode);
