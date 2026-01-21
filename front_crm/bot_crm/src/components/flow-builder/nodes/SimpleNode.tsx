/**
 * SimpleNode - Nodo básico desde cero siguiendo documentación oficial de React Flow
 * 
 * Documentación: https://reactflow.dev/learn/customization/custom-nodes
 * Handles: https://reactflow.dev/learn/customization/handles
 */

import React from 'react';
import { Handle, Position, NodeProps, useEdges } from 'reactflow';

interface SimpleNodeData {
  label: string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  color: string;
  executionCount?: number | string;
  onNodeClick?: (nodeId: string) => void;
}

export function SimpleNode({ id, data, selected }: NodeProps<SimpleNodeData>) {
  const { label, subtitle, icon: Icon, color, executionCount, onNodeClick } = data;
  const edges = useEdges();

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(id);
    }
  };

  // Verificar si ya hay conexión en input (target)
  const hasInputConnection = edges.some(edge => edge.target === id);
  
  // Verificar si ya hay conexión en output (source)
  const hasOutputConnection = edges.some(edge => edge.source === id);

  return (
    <div
      onClick={handleClick}
      style={{
        padding: '10px',
        borderRadius: '50%',
        width: '80px',
        height: '80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'white',
        border: selected ? `3px solid ${color}` : '2px solid #e5e7eb',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      {/* Icono principal - MÁS GRANDE */}
      <Icon size={40} color={color} strokeWidth={2} />

      {/* Badge de ejecución */}
      {executionCount && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            minWidth: '24px',
            height: '24px',
            padding: '0 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 'bold',
            border: '2px solid white',
          }}
        >
          {executionCount}
        </div>
      )}

      {/* Label debajo del nodo */}
      <div
        style={{
          position: 'absolute',
          top: '90px',
          textAlign: 'center',
          fontSize: '12px',
          fontWeight: '600',
          color: '#1f2937',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div
          style={{
            position: 'absolute',
            top: '105px',
            textAlign: 'center',
            fontSize: '10px',
            color: '#6b7280',
            whiteSpace: 'nowrap',
          }}
        >
          {subtitle}
        </div>
      )}

      {/* Handle de entrada (izquierda) - VISIBLE - Solo 1 conexión */}
      <Handle
        type="target"
        position={Position.Left}
        id="a"
        isConnectable={!hasInputConnection}
        style={{
          background: hasInputConnection ? '#9ca3af' : color,
          width: '14px',
          height: '14px',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          cursor: hasInputConnection ? 'not-allowed' : 'crosshair',
        }}
      />

      {/* Handle de salida (derecha) - VISIBLE - Solo 1 conexión */}
      <Handle
        type="source"
        position={Position.Right}
        id="b"
        isConnectable={!hasOutputConnection}
        style={{
          background: hasOutputConnection ? '#9ca3af' : color,
          width: '14px',
          height: '14px',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          cursor: hasOutputConnection ? 'not-allowed' : 'crosshair',
        }}
      />
    </div>
  );
}

export default SimpleNode;
