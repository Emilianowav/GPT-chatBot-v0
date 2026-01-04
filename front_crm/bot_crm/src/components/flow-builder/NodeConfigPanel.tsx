import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Node } from 'reactflow';
import styles from './NodeConfigPanel.module.css';

interface NodeConfigPanelProps {
  node: Node;
  onUpdate: (config: any) => void;
  onClose: () => void;
}

export default function NodeConfigPanel({ node, onUpdate, onClose }: NodeConfigPanelProps) {
  const [config, setConfig] = useState(node.data.config || {});

  useEffect(() => {
    setConfig(node.data.config || {});
  }, [node]);

  const handleSave = () => {
    onUpdate(config);
    onClose();
  };

  const updateField = (field: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Configurar Nodo</h3>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className={styles.content}>
        {/* Nombre del nodo */}
        <div className={styles.field}>
          <label className={styles.label}>Nombre del Nodo</label>
          <input
            type="text"
            className={styles.input}
            value={config.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Ej: Mensaje de bienvenida"
          />
        </div>

        {/* Tipo de nodo */}
        <div className={styles.field}>
          <label className={styles.label}>Tipo</label>
          <select
            className={styles.select}
            value={config.type || 'message'}
            onChange={(e) => updateField('type', e.target.value)}
          >
            <option value="message">Mensaje</option>
            <option value="question">Pregunta</option>
            <option value="condition">Condición</option>
            <option value="api">API Call</option>
            <option value="webhook">Webhook</option>
            <option value="email">Email</option>
            <option value="delay">Espera</option>
            <option value="validation">Validación</option>
          </select>
        </div>

        {/* Mensaje */}
        {(config.type === 'message' || config.type === 'question') && (
          <div className={styles.field}>
            <label className={styles.label}>Mensaje</label>
            <textarea
              className={styles.textarea}
              value={config.message || ''}
              onChange={(e) => updateField('message', e.target.value)}
              placeholder="Escribe el mensaje que se enviará al usuario..."
              rows={4}
            />
          </div>
        )}

        {/* Variable (para preguntas) */}
        {config.type === 'question' && (
          <div className={styles.field}>
            <label className={styles.label}>Variable</label>
            <input
              type="text"
              className={styles.input}
              value={config.variable || ''}
              onChange={(e) => updateField('variable', e.target.value)}
              placeholder="Ej: nombre_usuario"
            />
            <div className={styles.hint}>
              Nombre de la variable donde se guardará la respuesta
            </div>
          </div>
        )}

        {/* Validación */}
        {config.type === 'question' && (
          <div className={styles.field}>
            <label className={styles.label}>Validación</label>
            <select
              className={styles.select}
              value={config.validation?.type || 'none'}
              onChange={(e) => updateField('validation', { 
                ...config.validation, 
                type: e.target.value 
              })}
            >
              <option value="none">Sin validación</option>
              <option value="text">Texto</option>
              <option value="number">Número</option>
              <option value="email">Email</option>
              <option value="phone">Teléfono</option>
              <option value="option">Opción múltiple</option>
            </select>
          </div>
        )}

        {/* Opciones (para validación de opciones) */}
        {config.type === 'question' && config.validation?.type === 'option' && (
          <div className={styles.field}>
            <label className={styles.label}>Opciones</label>
            <textarea
              className={styles.textarea}
              value={config.validation?.options?.join('\n') || ''}
              onChange={(e) => updateField('validation', {
                ...config.validation,
                options: e.target.value.split('\n').filter((o: string) => o.trim())
              })}
              placeholder="Una opción por línea&#10;Ej:&#10;1&#10;2&#10;3"
              rows={4}
            />
          </div>
        )}

        {/* URL de API */}
        {config.type === 'api' && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>URL del Endpoint</label>
              <input
                type="text"
                className={styles.input}
                value={config.apiUrl || ''}
                onChange={(e) => updateField('apiUrl', e.target.value)}
                placeholder="https://api.example.com/endpoint"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Método</label>
              <select
                className={styles.select}
                value={config.apiMethod || 'GET'}
                onChange={(e) => updateField('apiMethod', e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </>
        )}

        {/* Condición */}
        {config.type === 'condition' && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>Variable a evaluar</label>
              <input
                type="text"
                className={styles.input}
                value={config.conditionVariable || ''}
                onChange={(e) => updateField('conditionVariable', e.target.value)}
                placeholder="Ej: edad"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Operador</label>
              <select
                className={styles.select}
                value={config.conditionOperator || 'equals'}
                onChange={(e) => updateField('conditionOperator', e.target.value)}
              >
                <option value="equals">Igual a</option>
                <option value="not_equals">Diferente de</option>
                <option value="greater">Mayor que</option>
                <option value="less">Menor que</option>
                <option value="contains">Contiene</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Valor</label>
              <input
                type="text"
                className={styles.input}
                value={config.conditionValue || ''}
                onChange={(e) => updateField('conditionValue', e.target.value)}
                placeholder="Valor a comparar"
              />
            </div>
          </>
        )}
      </div>

      <div className={styles.footer}>
        <button className={styles.btnSecondary} onClick={onClose}>
          Cancelar
        </button>
        <button className={styles.btnPrimary} onClick={handleSave}>
          <Save size={18} />
          Guardar
        </button>
      </div>
    </div>
  );
}
