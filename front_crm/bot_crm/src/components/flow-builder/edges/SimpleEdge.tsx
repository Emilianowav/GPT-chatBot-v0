import { memo } from 'react';
import { EdgeProps, useNodes } from 'reactflow';
import { LINE_CIRCLE_SPACING, LINE_CIRCLE_RADIUS, HANDLE_ORBIT_RADIUS, NODE_RADIUS } from '../constants';

/**
 * SIMPLE EDGE - DESDE CENTRO DEL NODO
 * 
 * PASO 2: Líneas salen desde el CENTRO del nodo
 * Mezcla colores de ambos nodos con gradiente
 */

function SimpleEdge({
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) {
  const nodes = useNodes();
  
  // Obtener colores de ambos nodos
  const sourceNode = nodes.find(n => n.id === source);
  const targetNode = nodes.find(n => n.id === target);
  
  const sourceColor = sourceNode?.data?.color || data?.color || '#25D366';
  const targetColor = targetNode?.data?.color || data?.color || '#25D366';

  // 🎯 AJUSTAR PUNTO INICIAL (desde borde derecho del nodo source)
  const adjustedSourceX = sourceX - 100;  // +50px a la derecha
  const adjustedSourceY = sourceY - 25;
  
  // 🎯 AJUSTAR PUNTO FINAL (hasta borde izquierdo del nodo target)
  const adjustedTargetX = targetX + 100 ;  // -50px a la izquierda
  const adjustedTargetY = targetY -25;

  // Calcular distancia con puntos ajustados
  const distance = Math.sqrt(
    Math.pow(adjustedTargetX - adjustedSourceX, 2) + 
    Math.pow(adjustedTargetY - adjustedSourceY, 2)
  );

  const numCircles = Math.max(2, Math.floor(distance / LINE_CIRCLE_SPACING));
  const circles = [];
  
  for (let i = 0; i < numCircles; i++) {
    const t = i / (numCircles - 1);
    const x = adjustedSourceX + (adjustedTargetX - adjustedSourceX) * t;
    const y = adjustedSourceY + (adjustedTargetY - adjustedSourceY) * t;
    circles.push({ x, y });
  }

  // Función para interpolar colores
  const interpolateColor = (color1: string, color2: string, factor: number): string => {
    // Convertir hex a RGB
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    // Interpolar
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    // Convertir de vuelta a hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  return (
    <g>
      {circles.map((circle, index) => {
        // Calcular factor de interpolación (0 = sourceColor, 1 = targetColor)
        const t = index / (circles.length - 1);
        const circleColor = interpolateColor(sourceColor, targetColor, t);
        
        return (
          <circle
            key={index}
            cx={circle.x}
            cy={circle.y}
            r={LINE_CIRCLE_RADIUS}
            fill={circleColor}
            stroke="#ffffff"
            strokeWidth={3}
            opacity={0.9}
          />
        );
      })}
    </g>
  );
}

export default memo(SimpleEdge);
