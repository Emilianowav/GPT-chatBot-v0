import { useState } from 'react';
import PathBuilder from './PathBuilder';
import styles from './WorkflowManager.module.css';

interface FieldConfig {
  path: string;
  alias: string;
  helper?: 'stock_por_sucursal' | 'categorias' | 'precio' | 'link';
}

interface ResponseFieldSelectorProps {
  fields: FieldConfig[];
  onChange: (fields: FieldConfig[]) => void;
  sampleResponse?: any;
}

const HELPERS = {
  stock_por_sucursal: {
    name: '📊 Stock por Sucursal',
    template: `{{#stock.sucursales}}
  • {{name}}: {{quantity}} unidades
{{/stock.sucursales}}`,
    paths: ['stock.sucursales[].name', 'stock.sucursales[].quantity']
  },
  categorias: {
    name: '🏷️ Listar Categorías',
    template: '{{#categories}}{{name}}{{^last}}, {{/last}}{{/categories}}',
    paths: ['categories[].name']
  },
  precio: {
    name: '💰 Formato de Precio',
    template: '${{price}}',
    paths: ['price']
  },
  link: {
    name: '🔗 Link de Compra',
    template: '🔗 Comprar: {{permalink}}',
    paths: ['permalink']
  }
};

export default function ResponseFieldSelector({
  fields,
  onChange,
  sampleResponse
}: ResponseFieldSelectorProps) {
  const [showHelpers, setShowHelpers] = useState(false);

  const handleAddField = () => {
    onChange([...fields, { path: '', alias: '' }]);
  };

  const handleUpdateField = (index: number, updates: Partial<FieldConfig>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onChange(newFields);
  };

  const handleRemoveField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const handleApplyHelper = (helperKey: keyof typeof HELPERS) => {
    const helper = HELPERS[helperKey];
    const newFields = helper.paths.map(path => ({
      path,
      alias: path.split('.').pop()?.replace('[]', '') || path,
      helper: helperKey
    }));
    onChange([...fields, ...newFields]);
    setShowHelpers(false);
  };

  // Extraer campos simples del sample response
  const getSimpleFields = (obj: any, prefix = ''): string[] => {
    if (!obj || typeof obj !== 'object') return [];
    
    const fields: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      
      if (Array.isArray(value)) {
        fields.push(`${path}[]`);
        if (value.length > 0 && typeof value[0] === 'object') {
          const subFields = getSimpleFields(value[0], `${path}[]`);
          fields.push(...subFields);
        }
      } else if (value && typeof value === 'object') {
        fields.push(path);
        const subFields = getSimpleFields(value, path);
        fields.push(...subFields);
      } else {
        fields.push(path);
      }
    }
    
    return fields;
  };

  const availableFields = sampleResponse ? getSimpleFields(sampleResponse) : [];

  return (
    <div className={styles.responseFieldSelector}>
      <div className={styles.selectorHeader}>
        <label>Campos a Mostrar en Resultado</label>
        <button
          type="button"
          onClick={() => setShowHelpers(!showHelpers)}
          className={styles.helperButton}
        >
          ✨ Helpers Rápidos
        </button>
      </div>

      {showHelpers && (
        <div className={styles.helpersPanel}>
          <h4>Helpers Rápidos</h4>
          <p>Inserta configuraciones comunes automáticamente</p>
          <div className={styles.helpersList}>
            {Object.entries(HELPERS).map(([key, helper]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleApplyHelper(key as keyof typeof HELPERS)}
                className={styles.helperItem}
              >
                {helper.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.fieldsList}>
        {fields.map((field, index) => (
          <div key={index} className={styles.fieldItem}>
            <div className={styles.fieldConfig}>
              <div className={styles.fieldPath}>
                <label>Path del Campo</label>
                {availableFields.length > 0 ? (
                  <select
                    value={field.path}
                    onChange={(e) => handleUpdateField(index, { path: e.target.value })}
                    className={styles.select}
                  >
                    <option value="">Seleccionar campo</option>
                    {availableFields.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                ) : (
                  <PathBuilder
                    value={field.path}
                    onChange={(path) => handleUpdateField(index, { path })}
                    sampleData={sampleResponse}
                  />
                )}
              </div>

              <div className={styles.fieldAlias}>
                <label>Nombre de Variable</label>
                <input
                  type="text"
                  value={field.alias}
                  onChange={(e) => handleUpdateField(index, { alias: e.target.value })}
                  placeholder="nombre_variable"
                  className={styles.input}
                />
                <small>Usarás: <code>{`{{${field.alias}}}`}</code></small>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveField(index)}
                className={styles.removeButton}
              >
                ✕
              </button>
            </div>

            {field.helper && (
              <div className={styles.helperBadge}>
                ✨ Helper: {HELPERS[field.helper].name}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddField}
        className={styles.addButton}
        style={{ marginTop: '0.5rem' }}
      >
        + Agregar Campo
      </button>

      {sampleResponse && (
        <details className={styles.sampleDataViewer}>
          <summary>👁️ Ver estructura de respuesta de ejemplo</summary>
          <pre>{JSON.stringify(sampleResponse, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
