import React, { memo } from 'react';
import { NodeProps, Handle, Position, useEdges } from 'reactflow';
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

  // Calcular conexiones salientes y entrantes desde este nodo
  const outgoingEdges = edges.filter(edge => edge.source === id);
  const incomingEdges = edges.filter(edge => edge.target === id);
  const hasOutgoingConnection = outgoingEdges.length > 0;
  const hasIncomingConnection = incomingEdges.length > 0;

  // Calcular posiciones en órbita para handles
  const getOrbitPosition = (index: number, total: number, isOutput: boolean = true) => {
    // Radio de órbita: 50px (radio del nodo) + 30px (separación)
    const orbitRadius = 80;
    
    if (total === 1) {
      // Una sola conexión: derecha (0°) o izquierda (180°)
      const angle = isOutput ? 0 : 180;
      const angleRad = (angle * Math.PI) / 180;
      return {
        x: Math.cos(angleRad) * orbitRadius,
        y: Math.sin(angleRad) * orbitRadius,
      };
    }
    
    // Múltiples conexiones: distribuir en semicírculo
    const startAngle = isOutput ? -45 : 135; // Derecha o izquierda
    const endAngle = isOutput ? 45 : 225;
    const angleStep = (endAngle - startAngle) / (total - 1);
    const angle = startAngle + (angleStep * index);
    const angleRad = (angle * Math.PI) / 180;
    
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
      {/* Handle de entrada */}
      {hasIncomingConnection ? (
        // Handle visual conectado en entrada (izquierda)
        <>
          <div
            className={styles.handleConnectedInput}
            style={{ background: color }}
          />
          <Handle
            type="target"
            position={Position.Left}
            style={{ opacity: 0 }}
          />
        </>
      ) : (
        // Handle invisible de entrada
        <Handle
          type="target"
          position={Position.Left}
          style={{ opacity: 0 }}
        />
      )}

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

      {/* Handles de salida en órbita */}
      {hasOutgoingConnection ? (
        // Múltiples handles orbitando
        outgoingEdges.map((edge, index) => {
          const pos = getOrbitPosition(index, outgoingEdges.length, true);
          return (
            <React.Fragment key={`output-${index}`}>
              {/* Handle visual pequeño en órbita */}
              <div
                className={styles.handleOrbit}
                style={{
                  background: color,
                  left: `calc(50% + ${pos.x}px)`,
                  top: `calc(50% + ${pos.y}px)`,
                }}
              />
              {/* Handle invisible de ReactFlow */}
              <Handle
                type="source"
                position={Position.Right}
                id={`source-${index}`}
                style={{
                  left: `calc(50% + ${pos.x}px)`,
                  top: `calc(50% + ${pos.y}px)`,
                  transform: 'translate(-50%, -50%)',
                  opacity: 0,
                }}
              />
            </React.Fragment>
          );
        })
      ) : (
        // Handle + cuando no hay conexiones
        <>
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
          <Handle
            type="source"
            position={Position.Right}
            style={{ opacity: 0 }}
          />
        </>
      )}

      {/* Handles de entrada en órbita */}
      {incomingEdges.map((edge, index) => {
        const pos = getOrbitPosition(index, incomingEdges.length, false);
        return (
          <React.Fragment key={`input-${index}`}>
            {/* Handle visual pequeño en órbita */}
            <div
              className={styles.handleOrbit}
              style={{
                background: color,
                left: `calc(50% + ${pos.x}px)`,
                top: `calc(50% + ${pos.y}px)`,
              }}
            />
            {/* Handle invisible de ReactFlow */}
            <Handle
              type="target"
              position={Position.Left}
              id={`target-${index}`}
              style={{
                left: `calc(50% + ${pos.x}px)`,
                top: `calc(50% + ${pos.y}px)`,
                transform: 'translate(-50%, -50%)',
                opacity: 0,
              }}
            />
          </React.Fragment>
        );
      })}

      {/* Handle invisible de entrada por defecto */}
      {!hasIncomingConnection && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ opacity: 0 }}
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
