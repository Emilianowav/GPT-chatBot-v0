import { memo } from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from 'reactflow';
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
  source,
  target,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const hasFilter = data?.filter;
  
  // Obtener colores de los nodos source y target
  const sourceColor = data?.sourceColor || '#d1d5db';
  const targetColor = data?.targetColor || '#d1d5db';

  // Crear gradiente entre colores de nodos
  const gradientId = `gradient-${id}`;

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sourceColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={targetColor} stopOpacity="0.8" />
        </linearGradient>
      </defs>

      <path
        id={id}
        style={{
          ...style,
          stroke: hasFilter ? '#8b5cf6' : `url(#${gradientId})`,
          strokeWidth: hasFilter ? 3 : 2,
          strokeDasharray: hasFilter ? '0' : '8, 8',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />

      {/* Círculos grandes en la línea */}
      <g>
        {/* Círculo en el punto medio */}
        <circle
          cx={labelX}
          cy={labelY}
          r={6}
          fill={hasFilter ? '#8b5cf6' : sourceColor}
          stroke="#f5f5f7"
          strokeWidth={3}
          className={styles.edgeDot}
        />
        
        {/* Círculos adicionales a lo largo de la línea */}
        <circle
          cx={(sourceX + labelX) / 2}
          cy={(sourceY + labelY) / 2}
          r={5}
          fill={sourceColor}
          stroke="#f5f5f7"
          strokeWidth={2}
          opacity={0.7}
        />
        <circle
          cx={(targetX + labelX) / 2}
          cy={(targetY + labelY) / 2}
          r={5}
          fill={targetColor}
          stroke="#f5f5f7"
          strokeWidth={2}
          opacity={0.7}
        />
      </g>

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
