import React, { memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import { Settings } from 'lucide-react';
import styles from './EdgeWithButton.module.css';

/**
 * EDGE CON BOTÓN DE CONFIGURACIÓN
 * 
 * Muestra:
 * - Línea punteada entre nodos
 * - Label con la condición (para Router)
 * - Botón de configuración en el centro
 */

interface EdgeData {
  label?: string;
  condition?: string;
  onConfigClick?: () => void;
}

function EdgeWithButton({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<EdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleConfigClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.onConfigClick) {
      data.onConfigClick();
    }
  };

  return (
    <>
      <path
        id={id}
        className={styles.edgePath}
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className={styles.edgeLabelContainer}
        >
          {data?.label && (
            <div className={styles.edgeLabel}>
              {data.label}
            </div>
          )}
          
          <button
            className={styles.edgeButton}
            onClick={handleConfigClick}
            title="Configurar condición"
          >
            <Settings size={14} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(EdgeWithButton);
