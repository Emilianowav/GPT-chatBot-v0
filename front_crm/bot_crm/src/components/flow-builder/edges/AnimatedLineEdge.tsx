import { memo, useState } from 'react';
import { EdgeProps, useStore, EdgeLabelRenderer, getBezierPath } from 'reactflow';
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
  sourcePosition,
  targetPosition,
  source,
  target,
  data,
  selected,
}: AnimatedLineEdgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const nodes = useStore((state) => state.nodeInternals);
  const sourceNode = nodes.get(source);
  const targetNode = nodes.get(target);
  
  const sourceColor = sourceNode?.data?.color || '#9ca3af';
  const targetColor = targetNode?.data?.color || '#9ca3af';
  
  // Generar path bezier para línea suave
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Validar coordenadas
  if (!isFinite(sourceX) || !isFinite(sourceY) || !isFinite(targetX) || !isFinite(targetY)) {
    console.warn(`Invalid edge coordinates for edge ${id}:`, { sourceX, sourceY, targetX, targetY });
    return null;
  }

  // No necesitamos círculos, solo línea sólida

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
        {/* Línea invisible MUY gruesa para hover (hitbox) */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={40}
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
        
        {/* Línea GRUESA y VISIBLE */}
        <path
          d={edgePath}
          fill="none"
          stroke={isHovered || selected ? '#8b5cf6' : '#374151'}
          strokeWidth={isHovered || selected ? 6 : 4}
          style={{ 
            transition: 'all 0.2s ease',
            pointerEvents: 'none'
          }}
        />
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
