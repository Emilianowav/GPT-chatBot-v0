import React from 'react';
import { Handle, Position } from 'reactflow';
import styles from './AppNode.module.css';

interface WebhookNodeProps {
  data: {
    label: string;
    icon?: string;
    config?: any;
  };
}

const WebhookNode: React.FC<WebhookNodeProps> = ({ data }) => {
  return (
    <div className={styles.node} style={{ 
      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
      border: '2px solid #dc4c3e',
      minWidth: '200px'
    }}>
      <Handle type="target" position={Position.Top} className={styles.handle} />
      
      <div className={styles.nodeHeader}>
        <div className={styles.iconContainer} style={{ fontSize: '32px' }}>
          🔔
        </div>
      </div>
      
      <div className={styles.nodeContent}>
        <div className={styles.nodeTitle}>{data.label}</div>
        {data.config?.tipo && (
          <div className={styles.nodeSubtitle}>
            {data.config.tipo === 'listener' ? 'Escuchando eventos' : data.config.tipo}
          </div>
        )}
        {data.config?.endpoint && (
          <div className={styles.nodeSubtitle} style={{ fontSize: '10px', opacity: 0.8 }}>
            {data.config.endpoint}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className={styles.handle} />
    </div>
  );
};

export default WebhookNode;
