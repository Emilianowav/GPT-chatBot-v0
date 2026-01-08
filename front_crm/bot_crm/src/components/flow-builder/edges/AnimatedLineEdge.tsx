import { memo } from 'react';
import { EdgeProps, getStraightPath } from 'reactflow';

/**
 * ANIMATED LINE EDGE - ÚNICO EDGE DEL SISTEMA
 * 
 * CARACTERÍSTICAS:
 * - Línea recta simple (NO círculos)
 * - Animación de flujo con dasharray
 * - Gradiente de color entre nodos
 * - Sin botones de configuración
 */

function AnimatedLineEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}: EdgeProps) {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Obtener colores de los nodos
  const sourceColor = data?.sourceColor || '#9ca3af';
  const targetColor = data?.targetColor || '#9ca3af';

  // Crear ID único para el gradiente
  const gradientId = `gradient-${sourceX}-${sourceY}-${targetX}-${targetY}`;

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sourceColor} stopOpacity={0.8} />
          <stop offset="100%" stopColor={targetColor} stopOpacity={0.8} />
        </linearGradient>
      </defs>
      
      <path
        d={edgePath}
        stroke={`url(#${gradientId})`}
        strokeWidth={3}
        fill="none"
        strokeDasharray="8 4"
        style={{
          ...style,
          animation: 'dashdraw 1s linear infinite',
        }}
      />
      
      <style>
        {`
          @keyframes dashdraw {
            to {
              stroke-dashoffset: -12;
            }
          }
        `}
      </style>
    </>
  );
}

export default memo(AnimatedLineEdge);
