'use client';

// 🎯 Configurador de Triggers para Workflows

import { useState } from 'react';
import styles from './WorkflowManager.module.css';

type TriggerType = 'keyword' | 'primer_mensaje' | 'manual';

interface WorkflowTrigger {
  tipo: TriggerType;
  keywords?: string[];
  primeraRespuesta?: boolean;
}

interface Props {
  trigger: WorkflowTrigger;
  onChange: (trigger: WorkflowTrigger) => void;
}

export default function WorkflowTriggerConfig({ trigger, onChange }: Props) {
  const [newKeyword, setNewKeyword] = useState('');

  const handleTypeChange = (tipo: TriggerType) => {
    onChange({
      ...trigger,
      tipo,
      keywords: tipo === 'keyword' ? (trigger.keywords || []) : undefined,
      primeraRespuesta: tipo === 'primer_mensaje' ? true : false
    });
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    const keywords = trigger.keywords || [];
    onChange({
      ...trigger,
      keywords: [...keywords, newKeyword.trim().toLowerCase()]
    });
    setNewKeyword('');
  };

  const handleRemoveKeyword = (index: number) => {
    const keywords = trigger.keywords || [];
    onChange({
      ...trigger,
      keywords: keywords.filter((_, i) => i !== index)
    });
  };

  return (
    <div className={styles.triggerConfig}>
      <h4>🎯 Activación del Workflow</h4>
      <p className={styles.helpText}>
        Define cuándo se debe activar este workflow
      </p>

      <div className={styles.formGroup}>
        <label>Tipo de Activación</label>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              checked={trigger.tipo === 'keyword'}
              onChange={() => handleTypeChange('keyword')}
            />
            <div>
              <strong>Por Palabras Clave</strong>
              <p>Se activa cuando el usuario escribe ciertas palabras</p>
            </div>
          </label>

          <label className={styles.radioLabel}>
            <input
              type="radio"
              checked={trigger.tipo === 'primer_mensaje'}
              onChange={() => handleTypeChange('primer_mensaje')}
            />
            <div>
              <strong>Primer Mensaje</strong>
              <p>Se activa automáticamente en el primer mensaje del usuario</p>
            </div>
          </label>

          <label className={styles.radioLabel}>
            <input
              type="radio"
              checked={trigger.tipo === 'manual'}
              onChange={() => handleTypeChange('manual')}
            />
            <div>
              <strong>Manual</strong>
              <p>Se activa solo manualmente desde el dashboard</p>
            </div>
          </label>
        </div>
      </div>

      {/* Keywords */}
      {trigger.tipo === 'keyword' && (
        <div className={styles.formGroup}>
          <label>Palabras Clave</label>
          <p className={styles.helpText}>
            El workflow se activará cuando el usuario escriba alguna de estas palabras
          </p>
          <div className={styles.keywordsList}>
            {(trigger.keywords || []).map((keyword, i) => (
              <div key={i} className={styles.keywordItem}>
                <span>{keyword}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(i)}
                  className={styles.removeButton}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className={styles.addKeyword}>
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="buscar, stock, disponibilidad..."
              className={styles.input}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
            />
            <button
              type="button"
              onClick={handleAddKeyword}
              className={styles.addButton}
            >
              Agregar
            </button>
          </div>
        </div>
      )}

      {/* Primera Respuesta */}
      {trigger.tipo === 'primer_mensaje' && (
        <div className={styles.infoBox}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <div>
            <strong>Workflow de Bienvenida</strong>
            <p>Este workflow se ejecutará automáticamente cuando un usuario nuevo envíe su primer mensaje.</p>
          </div>
        </div>
      )}

      {/* Manual */}
      {trigger.tipo === 'manual' && (
        <div className={styles.infoBox}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <div>
            <strong>Activación Manual</strong>
            <p>Este workflow solo se ejecutará cuando lo actives manualmente desde el dashboard o mediante API.</p>
          </div>
        </div>
      )}
    </div>
  );
}
