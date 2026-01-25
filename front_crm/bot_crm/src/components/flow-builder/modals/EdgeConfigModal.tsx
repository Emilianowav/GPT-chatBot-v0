'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Globe, ArrowRight } from 'lucide-react';
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
  allNodes?: any[];
  allEdges?: any[];
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
  variableLabel?: string; // Nombre legible para mostrar
  operator: string;
  value: string;
}

const OPERATORS = [
  { value: '==', label: 'Igual a' },
  { value: '!=', label: 'Diferente de' },
  { value: '>', label: 'Mayor que' },
  { value: '<', label: 'Menor que' },
  { value: '>=', label: 'Mayor o igual que' },
  { value: '<=', label: 'Menor o igual que' },
  { value: 'contains', label: 'Contiene' },
  { value: 'not_contains', label: 'No contiene' },
  { value: 'exists', label: 'Existe' },
  { value: 'not_exists', label: 'No existe' },
  { value: 'empty', label: 'Está vacío' },
  { value: 'not_empty', label: 'No está vacío' },
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
  allNodes = [],
  allEdges = [],
}: EdgeConfigModalProps) {
  const [label, setLabel] = useState(currentConfig?.label || '');
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState({ x: 0, y: 0 });
  const [activeConditionId, setActiveConditionId] = useState<string | null>(null);
  const [nodeSearchDepth, setNodeSearchDepth] = useState<'direct' | 'all'>('direct');

  // Calcular availableNodes dinámicamente basándose en nodeSearchDepth
  const computedAvailableNodes = React.useMemo(() => {
    if (!allNodes.length || !allEdges.length || !edgeId) return availableNodes;
    
    const currentEdge = allEdges.find((e: any) => e.id === edgeId);
    if (!currentEdge) return availableNodes;
    
    const sourceNode = allNodes.find((n: any) => n.id === currentEdge.source);
    if (!sourceNode || sourceNode.type !== 'router') return availableNodes;
    
    const upstreamNodes = new Set<string>();
    
    if (nodeSearchDepth === 'direct') {
      // Solo nodos directamente conectados al Router
      const directIncomingEdges = allEdges.filter((e: any) => e.target === sourceNode.id);
      for (const incomingEdge of directIncomingEdges) {
        const directUpstreamNode = allNodes.find((n: any) => n.id === incomingEdge.source);
        if (directUpstreamNode && directUpstreamNode.type !== 'router') {
          upstreamNodes.add(directUpstreamNode.id);
        }
      }
    } else {
      // Todos los nodos upstream (recursivo con detección de ciclos)
      const visited = new Set<string>();
      const findUpstreamNodes = (nodeId: string) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        
        const incomingEdges = allEdges.filter((e: any) => e.target === nodeId);
        for (const incomingEdge of incomingEdges) {
          const upstreamNode = allNodes.find((n: any) => n.id === incomingEdge.source);
          if (!upstreamNode || visited.has(upstreamNode.id)) continue;
          
          if (upstreamNode.type !== 'router') {
            upstreamNodes.add(upstreamNode.id);
          }
          findUpstreamNodes(upstreamNode.id);
        }
      };
      findUpstreamNodes(sourceNode.id);
    }
    
    return Array.from(upstreamNodes)
      .map(nodeId => {
        const node = allNodes.find((n: any) => n.id === nodeId);
        return node ? { id: node.id, label: node.data.label, type: node.type || 'default' } : null;
      })
      .filter((n): n is { id: string; label: string; type: string } => n !== null);
  }, [allNodes, allEdges, edgeId, nodeSearchDepth, availableNodes]);

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

  const handleVariableSelect = (variable: string, label?: string) => {
    if (activeConditionId) {
      setConditions(conditions.map(c => 
        c.id === activeConditionId 
          ? { ...c, variable, variableLabel: label || variable } 
          : c
      ));
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
                {isRouter ? 'Configurar Condición de Ruta' : 'Configurar filtro'}
              </h2>
              <p className={styles.modalSubtitle}>
                {isRouter 
                  ? 'Define la condición para esta ruta'
                  : 'Solo continuar si se cumple la condición'
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
            <div className={styles.labelRow}>
              <label className={styles.label}>
                Etiqueta
                <span className={styles.optional}>(opcional, máx 120 caracteres)</span>
              </label>
              {isRouter && (
                <div 
                  className={styles.scopeToggleContainer}
                  title={nodeSearchDepth === 'direct' 
                    ? 'Solo nodos directos - Click para mostrar todos los nodos anteriores'
                    : 'Todos los nodos anteriores - Click para mostrar solo nodos directos'}
                >
                  <button
                    type="button"
                    onClick={() => setNodeSearchDepth(nodeSearchDepth === 'direct' ? 'all' : 'direct')}
                    className={`${styles.scopeToggle} ${nodeSearchDepth === 'all' ? styles.scopeToggleActive : ''}`}
                  >
                    <div className={styles.toggleTrack}>
                      <div className={`${styles.toggleThumb} ${nodeSearchDepth === 'all' ? styles.toggleThumbActive : ''}`}>
                        {nodeSearchDepth === 'direct' ? (
                          <span className={styles.toggleNumber}>1</span>
                        ) : (
                          <Globe size={12} />
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value.slice(0, 120))}
              placeholder={isRouter ? "Nombre de la ruta" : "Nombre del filtro"}
              className={styles.input}
              maxLength={120}
            />
            <div className={styles.charCount}>{label.length}/120</div>
          </div>

          {/* Conditions List */}
          <div className={styles.formGroup}>
            <div className={styles.conditionsHeader}>
              <label className={styles.label}>Condiciones</label>
              <button
                type="button"
                onClick={addCondition}
                className={styles.addConditionBtn}
              >
                <Plus size={16} />
                Agregar Condición
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
                        {cond.variableLabel || cond.variable || 'Seleccionar variable...'}
                      </button>
                    </div>

                    {/* Operator */}
                    <div className={styles.conditionField}>
                      <label className={styles.smallLabel}>Operador</label>
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
                        <label className={styles.smallLabel}>Valor</label>
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
                      title="Eliminar condición"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className={styles.preview}>
              <div className={styles.previewLabel}>Vista previa:</div>
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
            Cancelar
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
            Guardar
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
        availableNodes={computedAvailableNodes}
        globalVariables={globalVariables}
      />
    </div>
  );
}
