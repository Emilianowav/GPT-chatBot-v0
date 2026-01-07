import React, { useState, useRef, useEffect } from 'react';
import styles from './VariableSelector.module.css';

interface Variable {
  label: string;
  value: string;
  category: 'node' | 'global' | 'trigger';
  nodeId?: string;
  description?: string;
}

interface VariableSelectorProps {
  nodes: any[];
  currentNodeId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

const VariableSelector: React.FC<VariableSelectorProps> = ({
  nodes,
  currentNodeId,
  value,
  onChange,
  placeholder = 'Escribe o selecciona una variable...',
  multiline = false
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Construir lista de variables disponibles
  const getAvailableVariables = (): Variable[] => {
    const variables: Variable[] = [];
    
    // 1. Variables del trigger (nodo 1)
    const triggerNode = nodes.find(n => n.id === '1' || n.data?.category === 'trigger');
    if (triggerNode) {
      variables.push(
        { label: 'Teléfono del usuario', value: '1.from', category: 'trigger', description: 'Número de WhatsApp del usuario' },
        { label: 'Mensaje del usuario', value: '1.message', category: 'trigger', description: 'Último mensaje enviado' },
        { label: 'Nombre del usuario', value: '1.profileName', category: 'trigger', description: 'Nombre de perfil de WhatsApp' }
      );
    }

    // 2. Variables de nodos anteriores
    nodes.forEach(node => {
      // Solo nodos que están ANTES del nodo actual
      if (isBeforeCurrentNode(node.id)) {
        if (node.type === 'gpt') {
          variables.push({
            label: `${node.data.label} - Respuesta`,
            value: `${node.id}.respuesta_gpt`,
            category: 'node',
            nodeId: node.id,
            description: 'Respuesta generada por el GPT'
          });

          // Variables recopiladas por el GPT
          const variablesRecopilar = node.data?.config?.variablesRecopilar || [];
          variablesRecopilar.forEach((v: any) => {
            variables.push({
              label: `${node.data.label} - ${v.nombre}`,
              value: `${node.id}.${v.nombre}`,
              category: 'node',
              nodeId: node.id,
              description: v.descripcion
            });
          });
        }
      }
    });

    // 3. Variables globales (recopiladas por GPT)
    const gptNodes = nodes.filter(n => n.type === 'gpt' && isBeforeCurrentNode(n.id));
    gptNodes.forEach(node => {
      const variablesRecopilar = node.data?.config?.variablesRecopilar || [];
      variablesRecopilar.forEach((v: any) => {
        variables.push({
          label: `Global - ${v.nombre}`,
          value: `global.${v.nombre}`,
          category: 'global',
          description: v.descripcion
        });
      });
    });

    return variables;
  };

  // Verificar si un nodo está antes del nodo actual
  const isBeforeCurrentNode = (nodeId: string): boolean => {
    // TODO: Implementar lógica de orden de nodos basado en edges
    // Por ahora, simplemente excluir el nodo actual
    return nodeId !== currentNodeId;
  };

  // Insertar variable en la posición del cursor
  const insertVariable = (variableValue: string) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const textBefore = value.substring(0, start);
    const textAfter = value.substring(end);
    
    // Insertar variable SIN {{}} - se parsean automáticamente
    const newValue = `${textBefore}{{${variableValue}}}${textAfter}`;
    
    onChange(newValue);
    setShowDropdown(false);

    // Restaurar foco y posición del cursor
    setTimeout(() => {
      input.focus();
      const newCursorPos = start + variableValue.length + 4; // +4 por {{}}
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Detectar @ para mostrar dropdown
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Mostrar dropdown si escribe @
    const cursorPos = e.target.selectionStart || 0;
    const charBeforeCursor = newValue[cursorPos - 1];
    
    if (charBeforeCursor === '@') {
      setShowDropdown(true);
      setCursorPosition(cursorPos);
    }
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableVariables = getAvailableVariables();

  // Agrupar variables por categoría
  const groupedVariables = {
    trigger: availableVariables.filter(v => v.category === 'trigger'),
    global: availableVariables.filter(v => v.category === 'global'),
    node: availableVariables.filter(v => v.category === 'node')
  };

  return (
    <div className={styles.variableSelector}>
      <div className={styles.inputWrapper}>
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={styles.textarea}
            rows={4}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={styles.input}
          />
        )}
        
        <button
          type="button"
          className={styles.variableButton}
          onClick={() => setShowDropdown(!showDropdown)}
          title="Insertar variable"
        >
          @
        </button>
      </div>

      {showDropdown && (
        <div ref={dropdownRef} className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>Variables Disponibles</span>
            <button onClick={() => setShowDropdown(false)} className={styles.closeButton}>×</button>
          </div>

          {groupedVariables.trigger.length > 0 && (
            <div className={styles.variableGroup}>
              <div className={styles.groupTitle}>📱 Trigger (WhatsApp)</div>
              {groupedVariables.trigger.map((variable, index) => (
                <div
                  key={index}
                  className={styles.variableItem}
                  onClick={() => insertVariable(variable.value)}
                >
                  <div className={styles.variableLabel}>{variable.label}</div>
                  {variable.description && (
                    <div className={styles.variableDescription}>{variable.description}</div>
                  )}
                  <div className={styles.variableValue}>{`{{${variable.value}}}`}</div>
                </div>
              ))}
            </div>
          )}

          {groupedVariables.global.length > 0 && (
            <div className={styles.variableGroup}>
              <div className={styles.groupTitle}>🌐 Variables Globales</div>
              {groupedVariables.global.map((variable, index) => (
                <div
                  key={index}
                  className={styles.variableItem}
                  onClick={() => insertVariable(variable.value)}
                >
                  <div className={styles.variableLabel}>{variable.label}</div>
                  {variable.description && (
                    <div className={styles.variableDescription}>{variable.description}</div>
                  )}
                  <div className={styles.variableValue}>{`{{${variable.value}}}`}</div>
                </div>
              ))}
            </div>
          )}

          {groupedVariables.node.length > 0 && (
            <div className={styles.variableGroup}>
              <div className={styles.groupTitle}>🔗 Nodos Anteriores</div>
              {groupedVariables.node.map((variable, index) => (
                <div
                  key={index}
                  className={styles.variableItem}
                  onClick={() => insertVariable(variable.value)}
                >
                  <div className={styles.variableLabel}>{variable.label}</div>
                  {variable.description && (
                    <div className={styles.variableDescription}>{variable.description}</div>
                  )}
                  <div className={styles.variableValue}>{`{{${variable.value}}}`}</div>
                </div>
              ))}
            </div>
          )}

          {availableVariables.length === 0 && (
            <div className={styles.emptyState}>
              No hay variables disponibles
            </div>
          )}

          <div className={styles.dropdownFooter}>
            <small>💡 Tip: Escribe @ para abrir este menú</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariableSelector;
