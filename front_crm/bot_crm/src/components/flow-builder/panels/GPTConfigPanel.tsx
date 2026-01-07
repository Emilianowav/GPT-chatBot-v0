import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import styles from './GPTConfigPanel.module.css';

// Tipos para la configuración del GPT con 3 bloques
interface Topico {
  id: string;
  titulo: string;
  contenido: string;
  keywords?: string[];
}

interface VariableRecopilar {
  nombre: string;
  descripcion: string;
  obligatorio: boolean;
  tipo: 'texto' | 'numero' | 'fecha' | 'email' | 'telefono';
  validacion?: {
    min?: number;
    max?: number;
    regex?: string;
    opciones?: string[];
  };
  ejemplos?: string[];
}

interface AccionCompletado {
  tipo: 'mensaje' | 'guardar_variables_globales' | 'marcar_completado' | 'ejecutar_api';
  contenido?: string;
  variables?: string[];
  token?: string;
  apiEndpoint?: string;
}

export interface GPTConversacionalConfig {
  tipo: 'conversacional' | 'transform' | 'formateador' | 'procesador';
  module: string;
  modelo: string;
  temperatura: number;
  maxTokens: number;
  
  // BLOQUE 1: PERSONALIDAD
  personalidad: string;
  
  // BLOQUE 2: INFORMACIÓN ESTÁTICA (Tópicos)
  topicos: Topico[];
  
  // BLOQUE 3: RECOPILACIÓN DE DATOS
  variablesRecopilar: VariableRecopilar[];
  
  // BLOQUE 4: ACCIONES POST-RECOPILACIÓN
  accionesCompletado: AccionCompletado[];
  
  // Legacy
  variablesEntrada?: string[];
  variablesSalida?: string[];
  globalVariablesOutput?: string[];
  outputFormat?: 'text' | 'json';
  jsonSchema?: any;
  systemPrompt?: string;
}

interface GPTConfigPanelProps {
  config: GPTConversacionalConfig;
  onChange: (config: GPTConversacionalConfig) => void;
}

const GPTConfigPanel: React.FC<GPTConfigPanelProps> = ({ config, onChange }) => {
  const [activeTab, setActiveTab] = useState<'basico' | 'personalidad' | 'topicos' | 'variables' | 'acciones'>('basico');

  // Inicializar valores por defecto si no existen
  useEffect(() => {
    if (!config.personalidad) {
      onChange({
        ...config,
        personalidad: '',
        topicos: config.topicos || [],
        variablesRecopilar: config.variablesRecopilar || [],
        accionesCompletado: config.accionesCompletado || []
      });
    }
  }, []);

  // BLOQUE 2: TÓPICOS
  const agregarTopico = () => {
    const nuevoTopico: Topico = {
      id: `topico-${Date.now()}`,
      titulo: '',
      contenido: '',
      keywords: []
    };
    onChange({
      ...config,
      topicos: [...(config.topicos || []), nuevoTopico]
    });
  };

  const actualizarTopico = (index: number, campo: keyof Topico, valor: any) => {
    const topicos = [...(config.topicos || [])];
    if (campo === 'keywords' && typeof valor === 'string') {
      topicos[index][campo] = valor.split(',').map(k => k.trim()).filter(k => k);
    } else {
      (topicos[index] as any)[campo] = valor;
    }
    onChange({ ...config, topicos });
  };

  const eliminarTopico = (index: number) => {
    const topicos = [...(config.topicos || [])];
    topicos.splice(index, 1);
    onChange({ ...config, topicos });
  };

  // BLOQUE 3: VARIABLES
  const agregarVariable = () => {
    const nuevaVariable: VariableRecopilar = {
      nombre: '',
      descripcion: '',
      obligatorio: true,
      tipo: 'texto',
      validacion: {},
      ejemplos: []
    };
    onChange({
      ...config,
      variablesRecopilar: [...(config.variablesRecopilar || []), nuevaVariable]
    });
  };

  const actualizarVariable = (index: number, campo: keyof VariableRecopilar, valor: any) => {
    const variables = [...(config.variablesRecopilar || [])];
    if (campo === 'ejemplos' && typeof valor === 'string') {
      variables[index][campo] = valor.split(',').map(e => e.trim()).filter(e => e);
    } else {
      (variables[index] as any)[campo] = valor;
    }
    onChange({ ...config, variablesRecopilar: variables });
  };

  const actualizarValidacion = (index: number, campo: string, valor: any) => {
    const variables = [...(config.variablesRecopilar || [])];
    variables[index].validacion = {
      ...variables[index].validacion,
      [campo]: valor ? Number(valor) : undefined
    };
    onChange({ ...config, variablesRecopilar: variables });
  };

  const eliminarVariable = (index: number) => {
    const variables = [...(config.variablesRecopilar || [])];
    variables.splice(index, 1);
    onChange({ ...config, variablesRecopilar: variables });
  };

  // BLOQUE 4: ACCIONES
  const agregarAccion = () => {
    const nuevaAccion: AccionCompletado = {
      tipo: 'mensaje',
      contenido: ''
    };
    onChange({
      ...config,
      accionesCompletado: [...(config.accionesCompletado || []), nuevaAccion]
    });
  };

  const actualizarAccion = (index: number, campo: keyof AccionCompletado, valor: any) => {
    const acciones = [...(config.accionesCompletado || [])];
    if (campo === 'variables' && typeof valor === 'string') {
      acciones[index][campo] = valor.split(',').map(v => v.trim()).filter(v => v);
    } else {
      (acciones[index] as any)[campo] = valor;
    }
    onChange({ ...config, accionesCompletado: acciones });
  };

  const eliminarAccion = (index: number) => {
    const acciones = [...(config.accionesCompletado || [])];
    acciones.splice(index, 1);
    onChange({ ...config, accionesCompletado: acciones });
  };

  return (
    <div className={styles.gptConfigPanel}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={activeTab === 'basico' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('basico')}
        >
          Básico
        </button>
        <button
          className={activeTab === 'personalidad' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('personalidad')}
        >
          Personalidad
        </button>
        <button
          className={activeTab === 'topicos' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('topicos')}
        >
          Tópicos ({config.topicos?.length || 0})
        </button>
        <button
          className={activeTab === 'variables' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('variables')}
        >
          Variables ({config.variablesRecopilar?.length || 0})
        </button>
        <button
          className={activeTab === 'acciones' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('acciones')}
        >
          Acciones ({config.accionesCompletado?.length || 0})
        </button>
      </div>

      {/* Contenido según tab activo */}
      <div className={styles.tabContent}>
        {/* TAB: BÁSICO */}
        {activeTab === 'basico' && (
          <div className={styles.section}>
            <h3>Configuración Básica</h3>
            
            <div className={styles.formGroup}>
              <label>Tipo de GPT</label>
              <select
                value={config.tipo}
                onChange={(e) => onChange({ ...config, tipo: e.target.value as any })}
              >
                <option value="conversacional">Conversacional</option>
                <option value="transform">Transform</option>
                <option value="formateador">Formateador</option>
                <option value="procesador">Procesador</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Modelo</label>
              <select
                value={config.modelo}
                onChange={(e) => onChange({ ...config, modelo: e.target.value })}
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Temperatura ({config.temperatura})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperatura}
                onChange={(e) => onChange({ ...config, temperatura: Number(e.target.value) })}
              />
              <small>0 = Preciso, 1 = Creativo</small>
            </div>

            <div className={styles.formGroup}>
              <label>Max Tokens</label>
              <input
                type="number"
                value={config.maxTokens}
                onChange={(e) => onChange({ ...config, maxTokens: Number(e.target.value) })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Formato de Salida</label>
              <select
                value={config.outputFormat || 'text'}
                onChange={(e) => onChange({ ...config, outputFormat: e.target.value as any })}
              >
                <option value="text">Texto</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB: PERSONALIDAD */}
        {activeTab === 'personalidad' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Personalidad del Bot</h3>
              <div className={styles.infoBox}>
                <Info size={16} />
                <span>Define el tono, estilo y comportamiento del asistente</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Descripción de Personalidad</label>
              <textarea
                rows={10}
                placeholder="Ejemplo:&#10;Eres el asistente virtual de Librería Veo Veo 📚&#10;Tono amigable, profesional, usa emojis&#10;Siempre saluda con entusiasmo"
                value={config.personalidad || ''}
                onChange={(e) => onChange({ ...config, personalidad: e.target.value })}
              />
              <small>Define cómo debe comportarse y comunicarse el bot</small>
            </div>
          </div>
        )}

        {/* TAB: TÓPICOS */}
        {activeTab === 'topicos' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Información Estática (Tópicos)</h3>
              <div className={styles.infoBox}>
                <Info size={16} />
                <span>El bot accederá a estos tópicos de forma "innata" cuando el usuario pregunte</span>
              </div>
            </div>

            {config.topicos && config.topicos.length > 0 ? (
              config.topicos.map((topico, index) => (
                <div key={topico.id} className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <h4>Tópico {index + 1}</h4>
                    <button
                      className={styles.deleteButton}
                      onClick={() => eliminarTopico(index)}
                      title="Eliminar tópico"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Título del Tópico</label>
                    <input
                      type="text"
                      placeholder="Ej: Horarios del Local"
                      value={topico.titulo}
                      onChange={(e) => actualizarTopico(index, 'titulo', e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Contenido</label>
                    <textarea
                      rows={5}
                      placeholder="Ej: Lunes a Viernes 8:30-12 y 17-21. Sábados 9-13 y 17-21"
                      value={topico.contenido}
                      onChange={(e) => actualizarTopico(index, 'contenido', e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Palabras Clave (opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: horario, abierto, cerrado, cuando (separadas por coma)"
                      value={topico.keywords?.join(', ') || ''}
                      onChange={(e) => actualizarTopico(index, 'keywords', e.target.value)}
                    />
                    <small>Ayuda al GPT a identificar cuándo usar este tópico</small>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No hay tópicos configurados</p>
                <small>Los tópicos son información estática que el bot usará para responder preguntas</small>
              </div>
            )}

            <button className={styles.addButton} onClick={agregarTopico}>
              <Plus size={16} />
              Agregar Tópico
            </button>
          </div>
        )}

        {/* TAB: VARIABLES */}
        {activeTab === 'variables' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Variables a Recopilar</h3>
              <div className={styles.infoBox}>
                <Info size={16} />
                <span>Define qué datos debe recopilar el bot del usuario</span>
              </div>
            </div>

            {config.variablesRecopilar && config.variablesRecopilar.length > 0 ? (
              config.variablesRecopilar.map((variable, index) => (
                <div key={index} className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <h4>Variable {index + 1}</h4>
                    <button
                      className={styles.deleteButton}
                      onClick={() => eliminarVariable(index)}
                      title="Eliminar variable"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Nombre de Variable</label>
                      <input
                        type="text"
                        placeholder="Ej: titulo"
                        value={variable.nombre}
                        onChange={(e) => actualizarVariable(index, 'nombre', e.target.value)}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Tipo</label>
                      <select
                        value={variable.tipo}
                        onChange={(e) => actualizarVariable(index, 'tipo', e.target.value)}
                      >
                        <option value="texto">Texto</option>
                        <option value="numero">Número</option>
                        <option value="fecha">Fecha</option>
                        <option value="email">Email</option>
                        <option value="telefono">Teléfono</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Descripción</label>
                    <input
                      type="text"
                      placeholder="Ej: Título del libro que busca el cliente"
                      value={variable.descripcion}
                      onChange={(e) => actualizarVariable(index, 'descripcion', e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={variable.obligatorio}
                        onChange={(e) => actualizarVariable(index, 'obligatorio', e.target.checked)}
                      />
                      <span>Obligatorio</span>
                    </label>
                  </div>

                  {variable.tipo === 'numero' && (
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Mínimo</label>
                        <input
                          type="number"
                          placeholder="1"
                          value={variable.validacion?.min || ''}
                          onChange={(e) => actualizarValidacion(index, 'min', e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Máximo</label>
                        <input
                          type="number"
                          placeholder="10"
                          value={variable.validacion?.max || ''}
                          onChange={(e) => actualizarValidacion(index, 'max', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className={styles.formGroup}>
                    <label>Ejemplos (opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: Harry Potter, Matemática 3 (separados por coma)"
                      value={variable.ejemplos?.join(', ') || ''}
                      onChange={(e) => actualizarVariable(index, 'ejemplos', e.target.value)}
                    />
                    <small>Ejemplos que se mostrarán al usuario</small>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No hay variables configuradas</p>
                <small>Las variables son datos que el bot recopilará del usuario</small>
              </div>
            )}

            <button className={styles.addButton} onClick={agregarVariable}>
              <Plus size={16} />
              Agregar Variable
            </button>
          </div>
        )}

        {/* TAB: ACCIONES */}
        {activeTab === 'acciones' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Acciones al Completar</h3>
              <div className={styles.infoBox}>
                <Info size={16} />
                <span>Qué hacer cuando se recopilen todos los datos obligatorios</span>
              </div>
            </div>

            {config.accionesCompletado && config.accionesCompletado.length > 0 ? (
              config.accionesCompletado.map((accion, index) => (
                <div key={index} className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <h4>Acción {index + 1}</h4>
                    <button
                      className={styles.deleteButton}
                      onClick={() => eliminarAccion(index)}
                      title="Eliminar acción"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Tipo de Acción</label>
                    <select
                      value={accion.tipo}
                      onChange={(e) => actualizarAccion(index, 'tipo', e.target.value)}
                    >
                      <option value="mensaje">Enviar Mensaje</option>
                      <option value="marcar_completado">Marcar Completado</option>
                      <option value="guardar_variables_globales">Guardar Variables Globales</option>
                    </select>
                  </div>

                  {accion.tipo === 'mensaje' && (
                    <div className={styles.formGroup}>
                      <label>Mensaje</label>
                      <textarea
                        rows={3}
                        placeholder="Ej: Perfecto, voy a buscar: {{titulo}} - {{editorial}}"
                        value={accion.contenido || ''}
                        onChange={(e) => actualizarAccion(index, 'contenido', e.target.value)}
                      />
                      <small>Usa {`{{variable}}`} para interpolar valores</small>
                    </div>
                  )}

                  {accion.tipo === 'marcar_completado' && (
                    <div className={styles.formGroup}>
                      <label>Token de Completado</label>
                      <input
                        type="text"
                        placeholder="Ej: [INFO_COMPLETA]"
                        value={accion.token || ''}
                        onChange={(e) => actualizarAccion(index, 'token', e.target.value)}
                      />
                      <small>Token que el Router detectará para continuar el flujo</small>
                    </div>
                  )}

                  {accion.tipo === 'guardar_variables_globales' && (
                    <div className={styles.formGroup}>
                      <label>Variables a Guardar</label>
                      <input
                        type="text"
                        placeholder="Ej: titulo, editorial, edicion (separadas por coma)"
                        value={accion.variables?.join(', ') || ''}
                        onChange={(e) => actualizarAccion(index, 'variables', e.target.value)}
                      />
                      <small>Variables que se guardarán en el contexto global</small>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No hay acciones configuradas</p>
                <small>Las acciones se ejecutan cuando se completa la recopilación</small>
              </div>
            )}

            <button className={styles.addButton} onClick={agregarAccion}>
              <Plus size={16} />
              Agregar Acción
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GPTConfigPanel;
