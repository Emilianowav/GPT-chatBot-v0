'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronRight, Database, ArrowRight } from 'lucide-react';
import styles from './FlowVariablesPanel.module.css';

interface FlowVariable {
  name: string;
  type: string;
  value?: any;
  generatedBy: string;
  step: number;
  description?: string;
}

interface FlowVariablesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  variables: FlowVariable[];
}

export default function FlowVariablesPanel({
  isOpen,
  onClose,
  variables,
}: FlowVariablesPanelProps) {
  const [expandedVars, setExpandedVars] = useState<Set<string>>(new Set());

  const toggleExpand = (varName: string) => {
    const newExpanded = new Set(expandedVars);
    if (newExpanded.has(varName)) {
      newExpanded.delete(varName);
    } else {
      newExpanded.add(varName);
    }
    setExpandedVars(newExpanded);
  };

  const formatValue = (value: any): string => {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'string': return '#10b981';
      case 'number': return '#3b82f6';
      case 'boolean': return '#8b5cf6';
      case 'array': return '#f59e0b';
      case 'object': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.panelOverlay}>
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Database size={20} />
            <div>
              <h3 className={styles.title}>Flow Variables</h3>
              <p className={styles.subtitle}>{variables.length} variables accumulated</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {variables.length === 0 ? (
            <div className={styles.emptyState}>
              <Database size={48} color="#d1d5db" />
              <p>No variables yet</p>
              <span>Variables will appear as the flow executes</span>
            </div>
          ) : (
            <div className={styles.variablesList}>
              {variables.map((variable, index) => {
                const isExpanded = expandedVars.has(variable.name);
                
                return (
                  <div key={variable.name} className={styles.variableItem}>
                    {/* Variable Header */}
                    <div 
                      className={styles.variableHeader}
                      onClick={() => toggleExpand(variable.name)}
                    >
                      <div className={styles.variableLeft}>
                        <button className={styles.expandButton}>
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        
                        <div className={styles.stepBadge}>
                          {variable.step}
                        </div>
                        
                        <div className={styles.variableInfo}>
                          <div className={styles.variableName}>
                            {variable.name}
                          </div>
                          <div className={styles.variableSource}>
                            from <strong>{variable.generatedBy}</strong>
                          </div>
                        </div>
                      </div>

                      <div 
                        className={styles.typeBadge}
                        style={{ background: getTypeColor(variable.type) }}
                      >
                        {variable.type}
                      </div>
                    </div>

                    {/* Variable Details (Expanded) */}
                    {isExpanded && (
                      <div className={styles.variableDetails}>
                        {variable.description && (
                          <div className={styles.description}>
                            {variable.description}
                          </div>
                        )}
                        
                        <div className={styles.valueSection}>
                          <div className={styles.valueLabel}>Current Value:</div>
                          <pre className={styles.valueCode}>
                            {formatValue(variable.value)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.flowPath}>
            <ArrowRight size={14} />
            <span>Variables flow from top to bottom</span>
          </div>
        </div>
      </div>
    </div>
  );
}
