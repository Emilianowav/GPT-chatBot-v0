import { memo } from 'react';
import { NodeProps } from 'reactflow';
import { Plus } from 'lucide-react';
import styles from './PlusNode.module.css';

/**
 * PLUS NODE - Nodo inicial estilo Make.com
 * 
 * Características:
 * - Círculo morado grande (120px)
 * - Icono + blanco grande
 * - Al hacer click: abre modal de apps
 * - Se convierte en AppNode al seleccionar app
 */

function PlusNode({ id, data }: NodeProps) {
  const handleClick = () => {
    if (data.onAddClick) {
      data.onAddClick(id);
    }
  };

  return (
    <div className={styles.plusNodeContainer}>
      <div 
        className={styles.plusNode}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Add first module"
      >
        <Plus size={48} strokeWidth={2.5} color="white" />
      </div>
    </div>
  );
}

export default memo(PlusNode);
