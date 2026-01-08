import { memo } from 'react';
import { EdgeProps, useStore } from 'reactflow';

/**
 * SIMPLE DOTTED EDGE - ESTILO MAKE.COM
 * 
 * Línea punteada simple con círculos espaciados uniformemente.
 * Sin animaciones complejas, diseño limpio y profesional.
 */

function AnimatedLineEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  source,
  target,
}: EdgeProps) {
  const nodes = useStore((state) => state.nodeInternals);
  const sourceNode = nodes.get(source);
  const targetNode = nodes.get(target);
  
  const sourceColor = sourceNode?.data?.color || '#9ca3af';
  const targetColor = targetNode?.data?.color || '#9ca3af';

  // Calcular distancia y número de círculos
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Espaciado entre círculos (similar a Make.com)
  const spacing = 20;
  const numDots = Math.floor(distance / spacing);
  
  const dots = [];
  for (let i = 0; i <= numDots; i++) {
    const t = i / numDots;
    const x = sourceX + (targetX - sourceX) * t;
    const y = sourceY + (targetY - sourceY) * t;
    
    // Color: mezcla gradual de source a target
    const color = t < 0.5 ? sourceColor : targetColor;
    
    dots.push({ x, y, color, key: i });
  }

  return (
    <g>
      {dots.map((dot) => (
        <circle
          key={dot.key}
          cx={dot.x}
          cy={dot.y}
          r={3}
          fill={dot.color}
          opacity={0.6}
        />
      ))}
    </g>
  );
}

export default memo(AnimatedLineEdge);
