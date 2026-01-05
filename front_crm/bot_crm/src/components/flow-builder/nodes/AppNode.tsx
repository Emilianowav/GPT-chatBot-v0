import { memo } from 'react';
import { NodeProps, Handle, Position, useEdges } from 'reactflow';
import { Plus, Zap } from 'lucide-react';
import styles from './AppNode.module.css';

/**
 * APP NODE - Nodo con app seleccionada estilo Make.com
 * 
 * Características:
 * - Círculo 100px con color de app
 * - Icono de app en el centro
 * - Badge de ejecución arriba derecha
 * - Badge de app abajo izquierda
 * - Handle + a la derecha (si no está conectado)
 * - Label y subtitle debajo
 */

interface AppNodeData {
  appName: string;
  appIcon?: React.ReactNode;
  color: string;
  label: string;
  subtitle?: string;
  executionCount?: number;
  hasConnection?: boolean;
  onHandleClick?: (nodeId: string) => void;
  onNodeClick?: (nodeId: string) => void;
}

function AppNode({ id, data, selected }: NodeProps<AppNodeData>) {
  const {
    appIcon,
    color,
    label,
    subtitle,
    executionCount = 1,
    hasConnection = false,
    onHandleClick,
    onNodeClick,
  } = data;

  const edges = useEdges();

  // Calcular conexiones salientes y entrantes desde este nodo
  const outgoingEdges = edges.filter(edge => edge.source === id);
  const incomingEdges = edges.filter(edge => edge.target === id);
  const hasOutgoingConnection = outgoingEdges.length > 0;
  const hasIncomingConnection = incomingEdges.length > 0;

  // Calcular ángulo para el handle según el número de conexiones
  // Por defecto: 0° (derecha), si hay múltiples se distribuyen en órbita
  const getHandleAngle = (index: number, total: number) => {
    if (total === 1) return 0; // Derecha
    // Distribuir en semicírculo derecho (-45° a 45°)
    const startAngle = -45;
    const endAngle = 45;
    const step = (endAngle - startAngle) / (total - 1);
    return startAngle + (step * index);
  };

  const handleNodeClick = () => {
    if (onNodeClick) {
      onNodeClick(id);
    }
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHandleClick) {
      onHandleClick(id);
    }
  };

  return (
    <div className={styles.appNodeContainer}>
      {/* Handle de entrada */}
      {hasIncomingConnection ? (
        // Handle visual conectado en entrada (izquierda)
        <>
          <div
            className={styles.handleConnectedInput}
            style={{ background: color }}
          />
          <Handle
            type="target"
            position={Position.Left}
            style={{ opacity: 0 }}
          />
        </>
      ) : (
        // Handle invisible de entrada
        <Handle
          type="target"
          position={Position.Left}
          style={{ opacity: 0 }}
        />
      )}

      {/* Círculo principal del nodo */}
      <div 
        className={`${styles.appNode} ${selected ? styles.selected : ''}`}
        style={{ 
          background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
          boxShadow: `0 8px 20px ${color}40`,
        }}
        onClick={handleNodeClick}
        role="button"
        tabIndex={0}
        aria-label={label}
      >
        {appIcon || <div className={styles.appIconPlaceholder}>?</div>}
      </div>

      {/* Badge de ejecución (arriba derecha) */}
      <div className={styles.executionBadge}>
        {executionCount}
      </div>

      {/* Badge de app (abajo izquierda) - ejemplo: rayo */}
      <div 
        className={styles.appBadge}
        style={{ background: color }}
      >
        <Zap size={16} color="white" strokeWidth={2.5} />
      </div>

      {/* Handles dinámicos en órbita */}
      {hasOutgoingConnection ? (
        // Mostrar handles conectados para cada conexión saliente
        outgoingEdges.map((edge, index) => {
          const angle = getHandleAngle(index, outgoingEdges.length);
          const angleRad = (angle * Math.PI) / 180;
          const radius = 70; // 50px (radio nodo) + 20px (radio handle)
          const handleX = Math.cos(angleRad) * radius;
          const handleY = Math.sin(angleRad) * radius;

          return (
            <div key={edge.id}>
              {/* Handle visual conectado en órbita */}
              <div
                className={styles.handleConnected}
                style={{
                  background: color,
                  position: 'absolute',
                  left: `calc(50% + ${handleX}px)`,
                  top: `calc(50% + ${handleY}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
              {/* Handle invisible de ReactFlow */}
              <Handle
                type="source"
                position={Position.Right}
                id={edge.id}
                style={{
                  left: `calc(50% + ${handleX}px)`,
                  top: `calc(50% + ${handleY}px)`,
                  opacity: 0,
                }}
              />
            </div>
          );
        })
      ) : (
        // Mostrar handle + cuando no hay conexiones
        <>
          <div
            className={styles.handlePlus}
            style={{ background: color }}
            onClick={handlePlusClick}
            role="button"
            tabIndex={0}
            aria-label="Add next module"
          >
            <Plus size={20} color="white" strokeWidth={3} />
          </div>
          {/* Handle invisible de salida por defecto */}
          <Handle
            type="source"
            position={Position.Right}
            style={{ opacity: 0 }}
          />
        </>
      )}

      {/* Labels */}
      <div className={styles.nodeLabel}>{label}</div>
      {subtitle && (
        <div className={styles.nodeSubtitle}>{subtitle}</div>
      )}
    </div>
  );
}

export default memo(AppNode);
