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
  Clock
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
  const color = nodeColors[data.type] || '#6366f1';

  return (
    <div 
      className={`${styles.node} ${selected ? styles.selected : ''}`}
      style={{ borderColor: color }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={styles.handle}
      />
      
      <div className={styles.nodeHeader} style={{ background: color }}>
        <Icon size={18} color="white" />
      </div>
      
      <div className={styles.nodeBody}>
        <div className={styles.nodeLabel}>{data.label}</div>
        {data.config?.message && (
          <div className={styles.nodePreview}>
            {data.config.message.substring(0, 50)}
            {data.config.message.length > 50 ? '...' : ''}
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className={styles.handle}
      />
    </div>
  );
}

export default memo(CustomNode);
