import { memo } from 'react';
import { EdgeProps, useNodes } from 'reactflow';
import { NODE_RADIUS, LINE_ORBIT_RADIUS, LINE_CIRCLE_SPACING, LINE_CIRCLE_RADIUS } from '../constants';

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
  id,
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

  // Obtener posiciones de los nodos
  const sourceNode = nodes.find(n => n.id === source);
  const targetNode = nodes.find(n => n.id === target);

  // Calcular ángulo desde source hacia target
  const calculateHandleOffset = (fromX: number, fromY: number, toX: number, toY: number) => {
    // Calcular desde el centro del nodo
    const fromCenterX = fromX + NODE_RADIUS;
    const fromCenterY = fromY + NODE_RADIUS;
    const toCenterX = toX + NODE_RADIUS;
    const toCenterY = toY + NODE_RADIUS;

    const dx = toCenterX - fromCenterX;
    const dy = toCenterY - fromCenterY;
    const angleRad = Math.atan2(dy, dx);
    
    // Calcular posición base en órbita
    const baseX = Math.cos(angleRad) * LINE_ORBIT_RADIUS;
    const baseY = Math.sin(angleRad) * LINE_ORBIT_RADIUS;
    
    // Aplicar el mismo desplazamiento visual que tiene el handle en CSS
    // transform: translate(-50%, -120%) significa:
    // - X: ya está centrado con -50% en el cálculo base
    // - Y: desplazamiento adicional de -20% del tamaño del handle (32px * -0.2 = -6.4px)
    const handleVisualOffsetY = -6.4; // -20% de 32px (tamaño del handle)
    
    return {
      x: baseX,
      y: baseY + handleVisualOffsetY,
    };
  };

  // Calcular posiciones reales de los handles en órbita
  let actualSourceX = sourceX;
  let actualSourceY = sourceY;
  let actualTargetX = targetX;
  let actualTargetY = targetY;

  if (sourceNode && targetNode) {
    // Offset del handle de salida (source)
    const sourceOffset = calculateHandleOffset(
      sourceNode.position.x,
      sourceNode.position.y,
      targetNode.position.x,
      targetNode.position.y
    );
    actualSourceX = sourceX + sourceOffset.x;
    actualSourceY = sourceY + sourceOffset.y;

    // Offset del handle de entrada (target) - ángulo inverso
    const targetOffset = calculateHandleOffset(
      targetNode.position.x,
      targetNode.position.y,
      sourceNode.position.x,
      sourceNode.position.y
    );
    actualTargetX = targetX + targetOffset.x;
    actualTargetY = targetY + targetOffset.y;
  }

  // Calcular distancia total usando posiciones reales de handles
  const distance = Math.sqrt(
    Math.pow(actualTargetX - actualSourceX, 2) + 
    Math.pow(actualTargetY - actualSourceY, 2)
  );

  // Calcular número de círculos
  const numCircles = Math.max(2, Math.floor(distance / LINE_CIRCLE_SPACING));
  // Generar posiciones de círculos desde handles reales
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
