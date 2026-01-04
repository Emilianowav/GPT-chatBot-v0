import { memo } from 'react';
import { EdgeProps, getStraightPath, EdgeLabelRenderer, useStore } from 'reactflow';
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
  const hasFilter = data?.filter;
  
  // Obtener colores de los nodos source y target
  const sourceColor = data?.sourceColor || '#d1d5db';
  const targetColor = data?.targetColor || '#d1d5db';

  // Obtener posiciones reales de los nodos para calcular ángulo
  const nodes = useStore((state) => state.nodeInternals);
  const sourceNode = nodes.get(source);
  const targetNode = nodes.get(target);

  // Calcular posición real del handle usando el mismo ángulo que DynamicHandleNode
  let actualSourceX = sourceX;
  let actualSourceY = sourceY;
  let actualTargetX = targetX;
  let actualTargetY = targetY;

  if (sourceNode && targetNode) {
    // Calcular ángulo desde source hacia target
    const sourceAngle = Math.atan2(
      targetNode.position.y - sourceNode.position.y,
      targetNode.position.x - sourceNode.position.x
    );
    
    // Calcular ángulo desde target hacia source
    const targetAngle = Math.atan2(
      sourceNode.position.y - targetNode.position.y,
      sourceNode.position.x - targetNode.position.x
    );

    // Radio del handle: 56px (40px radio círculo + 16px mitad handle de 32px)
    const handleRadius = 56;

    // Posición real del handle source
    actualSourceX = sourceX + Math.cos(sourceAngle) * handleRadius;
    actualSourceY = sourceY + Math.sin(sourceAngle) * handleRadius;

    // Posición real del handle target
    actualTargetX = targetX + Math.cos(targetAngle) * handleRadius;
    actualTargetY = targetY + Math.sin(targetAngle) * handleRadius;
  }

  // Calcular puntos a lo largo del path para los círculos
  const distance = Math.sqrt(Math.pow(actualTargetX - actualSourceX, 2) + Math.pow(actualTargetY - actualSourceY, 2));
  const numCircles = Math.floor(distance / 40); // Un círculo cada 40px
  const circles = [];
  
  for (let i = 1; i <= numCircles; i++) {
    const t = i / (numCircles + 1);
    const x = actualSourceX + (actualTargetX - actualSourceX) * t;
    const y = actualSourceY + (actualTargetY - actualSourceY) * t;
    
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
            transform: `translate(-50%, -50%) translate(${(actualSourceX + actualTargetX) / 2}px,${(actualSourceY + actualTargetY) / 2}px)`,
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
