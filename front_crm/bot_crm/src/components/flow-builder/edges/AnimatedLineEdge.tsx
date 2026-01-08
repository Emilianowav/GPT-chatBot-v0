import { memo } from 'react';
import { EdgeProps, useStore, EdgeLabelRenderer } from 'reactflow';
import { Settings } from 'lucide-react';

/**
 * SIMPLE DOTTED EDGE - ESTILO MAKE.COM
 * 
 * Línea punteada simple con círculos espaciados uniformemente.
 * Con label para mostrar condiciones/filtros.
 */

interface AnimatedLineEdgeProps extends EdgeProps {
  data?: {
    label?: string;
    condition?: string;
    onConfigClick?: (edgeId: string) => void;
  };
}

function AnimatedLineEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  source,
  target,
  data,
}: AnimatedLineEdgeProps) {
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

  // Calculate midpoint for label
  const edgeCenterX = (sourceX + targetX) / 2;
  const edgeCenterY = (sourceY + targetY) / 2;

  const handleConfigClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.onConfigClick) {
      data.onConfigClick(id);
    }
  };

  return (
    <>
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

      {/* Edge Label with Condition */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${edgeCenterX}px,${edgeCenterY}px)`,
            pointerEvents: 'all',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 100,
          }}
        >
          {/* Condition Label */}
          {(data?.label || data?.condition) && (
            <div
              style={{
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#374151',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                maxWidth: '200px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <span style={{ fontFamily: 'Courier New, monospace', color: '#8b5cf6' }}>
                {data.label || data.condition}
              </span>
            </div>
          )}

          {/* Config Button */}
          <button
            onClick={handleConfigClick}
            style={{
              width: '24px',
              height: '24px',
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              color: '#6b7280',
              transition: 'all 0.2s',
            }}
            title="Configure filter"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.borderColor = '#8b5cf6';
              e.currentTarget.style.color = '#8b5cf6';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.color = '#6b7280';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Settings size={14} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(AnimatedLineEdge);
