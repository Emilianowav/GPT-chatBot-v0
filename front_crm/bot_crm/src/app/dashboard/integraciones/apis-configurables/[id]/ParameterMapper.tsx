import { useState } from 'react';
import VariableSelector from './VariableSelector';
import styles from './WorkflowManager.module.css';

interface Variable {
  nombre: string;
  tipo: 'recopilar' | 'input' | 'confirmacion';
  valor?: any;
}

interface ParameterMapping {
  parametro: string;
  variable: string;
}

interface ParameterMapperProps {
  variables: Variable[];
  mappings: Record<string, string>;
  onChange: (mappings: Record<string, string>) => void;
  endpointParams?: string[];
}

export default function ParameterMapper({
  variables,
  mappings,
  onChange,
  endpointParams = []
}: ParameterMapperProps) {
  const [customParams, setCustomParams] = useState<ParameterMapping[]>([]);

  // Convertir mappings a array para mostrar
  const currentMappings = Object.entries(mappings).map(([variable, parametro]) => ({
    variable,
    parametro
  }));

  const handleAddMapping = () => {
    const newParam = endpointParams.find(p => !Object.values(mappings).includes(p)) || '';
    const newVariable = variables.find(v => !Object.keys(mappings).includes(v.nombre))?.nombre || '';
    
    if (newVariable) {
      onChange({
        ...mappings,
        [newVariable]: newParam
      });
    }
  };

  const handleUpdateMapping = (oldVariable: string, newVariable: string, newParametro: string) => {
    const newMappings = { ...mappings };
    
    // Eliminar el mapping anterior
    delete newMappings[oldVariable];
    
    // Agregar el nuevo
    if (newVariable && newParametro) {
      newMappings[newVariable] = newParametro;
    }
    
    onChange(newMappings);
  };

  const handleRemoveMapping = (variable: string) => {
    const newMappings = { ...mappings };
    delete newMappings[variable];
    onChange(newMappings);
  };

  return (
    <div className={styles.parameterMapper}>
      <div className={styles.mapperHeader}>
        <label>Mapeo de Parámetros</label>
        <p className={styles.helpText}>
          Conecta las variables recopiladas con los parámetros del endpoint
        </p>
      </div>

      <div className={styles.mappingsList}>
        {currentMappings.map((mapping, index) => {
          const variable = variables.find(v => v.nombre === mapping.variable);
          
          return (
            <div key={index} className={styles.mappingItem}>
              <div className={styles.mappingRow}>
                <div className={styles.mappingField}>
                  <label>Variable Recopilada</label>
                  <VariableSelector
                    variables={variables}
                    value={mapping.variable}
                    onChange={(newVar) => handleUpdateMapping(mapping.variable, newVar, mapping.parametro)}
                    placeholder="Seleccionar variable"
                  />
                  {variable?.valor && (
                    <small className={styles.valuePreview}>
                      Valor actual: <strong>{JSON.stringify(variable.valor)}</strong>
                    </small>
                  )}
                </div>

                <div className={styles.mappingArrow}>→</div>

                <div className={styles.mappingField}>
                  <label>Parámetro del Endpoint</label>
                  {endpointParams.length > 0 ? (
                    <select
                      value={mapping.parametro}
                      onChange={(e) => handleUpdateMapping(mapping.variable, mapping.variable, e.target.value)}
                      className={styles.select}
                    >
                      <option value="">Seleccionar parámetro</option>
                      {endpointParams.map(param => (
                        <option key={param} value={param}>{param}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={mapping.parametro}
                      onChange={(e) => handleUpdateMapping(mapping.variable, mapping.variable, e.target.value)}
                      placeholder="nombre_parametro"
                      className={styles.input}
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveMapping(mapping.variable)}
                  className={styles.removeButton}
                  title="Eliminar mapeo"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {variables.length > currentMappings.length && (
        <button
          type="button"
          onClick={handleAddMapping}
          className={styles.addButton}
          style={{ marginTop: '0.5rem' }}
        >
          + Agregar Filtro
        </button>
      )}

      {currentMappings.length === 0 && (
        <div className={styles.emptyState}>
          <p>No hay parámetros mapeados</p>
          <small>Agrega filtros para usar las variables recopiladas en la búsqueda</small>
        </div>
      )}
    </div>
  );
}
