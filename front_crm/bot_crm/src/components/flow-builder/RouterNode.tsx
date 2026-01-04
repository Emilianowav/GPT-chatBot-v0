import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch } from 'lucide-react';
import styles from './RouterNode.module.css';

function RouterNode({ data, selected }: NodeProps) {
  return (
    <div className={styles.nodeWrapper}>
      <Handle
        type="target"
        position={Position.Top}
        className={styles.handleTop}
      />
      
      {/* Nodo hexagonal estilo Make - Router */}
      <div 
        className={`${styles.routerHex} ${selected ? styles.selected : ''}`}
      >
        <div className={styles.hexInner}>
          <GitBranch size={36} color="white" strokeWidth={2.5} />
        </div>
      </div>

      {/* Nombre del router */}
      <div className={styles.nodeLabel}>
        {data.label || 'Router'}
      </div>

      {/* Subtítulo */}
      <div className={styles.nodeSubtitle}>
        Divide el flujo en múltiples caminos
      </div>

      {/* Badge con número de rutas */}
      {data.routeCount && (
        <div className={styles.nodeBadge}>
          {data.routeCount} rutas
        </div>
      )}

      {/* Handles de salida múltiples */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="route-1"
        className={styles.handleBottom}
        style={{ left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="route-2"
        className={styles.handleBottom}
        style={{ left: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="route-3"
        className={styles.handleBottom}
        style={{ left: '70%' }}
      />
    </div>
  );
}

export default memo(RouterNode);
