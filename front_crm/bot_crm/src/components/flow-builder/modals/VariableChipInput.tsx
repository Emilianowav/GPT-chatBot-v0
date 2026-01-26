import React, { useState, useRef, useEffect } from 'react';
import { X, Variable, Plus } from 'lucide-react';
import styles from './VariableChipInput.module.css';

interface VariableChipInputProps {
  value: string;
  onChange: (value: string) => void;
  onOpenVariableSelector: (event: React.MouseEvent) => void;
  placeholder?: string;
  className?: string;
  availableNodes?: Array<{ id: string; label: string; type: string; data?: any }>;
}

interface Segment {
  type: 'text' | 'variable';
  content: string;
}

export const VariableChipInput: React.FC<VariableChipInputProps> = ({
  value,
  onChange,
  onOpenVariableSelector,
  placeholder = '',
  className = '',
  availableNodes = []
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Parsear el valor para separar texto y variables
  const parseValue = (val: string): Segment[] => {
    const segments: Segment[] = [];
    const regex = /\{\{([^}]+)\}\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(val)) !== null) {
      // Agregar texto antes de la variable
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: val.substring(lastIndex, match.index)
        });
      }
      // Agregar variable
      segments.push({
        type: 'variable',
        content: match[1]
      });
      lastIndex = regex.lastIndex;
    }

    // Agregar texto restante
    if (lastIndex < val.length) {
      segments.push({
        type: 'text',
        content: val.substring(lastIndex)
      });
    }

    return segments;
  };

  const segments = parseValue(value);

  // Formatear nombre de variable para mostrar nombre del nodo en lugar del ID
  const formatVariableName = (varContent: string): string => {
    // Formato: node-ID.field o simplemente variable
    const match = varContent.match(/^node-(\d+)\.(.+)$/);
    if (match && availableNodes.length > 0) {
      const nodeId = `node-${match[1]}`;
      const field = match[2];
      const node = availableNodes.find(n => n.id === nodeId);
      if (node) {
        return `${node.label}.${field}`;
      }
    }
    return varContent;
  };

  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onChange(editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const removeVariable = (index: number) => {
    const newSegments = [...segments];
    newSegments.splice(index, 1);
    const newValue = newSegments.map(s => 
      s.type === 'variable' ? `{{${s.content}}}` : s.content
    ).join('');
    onChange(newValue);
  };

  if (isEditing) {
    return (
      <div className={`${styles.container} ${className}`}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={styles.editInput}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`} onClick={handleEdit}>
      <div className={styles.chipsContainer}>
        {segments.length === 0 || (segments.length === 1 && segments[0].content === '') ? (
          <span className={styles.placeholder}>{placeholder}</span>
        ) : (
          segments.map((segment, index) => (
            segment.type === 'variable' ? (
              <div key={index} className={styles.chip}>
                <Variable size={10} />
                <span>{formatVariableName(segment.content)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeVariable(index);
                  }}
                  className={styles.chipRemove}
                  type="button"
                >
                  <X size={10} />
                </button>
              </div>
            ) : (
              <span key={index} className={styles.textSegment}>
                {segment.content}
              </span>
            )
          ))
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenVariableSelector(e);
        }}
        className={styles.addVariableBtn}
        type="button"
        title="Agregar variable"
      >
        <Plus size={14} />
      </button>
    </div>
  );
};
