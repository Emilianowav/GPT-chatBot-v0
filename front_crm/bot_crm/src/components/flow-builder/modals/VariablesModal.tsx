'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Copy, Check } from 'lucide-react';
import styles from './VariablesModal.module.css';

interface Variable {
  nombre: string;
  valor: string;
  tipo: 'string' | 'number' | 'boolean' | 'object';
}

interface VariablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  variables: Record<string, any>;
  onSave: (variables: Record<string, any>) => void;
}

export default function VariablesModal({
  isOpen,
  onClose,
  variables,
  onSave,
}: VariablesModalProps) {
  const [localVariables, setLocalVariables] = useState<Variable[]>([]);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const vars = Object.entries(variables || {}).map(([nombre, valor]) => ({
        nombre,
        valor: typeof valor === 'object' ? JSON.stringify(valor, null, 2) : String(valor),
        tipo: (typeof valor === 'object' && valor !== null ? 'object' : typeof valor) as Variable['tipo'],
      }));
      setLocalVariables(vars);
      console.log('📊 Variables cargadas en modal:', vars);
    }
  }, [isOpen, variables]);

  const handleAddVariable = () => {
    setLocalVariables([
      ...localVariables,
      { nombre: '', valor: '', tipo: 'string' },
    ]);
  };

  const handleUpdateVariable = (index: number, field: keyof Variable, value: string) => {
    const updated = [...localVariables];
    updated[index] = { ...updated[index], [field]: value };
    setLocalVariables(updated);
  };

  const handleDeleteVariable = (index: number) => {
    setLocalVariables(localVariables.filter((_, i) => i !== index));
  };

  const handleCopyVariable = (nombre: string) => {
    navigator.clipboard.writeText(`{{${nombre}}}`);
    setCopiedVar(nombre);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const handleSave = () => {
    const varsObject: Record<string, any> = {};
    localVariables.forEach((v) => {
      if (v.nombre) {
        try {
          if (v.tipo === 'number') {
            varsObject[v.nombre] = parseFloat(v.valor);
          } else if (v.tipo === 'boolean') {
            varsObject[v.nombre] = v.valor === 'true';
          } else if (v.tipo === 'object') {
            varsObject[v.nombre] = JSON.parse(v.valor);
          } else {
            varsObject[v.nombre] = v.valor;
          }
        } catch (e) {
          varsObject[v.nombre] = v.valor;
        }
      }
    });
    onSave(varsObject);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2>Variables Globales</h2>
            <p>Define variables que estarán disponibles en todo el flujo</p>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.info}>
            <p>
              💡 Las variables globales se pueden usar en cualquier nodo con el formato{' '}
              <code>{'{{'}</code>nombre<code>{'}}'}</code>
            </p>
          </div>

          <div className={styles.variablesList}>
            {localVariables.map((variable, index) => (
              <div key={index} className={styles.variableRow}>
                <input
                  type="text"
                  placeholder="nombre_variable"
                  value={variable.nombre}
                  onChange={(e) => handleUpdateVariable(index, 'nombre', e.target.value)}
                  className={styles.nameInput}
                />

                <select
                  value={variable.tipo}
                  onChange={(e) => handleUpdateVariable(index, 'tipo', e.target.value)}
                  className={styles.typeSelect}
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="object">Object</option>
                </select>

                <input
                  type="text"
                  placeholder="valor"
                  value={variable.valor}
                  onChange={(e) => handleUpdateVariable(index, 'valor', e.target.value)}
                  className={styles.valueInput}
                />

                <button
                  className={styles.copyButton}
                  onClick={() => handleCopyVariable(variable.nombre)}
                  title="Copiar sintaxis"
                  disabled={!variable.nombre}
                >
                  {copiedVar === variable.nombre ? (
                    <Check size={16} className={styles.checkIcon} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>

                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteVariable(index)}
                  title="Eliminar variable"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button className={styles.addButton} onClick={handleAddVariable}>
            <Plus size={16} />
            Agregar Variable
          </button>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.saveButton} onClick={handleSave}>
            Guardar Variables
          </button>
        </div>
      </div>
    </div>
  );
}
