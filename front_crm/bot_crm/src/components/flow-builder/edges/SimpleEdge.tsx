import { memo } from 'react';
import { EdgeProps, getStraightPath } from 'reactflow';

/**
 * EDGE ULTRA SIMPLE - SOLO LÍNEA GRUESA
 * Para debugging: línea recta, gruesa, siempre visible
 */

function SimpleEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <g>
      {/* Línea ULTRA GRUESA para debugging */}
      <path
        d={edgePath}
        fill="none"
        stroke="#ef4444"
        strokeWidth={8}
        style={{ 
          pointerEvents: 'stroke',
          cursor: 'pointer'
        }}
      />
      
      {/* Círculo en el inicio */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r={6}
        fill="#22c55e"
      />
      
      {/* Círculo en el fin */}
      <circle
        cx={targetX}
        cy={targetY}
        r={6}
        fill="#3b82f6"
      />
    </g>
  );
}

export default memo(SimpleEdge);
