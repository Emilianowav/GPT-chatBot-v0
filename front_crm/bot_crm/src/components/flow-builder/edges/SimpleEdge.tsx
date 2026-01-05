import { memo } from 'react';
import { EdgeProps, useNodes } from 'reactflow';
import { LINE_CIRCLE_SPACING, LINE_CIRCLE_RADIUS, HANDLE_ORBIT_RADIUS, NODE_RADIUS } from '../constants';

/**
 * SIMPLE EDGE - Línea con círculos estilo Make.com
 * 
 * sourceX/Y y targetX/Y son del centro del nodo.
 * Calculamos el ángulo y aplicamos HANDLE_ORBIT_RADIUS para
 * que las líneas comiencen desde los handles visuales en órbita.
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
  const color = data?.color || '#25D366';
  const nodes = useNodes();

  const sourceNode = nodes.find(n => n.id === source);
  const targetNode = nodes.find(n => n.id === target);

  if (!sourceNode || !targetNode) {
    // Fallback si no encontramos los nodos
    return null;
  }

  // Calcular posición del centro de cada nodo
  const sourceCenterX = sourceNode.position.x + NODE_RADIUS;
  const sourceCenterY = sourceNode.position.y + NODE_RADIUS;
  const targetCenterX = targetNode.position.x + NODE_RADIUS;
  const targetCenterY = targetNode.position.y + NODE_RADIUS;

  // Calcular ángulo entre centros de nodos
  const dx = targetCenterX - sourceCenterX;
  const dy = targetCenterY - sourceCenterY;
  const angleRad = Math.atan2(dy, dx);

  // Calcular posición EXACTA del handle visual en órbita del source
  const actualSourceX = sourceCenterX + Math.cos(angleRad) * HANDLE_ORBIT_RADIUS;
  const actualSourceY = sourceCenterY + Math.sin(angleRad) * HANDLE_ORBIT_RADIUS;
  
  // Calcular posición EXACTA del handle visual en órbita del target (ángulo inverso)
  const actualTargetX = targetCenterX - Math.cos(angleRad) * HANDLE_ORBIT_RADIUS;
  const actualTargetY = targetCenterY - Math.sin(angleRad) * HANDLE_ORBIT_RADIUS;

  // Calcular distancia total
  const distance = Math.sqrt(
    Math.pow(actualTargetX - actualSourceX, 2) + 
    Math.pow(actualTargetY - actualSourceY, 2)
  );

  // Calcular número de círculos
  const numCircles = Math.max(2, Math.floor(distance / LINE_CIRCLE_SPACING));
  
  // Generar posiciones de círculos
  const circles = [];
  for (let i = 0; i < numCircles; i++) {
    const t = i / (numCircles - 1);
    const x = actualSourceX + (actualTargetX - actualSourceX) * t;
    const y = actualSourceY + (actualTargetY - actualSourceY) * t;
    
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
