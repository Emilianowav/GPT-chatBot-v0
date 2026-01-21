/**
 * BASE ROUTER NODE - Componente genérico para nodos de control de flujo
 * 
 * PROPÓSITO:
 * - Nodos que pueden tener múltiples salidas (Router, Condition, etc.)
 * - Handle de entrada móvil
 * - Múltiples handles de salida móviles
 * - Handle plus solo en hover (1 solo, abajo del nodo)
 * 
 * USO:
 * - RouterNode, ConditionNode, SwitchNode
 */

import React, { memo, useState } from 'react';
import { NodeProps, Handle, Position, useReactFlow } from 'reactflow';
import { Plus, X } from 'lucide-react';
import { useRouterHandles } from '../hooks/useOrbitHandles';
import styles from './BaseRouterNode.module.css';

interface BaseRouterNodeData {
  label: string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  color: string;
  executionCount?: number;
  routes?: number;
  onNodeClick?: (nodeId: string) => void;
  onHandleClick?: (nodeId: string, handleId?: string) => void;
  config?: {
    routes?: Array<{
      id: string;
      label: string;
      condition?: string;
    }>;
  };
}

interface BaseRouterNodeProps extends NodeProps<BaseRouterNodeData> {
  nodeRadius?: number;
}

function BaseRouterNode({ id, data, selected, nodeRadius = 50 }: BaseRouterNodeProps) {
  const {
    label,
    subtitle,
    icon: Icon,
    color,
    executionCount = 1,
    routes = 2,
    onNodeClick,
    onHandleClick,
    config,
  } = data;

  const [isHovered, setIsHovered] = useState(false);
  const { deleteElements, getEdges } = useReactFlow();
  
  // Obtener handles en órbita para router
  const routeCount = config?.routes?.length || routes;
  const handles = useRouterHandles(id, nodeRadius, routeCount);

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

  const handleDisconnect = (handleId: string, connectedNodeId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    // Encontrar el edge exacto a eliminar
    const edgesToDelete = getEdges().filter(
      edge => (edge.source === id && edge.target === connectedNodeId) ||
              (edge.target === id && edge.source === connectedNodeId)
    );
    if (edgesToDelete.length > 0) {
      deleteElements({ edges: edgesToDelete });
    }
  };

  return (
    <div 
      className={styles.routerNodeContainer}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Círculo principal del nodo */}
      <div
        className={`${styles.routerNode} ${selected ? styles.selected : ''}`}
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

      {/* Handles en órbita */}
      {handles.map((handle) => (
        <Handle
          key={handle.id}
          type={handle.type}
          position={Position.Top}
          id={handle.id}
          className={`${styles.orbitHandle} ${handle.isConnected ? styles.connected : ''}`}
          style={{
            background: handle.isConnected ? color : '#9ca3af',
            left: `calc(50% + ${handle.x}px)`,
            top: `calc(50% + ${handle.y}px)`,
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            border: '4px solid white',
            boxShadow: handle.isConnected 
              ? `0 0 0 2px ${color}, 0 4px 12px rgba(0, 0, 0, 0.2)` 
              : '0 0 0 2px #6b7280, 0 4px 12px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            opacity: 1,
            zIndex: 100,
          }}
          onClick={handle.isConnected && handle.connectedNodeId 
            ? handleDisconnect(handle.id, handle.connectedNodeId) 
            : undefined
          }
        >
          {/* Indicador visual del tipo de handle */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '8px',
              height: '8px',
              background: 'white',
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
        </Handle>
      ))}

      {/* Handle Plus - Solo visible en hover, abajo del nodo */}
      {isHovered && (
        <div
          className={styles.handlePlus}
          style={{
            position: 'absolute',
            bottom: '-40px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
          onClick={handlePlusClick}
          role="button"
          tabIndex={0}
          aria-label="Add route"
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

export default memo(BaseRouterNode);
