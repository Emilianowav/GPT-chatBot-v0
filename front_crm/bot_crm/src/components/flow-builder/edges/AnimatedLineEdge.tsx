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
        {/* Degradado suave de source a target */}
        <linearGradient id={`gradient-${edgeId}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sourceColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={targetColor} stopOpacity="0.3" />
        </linearGradient>
        
        {/* Filtro de brillo para las partículas */}
        <filter id={`glow-${edgeId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Línea base sutil */}
      <path
        d={`M ${sourceX},${sourceY} L ${targetX},${targetY}`}
        stroke={`url(#gradient-${edgeId})`}
        strokeWidth={2}
        fill="none"
      />
      
      {/* Partículas de energía que viajan */}
      {particles.map((index) => {
        const delay = index * 0.4;
        
        return (
          <g key={index}>
            {/* Partícula principal */}
            <circle
              r="4"
              fill={sourceColor}
              filter={`url(#glow-${edgeId})`}
              opacity="0"
            >
              {/* Animación de movimiento a lo largo de la línea */}
              <animateMotion
                dur="1.2s"
                begin={`${delay}s`}
                repeatCount="indefinite"
                path={`M ${sourceX},${sourceY} L ${targetX},${targetY}`}
              />
              
              {/* Animación de opacidad (aparece y desaparece) */}
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.2;0.8;1"
                dur="1.2s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
              
              {/* Animación de color (de source a target) */}
              <animate
                attributeName="fill"
                values={`${sourceColor};${targetColor}`}
                dur="1.2s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
              
              {/* Animación de tamaño (pulso) */}
              <animate
                attributeName="r"
                values="3;5;3"
                dur="1.2s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
            </circle>
            
            {/* Estela de la partícula */}
            <circle
              r="2"
              fill={sourceColor}
              opacity="0"
            >
              <animateMotion
                dur="1.2s"
                begin={`${delay}s`}
                repeatCount="indefinite"
                path={`M ${sourceX},${sourceY} L ${targetX},${targetY}`}
              />
              
              <animate
                attributeName="opacity"
                values="0;0.5;0.5;0"
                keyTimes="0;0.2;0.8;1"
                dur="1.2s"
                begin={`${delay + 0.1}s`}
                repeatCount="indefinite"
              />
              
              <animate
                attributeName="fill"
                values={`${sourceColor};${targetColor}`}
                dur="1.2s"
                begin={`${delay}s`}
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
