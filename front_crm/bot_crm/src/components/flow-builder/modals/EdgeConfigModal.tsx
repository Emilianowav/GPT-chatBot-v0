'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { VariableSelector } from '../VariableSelector';
import styles from './EdgeConfigModal.module.css';

interface EdgeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: EdgeConfig) => void;
  edgeId: string;
  sourceNodeType?: string;
  currentConfig?: EdgeConfig;
  availableNodes?: Array<{ id: string; label: string; type: string }>;
  globalVariables?: string[];
}

interface EdgeConfig {
  label?: string;
  condition?: string;
  conditions?: Condition[];
  color?: string;
}

interface Condition {
  id: string;
  variable: string;
  operator: string;
  value: string;
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
  availableNodes = [],
  globalVariables = [],
}: EdgeConfigModalProps) {
  const [label, setLabel] = useState(currentConfig?.label || '');
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState({ x: 0, y: 0 });
  const [activeConditionId, setActiveConditionId] = useState<string | null>(null);

  useEffect(() => {
    if (currentConfig?.conditions && currentConfig.conditions.length > 0) {
      setConditions(currentConfig.conditions);
    } else if (currentConfig?.condition) {
      // Parse existing condition string to conditions array
      const bracketMatch = currentConfig.condition.match(/\{\{([^}]+)\}\}\s+(empty|not_empty|exists|not_exists)$/i);
      if (bracketMatch) {
        setConditions([{
          id: Date.now().toString(),
          variable: `{{${bracketMatch[1]}}}`,
          operator: bracketMatch[2].toLowerCase().replace(/\s+/g, '_'),
          value: ''
        }]);
      } else {
        const standardMatch = currentConfig.condition.match(/(.+?)\s*(==|!=|>|<|>=|<=|contains|not_contains|exists|not_exists|empty|not_empty)\s*(.+)?/);
        if (standardMatch) {
          setConditions([{
            id: Date.now().toString(),
            variable: standardMatch[1].trim(),
            operator: standardMatch[2].trim(),
            value: standardMatch[3]?.trim() || ''
          }]);
        }
      }
    } else if (conditions.length === 0) {
      // Agregar una condición vacía por defecto
      addCondition();
    }
  }, [currentConfig]);

  const addCondition = () => {
    setConditions([...conditions, {
      id: Date.now().toString(),
      variable: '',
      operator: '==',
      value: ''
    }]);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const updateCondition = (id: string, field: keyof Condition, value: string) => {
    setConditions(conditions.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const openVariableSelector = (conditionId: string, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setSelectorPosition({ x: rect.right + 10, y: rect.top });
    setActiveConditionId(conditionId);
    setShowVariableSelector(true);
  };

  const handleVariableSelect = (variable: string) => {
    if (activeConditionId) {
      updateCondition(activeConditionId, 'variable', variable);
    }
    setShowVariableSelector(false);
    setActiveConditionId(null);
  };

  const handleSave = () => {
    // Construir string de condición para compatibilidad
    const conditionStrings = conditions.map(c => {
      if (c.operator === 'empty' || c.operator === 'not_empty' || 
          c.operator === 'exists' || c.operator === 'not_exists') {
        return `${c.variable} ${c.operator}`;
      }
      return `${c.variable} ${c.operator} ${c.value}`;
    });
    
    const conditionString = conditionStrings.join(' AND ');
    
    onSave({
      label: label || `Filter: ${conditionString}`,
      condition: conditionString,
      conditions: conditions,
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

          {/* Conditions List */}
          <div className={styles.formGroup}>
            <div className={styles.conditionsHeader}>
              <label className={styles.label}>Conditions</label>
              <button
                type="button"
                onClick={addCondition}
                className={styles.addConditionBtn}
              >
                <Plus size={16} />
                Add Condition
              </button>
            </div>
            
            <div className={styles.conditionsList}>
              {conditions.map((cond, index) => (
                <div key={cond.id} className={styles.conditionItem}>
                  <div className={styles.conditionNumber}>{index + 1}</div>
                  
                  <div className={styles.conditionFields}>
                    {/* Variable Selector */}
                    <div className={styles.conditionField}>
                      <label className={styles.smallLabel}>Variable</label>
                      <button
                        type="button"
                        onClick={(e) => openVariableSelector(cond.id, e)}
                        className={styles.variableButton}
                      >
                        {cond.variable || 'Select variable...'}
                      </button>
                    </div>

                    {/* Operator */}
                    <div className={styles.conditionField}>
                      <label className={styles.smallLabel}>Operator</label>
                      <select
                        value={cond.operator}
                        onChange={(e) => updateCondition(cond.id, 'operator', e.target.value)}
                        className={styles.select}
                      >
                        {OPERATORS.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Value */}
                    {cond.operator !== 'exists' && cond.operator !== 'not_exists' && 
                     cond.operator !== 'empty' && cond.operator !== 'not_empty' && (
                      <div className={styles.conditionField}>
                        <label className={styles.smallLabel}>Value</label>
                        <input
                          type="text"
                          value={cond.value}
                          onChange={(e) => updateCondition(cond.id, 'value', e.target.value)}
                          placeholder='""'
                          className={styles.input}
                        />
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  {conditions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCondition(cond.id)}
                      className={styles.deleteConditionBtn}
                      title="Remove condition"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className={styles.preview}>
              <div className={styles.previewLabel}>Preview:</div>
              <code className={styles.previewCode}>
                {conditions.map((c, i) => {
                  const condStr = c.operator === 'empty' || c.operator === 'not_empty' || 
                                  c.operator === 'exists' || c.operator === 'not_exists'
                    ? `${c.variable || 'variable'} ${c.operator}`
                    : `${c.variable || 'variable'} ${c.operator} ${c.value || 'value'}`;
                  return (
                    <span key={c.id}>
                      {condStr}
                      {i < conditions.length - 1 && <span className={styles.andOperator}> AND </span>}
                    </span>
                  );
                })}
              </code>
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
            disabled={conditions.length === 0 || conditions.some(c => 
              !c.variable || 
              (c.operator !== 'exists' && c.operator !== 'not_exists' && 
               c.operator !== 'empty' && c.operator !== 'not_empty' && !c.value)
            )}
          >
            Save
          </button>
        </div>
      </div>

      {/* Variable Selector */}
      <VariableSelector
        isOpen={showVariableSelector}
        onClose={() => {
          setShowVariableSelector(false);
          setActiveConditionId(null);
        }}
        onSelect={handleVariableSelect}
        position={selectorPosition}
        availableNodes={availableNodes}
        globalVariables={globalVariables}
      />
    </div>
  );
}
