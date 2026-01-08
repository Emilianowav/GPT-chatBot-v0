'use client';

import { EdgeLabelRenderer, BaseEdge, EdgeProps } from 'reactflow';
import { Settings } from 'lucide-react';
import styles from './EdgeLabel.module.css';

interface EdgeLabelProps extends EdgeProps {
  label?: string;
  condition?: string;
  onConfigClick?: (edgeId: string) => void;
}

export default function EdgeLabel({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  label,
  condition,
  onConfigClick,
}: EdgeLabelProps) {
  // Calculate midpoint
  const edgeCenterX = (sourceX + targetX) / 2;
  const edgeCenterY = (sourceY + targetY) / 2;

  const handleConfigClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onConfigClick) {
      onConfigClick(id);
    }
  };

  return (
    <EdgeLabelRenderer>
      <div
        style={{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${edgeCenterX}px,${edgeCenterY}px)`,
          pointerEvents: 'all',
        }}
        className={styles.edgeLabelContainer}
      >
        {/* Condition Label */}
        {(label || condition) && (
          <div className={styles.conditionLabel}>
            <span className={styles.conditionText}>
              {label || condition}
            </span>
          </div>
        )}

        {/* Config Button */}
        <button
          onClick={handleConfigClick}
          className={styles.configButton}
          title="Configure filter"
        >
          <Settings size={14} />
        </button>
      </div>
    </EdgeLabelRenderer>
  );
}
