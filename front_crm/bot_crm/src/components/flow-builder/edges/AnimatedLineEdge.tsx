import { memo } from 'react';
import { EdgeProps, useStore } from 'reactflow';

/**
 * ANIMATED CIRCLE EDGE - ÚNICO EDGE DEL SISTEMA
 * 
 * CARACTERÍSTICAS:
 * - Círculos que simulan flujo
 * - Animación de tamaño hacia la dirección del flujo (UN círculo a la vez)
 * - Mezcla de colores entre nodos source y target
 * - Eje desde el borde de los nodos (no desde el centro)
 */

function AnimatedLineEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  source,
  target,
  data,
}: EdgeProps) {
  // PUNTO 3: Obtener colores directamente de los nodos usando useStore
  const nodes = useStore((state) => state.nodeInternals);
  const sourceNode = nodes.get(source);
  const targetNode = nodes.get(target);
  
  const sourceColor = sourceNode?.data?.color || data?.sourceColor || '#9ca3af';
  const targetColor = targetNode?.data?.color || data?.targetColor || '#9ca3af';

  // PUNTO 2: Calcular ángulo y posiciones desde el BORDE de los nodos
  const nodeRadius = 50; // Radio del nodo (100px diámetro / 2)
  const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
  
  // Punto inicial: borde del nodo source
  const adjustedSourceX = sourceX + Math.cos(angle) * nodeRadius;
  const adjustedSourceY = sourceY + Math.sin(angle) * nodeRadius;
  
  // Punto final: borde del nodo target
  const adjustedTargetX = targetX - Math.cos(angle) * nodeRadius;
  const adjustedTargetY = targetY - Math.sin(angle) * nodeRadius;

  // Calcular distancia entre bordes de nodos
  const distance = Math.sqrt(
    Math.pow(adjustedTargetX - adjustedSourceX, 2) + 
    Math.pow(adjustedTargetY - adjustedSourceY, 2)
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
    const x = adjustedSourceX + (adjustedTargetX - adjustedSourceX) * t;
    const y = adjustedSourceY + (adjustedTargetY - adjustedSourceY) * t;
    
    // Mezclar colores según posición
    const color = interpolateColor(sourceColor, targetColor, t);
    
    // Tamaño base del círculo
    const baseSize = 6;
    
    circles.push({ x, y, color, baseSize, index: i });
  }

  return (
    <>
      <g>
        {circles.map((circle, i) => (
          <circle
            key={i}
            cx={circle.x}
            cy={circle.y}
            r={circle.baseSize}
            fill={circle.color}
            stroke="#ffffff"
            strokeWidth={1.5}
            opacity={0.85}
          >
            {/* Animación simple y ejecutiva */}
            <animate
              attributeName="r"
              values={`${circle.baseSize};${circle.baseSize + 2};${circle.baseSize}`}
              dur="1s"
              begin={`${i * 0.1}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </g>
    </>
  );
}

export default memo(AnimatedLineEdge);
