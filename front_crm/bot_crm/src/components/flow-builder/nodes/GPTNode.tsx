import React from 'react';
import { Handle, Position } from 'reactflow';
import styles from './AppNode.module.css';

interface GPTNodeProps {
  data: {
    label: string;
    icon?: string;
    config?: any;
  };
}

const GPTNode: React.FC<GPTNodeProps> = ({ data }) => {
  const getIconForType = (tipo: string) => {
    switch (tipo) {
      case 'conversacional':
        return '🤖';
      case 'formateador':
        return '⚙️';
      case 'procesador':
        return '🧠';
      default:
        return '🤖';
    }
  };

  const icon = data.config?.tipo ? getIconForType(data.config.tipo) : '🤖';

  return (
    <div className={styles.node} style={{ 
      background: 'linear-gradient(135deg, #10a37f 0%, #1a7f64 100%)',
      border: '2px solid #0d8c6c',
      minWidth: '200px'
    }}>
      <Handle type="target" position={Position.Top} className={styles.handle} />
      
      <div className={styles.nodeHeader}>
        <div className={styles.iconContainer} style={{ fontSize: '32px' }}>
          {icon}
        </div>
      </div>
      
      <div className={styles.nodeContent}>
        <div className={styles.nodeTitle}>{data.label}</div>
        {data.config?.tipo && (
          <div className={styles.nodeSubtitle}>
            Tipo: {data.config.tipo}
          </div>
        )}
        {data.config?.modelo && (
          <div className={styles.nodeSubtitle} style={{ fontSize: '10px', opacity: 0.8 }}>
            {data.config.modelo}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className={styles.handle} />
    </div>
  );
};

export default GPTNode;
