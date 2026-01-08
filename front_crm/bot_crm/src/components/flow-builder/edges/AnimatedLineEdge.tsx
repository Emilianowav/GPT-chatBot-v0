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

  // ID único para el degradado
  const edgeId = `${source}-${target}`;

  return (
    <>
      <defs>
        <linearGradient id={`gradient-${edgeId}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sourceColor} />
          <stop offset="50%" stopColor={sourceColor} />
          <stop offset="50%" stopColor={targetColor} />
          <stop offset="100%" stopColor={targetColor} />
        </linearGradient>
      </defs>
      <path
        d={`M ${sourceX},${sourceY} L ${targetX},${targetY}`}
        stroke={`url(#gradient-${edgeId})`}
        strokeWidth={2}
        fill="none"
        opacity={0.8}
      />
    </>
  );
}

export default memo(AnimatedLineEdge);
