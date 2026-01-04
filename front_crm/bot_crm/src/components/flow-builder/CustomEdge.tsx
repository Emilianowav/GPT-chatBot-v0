import { memo } from 'react';
import { EdgeProps, getStraightPath, EdgeLabelRenderer } from 'reactflow';
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
  // Usar líneas RECTAS siempre
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const hasFilter = data?.filter;
  
  // Obtener colores de los nodos source y target
  const sourceColor = data?.sourceColor || '#d1d5db';
  const targetColor = data?.targetColor || '#d1d5db';

  // Calcular puntos a lo largo del path para los círculos
  const distance = Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2));
  const numCircles = Math.floor(distance / 40); // Un círculo cada 40px
  const circles = [];
  
  for (let i = 1; i <= numCircles; i++) {
    const t = i / (numCircles + 1);
    const x = sourceX + (targetX - sourceX) * t;
    const y = sourceY + (targetY - sourceY) * t;
    
    // Interpolar color
    const r1 = parseInt(sourceColor.slice(1, 3), 16);
    const g1 = parseInt(sourceColor.slice(3, 5), 16);
    const b1 = parseInt(sourceColor.slice(5, 7), 16);
    const r2 = parseInt(targetColor.slice(1, 3), 16);
    const g2 = parseInt(targetColor.slice(3, 5), 16);
    const b2 = parseInt(targetColor.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    
    circles.push({ x, y, color, size: 8 });
  }

  return (
    <>
      {/* Círculos grandes en lugar de línea */}
      <g>
        {circles.map((circle, i) => (
          <circle
            key={`circle-${i}`}
            cx={circle.x}
            cy={circle.y}
            r={circle.size}
            fill={hasFilter ? '#8b5cf6' : circle.color}
            stroke="#f5f5f7"
            strokeWidth={3}
            opacity={0.9}
          />
        ))}
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
