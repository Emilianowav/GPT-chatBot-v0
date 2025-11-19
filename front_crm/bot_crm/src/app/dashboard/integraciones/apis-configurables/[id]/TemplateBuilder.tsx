'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Type, List, Database } from 'lucide-react';
import styles from './TemplateBuilder.module.css';

interface TemplateBlock {
  id: string;
  type: 'text' | 'variable' | 'array';
  content?: string;
  variable?: string;
  arrayVariable?: string;
  arrayTemplate?: TemplateBlock[];
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  variables: string[];
  endpoints: any[];
  onTestEndpoint?: (endpointId: string) => Promise<any>;
}

export default function TemplateBuilder({ value, onChange, variables, endpoints, onTestEndpoint }: Props) {
  const [blocks, setBlocks] = useState<TemplateBlock[]>([]);
  const [preview, setPreview] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [endpointData, setEndpointData] = useState<Record<string, any>>({});

  // Convertir template string a bloques visuales
  useEffect(() => {
    if (!value) {
      setBlocks([{ id: '1', type: 'text', content: '' }]);
      return;
    }
    // Por ahora, inicializar con un bloque de texto
    setBlocks([{ id: '1', type: 'text', content: value }]);
  }, []);

  // Generar preview del template
  useEffect(() => {
    const generated = blocks.map(block => {
      if (block.type === 'text') return block.content || '';
      if (block.type === 'variable') return `{{${block.variable}}}`;
      if (block.type === 'array') {
        const inner = block.arrayTemplate?.map(b => 
          b.type === 'text' ? b.content : `{{${b.variable}}}`
        ).join('') || '';
        return `{{#${block.arrayVariable}}}\n${inner}\n{{/${block.arrayVariable}}}`;
      }
      return '';
    }).join('');
    
    setPreview(generated);
    onChange(generated);
  }, [blocks]);

  const addBlock = (type: 'text' | 'variable' | 'array') => {
    const newBlock: TemplateBlock = {
      id: Date.now().toString(),
      type,
      content: type === 'text' ? '' : undefined,
      variable: type === 'variable' ? '' : undefined,
      arrayVariable: type === 'array' ? '' : undefined,
      arrayTemplate: type === 'array' ? [] : undefined,
    };
    setBlocks([...blocks, newBlock]);
    setShowAddMenu(false);
  };

  const updateBlock = (id: string, updates: Partial<TemplateBlock>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const testEndpoint = async (endpointId: string) => {
    if (!onTestEndpoint) return;
    try {
      const data = await onTestEndpoint(endpointId);
      setEndpointData({ ...endpointData, [endpointId]: data });
    } catch (error) {
      console.error('Error testing endpoint:', error);
    }
  };

  const getEndpointFields = (endpointId: string) => {
    const data = endpointData[endpointId];
    if (!data) return [];
    
    // Extraer campos del primer item si es array
    if (Array.isArray(data)) {
      return data.length > 0 ? Object.keys(data[0]) : [];
    }
    
    // Si tiene una propiedad data que es array
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      return Object.keys(data.data[0]);
    }
    
    return Object.keys(data);
  };

  return (
    <div className={styles.builder}>
      {variables.length > 0 && (
        <div className={styles.variablesInfo}>
          <strong>📦 Variables disponibles del flujo:</strong>
          <div className={styles.variablesList}>
            {variables.map(v => (
              <code key={v} className={styles.variableTag}>{v}</code>
            ))}
          </div>
        </div>
      )}

      <div className={styles.blocks}>
        {blocks.map((block, index) => (
          <div key={block.id} className={styles.block}>
            <div className={styles.blockHeader}>
              <span className={styles.blockType}>
                {block.type === 'text' && <><Type size={14} /> Texto</>}
                {block.type === 'variable' && <><Database size={14} /> Variable</>}
                {block.type === 'array' && <><List size={14} /> Lista</>}
              </span>
              <button onClick={() => removeBlock(block.id)} className={styles.removeBtn}>
                <X size={14} />
              </button>
            </div>

            {block.type === 'text' && (
              <textarea
                value={block.content || ''}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                placeholder="Escribe tu mensaje... Ej: ✅ Encontré los siguientes resultados:"
                className={styles.textInput}
                rows={2}
              />
            )}

            {block.type === 'variable' && (
              <div className={styles.variableSelect}>
                <select
                  value={block.variable || ''}
                  onChange={(e) => updateBlock(block.id, { variable: e.target.value })}
                  className={styles.select}
                >
                  <option value="">Selecciona una variable</option>
                  {variables.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                {block.variable && (
                  <div className={styles.selectedVar}>
                    Insertará: <code>{`{{${block.variable}}}`}</code>
                  </div>
                )}
              </div>
            )}

            {block.type === 'array' && (
              <div className={styles.arrayConfig}>
                <label>Variable que contiene la lista:</label>
                <select
                  value={block.arrayVariable || ''}
                  onChange={(e) => updateBlock(block.id, { arrayVariable: e.target.value })}
                  className={styles.select}
                >
                  <option value="">Selecciona el array</option>
                  {variables.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>

                {block.arrayVariable && (
                  <div className={styles.arrayTemplate}>
                    <label>Formato de cada item de la lista:</label>
                    <div className={styles.arrayBlocks}>
                      <textarea
                        placeholder="Ej: 📱 {{nombre}} - ${{precio}}"
                        className={styles.textInput}
                        rows={3}
                      />
                      <small style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                        Usa {`{{campo}}`} para acceder a propiedades de cada item
                      </small>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className={styles.addBlock}>
          {!showAddMenu ? (
            <button onClick={() => setShowAddMenu(true)} className={styles.addBtn}>
              <Plus size={16} /> Agregar bloque
            </button>
          ) : (
            <div className={styles.addMenu}>
              <button onClick={() => addBlock('text')} className={styles.menuItem}>
                <Type size={16} /> Texto
              </button>
              <button onClick={() => addBlock('variable')} className={styles.menuItem}>
                <Database size={16} /> Variable
              </button>
              <button onClick={() => addBlock('array')} className={styles.menuItem}>
                <List size={16} /> Lista
              </button>
              <button onClick={() => setShowAddMenu(false)} className={styles.menuCancel}>
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.preview}>
        <label>Vista previa:</label>
        <pre className={styles.previewCode}>{preview || 'Agrega bloques para construir tu template'}</pre>
      </div>
    </div>
  );
}
