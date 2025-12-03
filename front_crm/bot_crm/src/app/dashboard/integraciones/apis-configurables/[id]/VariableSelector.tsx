import { useState } from 'react';
import styles from './WorkflowManager.module.css';

interface Variable {
  nombre: string;
  tipo: 'recopilar' | 'input' | 'confirmacion';
  valor?: any;
}

interface VariableSelectorProps {
  variables: Variable[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowEmpty?: boolean;
}

export default function VariableSelector({
  variables,
  value,
  onChange,
  placeholder = 'Seleccionar variable',
  allowEmpty = false
}: VariableSelectorProps) {
  const [showPreview, setShowPreview] = useState(false);

  const selectedVariable = variables.find(v => v.nombre === value);

  return (
    <div className={styles.variableSelector}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.select}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      >
        {allowEmpty && <option value="">{placeholder}</option>}
        {!allowEmpty && !value && <option value="">{placeholder}</option>}
        
        {variables.map((variable) => (
          <option key={variable.nombre} value={variable.nombre}>
            {variable.nombre}
            {variable.tipo === 'recopilar' && ' 📝'}
            {variable.tipo === 'input' && ' ✍️'}
            {variable.tipo === 'confirmacion' && ' ✓'}
          </option>
        ))}
      </select>

      {showPreview && selectedVariable && selectedVariable.valor && (
        <div className={styles.variablePreview}>
          <strong>Preview:</strong> {JSON.stringify(selectedVariable.valor)}
        </div>
      )}
    </div>
  );
}
