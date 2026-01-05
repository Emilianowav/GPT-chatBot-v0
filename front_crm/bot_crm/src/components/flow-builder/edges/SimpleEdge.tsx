import { memo } from 'react';
import { EdgeProps } from 'reactflow';
import { LINE_CIRCLE_SPACING, LINE_CIRCLE_RADIUS } from '../constants';

/**
 * SIMPLE EDGE - Línea con círculos estilo Make.com
 * 
 * ReactFlow proporciona sourceX, sourceY, targetX, targetY
 * que son las posiciones EXACTAS de los handles renderizados.
 * No necesitamos calcular nada, solo usar esas posiciones.
 */

function SimpleEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) {
  const color = data?.color || '#25D366';

  // Calcular distancia total entre handles
  const distance = Math.sqrt(
    Math.pow(targetX - sourceX, 2) + 
    Math.pow(targetY - sourceY, 2)
  );

  // Calcular número de círculos
  const numCircles = Math.max(2, Math.floor(distance / LINE_CIRCLE_SPACING));
  
  // Generar posiciones de círculos desde sourceX/Y hasta targetX/Y
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
