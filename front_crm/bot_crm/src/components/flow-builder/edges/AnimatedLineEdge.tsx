import { memo } from 'react';
import { EdgeProps } from 'reactflow';

/**
 * ANIMATED CIRCLE EDGE - ÚNICO EDGE DEL SISTEMA
 * 
 * CARACTERÍSTICAS:
 * - Círculos que simulan flujo
 * - Animación de tamaño hacia la dirección del flujo
 * - Mezcla de colores entre nodos source y target
 */

function AnimatedLineEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) {
  // Obtener colores de los nodos
  const sourceColor = data?.sourceColor || '#9ca3af';
  const targetColor = data?.targetColor || '#9ca3af';

  // Calcular distancia y número de círculos
  const distance = Math.sqrt(
    Math.pow(targetX - sourceX, 2) + 
    Math.pow(targetY - sourceY, 2)
  );
  
  const numCircles = Math.max(3, Math.floor(distance / 40));
  const circles = [];
  
  // Función para interpolar colores
  const interpolateColor = (color1: string, color2: string, factor: number): string => {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  for (let i = 0; i < numCircles; i++) {
    const t = i / (numCircles - 1);
    const x = sourceX + (targetX - sourceX) * t;
    const y = sourceY + (targetY - sourceY) * t;
    
    // Mezclar colores según posición
    const color = interpolateColor(sourceColor, targetColor, t);
    
    // Tamaño base del círculo
    const baseSize = 6;
    
    circles.push({ x, y, color, baseSize, index: i });
  }

  return (
    <>
      <g>
        {circles.map((circle, i) => {
          // Crear ID único para la animación
          const animId = `pulse-${sourceX}-${sourceY}-${i}`;
          
          return (
            <g key={i}>
              <circle
                cx={circle.x}
                cy={circle.y}
                r={circle.baseSize}
                fill={circle.color}
                stroke="#ffffff"
                strokeWidth={2}
                opacity={0.9}
              >
                <animate
                  attributeName="r"
                  values={`${circle.baseSize};${circle.baseSize + 3};${circle.baseSize}`}
                  dur="1.5s"
                  begin={`${i * 0.15}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          );
        })}
      </g>
    </>
  );
}

export default memo(AnimatedLineEdge);
