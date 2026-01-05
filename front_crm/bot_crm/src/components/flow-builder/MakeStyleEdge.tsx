import { memo } from 'react';
import { EdgeProps, EdgeLabelRenderer, useStore } from 'reactflow';
import { Settings } from 'lucide-react';
import styles from './CustomEdge.module.css';

/**
 * EDGE ESTILO MAKE.COM
 * 
 * CARACTERÍSTICAS:
 * 1. Líneas salen DIRECTAMENTE del handle (no del centro del nodo)
 * 2. Círculos grandes espaciados formando la línea
 * 3. Gradiente de color entre nodos
 * 4. Botón de configuración en el centro
 * 5. Actualización instantánea al mover nodos
 */

// Constantes (deben coincidir con MakeStyleNode)
const NODE_RADIUS = 50; // Radio del círculo del nodo
const HANDLE_SIZE = 40; // Tamaño del handle visual
const HANDLE_RADIUS = HANDLE_SIZE / 2; // 20px - Radio del handle

function MakeStyleEdge({
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

  // Obtener posiciones reales de los nodos
  const nodes = useStore((state) => state.nodeInternals);
  const sourceNode = nodes.get(source);
  const targetNode = nodes.get(target);

  // Calcular posición REAL del handle en el borde del nodo
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

    // CRÍTICO: Handle visual está en NODE_RADIUS (50px)
    // Handle tiene 40px de diámetro, su centro está en NODE_RADIUS
    // Pero la línea debe salir desde el BORDE EXTERIOR del handle
    // Por lo tanto: NODE_RADIUS + HANDLE_RADIUS = 50px + 20px = 70px
    const handleConnectionPoint = NODE_RADIUS + HANDLE_RADIUS;
    
    actualSourceX = sourceX + Math.cos(sourceAngle) * handleConnectionPoint;
    actualSourceY = sourceY + Math.sin(sourceAngle) * handleConnectionPoint;

    actualTargetX = targetX + Math.cos(targetAngle) * handleConnectionPoint;
    actualTargetY = targetY + Math.sin(targetAngle) * handleConnectionPoint;
  }

  // Calcular círculos a lo largo de la línea recta
  const distance = Math.sqrt(
    Math.pow(actualTargetX - actualSourceX, 2) + 
    Math.pow(actualTargetY - actualSourceY, 2)
  );
  
  // Círculos más espaciados como en Make.com
  const numCircles = Math.floor(distance / 35); // Un círculo cada 35px
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
    
    // Círculos más grandes como en Make.com
    circles.push({ x, y, color, size: 10 });
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

export default memo(MakeStyleEdge);
