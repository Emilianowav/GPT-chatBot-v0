'use client';

// 🤖 Componente de Integración con Chatbot
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ChatbotSelector from '@/components/ChatbotSelector/ChatbotSelector';
import styles from './ChatbotIntegration.module.css';

interface Endpoint {
  _id?: string;
  id?: string;
  nombre: string;
  metodo: string;
  ruta?: string;
  path?: string;
  parametros?: {
    query?: Array<{ nombre: string; tipo: string; descripcion?: string }>;
    path?: Array<{ nombre: string; tipo: string; descripcion?: string }>;
  };
}

interface ParametroConfig {
  nombre: string;
  extraerDe: 'mensaje' | 'fijo';
  valorFijo?: string;
  regex?: string;
  descripcion?: string;
}

interface KeywordConfig {
  palabra: string;
  endpointId: string;
  descripcion?: string;
  extraerParametros: boolean;
  parametrosConfig: ParametroConfig[];
  respuestaTemplate: string;
  ejemplos?: string[];
}

interface ChatbotIntegrationData {
  habilitado: boolean;
  chatbotId: string;
  keywords: KeywordConfig[];
  mensajeAyuda?: string;
}

interface Props {
  apiId: string;
  endpoints: Endpoint[];
  integration?: ChatbotIntegrationData;
  onSave: (data: ChatbotIntegrationData) => Promise<void>;
}

export default function ChatbotIntegration({ apiId, endpoints, integration, onSave }: Props) {
  const { empresa } = useAuth();
  const [formData, setFormData] = useState<ChatbotIntegrationData>({
    habilitado: false,
    chatbotId: '',
    keywords: [],
    mensajeAyuda: ''
  });
  const [editingKeyword, setEditingKeyword] = useState<number | null>(null);
  const [showKeywordForm, setShowKeywordForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (integration) {
      setFormData(integration);
    }
  }, [integration]);

  const handleAddKeyword = () => {
    setEditingKeyword(formData.keywords.length);
    setFormData({
      ...formData,
      keywords: [
        ...formData.keywords,
        {
          palabra: '',
          endpointId: '',
          descripcion: '',
          extraerParametros: false,
          parametrosConfig: [],
          respuestaTemplate: '',
          ejemplos: []
        }
      ]
    });
    setShowKeywordForm(true);
  };

  const handleEditKeyword = (index: number) => {
    setEditingKeyword(index);
    setShowKeywordForm(true);
  };

  const handleDeleteKeyword = (index: number) => {
    const newKeywords = formData.keywords.filter((_, i) => i !== index);
    setFormData({ ...formData, keywords: newKeywords });
  };

  const handleKeywordChange = (index: number, field: keyof KeywordConfig, value: any) => {
    const newKeywords = [...formData.keywords];
    newKeywords[index] = { ...newKeywords[index], [field]: value };
    setFormData({ ...formData, keywords: newKeywords });
  };

  const handleParametroChange = (
    keywordIndex: number,
    paramIndex: number,
    field: keyof ParametroConfig,
    value: any
  ) => {
    const newKeywords = [...formData.keywords];
    const newParams = [...newKeywords[keywordIndex].parametrosConfig];
    newParams[paramIndex] = { ...newParams[paramIndex], [field]: value };
    newKeywords[keywordIndex].parametrosConfig = newParams;
    setFormData({ ...formData, keywords: newKeywords });
  };

  const handleAddParametro = (keywordIndex: number) => {
    const newKeywords = [...formData.keywords];
    newKeywords[keywordIndex].parametrosConfig.push({
      nombre: '',
      extraerDe: 'mensaje',
      descripcion: ''
    });
    setFormData({ ...formData, keywords: newKeywords });
  };

  const handleDeleteParametro = (keywordIndex: number, paramIndex: number) => {
    const newKeywords = [...formData.keywords];
    newKeywords[keywordIndex].parametrosConfig = newKeywords[keywordIndex].parametrosConfig.filter(
      (_, i) => i !== paramIndex
    );
    setFormData({ ...formData, keywords: newKeywords });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(formData);
      setShowKeywordForm(false);
      setEditingKeyword(null);
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setSaving(false);
    }
  };

  const getEndpointParams = (endpointId: string) => {
    const endpoint = endpoints.find(e => (e.id || e._id) === endpointId);
    if (!endpoint || !endpoint.parametros) return [];
    
    const params = [];
    if (endpoint.parametros.query) {
      params.push(...endpoint.parametros.query);
    }
    if (endpoint.parametros.path) {
      params.push(...endpoint.parametros.path);
    }
    return params;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.title}>Integración con Chatbot</h2>
          <p className={styles.subtitle}>
            Configura palabras clave para ejecutar endpoints desde WhatsApp
          </p>
        </div>
        
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={formData.habilitado}
            onChange={(e) => setFormData({ ...formData, habilitado: e.target.checked })}
          />
          <span className={styles.toggleSlider}></span>
          <span className={styles.toggleLabel}>
            {formData.habilitado ? 'Habilitado' : 'Deshabilitado'}
          </span>
        </label>
      </div>

      {formData.habilitado && (
        <>
          <div className={styles.section}>
            <ChatbotSelector
              value={formData.chatbotId}
              onChange={(chatbotId) => setFormData({ ...formData, chatbotId })}
              label="Chatbot Vinculado"
              required
              showStats
            />
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Palabras Clave</h3>
              <button
                className={styles.addButton}
                onClick={handleAddKeyword}
                disabled={!formData.chatbotId}
              >
                + Agregar Keyword
              </button>
            </div>

            {formData.keywords.length === 0 ? (
              <div className={styles.empty}>
                No hay palabras clave configuradas. Agrega una para comenzar.
              </div>
            ) : (
              <div className={styles.keywordsList}>
                {formData.keywords.map((keyword, index) => (
                  <div key={index} className={styles.keywordCard}>
                    <div className={styles.keywordHeader}>
                      <div className={styles.keywordInfo}>
                        <span className={styles.keywordWord}>"{keyword.palabra}"</span>
                        <span className={styles.keywordEndpoint}>
                          → {endpoints.find(e => e.id === keyword.endpointId)?.nombre || 'Sin endpoint'}
                        </span>
                      </div>
                      <div className={styles.keywordActions}>
                        <button
                          className={styles.iconButton}
                          onClick={() => handleEditKeyword(index)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className={styles.iconButton}
                          onClick={() => handleDeleteKeyword(index)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    {keyword.descripcion && (
                      <p className={styles.keywordDescription}>{keyword.descripcion}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <label className={styles.label}>
              Mensaje de Ayuda
              <span className={styles.hint}>Mensaje que se envía cuando el usuario pide ayuda</span>
            </label>
            <textarea
              className={styles.textarea}
              value={formData.mensajeAyuda || ''}
              onChange={(e) => setFormData({ ...formData, mensajeAyuda: e.target.value })}
              placeholder="Ej: Puedes usar los siguientes comandos:&#10;- buscar [producto]: Buscar productos&#10;- categorias: Ver categorías"
              rows={4}
            />
          </div>

          <div className={styles.actions}>
            <button
              className={styles.saveButton}
              onClick={handleSave}
              disabled={saving || !formData.chatbotId}
            >
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </>
      )}

      {/* Modal de Edición de Keyword */}
      {showKeywordForm && editingKeyword !== null && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Configurar Palabra Clave</h3>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setShowKeywordForm(false);
                  setEditingKeyword(null);
                }}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Palabra Clave *</label>
                <input
                  type="text"
                  value={formData.keywords[editingKeyword].palabra}
                  onChange={(e) => handleKeywordChange(editingKeyword, 'palabra', e.target.value)}
                  placeholder="buscar, productos, categorias..."
                />
              </div>

              <div className={styles.formGroup}>
                <label>Endpoint a Ejecutar *</label>
                <select
                  value={formData.keywords[editingKeyword].endpointId}
                  onChange={(e) => handleKeywordChange(editingKeyword, 'endpointId', e.target.value)}
                >
                  <option value="">Selecciona un endpoint</option>
                  {endpoints.map((endpoint) => (
                    <option key={endpoint.id} value={endpoint.id}>
                      {endpoint.metodo} {endpoint.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Descripción</label>
                <input
                  type="text"
                  value={formData.keywords[editingKeyword].descripcion || ''}
                  onChange={(e) => handleKeywordChange(editingKeyword, 'descripcion', e.target.value)}
                  placeholder="Qué hace este comando..."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.keywords[editingKeyword].extraerParametros}
                    onChange={(e) =>
                      handleKeywordChange(editingKeyword, 'extraerParametros', e.target.checked)
                    }
                  />
                  Extraer parámetros del mensaje
                </label>
              </div>

              {formData.keywords[editingKeyword].extraerParametros && (
                <div className={styles.parametrosSection}>
                  <div className={styles.sectionHeader}>
                    <h4>Configuración de Parámetros</h4>
                    <button
                      className={styles.addButton}
                      onClick={() => handleAddParametro(editingKeyword)}
                    >
                      + Agregar
                    </button>
                  </div>

                  {formData.keywords[editingKeyword].parametrosConfig.map((param, paramIndex) => (
                    <div key={paramIndex} className={styles.paramCard}>
                      <div className={styles.paramHeader}>
                        <span>Parámetro {paramIndex + 1}</span>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDeleteParametro(editingKeyword, paramIndex)}
                        >
                          ×
                        </button>
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>Nombre del Parámetro</label>
                          <select
                            value={param.nombre}
                            onChange={(e) =>
                              handleParametroChange(editingKeyword, paramIndex, 'nombre', e.target.value)
                            }
                          >
                            <option value="">Selecciona...</option>
                            {getEndpointParams(formData.keywords[editingKeyword].endpointId).map((p) => (
                              <option key={p.nombre} value={p.nombre}>
                                {p.nombre} ({p.tipo})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className={styles.formGroup}>
                          <label>Extraer De</label>
                          <select
                            value={param.extraerDe}
                            onChange={(e) =>
                              handleParametroChange(
                                editingKeyword,
                                paramIndex,
                                'extraerDe',
                                e.target.value as 'mensaje' | 'fijo'
                              )
                            }
                          >
                            <option value="mensaje">Mensaje del usuario</option>
                            <option value="fijo">Valor fijo</option>
                          </select>
                        </div>
                      </div>

                      {param.extraerDe === 'fijo' && (
                        <div className={styles.formGroup}>
                          <label>Valor Fijo</label>
                          <input
                            type="text"
                            value={param.valorFijo || ''}
                            onChange={(e) =>
                              handleParametroChange(editingKeyword, paramIndex, 'valorFijo', e.target.value)
                            }
                          />
                        </div>
                      )}

                      {param.extraerDe === 'mensaje' && (
                        <div className={styles.formGroup}>
                          <label>Regex (opcional)</label>
                          <input
                            type="text"
                            value={param.regex || ''}
                            onChange={(e) =>
                              handleParametroChange(editingKeyword, paramIndex, 'regex', e.target.value)
                            }
                            placeholder="Ej: buscar (.+)"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Template de Respuesta *</label>
                <textarea
                  value={formData.keywords[editingKeyword].respuestaTemplate}
                  onChange={(e) => handleKeywordChange(editingKeyword, 'respuestaTemplate', e.target.value)}
                  placeholder="Usa {{variable}} para insertar datos de la respuesta&#10;Ej: Encontré {{total}} productos:&#10;{{#productos}}&#10;- {{nombre}}: ${{precio}}&#10;{{/productos}}"
                  rows={6}
                />
                <span className={styles.hint}>
                  Usa sintaxis Mustache: {'{{'} variable {'}}'} para valores simples, {'{{'} #array {'}}'}...{'{{'} /array {'}}'} para listas
                </span>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowKeywordForm(false);
                  setEditingKeyword(null);
                }}
              >
                Cancelar
              </button>
              <button
                className={styles.saveButton}
                onClick={() => setShowKeywordForm(false)}
              >
                Guardar Keyword
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
