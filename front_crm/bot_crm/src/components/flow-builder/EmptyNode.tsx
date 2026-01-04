'use client';

import { Plus } from 'lucide-react';
import { Handle, Position } from 'reactflow';
import styles from './EmptyNode.module.css';

interface EmptyNodeProps {
  data: {
    onAddClick: () => void;
  };
}

export default function EmptyNode({ data }: EmptyNodeProps) {
  return (
    <div className={styles.emptyNode}>
      <Handle type="target" position={Position.Top} className={styles.handle} />
      
      <button 
        className={styles.addButton}
        onClick={data.onAddClick}
        title="Agregar módulo"
      >
        <Plus size={32} />
      </button>
      
      <Handle type="source" position={Position.Bottom} className={styles.handle} />
    </div>
  );
}
