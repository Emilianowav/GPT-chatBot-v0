import { useState, useEffect } from 'react';
import styles from './WorkflowManager.module.css';

interface PathLevel {
  field: string;
  isArray: boolean;
}

interface PathBuilderProps {
  value: string;
  onChange: (value: string) => void;
  sampleData?: any;
  label?: string;
}

export default function PathBuilder({
  value,
  onChange,
  sampleData,
  label = 'Path del Campo'
}: PathBuilderProps) {
  const [levels, setLevels] = useState<PathLevel[]>([]);
  const [currentData, setCurrentData] = useState<any>(sampleData);

  // Parse el path actual en levels
  useEffect(() => {
    if (value) {
      const parts = value.split('.');
      const parsedLevels: PathLevel[] = parts.map(part => ({
        field: part.replace('[]', ''),
        isArray: part.includes('[]')
      }));
      setLevels(parsedLevels);
    } else {
      setLevels([]);
    }
  }, [value]);

  // Construir el path desde los levels
  const buildPath = (newLevels: PathLevel[]) => {
    const path = newLevels
      .map(level => level.field + (level.isArray ? '[]' : ''))
      .join('.');
    onChange(path);
  };

  // Agregar un nuevo nivel
  const addLevel = () => {
    const newLevels = [...levels, { field: '', isArray: false }];
    setLevels(newLevels);
  };

  // Actualizar un nivel
  const updateLevel = (index: number, updates: Partial<PathLevel>) => {
    const newLevels = [...levels];
    newLevels[index] = { ...newLevels[index], ...updates };
    setLevels(newLevels);
    buildPath(newLevels);
  };

  // Eliminar un nivel
  const removeLevel = (index: number) => {
    const newLevels = levels.filter((_, i) => i !== index);
    setLevels(newLevels);
    buildPath(newLevels);
  };

  // Obtener campos disponibles para un nivel
  const getAvailableFields = (levelIndex: number): string[] => {
    if (!sampleData) return [];

    let data = sampleData;
    
    // Navegar hasta el nivel actual
    for (let i = 0; i < levelIndex; i++) {
      const level = levels[i];
      if (!data || !level.field) return [];
      
      data = data[level.field];
      if (level.isArray && Array.isArray(data) && data.length > 0) {
        data = data[0]; // Tomar el primer elemento del array
      }
    }

    if (!data || typeof data !== 'object') return [];
    return Object.keys(data);
  };

  return (
    <div className={styles.pathBuilder}>
      <label>{label}</label>
      
      <div className={styles.pathLevels}>
        {levels.map((level, index) => (
          <div key={index} className={styles.pathLevel}>
            <span className={styles.levelNumber}>Nivel {index + 1}</span>
            
            <select
              value={level.field}
              onChange={(e) => updateLevel(index, { field: e.target.value })}
              className={styles.select}
            >
              <option value="">Seleccionar campo</option>
              {getAvailableFields(index).map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={level.isArray}
                onChange={(e) => updateLevel(index, { isArray: e.target.checked })}
              />
              <span>Es array</span>
            </label>

            <button
              type="button"
              onClick={() => removeLevel(index)}
              className={styles.removeButton}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addLevel}
        className={styles.addButton}
        style={{ marginTop: '0.5rem' }}
      >
        + Agregar Nivel
      </button>

      {value && (
        <div className={styles.pathPreview}>
          <strong>Path generado:</strong> <code>{value}</code>
        </div>
      )}
    </div>
  );
}
