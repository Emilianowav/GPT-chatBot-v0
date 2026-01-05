import { memo } from 'react';
import { EdgeProps, useNodes } from 'reactflow';
import { LINE_CIRCLE_SPACING, LINE_CIRCLE_RADIUS, HANDLE_ORBIT_RADIUS, NODE_RADIUS } from '../constants';

/**
 * SIMPLE EDGE - DESDE CENTRO DEL NODO
 * 
 * PASO 2: Líneas salen desde el CENTRO del nodo
 */

function SimpleEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) {
  const color = data?.color || '#25D366';

  // Líneas desde centro a centro
  const distance = Math.sqrt(
    Math.pow(targetX - sourceX, 2) + 
    Math.pow(targetY - sourceY, 2)
  );

  const numCircles = Math.max(2, Math.floor(distance / LINE_CIRCLE_SPACING));
  const circles = [];
  
  for (let i = 0; i < numCircles; i++) {
    const t = i / (numCircles - 1);
    const x = sourceX + (targetX - sourceX) * t;
    const y = sourceY + (targetY - sourceY) * t;
    circles.push({ x, y });
  }

  return (
    <g>
      {circles.map((circle, index) => (
        <circle
          key={index}
          cx={circle.x}
          cy={circle.y}
          r={LINE_CIRCLE_RADIUS}
          fill={color}
          stroke="#ffffff"
          strokeWidth={3}
          opacity={0.9}
        />
      ))}
    </g>
  );
}

export default memo(SimpleEdge);
