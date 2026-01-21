import { memo, useState } from 'react';
import { EdgeProps, useStore, EdgeLabelRenderer, getBezierPath } from 'reactflow';
import { Settings } from 'lucide-react';

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
  markerEnd,
  markerStart,
}: AnimatedLineEdgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const nodes = useStore((state) => state.nodeInternals);
  const sourceNode = nodes.get(source);
  const targetNode = nodes.get(target);
  
  const sourceColor = sourceNode?.data?.color || '#9ca3af';
  const targetColor = targetNode?.data?.color || '#9ca3af';

  // Validar coordenadas
  if (!isFinite(sourceX) || !isFinite(sourceY) || !isFinite(targetX) || !isFinite(targetY)) {
    console.warn(`Invalid edge coordinates for edge ${id}:`, { sourceX, sourceY, targetX, targetY });
    return null;
  }

  // Calculate midpoint for label
  const edgeCenterX = (sourceX + targetX) / 2;
  const edgeCenterY = (sourceY + targetY) / 2;

  // Calcular posiciones orbitales usando dimensiones reales del nodo
  const ORBIT_RADIUS = 42; // Distancia orbital desde el centro del nodo
  
  // Obtener dimensiones reales de los nodos
  const sourceWidth = (sourceNode as any)?.measured?.width || 80;
  const sourceHeight = (sourceNode as any)?.measured?.height || 80;
  const targetWidth = (targetNode as any)?.measured?.width || 80;
  const targetHeight = (targetNode as any)?.measured?.height || 80;
  
  // Calcular centro de cada nodo
  const sourceCenterX = sourceNode ? sourceNode.position.x + (sourceWidth / 2) : sourceX;
  const sourceCenterY = sourceNode ? sourceNode.position.y + (sourceHeight / 2) : sourceY;
  const targetCenterX = targetNode ? targetNode.position.x + (targetWidth / 2) : targetX;
  const targetCenterY = targetNode ? targetNode.position.y + (targetHeight / 2) : targetY;
  
  // Calcular ángulo entre centros de nodos
  const angleToTarget = Math.atan2(
    targetCenterY - sourceCenterY,
    targetCenterX - sourceCenterX
  );
  
  const angleToSource = Math.atan2(
    sourceCenterY - targetCenterY,
    sourceCenterX - targetCenterX
  );
  
  // Proyectar enchufes en órbita desde el centro del nodo
  const sourceUpdaterX = sourceCenterX + Math.cos(angleToTarget) * ORBIT_RADIUS;
  const sourceUpdaterY = sourceCenterY + Math.sin(angleToTarget) * ORBIT_RADIUS;
  const targetUpdaterX = targetCenterX + Math.cos(angleToSource) * ORBIT_RADIUS;
  const targetUpdaterY = targetCenterY + Math.sin(angleToSource) * ORBIT_RADIUS;

  // Crear path completamente recto
  const midX = (sourceUpdaterX + targetUpdaterX) / 2;
  const midY = (sourceUpdaterY + targetUpdaterY) / 2;
  
  // Path recto directo sin offset
  const edgePath = `M ${sourceUpdaterX},${sourceUpdaterY} L ${targetUpdaterX},${targetUpdaterY}`;
  const labelX = midX;
  const labelY = midY;

  const handleConfigClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('🔧 Edge config clicked:', id, 'Handler exists:', !!data?.onConfigClick);
    if (data?.onConfigClick) {
      data.onConfigClick(id);
    } else {
      console.warn('⚠️ No onConfigClick handler found for edge:', id);
    }
  };

  // Crear gradiente único para este edge
  const gradientId = `edge-gradient-${id}`;

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sourceColor} stopOpacity="1" />
          <stop offset="30%" stopColor={sourceColor} stopOpacity="0.8" />
          <stop offset="50%" stopColor={sourceColor} stopOpacity="0.4" />
          <stop offset="50%" stopColor={targetColor} stopOpacity="0.4" />
          <stop offset="70%" stopColor={targetColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={targetColor} stopOpacity="1" />
        </linearGradient>
      </defs>

      <g style={{ zIndex: 9999 }}>
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
        
        {/* Línea de círculos pequeños con gradiente de colores estilo Make.com */}
        <path
          d={edgePath}
          fill="none"
          stroke={isHovered || selected ? '#8b5cf6' : `url(#${gradientId})`}
          strokeWidth={isHovered || selected ? 4 : 3}
          strokeDasharray="3 4"
          strokeLinecap="round"
          style={{ 
            transition: 'all 0s ease',
            pointerEvents: 'none'
          }}
          markerEnd={markerEnd}
          markerStart={markerStart}
        />
      </g>
      
      {/* ENCHUFES (Edge Updaters) - Círculos en el borde del nodo con colores */}
      <g style={{ zIndex: 10000 }}>
        {/* Source updater (en el borde del nodo source) */}
        <circle
          cx={sourceUpdaterX}
          cy={sourceUpdaterY}
          r={12}
          fill={sourceColor}
          stroke="#fff"
          strokeWidth={2.5}
          className="react-flow__edgeupdater react-flow__edgeupdater-source"
          style={{
            cursor: 'grab',
            filter: `drop-shadow(0 2px 6px ${sourceColor}40)`,
            pointerEvents: 'all',
            opacity: 0.9
          }}
        />
        
        {/* Target updater (en el borde del nodo target) */}
        <circle
          cx={targetUpdaterX}
          cy={targetUpdaterY}
          r={12}
          fill={targetColor}
          stroke="#fff"
          strokeWidth={2.5}
          className="react-flow__edgeupdater react-flow__edgeupdater-target"
          style={{
            cursor: 'grab',
            filter: `drop-shadow(0 2px 6px ${targetColor}40)`,
            pointerEvents: 'all',
            opacity: 0.9
          }}
        />
      </g>

      {/* Edge Label with Condition - Siempre visible */}
      {
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 10000,
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

            {/* Config Button - Siempre visible */}
            <button
              onClick={handleConfigClick}
              style={{
                width: '32px',
                height: '32px',
                background: isHovered || selected ? '#8b5cf6' : 'white',
                border: `2px solid ${isHovered || selected ? '#8b5cf6' : '#d1d5db'}`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                color: isHovered || selected ? 'white' : '#6b7280',
                transition: 'all 0.2s',
                zIndex: 10000,
              }}
              title="Configurar filtro/condición"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#8b5cf6';
                e.currentTarget.style.borderColor = '#8b5cf6';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'scale(1.15)';
              }}
              onMouseLeave={(e) => {
                if (!selected) {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.color = '#6b7280';
                }
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Settings size={16} strokeWidth={2.5} />
            </button>
          </div>
        </EdgeLabelRenderer>
      }
    </>
  );
}

export default memo(AnimatedLineEdge);
