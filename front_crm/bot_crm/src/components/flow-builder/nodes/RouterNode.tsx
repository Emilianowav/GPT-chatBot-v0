import React, { memo } from 'react';
import { Handle, Position, NodeProps, useEdges } from 'reactflow';
import { GitBranch } from 'lucide-react';

const RouterIcon = ({ size = 40, color = '#f59e0b' }: { size?: number; color?: string }) => (
  <GitBranch size={size} color={color} strokeWidth={2} />
);

interface RouterNodeData {
  label: string;
  subtitle?: string;
  executionCount?: string | number;
  routes?: number;
  config?: {
    routes?: Array<{
      id: string;
      label: string;
      condition?: string;
    }>;
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
  routeHandles?: string[];
  onNodeClick?: (nodeId: string) => void;
  color?: string;
}

function RouterNode({ id, data, selected }: NodeProps<RouterNodeData>) {
  const { label, subtitle, executionCount, onNodeClick, routeHandles } = data;
  const edges = useEdges();

  // Verificar si ya hay conexión en input (target) - Router solo acepta 1 entrada
  const hasInputConnection = edges.some(edge => edge.target === id);
  const color = data.color || '#f59e0b';

  // Generar handles de salida según número de rutas (IDs: b, c, d, e...)
  const outputHandles = Array.from({ length: data.routes || 2 }, (_, i) => ({
    id: String.fromCharCode(98 + i), // 'b', 'c', 'd', 'e'...
    angle: (Math.PI / 2) + ((i - (data.routes || 2 - 1) / 2) * (Math.PI / 4)),
  }));

  return (
    <div
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
      }}
    >
      <RouterIcon size={40} color={color} />

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
        {label || 'Router'}
      </div>

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

      {/* Múltiples handles de salida (derecha) - VISIBLES - ILIMITADAS */}
      {outputHandles.map((handle) => (
        <Handle
          key={handle.id}
          type="source"
          position={Position.Right}
          id={handle.id}
          isConnectable={true}
          style={{
            background: color,
            width: '14px',
            height: '14px',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            top: `${50 + Math.sin(handle.angle) * 30}%`,
            cursor: 'crosshair',
          }}
        />
      ))}
    </div>
  );
}

export default memo(RouterNode);
