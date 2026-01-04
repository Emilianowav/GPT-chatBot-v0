import { memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import { Settings } from 'lucide-react';
import styles from './CustomEdge.module.css';

function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const hasFilter = data?.filter;

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: hasFilter ? '#8b5cf6' : '#d1d5db',
          strokeWidth: hasFilter ? 3 : 2,
          strokeDasharray: hasFilter ? '0' : '8, 8',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      {/* Puntos en los extremos */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r={6}
        fill="#10b981"
        stroke="white"
        strokeWidth={2}
        className={styles.edgeDot}
      />
      <circle
        cx={targetX}
        cy={targetY}
        r={6}
        fill="#10b981"
        stroke="white"
        strokeWidth={2}
        className={styles.edgeDot}
      />

      {/* Botón de configuración en el centro */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className={styles.edgeButtonWrapper}
        >
          <button
            className={`${styles.edgeButton} ${hasFilter ? styles.hasFilter : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (data?.onConfigClick) {
                data.onConfigClick(id);
              }
            }}
            title={hasFilter ? 'Filtro configurado' : 'Configurar filtro'}
          >
            <Settings size={14} />
          </button>
          
          {hasFilter && (
            <div className={styles.filterLabel}>
              {data.filter.label || 'Filtro'}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(CustomEdge);
