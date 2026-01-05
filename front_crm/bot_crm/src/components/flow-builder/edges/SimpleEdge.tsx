import { memo } from 'react';
import { EdgeProps } from 'reactflow';

/**
 * SIMPLE EDGE - Línea con círculos estilo Make.com
 * 
 * Características:
 * - Círculos espaciados (no línea sólida)
 * - Color del nodo source
 * - Círculos de 10px con borde blanco
 * - Espaciado de 35px entre círculos
 */

function SimpleEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) {
  const color = data?.color || '#25D366';

  // Calcular distancia total
  const distance = Math.sqrt(
    Math.pow(targetX - sourceX, 2) + 
    Math.pow(targetY - sourceY, 2)
  );

  // Calcular número de círculos (uno cada 35px)
  const numCircles = Math.max(2, Math.floor(distance / 35));

  // Generar posiciones de círculos
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
          r={10}
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
