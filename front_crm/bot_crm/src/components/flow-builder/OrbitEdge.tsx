import { memo } from 'react';
import { EdgeProps, EdgeLabelRenderer, useStore } from 'reactflow';
import { Settings } from 'lucide-react';
import styles from './CustomEdge.module.css';

/**
 * CONCEPTO DE CONEXIÓN CON ÓRBITA:
 * 
 * 1. ReactFlow pasa sourceX/sourceY y targetX/targetY desde el CENTRO del nodo
 * 2. Necesitamos calcular la posición REAL del handle en la órbita
 * 3. Cálculo:
 *    - Ángulo desde source hacia target: atan2(dy, dx)
 *    - Posición handle source: center + (cos(angle) * ORBIT_RADIUS, sin(angle) * ORBIT_RADIUS)
 *    - Ángulo desde target hacia source: atan2(-dy, -dx)
 *    - Posición handle target: center + (cos(angle) * ORBIT_RADIUS, sin(angle) * ORBIT_RADIUS)
 * 4. Resultado: Línea recta desde handle source hasta handle target
 * 
 * ÓRBITA:
 * - Radio de órbita: 56px (40px radio nodo + 16px mitad handle)
 * - Los handles siempre están a esta distancia del centro
 * - Las líneas conectan handle a handle, no centro a centro
 */

// Constantes de órbita (deben coincidir con OrbitHandleNode)
const NODE_RADIUS = 40;
const HANDLE_SIZE = 32;
const HANDLE_HALF = HANDLE_SIZE / 2;
const ORBIT_RADIUS = NODE_RADIUS + HANDLE_HALF; // 56px

function OrbitEdge({
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
  
  // Obtener colores de los nodos
  const sourceColor = data?.sourceColor || '#d1d5db';
  const targetColor = data?.targetColor || '#d1d5db';

  // Obtener posiciones reales de los nodos para calcular órbita
  const nodes = useStore((state) => state.nodeInternals);
  const sourceNode = nodes.get(source);
  const targetNode = nodes.get(target);

  // Calcular posición REAL del handle en la órbita
  let actualSourceX = sourceX;
  let actualSourceY = sourceY;
  let actualTargetX = targetX;
  let actualTargetY = targetY;

  if (sourceNode && targetNode) {
    // Ángulo desde source hacia target
    const sourceAngle = Math.atan2(
      targetNode.position.y - sourceNode.position.y,
      targetNode.position.x - sourceNode.position.x
    );
    
    // Ángulo desde target hacia source
    const targetAngle = Math.atan2(
      sourceNode.position.y - targetNode.position.y,
      sourceNode.position.x - targetNode.position.x
    );

    // Posición real del handle source en la órbita
    actualSourceX = sourceX + Math.cos(sourceAngle) * ORBIT_RADIUS;
    actualSourceY = sourceY + Math.sin(sourceAngle) * ORBIT_RADIUS;

    // Posición real del handle target en la órbita
    actualTargetX = targetX + Math.cos(targetAngle) * ORBIT_RADIUS;
    actualTargetY = targetY + Math.sin(targetAngle) * ORBIT_RADIUS;
  }

  // Calcular círculos a lo largo de la línea recta
  const distance = Math.sqrt(
    Math.pow(actualTargetX - actualSourceX, 2) + 
    Math.pow(actualTargetY - actualSourceY, 2)
  );
  const numCircles = Math.floor(distance / 40); // Un círculo cada 40px
  const circles = [];
  
  for (let i = 1; i <= numCircles; i++) {
    const t = i / (numCircles + 1);
    const x = actualSourceX + (actualTargetX - actualSourceX) * t;
    const y = actualSourceY + (actualTargetY - actualSourceY) * t;
    
    // Interpolar color entre source y target
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
      {/* Círculos que forman la línea recta */}
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

export default memo(OrbitEdge);
