'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import styles from './EdgeConfigModal.module.css';

interface EdgeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: EdgeConfig) => void;
  edgeId: string;
  sourceNodeType?: string;
  currentConfig?: EdgeConfig;
}

interface EdgeConfig {
  label?: string;
  condition?: string;
  color?: string;
}

const OPERATORS = [
  { value: '==', label: 'Equal to' },
  { value: '!=', label: 'Not equal to' },
  { value: '>', label: 'Greater than' },
  { value: '<', label: 'Less than' },
  { value: '>=', label: 'Greater than or equal to' },
  { value: '<=', label: 'Less than or equal to' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'exists', label: 'Exists' },
  { value: 'not_exists', label: 'Does not exist' },
  { value: 'empty', label: 'Is empty' },
  { value: 'not_empty', label: 'Is not empty' },
];

export default function EdgeConfigModal({
  isOpen,
  onClose,
  onSave,
  edgeId,
  sourceNodeType,
  currentConfig,
}: EdgeConfigModalProps) {
  const [label, setLabel] = useState(currentConfig?.label || '');
  const [condition, setCondition] = useState(currentConfig?.condition || '');
  const [selectedOperator, setSelectedOperator] = useState('==');
  const [leftValue, setLeftValue] = useState('');
  const [rightValue, setRightValue] = useState('');

  useEffect(() => {
    if (currentConfig?.condition) {
      // Parse existing condition
      // Soporta formatos:
      // 1. {{variable}} operator (ej: {{gpt-conversacional.variables_faltantes}} empty)
      // 2. variable operator value (ej: search != "")
      
      // Intentar formato {{variable}} operator primero
      const bracketMatch = currentConfig.condition.match(/\{\{([^}]+)\}\}\s+(empty|not_empty|exists|not_exists)$/i);
      if (bracketMatch) {
        setLeftValue(`{{${bracketMatch[1]}}}`);
        setSelectedOperator(bracketMatch[2].toLowerCase().replace(/\s+/g, '_'));
        setRightValue('');
        return;
      }
      
      // Intentar formato estándar: variable operator value
      const standardMatch = currentConfig.condition.match(/(.+?)\s*(==|!=|>|<|>=|<=|contains|not_contains|exists|not_exists|empty|not_empty)\s*(.+)?/);
      if (standardMatch) {
        setLeftValue(standardMatch[1].trim());
        setSelectedOperator(standardMatch[2].trim());
        setRightValue(standardMatch[3]?.trim() || '');
      }
    }
  }, [currentConfig]);

  const handleSave = () => {
    // Construir condición según el operador
    let conditionString = '';
    
    if (selectedOperator === 'empty' || selectedOperator === 'not_empty' || 
        selectedOperator === 'exists' || selectedOperator === 'not_exists') {
      // Para estos operadores, no incluir rightValue
      conditionString = `${leftValue} ${selectedOperator}`;
    } else {
      // Para otros operadores, incluir rightValue
      conditionString = `${leftValue} ${selectedOperator} ${rightValue}`;
    }
    
    onSave({
      label: label || `Filter: ${conditionString}`,
      condition: conditionString,
      color: '#8b5cf6',
    });
    
    onClose();
  };

  if (!isOpen) return null;

  const isRouter = sourceNodeType === 'router';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.iconContainer} style={{ background: '#8b5cf6' }}>
              🔀
            </div>
            <div>
              <h2 className={styles.modalTitle}>
                {isRouter ? 'Configure Route Condition' : 'Set up a filter'}
              </h2>
              <p className={styles.modalSubtitle}>
                {isRouter 
                  ? 'Define the condition for this route'
                  : 'Only continue if the condition is met'
                }
              </p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Label */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Label
              <span className={styles.optional}>(optional, max 120 characters)</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value.slice(0, 120))}
              placeholder={isRouter ? "Route name" : "Filter name"}
              className={styles.input}
              maxLength={120}
            />
            <div className={styles.charCount}>{label.length}/120</div>
          </div>

          {/* Condition Builder */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Condition</label>
            
            <div className={styles.conditionBuilder}>
              {/* Left Value (Variable) */}
              <div className={styles.conditionPart}>
                <label className={styles.smallLabel}>Variable</label>
                <input
                  type="text"
                  value={leftValue}
                  onChange={(e) => setLeftValue(e.target.value)}
                  placeholder="search"
                  className={styles.input}
                />
                <div className={styles.hint}>
                  Tip: Use variable names like <code>search</code>, <code>total_productos</code>
                </div>
              </div>

              {/* Operator */}
              <div className={styles.conditionPart}>
                <label className={styles.smallLabel}>Operator</label>
                <select
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value)}
                  className={styles.select}
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Right Value */}
              {selectedOperator !== 'exists' && selectedOperator !== 'not_exists' && 
               selectedOperator !== 'empty' && selectedOperator !== 'not_empty' && (
                <div className={styles.conditionPart}>
                  <label className={styles.smallLabel}>Value</label>
                  <input
                    type="text"
                    value={rightValue}
                    onChange={(e) => setRightValue(e.target.value)}
                    placeholder='""'
                    className={styles.input}
                  />
                  <div className={styles.hint}>
                    Use <code>""</code> for empty string, or any value
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className={styles.preview}>
              <div className={styles.previewLabel}>Preview:</div>
              <code className={styles.previewCode}>
                {leftValue || 'variable'} {selectedOperator} {
                  selectedOperator !== 'exists' && 
                  selectedOperator !== 'not_exists' && 
                  selectedOperator !== 'empty' && 
                  selectedOperator !== 'not_empty' 
                    ? (rightValue || 'value') 
                    : ''
                }
              </code>
            </div>
          </div>

          {/* Examples */}
          <div className={styles.examples}>
            <div className={styles.examplesTitle}>💡 Examples:</div>
            <div className={styles.examplesList}>
              <div className={styles.example}>
                <code>search != ""</code> - Search is not empty
              </div>
              <div className={styles.example}>
                <code>total_productos &gt; 0</code> - Has products
              </div>
              <div className={styles.example}>
                <code>mensaje_usuario contains "ayuda"</code> - Message contains "ayuda"
              </div>
              <div className={styles.example}>
                <code>{`{{gpt.variables_faltantes}} empty`}</code> - Variables array is empty
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnSecondary}>
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className={styles.btnPrimary}
            disabled={!leftValue || (!rightValue && 
              selectedOperator !== 'exists' && 
              selectedOperator !== 'not_exists' &&
              selectedOperator !== 'empty' &&
              selectedOperator !== 'not_empty'
            )}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
