'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import styles from './TopicsModal.module.css';

interface TopicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Record<string, any>;
  onSave: (topics: Record<string, any>) => void;
}

export default function TopicsModal({
  isOpen,
  onClose,
  topics,
  onSave,
}: TopicsModalProps) {
  const [localTopics, setLocalTopics] = useState<Record<string, any>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['empresa']));

  useEffect(() => {
    if (isOpen) {
      setLocalTopics(topics || {});
    }
  }, [isOpen, topics]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleAddSection = () => {
    const sectionName = prompt('Nombre de la nueva sección (ej: empresa, personalidad, seguridad):');
    if (!sectionName) return;
    
    if (localTopics[sectionName]) {
      alert(`La sección "${sectionName}" ya existe`);
      return;
    }
    
    setLocalTopics({
      ...localTopics,
      [sectionName]: {}
    });
    setExpandedSections(new Set([...expandedSections, sectionName]));
  };

  const handleDeleteSection = (section: string) => {
    if (confirm(`¿Eliminar la sección "${section}"?`)) {
      const newTopics = { ...localTopics };
      delete newTopics[section];
      setLocalTopics(newTopics);
    }
  };

  const handleAddField = (section: string) => {
    const fieldName = prompt('Nombre del campo (ej: nombre, whatsapp, tono):');
    if (!fieldName) return;
    
    if (localTopics[section][fieldName] !== undefined) {
      alert(`El campo "${fieldName}" ya existe en esta sección`);
      return;
    }
    
    // Preguntar tipo de valor
    const tipo = prompt('Tipo de valor:\n1 = Texto simple\n2 = Número\n3 = Objeto/Array (JSON)\n\nIngresa 1, 2 o 3:', '1');
    
    let valorInicial: any = '';
    if (tipo === '2') {
      valorInicial = 0;
    } else if (tipo === '3') {
      valorInicial = {};
    }
    
    setLocalTopics({
      ...localTopics,
      [section]: {
        ...localTopics[section],
        [fieldName]: valorInicial
      }
    });
  };

  const handleUpdateField = (section: string, field: string, value: any) => {
    setLocalTopics({
      ...localTopics,
      [section]: {
        ...localTopics[section],
        [field]: value
      }
    });
  };

  const handleDeleteField = (section: string, field: string) => {
    const newSection = { ...localTopics[section] };
    delete newSection[field];
    setLocalTopics({
      ...localTopics,
      [section]: newSection
    });
  };

  const handleSave = () => {
    onSave(localTopics);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2>Tópicos Globales</h2>
            <p>Información que se inyecta automáticamente en todos los nodos GPT</p>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.info}>
            <p>
              💡 Los tópicos se inyectan automáticamente en el systemPrompt de cada nodo GPT.
              Úsalos para definir la personalidad, políticas, información de la empresa, etc.
            </p>
          </div>

          <div className={styles.topicsList}>
            {Object.entries(localTopics).map(([section, fields]) => (
              <div key={section} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <button
                    className={styles.toggleButton}
                    onClick={() => toggleSection(section)}
                  >
                    {expandedSections.has(section) ? (
                      <ChevronDown size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    )}
                  </button>
                  <h3>{section}</h3>
                  <button
                    className={styles.addFieldButton}
                    onClick={() => handleAddField(section)}
                    title="Agregar campo"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    className={styles.deleteSectionButton}
                    onClick={() => handleDeleteSection(section)}
                    title="Eliminar sección"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {expandedSections.has(section) && (
                  <div className={styles.fields}>
                    {typeof fields === 'object' && fields !== null ? (
                      Object.entries(fields).map(([field, value]) => (
                        <div key={field} className={styles.fieldRow}>
                          <label>{field}</label>
                          <div className={styles.fieldInput}>
                            {typeof value === 'object' && value !== null ? (
                              <textarea
                                value={JSON.stringify(value, null, 2)}
                                onChange={(e) => {
                                  try {
                                    const parsed = JSON.parse(e.target.value);
                                    handleUpdateField(section, field, parsed);
                                  } catch {
                                    // Mantener como string si no es JSON válido
                                    handleUpdateField(section, field, e.target.value);
                                  }
                                }}
                                rows={6}
                                className={styles.textarea}
                                placeholder='{ "clave": "valor" } o ["item1", "item2"]'
                              />
                            ) : typeof value === 'number' ? (
                              <input
                                type="number"
                                value={value}
                                onChange={(e) => handleUpdateField(section, field, parseFloat(e.target.value) || 0)}
                                className={styles.input}
                                placeholder="0"
                              />
                            ) : (
                              <textarea
                                value={String(value)}
                                onChange={(e) => handleUpdateField(section, field, e.target.value)}
                                className={styles.input}
                                rows={3}
                                placeholder="Escribe aquí el valor..."
                              />
                            )}
                            <button
                              className={styles.deleteFieldButton}
                              onClick={() => handleDeleteField(section, field)}
                              title="Eliminar campo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className={styles.emptySection}>Sin campos</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className={styles.addSectionButton} onClick={handleAddSection}>
            <Plus size={16} />
            Agregar Sección
          </button>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.saveButton} onClick={handleSave}>
            Guardar Tópicos
          </button>
        </div>
      </div>
    </div>
  );
}
