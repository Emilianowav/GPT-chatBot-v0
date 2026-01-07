import React, { memo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Plus } from 'lucide-react';
import styles from './AppNode.module.css';

interface GPTNodeData {
  label: string;
  icon?: string;
  executionCount?: number;
  hasConnection?: boolean;
  onHandleClick?: (nodeId: string) => void;
  onNodeClick?: (nodeId: string) => void;
  config?: {
    tipo: 'conversacional' | 'formateador' | 'procesador';
    modelo?: string;
    temperatura?: number;
    max_tokens?: number;
    prompt_sistema?: string;
    variables_entrada?: string[];
    variables_salida?: string[];
  };
}

function GPTNode({ id, data, selected }: NodeProps<GPTNodeData>) {
  const {
    label,
    executionCount = 1,
    hasConnection = false,
    onHandleClick,
    onNodeClick,
    config,
  } = data;

  const color = '#10a37f'; // OpenAI green

  const getIconForType = () => {
    return (
      <img 
        src="/logos tecnologias/chatgpt.svg" 
        alt="ChatGPT" 
        className={styles.nodeLogo}
      />
    );
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
      <div
        className={`${styles.appNode} ${selected ? styles.selected : ''}`}
        style={{ background: color }}
        onClick={handleNodeClick}
      >
        {getIconForType()}

        <div 
          className={styles.executionBadge}
          style={{ background: '#ef4444' }}
        >
          {executionCount}
        </div>

        <div 
          className={styles.appBadge}
          style={{ background: color }}
        >
          <img 
            src="/logos tecnologias/chatgpt.svg" 
            alt="ChatGPT" 
            style={{ width: '16px', height: '16px' }}
          />
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0 }}
      />

      {!hasConnection && (
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
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0 }}
      />

      <div className={styles.nodeLabel}>{label}</div>
      {config?.tipo && (
        <div className={styles.nodeSubtitle}>{config.tipo}</div>
      )}
    </div>
  );
}

export default memo(GPTNode);
