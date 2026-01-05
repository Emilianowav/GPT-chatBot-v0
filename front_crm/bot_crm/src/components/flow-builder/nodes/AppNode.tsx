import React, { memo } from 'react';
import { NodeProps, Handle, Position, useEdges, useNodes } from 'reactflow';
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

  const edges = useEdges();
  const nodes = useNodes();

  // Calcular conexiones salientes y entrantes desde este nodo
  const outgoingEdges = edges.filter(edge => edge.source === id);
  const incomingEdges = edges.filter(edge => edge.target === id);
  const hasOutgoingConnection = outgoingEdges.length > 0;
  const hasIncomingConnection = incomingEdges.length > 0;

  // Obtener posición del nodo actual
  const currentNode = nodes.find(n => n.id === id);
  const currentPos = currentNode?.position || { x: 0, y: 0 };

  // Calcular ángulo entre dos nodos para posicionar handle en órbita
  const calculateHandleAngle = (targetNodeId: string): number => {
    const targetNode = nodes.find(n => n.id === targetNodeId);
    if (!targetNode) return 0;

    // Calcular desde el centro del nodo (position + 50px que es el radio)
    const nodeRadius = 50;
    const currentCenterX = currentPos.x + nodeRadius;
    const currentCenterY = currentPos.y + nodeRadius;
    const targetCenterX = targetNode.position.x + nodeRadius;
    const targetCenterY = targetNode.position.y + nodeRadius;

    const dx = targetCenterX - currentCenterX;
    const dy = targetCenterY - currentCenterY;
    
    // Calcular ángulo en radianes y convertir a grados
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI;
    
    return angleDeg;
  };

  // Calcular posición x,y del handle en órbita según ángulo
  const getHandlePosition = (angleDeg: number) => {
    const orbitRadius = 70; // 50px radio nodo + 20px separación
    const angleRad = (angleDeg * Math.PI) / 180;
    
    return {
      x: Math.cos(angleRad) * orbitRadius,
      y: Math.sin(angleRad) * orbitRadius,
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

      {/* Handles visuales de entrada en órbita (solo decoración) */}
      {incomingEdges.map((edge, index) => {
        const angle = calculateHandleAngle(edge.source);
        const pos = getHandlePosition(angle);
        
        return (
          <div
            key={`input-visual-${edge.id}`}
            className={styles.handleOrbit}
            style={{
              background: color,
              left: `calc(50% + ${pos.x}px)`,
              top: `calc(50% + ${pos.y}px)`,
            }}
          />
        );
      })}

      {/* Handle invisible de ReactFlow (posición estándar Left) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0 }}
      />

      {/* Handles visuales de salida en órbita (solo decoración) */}
      {hasOutgoingConnection ? (
        outgoingEdges.map((edge, index) => {
          const angle = calculateHandleAngle(edge.target);
          const pos = getHandlePosition(angle);
          
          return (
            <div
              key={`output-visual-${edge.id}`}
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

export default memo(AppNode);
