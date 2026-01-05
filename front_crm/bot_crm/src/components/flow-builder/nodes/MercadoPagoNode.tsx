import React from 'react';
import { Handle, Position } from 'reactflow';
import styles from './AppNode.module.css';

interface MercadoPagoNodeProps {
  data: {
    label: string;
    icon?: string;
    config?: any;
  };
}

const MercadoPagoNode: React.FC<MercadoPagoNodeProps> = ({ data }) => {
  return (
    <div className={styles.node} style={{ 
      background: 'linear-gradient(135deg, #009ee3 0%, #0084c7 100%)',
      border: '2px solid #006ba6',
      minWidth: '200px'
    }}>
      <Handle type="target" position={Position.Top} className={styles.handle} />
      
      <div className={styles.nodeHeader}>
        <div className={styles.iconContainer} style={{ fontSize: '32px' }}>
          💳
        </div>
      </div>
      
      <div className={styles.nodeContent}>
        <div className={styles.nodeTitle}>{data.label}</div>
        {data.config?.tipo && (
          <div className={styles.nodeSubtitle}>
            {data.config.tipo === 'crear_preferencia' ? 'Generar Link de Pago' : data.config.tipo}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className={styles.handle} />
    </div>
  );
};

export default MercadoPagoNode;
