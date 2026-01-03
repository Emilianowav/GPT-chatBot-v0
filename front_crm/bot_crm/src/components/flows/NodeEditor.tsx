'use client';

import { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, AlertCircle } from 'lucide-react';
import styles from './NodeEditor.module.css';

interface FlowNode {
  _id?: string;
  empresaId?: string;
  flowId?: string;
  id: string;
  type: string;
  name: string;
  message?: string;
  options?: Array<{ text: string; value?: string; next?: string; url?: string }>;
  validation?: {
    type: string;
    min?: number;
    max?: number;
    pattern?: string;
    errorMessage?: string;
  };
  conditions?: Array<{
    if?: string;
    else?: string;
    next?: string;
    operator?: string;
    value?: any;
  }>;
  action?: {
    type: string;
    config?: any;
    onSuccess?: string;
    onError?: string;
  };
  next?: string;
  activo: boolean;
}

interface NodeEditorProps {
  node: FlowNode | null;
  nodes: FlowNode[];
  onSave: (node: FlowNode) => void;
  onCancel: () => void;
}

const nodeTypes = [
  { value: 'menu', label: 'Menú', description: 'Opciones múltiples' },
  { value: 'input', label: 'Input', description: 'Captura de datos' },
  { value: 'message', label: 'Mensaje', description: 'Mensaje simple' },
  { value: 'condition', label: 'Condición', description: 'Lógica condicional' },
  { value: 'action', label: 'Acción', description: 'Ejecutar acción' },
  { value: 'api_call', label: 'API Call', description: 'Llamada a API' },
  { value: 'gpt', label: 'GPT', description: 'Respuesta con IA' }
];

const validationTypes = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'date', label: 'Fecha' },
  { value: 'regex', label: 'Regex' }
];

const actionTypes = [
  { value: 'create_payment_link', label: 'Generar Link de Pago' },
  { value: 'api_call', label: 'Llamar API' },
  { value: 'save_data', label: 'Guardar Datos' },
  { value: 'send_email', label: 'Enviar Email' },
  { value: 'gpt_response', label: 'Respuesta GPT' }
];

const conditionOperators = [
  { value: 'eq', label: 'Igual (=)' },
  { value: 'neq', label: 'Diferente (≠)' },
  { value: 'gt', label: 'Mayor (>)' },
  { value: 'lt', label: 'Menor (<)' },
  { value: 'gte', label: 'Mayor o igual (≥)' },
  { value: 'lte', label: 'Menor o igual (≤)' },
  { value: 'contains', label: 'Contiene' },
  { value: 'exists', label: 'Existe' }
];

export default function NodeEditor({ node, nodes, onSave, onCancel }: NodeEditorProps) {
  const [nodeData, setNodeData] = useState<FlowNode>(node || {
    id: '',
    type: 'menu',
    name: '',
    message: '',
    activo: true
  });

  useEffect(() => {
    if (node) {
      setNodeData(node);
    }
  }, [node]);

  const handleAddOption = () => {
    const options = nodeData.options || [];
    setNodeData({
      ...nodeData,
      options: [...options, { text: '', next: '' }]
    });
  };

  const handleRemoveOption = (index: number) => {
    const options = [...(nodeData.options || [])];
    options.splice(index, 1);
    setNodeData({ ...nodeData, options });
  };

  const handleUpdateOption = (index: number, field: string, value: string) => {
    const options = [...(nodeData.options || [])];
    options[index] = { ...options[index], [field]: value };
    setNodeData({ ...nodeData, options });
  };

  const handleAddCondition = () => {
    const conditions = nodeData.conditions || [];
    setNodeData({
      ...nodeData,
      conditions: [...conditions, { if: '', operator: 'eq', value: '', next: '' }]
    });
  };

  const handleRemoveCondition = (index: number) => {
    const conditions = [...(nodeData.conditions || [])];
    conditions.splice(index, 1);
    setNodeData({ ...nodeData, conditions });
  };

  const handleUpdateCondition = (index: number, field: string, value: any) => {
    const conditions = [...(nodeData.conditions || [])];
    conditions[index] = { ...conditions[index], [field]: value };
    setNodeData({ ...nodeData, conditions });
  };

  const handleSave = () => {
    if (!nodeData.id || !nodeData.name) {
      alert('Por favor completa el ID y el nombre del nodo');
      return;
    }
    onSave(nodeData);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {node ? 'Editar Nodo' : 'Nuevo Nodo'}
        </h3>
        <div className={styles.headerActions}>
          <button onClick={handleSave} className={styles.saveButton}>
            <Save style={{ width: '16px', height: '16px' }} />
            Guardar
          </button>
          <button onClick={onCancel} className={styles.cancelButton}>
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
      </div>

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            ID del Nodo <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            value={nodeData.id}
            onChange={(e) => setNodeData({ ...nodeData, id: e.target.value })}
            className={styles.input}
            placeholder="Ej: main_menu"
          />
          <p className={styles.helpText}>Identificador único del nodo (sin espacios)</p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Nombre del Nodo <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            value={nodeData.name}
            onChange={(e) => setNodeData({ ...nodeData, name: e.target.value })}
            className={styles.input}
            placeholder="Ej: Menú Principal"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Tipo de Nodo <span className={styles.required}>*</span>
          </label>
          <select
            value={nodeData.type}
            onChange={(e) => setNodeData({ ...nodeData, type: e.target.value })}
            className={styles.select}
          >
            {nodeTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label} - {type.description}
              </option>
            ))}
          </select>
        </div>

        {['menu', 'input', 'message', 'gpt'].includes(nodeData.type) && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Mensaje</label>
            <textarea
              value={nodeData.message || ''}
              onChange={(e) => setNodeData({ ...nodeData, message: e.target.value })}
              className={styles.textarea}
              placeholder="Escribe el mensaje que verá el usuario..."
            />
            <p className={styles.helpText}>
              Puedes usar variables con {'{{variable}}'} 
            </p>
          </div>
        )}

        {nodeData.type === 'menu' && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Opciones del Menú</div>
            <div className={styles.optionsList}>
              {(nodeData.options || []).map((option, index) => (
                <div key={index} className={styles.optionItem}>
                  <div className={styles.optionInputs}>
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleUpdateOption(index, 'text', e.target.value)}
                      className={styles.input}
                      placeholder="Texto de la opción"
                    />
                    <input
                      type="text"
                      value={option.value || ''}
                      onChange={(e) => handleUpdateOption(index, 'value', e.target.value)}
                      className={styles.input}
                      placeholder="Valor (opcional)"
                    />
                    <select
                      value={option.next || ''}
                      onChange={(e) => handleUpdateOption(index, 'next', e.target.value)}
                      className={styles.select}
                    >
                      <option value="">Siguiente nodo...</option>
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleRemoveOption(index)}
                    className={styles.deleteButton}
                  >
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={handleAddOption} className={styles.addButton}>
              <Plus style={{ width: '16px', height: '16px' }} />
              Agregar Opción
            </button>
          </div>
        )}

        {nodeData.type === 'input' && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Validación</div>
            <div className={styles.formGroup}>
              <select
                value={nodeData.validation?.type || 'text'}
                onChange={(e) => setNodeData({
                  ...nodeData,
                  validation: { ...nodeData.validation, type: e.target.value }
                })}
                className={styles.select}
              >
                {validationTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {nodeData.type === 'condition' && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Condiciones</div>
            <div className={styles.optionsList}>
              {(nodeData.conditions || []).map((condition, index) => (
                <div key={index} className={styles.optionItem}>
                  <div className={styles.optionInputs}>
                    <input
                      type="text"
                      value={condition.if || ''}
                      onChange={(e) => handleUpdateCondition(index, 'if', e.target.value)}
                      className={styles.input}
                      placeholder="Variable"
                    />
                    <select
                      value={condition.operator || 'eq'}
                      onChange={(e) => handleUpdateCondition(index, 'operator', e.target.value)}
                      className={styles.select}
                    >
                      {conditionOperators.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={condition.value || ''}
                      onChange={(e) => handleUpdateCondition(index, 'value', e.target.value)}
                      className={styles.input}
                      placeholder="Valor"
                    />
                    <select
                      value={condition.next || ''}
                      onChange={(e) => handleUpdateCondition(index, 'next', e.target.value)}
                      className={styles.select}
                    >
                      <option value="">Si cumple...</option>
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleRemoveCondition(index)}
                    className={styles.deleteButton}
                  >
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={handleAddCondition} className={styles.addButton}>
              <Plus style={{ width: '16px', height: '16px' }} />
              Agregar Condición
            </button>
          </div>
        )}

        {nodeData.type === 'action' && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Configuración de Acción</div>
            <div className={styles.formGroup}>
              <select
                value={nodeData.action?.type || ''}
                onChange={(e) => setNodeData({
                  ...nodeData,
                  action: { ...nodeData.action, type: e.target.value }
                })}
                className={styles.select}
              >
                <option value="">Seleccionar acción...</option>
                {actionTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {!['menu', 'condition', 'action'].includes(nodeData.type) && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Siguiente Nodo</label>
            <select
              value={nodeData.next || ''}
              onChange={(e) => setNodeData({ ...nodeData, next: e.target.value })}
              className={styles.select}
            >
              <option value="">Seleccionar nodo...</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.section}>
          <div className={styles.checkbox}>
            <input
              type="checkbox"
              checked={nodeData.activo}
              onChange={(e) => setNodeData({ ...nodeData, activo: e.target.checked })}
              className={styles.checkboxInput}
            />
            <label className={styles.checkboxLabel}>Nodo Activo</label>
          </div>
        </div>

        <div className={styles.alert}>
          <AlertCircle style={{ width: '18px', height: '18px' }} className={styles.alertIcon} />
          <p className={styles.alertText}>
            Usa variables con {'{{nombreVariable}}'} en los mensajes para personalizar las respuestas.
          </p>
        </div>
      </div>
    </div>
  );
}
