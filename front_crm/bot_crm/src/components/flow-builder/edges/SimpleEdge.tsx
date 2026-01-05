import { memo } from 'react';
import { EdgeProps, useNodes } from 'reactflow';
import { LINE_CIRCLE_SPACING, LINE_CIRCLE_RADIUS, HANDLE_ORBIT_RADIUS, NODE_RADIUS } from '../constants';

/**
 * SIMPLE EDGE DESDE CERO
 * 
 * OBJETIVO: Línea recta desde handle visual source hasta handle visual target
 * 
 * PROBLEMA: ReactFlow da sourceX/Y desde centro del nodo, no desde handle en órbita
 * SOLUCIÓN: Calcular posición exacta de handles en órbita manualmente
 */

function SimpleEdge({
  source,
  target,
  data,
}: EdgeProps) {
  const color = data?.color || '#25D366';
  const nodes = useNodes();

  // Obtener nodos
  const sourceNode = nodes.find(n => n.id === source);
  const targetNode = nodes.find(n => n.id === target);

  if (!sourceNode || !targetNode) return null;

  // PASO 1: Calcular centro de cada nodo
  const sourceCenterX = sourceNode.position.x + NODE_RADIUS;
  const sourceCenterY = sourceNode.position.y + NODE_RADIUS;
  const targetCenterX = targetNode.position.x + NODE_RADIUS;
  const targetCenterY = targetNode.position.y + NODE_RADIUS;

  // PASO 2: Calcular ángulo entre centros
  const dx = targetCenterX - sourceCenterX;
  const dy = targetCenterY - sourceCenterY;
  const angle = Math.atan2(dy, dx);

  // PASO 3: Calcular posición EXACTA del handle visual en órbita
  // Handle source: centro + HANDLE_ORBIT_RADIUS en dirección del target
  const handleSourceX = sourceCenterX + Math.cos(angle) * HANDLE_ORBIT_RADIUS;
  const handleSourceY = sourceCenterY + Math.sin(angle) * HANDLE_ORBIT_RADIUS;

  // Handle target: centro - HANDLE_ORBIT_RADIUS en dirección del source
  const handleTargetX = targetCenterX - Math.cos(angle) * HANDLE_ORBIT_RADIUS;
  const handleTargetY = targetCenterY - Math.sin(angle) * HANDLE_ORBIT_RADIUS;

  // PASO 3.5: Aplicar desplazamiento visual del handle CSS
  // transform: translate(-50%, -120%) = -20% de 32px = -6.4px
  const handleVisualOffsetY = -6.4;
  
  const finalSourceX = handleSourceX;
  const finalSourceY = handleSourceY + handleVisualOffsetY;
  const finalTargetX = handleTargetX;
  const finalTargetY = handleTargetY + handleVisualOffsetY;

  // PASO 4: Calcular distancia entre handles finales
  const distance = Math.sqrt(
    Math.pow(finalTargetX - finalSourceX, 2) + 
    Math.pow(finalTargetY - finalSourceY, 2)
  );

  // PASO 5: Generar círculos en línea recta entre handles finales
  const numCircles = Math.max(2, Math.floor(distance / LINE_CIRCLE_SPACING));
  const circles = [];
  
  for (let i = 0; i < numCircles; i++) {
    const t = i / (numCircles - 1);
    const x = finalSourceX + (finalTargetX - finalSourceX) * t;
    const y = finalSourceY + (finalTargetY - finalSourceY) * t;
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
