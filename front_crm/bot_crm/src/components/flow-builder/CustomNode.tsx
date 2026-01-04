import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import styles from './CustomNode.module.css';
import { 
  MessageSquare, 
  GitBranch, 
  Database, 
  CheckCircle, 
  AlertCircle,
  Webhook,
  Mail,
  Clock,
  Phone,
  Plus
} from 'lucide-react';

const nodeIcons: Record<string, any> = {
  message: MessageSquare,
  question: MessageSquare,
  condition: GitBranch,
  api: Database,
  webhook: Webhook,
  email: Mail,
  delay: Clock,
  validation: CheckCircle,
  error: AlertCircle,
};

const nodeColors: Record<string, string> = {
  message: '#6366f1',
  question: '#8b5cf6',
  condition: '#f59e0b',
  api: '#10b981',
  webhook: '#ec4899',
  email: '#3b82f6',
  delay: '#6b7280',
  validation: '#14b8a6',
  error: '#ef4444',
};

function CustomNode({ data, selected }: NodeProps) {
  const Icon = nodeIcons[data.type] || MessageSquare;
  const color = nodeColors[data.type] || '#25D366';

  return (
    <div className={styles.nodeWrapper}>
      <Handle
        type="target"
        position={Position.Top}
        className={styles.handleTop}
      />
      
      {/* Nodo circular estilo Make */}
      <div 
        className={`${styles.nodeCircle} ${selected ? styles.selected : ''}`}
        style={{ 
          background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
          boxShadow: selected 
            ? `0 0 0 3px ${color}40, 0 8px 24px ${color}60`
            : `0 4px 12px ${color}40`
        }}
      >
        <Icon size={32} color="white" strokeWidth={2} />
      </div>

      {/* Nombre del nodo debajo */}
      <div className={styles.nodeLabel}>
        {data.label}
      </div>

      {/* Subtítulo/descripción */}
      {data.config?.message && (
        <div className={styles.nodeSubtitle}>
          {data.config.message.substring(0, 30)}
          {data.config.message.length > 30 ? '...' : ''}
        </div>
      )}

      {/* Badge con número */}
      {data.config?.id && (
        <div className={styles.nodeBadge}>
          {data.config.id.split('-').pop()?.substring(0, 2) || '1'}
        </div>
      )}

      {/* Botón + para agregar siguiente */}
      <button className={styles.addButton} title="Agregar módulo">
        <Plus size={14} />
      </button>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className={styles.handleBottom}
      />
    </div>
  );
}

export default memo(CustomNode);
