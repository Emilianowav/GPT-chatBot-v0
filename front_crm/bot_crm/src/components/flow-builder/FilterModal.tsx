'use client';

import { useState } from 'react';
import { X, HelpCircle, MoreVertical, Plus } from 'lucide-react';
import styles from './FilterModal.module.css';

interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface FilterModalProps {
  edgeId: string;
  onSave: (edgeId: string, filter: any) => void;
  onClose: () => void;
}

const OPERATORS = [
  'Equal to',
  'Not equal to',
  'Greater than',
  'Less than',
  'Greater than or equal to',
  'Less than or equal to',
  'Contains',
  'Does not contain',
  'Starts with',
  'Ends with',
  'Is empty',
  'Is not empty',
];

export default function FilterModal({ edgeId, onSave, onClose }: FilterModalProps) {
  const [label, setLabel] = useState('');
  const [rules, setRules] = useState<FilterRule[]>([
    { id: '1', field: '', operator: 'Equal to', value: '' }
  ]);
  const [logicType, setLogicType] = useState<'AND' | 'OR'>('AND');

  const addRule = (type: 'AND' | 'OR') => {
    setLogicType(type);
    setRules([...rules, {
      id: Date.now().toString(),
      field: '',
      operator: 'Equal to',
      value: ''
    }]);
  };

  const updateRule = (id: string, field: keyof FilterRule, value: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
  };

  const removeRule = (id: string) => {
    if (rules.length > 1) {
      setRules(rules.filter(rule => rule.id !== id));
    }
  };

  const handleSave = () => {
    onSave(edgeId, {
      label,
      rules,
      logicType
    });
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Set up a filter</h2>
          <div className={styles.headerActions}>
            <button className={styles.iconButton} title="More options">
              <MoreVertical size={18} />
            </button>
            <button className={styles.iconButton} title="Help">
              <HelpCircle size={18} />
            </button>
            <button className={styles.iconButton} onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>Label</label>
            <input
              type="text"
              className={styles.input}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={120}
              placeholder="Enter filter label"
            />
            {label.length > 0 && (
              <div className={styles.hint}>
                {label.length}/120 characters
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Condition</label>
            
            {rules.map((rule, index) => (
              <div key={rule.id} className={styles.ruleGroup}>
                {index > 0 && (
                  <div className={styles.logicBadge}>
                    {logicType}
                  </div>
                )}
                
                <div className={styles.rule}>
                  <input
                    type="text"
                    className={styles.input}
                    value={rule.field}
                    onChange={(e) => updateRule(rule.id, 'field', e.target.value)}
                    placeholder="Field or variable"
                  />
                  
                  <select
                    className={styles.select}
                    value={rule.operator}
                    onChange={(e) => updateRule(rule.id, 'operator', e.target.value)}
                  >
                    {OPERATORS.map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                  
                  <input
                    type="text"
                    className={styles.input}
                    value={rule.value}
                    onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                    placeholder="Value"
                  />

                  {rules.length > 1 && (
                    <button
                      className={styles.removeButton}
                      onClick={() => removeRule(rule.id)}
                      title="Remove rule"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className={styles.addRules}>
              <button 
                className={styles.addRuleButton}
                onClick={() => addRule('AND')}
              >
                <Plus size={14} />
                Add AND rule
              </button>
              <button 
                className={styles.addRuleButton}
                onClick={() => addRule('OR')}
              >
                <Plus size={14} />
                Add OR rule
              </button>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.saveButton} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
