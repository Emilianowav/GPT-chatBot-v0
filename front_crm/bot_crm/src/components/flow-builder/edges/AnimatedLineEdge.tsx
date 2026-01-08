import { memo } from 'react';
import { EdgeProps, useStore } from 'reactflow';

/**
 * DISRUPTIVE ANIMATED EDGE
 * 
 * Animación innovadora con partículas de energía que fluyen
 * desde el nodo source hacia el target, con efecto de pulso
 * y cambio de color gradual.
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
  const nodes = useStore((state) => state.nodeInternals);
  const sourceNode = nodes.get(source);
  const targetNode = nodes.get(target);
  
  const sourceColor = sourceNode?.data?.color || data?.sourceColor || '#9ca3af';
  const targetColor = targetNode?.data?.color || data?.targetColor || '#9ca3af';

  const edgeId = `${source}-${target}`;
  
  // Calcular ángulo y distancia
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Crear 3 partículas de energía que viajan por la línea
  const particles = [0, 1, 2];

  return (
    <>
      <defs>
        {/* Degradado 50/50: centro hacia nodos */}
        <linearGradient id={`gradient-${edgeId}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sourceColor} />
          <stop offset="50%" stopColor={sourceColor} />
          <stop offset="50%" stopColor={targetColor} />
          <stop offset="100%" stopColor={targetColor} />
        </linearGradient>
      </defs>
      
      {/* Línea con degradado 50/50 */}
      <path
        d={`M ${sourceX},${sourceY} L ${targetX},${targetY}`}
        stroke={`url(#gradient-${edgeId})`}
        strokeWidth={3}
        fill="none"
        opacity={0.9}
        strokeDasharray="5,3"
      />
      
      {/* Partículas de energía que viajan */}
      {particles.map((index) => {
        const delay = index * 1.2;
        
        return (
          <g key={index}>
            {/* Partícula principal */}
            <circle
              r="4"
              fill="#9ca3af"
              opacity="0"
            >
              {/* Animación de movimiento a lo largo de la línea */}
              <animateMotion
                dur="3.6s"
                begin={`${delay}s`}
                repeatCount="indefinite"
                path={`M ${sourceX},${sourceY} L ${targetX},${targetY}`}
              />
              
              {/* Animación de opacidad (aparece y desaparece) */}
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.2;0.8;1"
                dur="3.6s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
              
              {/* Animación de tamaño (pulso) */}
              <animate
                attributeName="r"
                values="3;5;3"
                dur="3.6s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
            </circle>
            
            {/* Estela de la partícula */}
            <circle
              r="2"
              fill="#9ca3af"
              opacity="0"
            >
              <animateMotion
                dur="3.6s"
                begin={`${delay}s`}
                repeatCount="indefinite"
                path={`M ${sourceX},${sourceY} L ${targetX},${targetY}`}
              />
              
              <animate
                attributeName="opacity"
                values="0;0.5;0.5;0"
                keyTimes="0;0.2;0.8;1"
                dur="3.6s"
                begin={`${delay + 0.1}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        );
      })}
    </>
  );
}

export default memo(AnimatedLineEdge);
