'use client';

// 🔄 Modal de Workflow Conversacional - Diseño por Pasos

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check, AlertCircle, MessageSquare, Zap, Settings, Eye } from 'lucide-react';
import WorkflowStepEditor from './WorkflowStepEditor';
import TemplateBuilder from './TemplateBuilder';
import styles from './ModalWorkflow.module.css';

type ValidationType = 'texto' | 'numero' | 'opcion' | 'regex';
type StepType = 'recopilar' | 'input' | 'confirmacion' | 'consulta_filtrada' | 'validar';
type TriggerType = 'keyword' | 'primer_mensaje' | 'manual';

interface StepValidation {
  tipo: ValidationType;
  opciones?: string[];
  regex?: string;
  mensajeError?: string;
}

interface EndpointResponseConfig {
  arrayPath?: string;
  idField?: string;
  displayField?: string;
}

interface EndpointRelacionado {
  endpointId: string;
  origenDatos: 'resultado' | 'variable';
  campoIdOrigen?: string;
  variableOrigen?: string;
  parametroDestino: string;
  campos: string[];
  prefijo?: string;
}

interface FlowStep {
  orden: number;
  tipo: StepType;
  pregunta?: string;
  nombreVariable: string;
  validacion?: StepValidation;
  endpointResponseConfig?: EndpointResponseConfig;
  endpointId?: string;
  mapeoParametros?: Record<string, string>;
  plantillaOpciones?: string;
  plantillaRespuesta?: string;
  endpointsRelacionados?: EndpointRelacionado[];
  nombre?: string;
  descripcion?: string;
  mensajeError?: string;
  intentosMaximos?: number;
}

interface WorkflowTrigger {
  tipo: TriggerType;
  keywords?: string[];
  primeraRespuesta?: boolean;
}

interface WorkflowSiguiente {
  workflowId: string;
  opcion: string;
}

interface RepetirWorkflow {
  habilitado: boolean;
  desdePaso: number;
  variablesALimpiar: string[];
  pregunta?: string;
  opcionRepetir?: string;
  opcionFinalizar?: string;
}

interface Workflow {
  id?: string;
  _id?: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  trigger: WorkflowTrigger;
  prioridad?: number;
  steps: FlowStep[];
  mensajeInicial?: string;
  mensajeFinal?: string;
  mensajeAbandonar?: string;
  respuestaTemplate?: string;
  workflowsSiguientes?: {
    pregunta?: string;
    workflows: WorkflowSiguiente[];
  };
  repetirWorkflow?: RepetirWorkflow;
  permitirAbandonar?: boolean;
  timeoutMinutos?: number;
}

interface Endpoint {
  _id?: string;
  id?: string;
  nombre: string;
  metodo: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Workflow) => Promise<void>;
  workflowInicial?: Workflow | null;
  endpoints: Endpoint[];
  workflows: Workflow[];
  apiBaseUrl?: string;
  apiAuth?: any;
}

const PASOS_WIZARD = [
  { numero: 1, titulo: 'Información', icono: MessageSquare, descripcion: 'Datos básicos del workflow' },
  { numero: 2, titulo: 'Activación', icono: Zap, descripcion: 'Cuándo se activa' },
  { numero: 3, titulo: 'Pasos', icono: Settings, descripcion: 'Flujo de conversación' },
  { numero: 4, titulo: 'Mensajes', icono: MessageSquare, descripcion: 'Respuestas y templates' },
  { numero: 5, titulo: 'Revisión', icono: Eye, descripcion: 'Confirmar y guardar' }
];

export default function ModalWorkflow({ isOpen, onClose, onSubmit, workflowInicial, endpoints, workflows, apiBaseUrl, apiAuth }: Props) {
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState('');

  const [formData, setFormData] = useState<Workflow>({
    nombre: '',
    descripcion: '',
    activo: true,
    trigger: {
      tipo: 'keyword',
      keywords: [],
      primeraRespuesta: false
    },
    prioridad: 0,
    steps: [],
    mensajeInicial: '',
    mensajeFinal: '',
    mensajeAbandonar: '',
    respuestaTemplate: '',
    permitirAbandonar: true,
    timeoutMinutos: 30
  });

  // Inicializar con datos del workflow si existe
  useEffect(() => {
    if (workflowInicial) {
      setFormData(workflowInicial);
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        activo: true,
        trigger: {
          tipo: 'keyword',
          keywords: [],
          primeraRespuesta: false
        },
        prioridad: 0,
        steps: [],
        mensajeInicial: '',
        mensajeFinal: '',
        mensajeAbandonar: '',
        respuestaTemplate: '',
        permitirAbandonar: true,
        timeoutMinutos: 30
      });
    }
    setPaso(1);
    setError(null);
  }, [workflowInicial, isOpen]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleChange = (campo: keyof Workflow, valor: any) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
    setError(null);
  };

  const handleTriggerChange = (campo: keyof WorkflowTrigger, valor: any) => {
    setFormData(prev => ({
      ...prev,
      trigger: { ...prev.trigger, [campo]: valor }
    }));
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    const keywords = formData.trigger.keywords || [];
    handleTriggerChange('keywords', [...keywords, newKeyword.trim().toLowerCase()]);
    setNewKeyword('');
  };

  const handleRemoveKeyword = (index: number) => {
    const keywords = formData.trigger.keywords || [];
    handleTriggerChange('keywords', keywords.filter((_, i) => i !== index));
  };

  const handleAddStep = () => {
    const newStep: FlowStep = {
      orden: formData.steps.length + 1,
      tipo: 'recopilar',
      nombreVariable: `variable_${formData.steps.length + 1}`,
      nombre: `Paso ${formData.steps.length + 1}`,
      pregunta: '',
      validacion: {
        tipo: 'texto'
      },
      intentosMaximos: 3
    };
    handleChange('steps', [...formData.steps, newStep]);
  };

  const handleAddConfirmacionStep = () => {
    // Detectar variables disponibles para confirmar
    const variablesRecopiladas = formData.steps
      .filter(s => s.tipo === 'recopilar' && s.nombreVariable)
      .map(s => ({
        variable: s.nombreVariable,
        nombre: s.nombre || s.nombreVariable,
        tieneNombre: s.endpointId && s.endpointResponseConfig?.displayField
      }));

    if (variablesRecopiladas.length === 0) {
      alert('⚠️ Agrega al menos un paso de recopilación antes de crear la confirmación');
      return;
    }

    // Construir pregunta de confirmación con variables
    let preguntaConfirmacion = '📋 *CONFIRMA TUS DATOS*\n\n';
    
    variablesRecopiladas.forEach((v, idx) => {
      const emoji = idx === 0 ? '📍' : idx === 1 ? '📂' : '🔍';
      const nombreMostrar = v.nombre.replace(/^(Paso \d+|variable_\d+)$/i, `Campo ${idx + 1}`);
      // Si tiene nombre asociado (de API), usar variable_nombre, sino usar la variable directa
      const variableAMostrar = v.tieneNombre ? `${v.variable}_nombre` : v.variable;
      preguntaConfirmacion += `${emoji} *${nombreMostrar}:* {{${variableAMostrar}}}\n`;
    });

    preguntaConfirmacion += '\n¿Los datos son correctos?\n\n';
    preguntaConfirmacion += '1️⃣ Confirmar y continuar\n';
    
    // Agregar opciones para cambiar cada variable
    variablesRecopiladas.forEach((v, idx) => {
      const nombreMostrar = v.nombre.replace(/^(Paso \d+|variable_\d+)$/i, `campo ${idx + 1}`);
      preguntaConfirmacion += `${idx + 2}️⃣ Cambiar ${nombreMostrar.toLowerCase()}\n`;
    });
    
    preguntaConfirmacion += `${variablesRecopiladas.length + 2}️⃣ Cancelar`;

    // Crear opciones de validación
    const opciones = ['1: Confirmar y continuar'];
    variablesRecopiladas.forEach((v, idx) => {
      const nombreMostrar = v.nombre.replace(/^(Paso \d+|variable_\d+)$/i, `campo ${idx + 1}`);
      opciones.push(`${idx + 2}: Cambiar ${nombreMostrar.toLowerCase()}`);
    });
    opciones.push(`${variablesRecopiladas.length + 2}: Cancelar`);

    // Buscar si ya existe un paso de confirmación
    const confirmacionExistente = formData.steps.findIndex(s => s.nombreVariable === 'confirmacion');
    
    const pasoConfirmacion: FlowStep = {
      orden: formData.steps.length + 1,
      tipo: 'confirmacion',
      nombreVariable: 'confirmacion',
      nombre: 'Confirmar Datos',
      descripcion: 'Usuario confirma los datos ingresados antes de continuar',
      pregunta: preguntaConfirmacion,
      validacion: {
        tipo: 'opcion',
        opciones: opciones,
        mensajeError: `Por favor selecciona una opción válida (1-${variablesRecopiladas.length + 2})`
      },
      intentosMaximos: 3
    };

    if (confirmacionExistente >= 0) {
      // Actualizar el existente
      const newSteps = [...formData.steps];
      newSteps[confirmacionExistente] = {
        ...newSteps[confirmacionExistente],
        ...pasoConfirmacion,
        orden: newSteps[confirmacionExistente].orden
      };
      handleChange('steps', newSteps);
      alert('✅ Paso de confirmación actualizado con las variables actuales');
    } else {
      // Agregar nuevo
      handleChange('steps', [...formData.steps, pasoConfirmacion]);
      alert('✅ Paso de confirmación agregado. Recuerda agregar un paso EJECUTAR después.');
    }
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = formData.steps
      .filter((_, idx) => idx !== index)
      .map((s, idx) => ({ ...s, orden: idx + 1 }));
    handleChange('steps', newSteps);
  };

  const handleStepChange = (index: number, step: FlowStep) => {
    const newSteps = [...formData.steps];
    newSteps[index] = step;
    handleChange('steps', newSteps);
  };

  const getAvailableVariables = (upToIndex: number): string[] => {
    return formData.steps
      .slice(0, upToIndex)
      .filter(s => s.tipo === 'recopilar')
      .map(s => s.nombreVariable);
  };

  const validarPaso = (pasoActual: number): boolean => {
    setError(null);

    switch (pasoActual) {
      case 1:
        if (!formData.nombre.trim()) {
          setError('El nombre del workflow es obligatorio');
          return false;
        }
        break;
      case 2:
        if (formData.trigger.tipo === 'keyword' && (!formData.trigger.keywords || formData.trigger.keywords.length === 0)) {
          setError('Debes agregar al menos una palabra clave');
          return false;
        }
        break;
      case 3:
        if (formData.steps.length === 0) {
          setError('Debes agregar al menos un paso');
          return false;
        }
        break;
    }

    return true;
  };

  const handleSiguiente = () => {
    if (validarPaso(paso)) {
      setPaso(paso + 1);
    }
  };

  const handleAnterior = () => {
    setPaso(paso - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validarPaso(paso)) return;

    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el workflow');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2>{workflowInicial ? 'Editar Workflow' : 'Nuevo Workflow Conversacional'}</h2>
          <p>Crea conversaciones guiadas paso a paso</p>
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={24} />
          Volver a la lista
        </button>
      </div>

        {/* Progress Bar */}
        <div className={styles.progressBar}>
          {/* Indicador de pasos anteriores */}
          {paso > 1 && (
            <div className={styles.progressIndicator}>
              <ChevronLeft size={16} />
              <span>{paso - 1} completados</span>
            </div>
          )}

          {/* Paso actual */}
          {PASOS_WIZARD.filter(p => p.numero === paso).map((p) => (
            <div key={p.numero} className={`${styles.progressStep} ${styles.progressStepCurrent}`}>
              <div className={styles.progressNumber}>{p.numero}</div>
              <span>{p.titulo}</span>
            </div>
          ))}

          {/* Línea separadora */}
          {paso < PASOS_WIZARD.length && (
            <div className={styles.progressLine} />
          )}

          {/* Siguiente paso */}
          {paso < PASOS_WIZARD.length && PASOS_WIZARD.filter(p => p.numero === paso + 1).map((p) => (
            <div key={p.numero} className={styles.progressStep}>
              <div className={styles.progressNumber}>{p.numero}</div>
              <span>{p.titulo}</span>
            </div>
          ))}

          {/* Indicador de pasos restantes */}
          {paso < PASOS_WIZARD.length - 1 && (
            <div className={styles.progressIndicator}>
              <span>{PASOS_WIZARD.length - paso - 1} más</span>
              <ChevronRight size={16} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className={styles.content}>
          {error && (
            <div className={styles.error}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Paso 1: Información Básica */}
          {paso === 1 && (
            <div className={styles.paso}>
              <h3>📋 Información Básica</h3>
              <p className={styles.pasoDes}>Define el nombre y propósito del workflow</p>

              <div className={styles.formGroup}>
                <label>Nombre del Workflow *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="Ej: Búsqueda de Productos"
                  className={styles.input}
                  autoFocus
                />
                <small>Ejemplo: "Búsqueda de Productos", "Reserva de Turnos", "Cotización"</small>
              </div>

              <div className={styles.formGroup}>
                <label>Descripción</label>
                <textarea
                  value={formData.descripcion || ''}
                  onChange={(e) => handleChange('descripcion', e.target.value)}
                  placeholder="Describe qué hace este workflow..."
                  rows={3}
                  className={styles.textarea}
                />
                <small>Ejemplo: "Permite buscar productos filtrando por sucursal, categoría y nombre"</small>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Prioridad</label>
                  <input
                    type="number"
                    value={formData.prioridad || 0}
                    onChange={(e) => handleChange('prioridad', parseInt(e.target.value))}
                    min={0}
                    max={100}
                    className={styles.input}
                  />
                  <small>Mayor número = mayor prioridad (0-100)</small>
                </div>

                <div className={styles.formGroup}>
                  <label>Timeout (minutos)</label>
                  <input
                    type="number"
                    value={formData.timeoutMinutos || 30}
                    onChange={(e) => handleChange('timeoutMinutos', parseInt(e.target.value))}
                    min={1}
                    max={1440}
                    className={styles.input}
                  />
                  <small>Tiempo máximo de inactividad (1-1440 min)</small>
                </div>
              </div>
            </div>
          )}

          {/* Paso 2: Activación */}
          {paso === 2 && (
            <div className={styles.paso}>
              <h3>🎯 Activación del Workflow</h3>
              <p className={styles.pasoDes}>Define cuándo se debe activar este workflow</p>

              {/* Mostrar opciones solo si no hay trigger seleccionado o si no es keyword con keywords agregadas */}
              {(formData.trigger.tipo !== 'keyword' || !formData.trigger.keywords || formData.trigger.keywords.length === 0) && (
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      checked={formData.trigger.tipo === 'keyword'}
                      onChange={() => handleTriggerChange('tipo', 'keyword')}
                    />
                    <div>
                      <strong>Por Palabras Clave</strong>
                      <p>Se activa cuando el usuario escribe ciertas palabras</p>
                      <small className={styles.ejemplo}>Ejemplo: "buscar", "stock", "disponibilidad"</small>
                    </div>
                  </label>

                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      checked={formData.trigger.tipo === 'primer_mensaje'}
                      onChange={() => handleTriggerChange('tipo', 'primer_mensaje')}
                    />
                    <div>
                      <strong>Primer Mensaje</strong>
                      <p>Se activa automáticamente en el primer mensaje del usuario</p>
                      <small className={styles.ejemplo}>Ejemplo: Workflow de bienvenida para nuevos usuarios</small>
                    </div>
                  </label>

                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      checked={formData.trigger.tipo === 'manual'}
                      onChange={() => handleTriggerChange('tipo', 'manual')}
                    />
                    <div>
                      <strong>Manual</strong>
                      <p>Se activa solo manualmente desde el dashboard</p>
                      <small className={styles.ejemplo}>Ejemplo: Workflows de administración o testing</small>
                    </div>
                  </label>
                </div>
              )}

              {/* Sección de keywords expandida */}
              {formData.trigger.tipo === 'keyword' && (
                <div className={styles.formGroup}>
                  <div className={styles.keywordHeader}>
                    <label>Palabras Clave</label>
                    {formData.trigger.keywords && formData.trigger.keywords.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleChange('trigger', { ...formData.trigger, keywords: [] })}
                        className={styles.btnCancel}
                      >
                        <X size={16} />
                        Cambiar tipo de activación
                      </button>
                    )}
                  </div>
                  
                  <div className={styles.keywordsList}>
                    {(formData.trigger.keywords || []).map((keyword, i) => (
                      <div key={i} className={styles.keywordItem}>
                        <span>{keyword}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(i)}
                          className={styles.removeButton}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className={styles.addKeyword}>
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="buscar, stock, disponibilidad..."
                      className={styles.input}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                    />
                    <button
                      type="button"
                      onClick={handleAddKeyword}
                      className={styles.addButton}
                    >
                      Agregar
                    </button>
                  </div>
                  <small>Ejemplo: "buscar", "stock", "precio", "disponibilidad"</small>
                </div>
              )}
            </div>
          )}

          {/* Paso 3: Pasos del Workflow */}
          {paso === 3 && (
            <div className={styles.paso}>
              <div className={styles.pasoHeader}>
                <div>
                  <h3>📝 Pasos del Workflow</h3>
                  <p className={styles.pasoDes}>Recopila información consultando endpoints y guarda las selecciones del usuario</p>
                </div>
                <button type="button" className={styles.addButton} onClick={handleAddStep}>
                  + Agregar Paso
                </button>
              </div>

              {formData.steps.length === 0 ? (
                <div className={styles.emptySteps}>
                  <p>Agrega al menos un paso para crear el workflow</p>
                  <button type="button" className={styles.primaryButton} onClick={handleAddStep}>
                    Agregar Primer Paso
                  </button>
                  <div className={styles.ejemploBox}>
                    <strong>💡 Ejemplo de flujo de búsqueda de productos:</strong>
                    <ol>
                      <li><strong>Paso 1:</strong> Consultar GET /sucursales → Mostrar "Elegí tu sucursal: 1, 2, 3" → Guardar selección en variable <code>sucursal_id</code></li>
                      <li><strong>Paso 2:</strong> Consultar GET /categorias?sucursal={'{{sucursal_id}}'} → Mostrar opciones → Guardar en <code>categoria_id</code></li>
                      <li><strong>Paso 3:</strong> Consultar GET /productos?sucursal={'{{sucursal_id}}'}&categoria={'{{categoria_id}}'} → Mostrar resultado final</li>
                    </ol>
                    <p style={{marginTop: '1rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)'}}>
                      Cada paso consulta un endpoint, muestra las opciones al usuario, y guarda su selección para usarla en los siguientes pasos.
                    </p>
                  </div>
                </div>
              ) : (
                <div className={styles.stepsList}>
                  {formData.steps.map((step, idx) => (
                    <WorkflowStepEditor
                      key={idx}
                      step={step}
                      index={idx}
                      endpoints={endpoints}
                      apiBaseUrl={apiBaseUrl}
                      apiAuth={apiAuth}
                      variables={getAvailableVariables(idx)}
                      onChange={handleStepChange}
                      onRemove={handleRemoveStep}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Paso 4: Mensajes y Template */}
          {paso === 4 && (
            <div className={styles.paso}>
              <h3>💬 Mensajes y Respuestas</h3>
              <p className={styles.pasoDes}>Personaliza los mensajes del workflow</p>

              <div className={styles.formGroup}>
                <label>Mensaje Inicial</label>
                <textarea
                  value={formData.mensajeInicial || ''}
                  onChange={(e) => handleChange('mensajeInicial', e.target.value)}
                  placeholder="🔍 Te ayudo a buscar productos"
                  rows={2}
                  className={styles.textarea}
                />
                <small>Ejemplo: "🔍 Te ayudo a buscar productos en nuestro stock"</small>
              </div>

              <div className={styles.formGroup}>
                <label>Template de Respuesta Final *</label>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem' }}>
                  Construye tu respuesta usando las variables recopiladas en los pasos anteriores
                </p>
                <TemplateBuilder
                  value={formData.respuestaTemplate || ''}
                  onChange={(value) => handleChange('respuestaTemplate', value)}
                  variables={formData.steps
                    .filter(s => s.tipo === 'recopilar' || s.tipo === 'consulta_filtrada')
                    .map(s => s.nombreVariable)
                    .filter(v => v && v.trim() !== '')}
                  endpoints={endpoints}
                />
              </div>

              <div className={styles.divider} style={{margin: '2rem 0 1.5rem'}}>
                <span>🔗 Workflows Encadenados (Opcional)</span>
              </div>

              <div className={styles.formGroup}>
                <label>Pregunta para Workflows Siguientes</label>
                <input
                  type="text"
                  value={formData.workflowsSiguientes?.pregunta || ''}
                  onChange={(e) => handleChange('workflowsSiguientes', {
                    ...formData.workflowsSiguientes,
                    pregunta: e.target.value,
                    workflows: formData.workflowsSiguientes?.workflows || []
                  })}
                  placeholder="¿Qué te gustaría hacer?"
                  className={styles.input}
                />
                <small>Pregunta que se mostrará al finalizar el workflow para ofrecer otras opciones</small>
              </div>

              <div className={styles.formGroup}>
                <label>Opciones de Workflows</label>
                <p className={styles.helpText}>
                  Define qué workflows se pueden ejecutar después de este
                </p>
                <div className={styles.opcionesList}>
                  {(formData.workflowsSiguientes?.workflows || []).map((wf, i) => (
                    <div key={i} className={styles.opcionItem}>
                      <span className={styles.opcionNumero}>{i + 1}</span>
                      <input
                        type="text"
                        value={wf.opcion}
                        onChange={(e) => {
                          const nuevosWorkflows = [...(formData.workflowsSiguientes?.workflows || [])];
                          nuevosWorkflows[i] = { ...nuevosWorkflows[i], opcion: e.target.value };
                          handleChange('workflowsSiguientes', {
                            ...formData.workflowsSiguientes,
                            pregunta: formData.workflowsSiguientes?.pregunta || '',
                            workflows: nuevosWorkflows
                          });
                        }}
                        placeholder="Consultar otro producto"
                        className={styles.input}
                        style={{flex: 1}}
                      />
                      <select
                        value={wf.workflowId}
                        onChange={(e) => {
                          const nuevosWorkflows = [...(formData.workflowsSiguientes?.workflows || [])];
                          nuevosWorkflows[i] = { ...nuevosWorkflows[i], workflowId: e.target.value };
                          handleChange('workflowsSiguientes', {
                            ...formData.workflowsSiguientes,
                            pregunta: formData.workflowsSiguientes?.pregunta || '',
                            workflows: nuevosWorkflows
                          });
                        }}
                        className={styles.select}
                        style={{flex: 1}}
                      >
                        <option value="">Seleccionar workflow</option>
                        {workflows.map((workflow) => (
                          <option key={workflow._id || workflow.id} value={workflow._id || workflow.id}>
                            {workflow.nombre}
                          </option>
                        ))}
                        {formData._id && (
                          <option value={formData._id}>
                            {formData.nombre} (este workflow)
                          </option>
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const nuevosWorkflows = (formData.workflowsSiguientes?.workflows || []).filter((_, idx) => idx !== i);
                          handleChange('workflowsSiguientes', {
                            ...formData.workflowsSiguientes,
                            pregunta: formData.workflowsSiguientes?.pregunta || '',
                            workflows: nuevosWorkflows
                          });
                        }}
                        className={styles.removeButton}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nuevosWorkflows = [...(formData.workflowsSiguientes?.workflows || []), { workflowId: '', opcion: '' }];
                    handleChange('workflowsSiguientes', {
                      ...formData.workflowsSiguientes,
                      pregunta: formData.workflowsSiguientes?.pregunta || '',
                      workflows: nuevosWorkflows
                    });
                  }}
                  className={styles.addButton}
                  style={{marginTop: '0.5rem'}}
                >
                  + Agregar Workflow
                </button>
                <small>💡 Puedes encadenar workflows existentes o incluso este mismo workflow para permitir consultas repetidas</small>
              </div>

              <div className={styles.divider} style={{margin: '2rem 0 1.5rem'}}>
                <span>🔄 Repetición del Workflow (Opcional)</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.repetirWorkflow?.habilitado || false}
                    onChange={(e) => handleChange('repetirWorkflow', {
                      habilitado: e.target.checked,
                      desdePaso: formData.repetirWorkflow?.desdePaso || 3,
                      variablesALimpiar: formData.repetirWorkflow?.variablesALimpiar || [],
                      pregunta: formData.repetirWorkflow?.pregunta || '',
                      opcionRepetir: formData.repetirWorkflow?.opcionRepetir || '',
                      opcionFinalizar: formData.repetirWorkflow?.opcionFinalizar || ''
                    })}
                  />
                  Permitir repetir el workflow desde un paso específico
                </label>
                <small>Al finalizar, el usuario podrá elegir repetir la búsqueda manteniendo datos anteriores</small>
              </div>

              {formData.repetirWorkflow?.habilitado && (
                <>
                  <div className={styles.formGroup}>
                    <label>Repetir desde paso</label>
                    <select
                      value={formData.repetirWorkflow?.desdePaso || 1}
                      onChange={(e) => handleChange('repetirWorkflow', {
                        ...formData.repetirWorkflow,
                        desdePaso: parseInt(e.target.value)
                      })}
                      className={styles.select}
                    >
                      {formData.steps.map((step) => (
                        <option key={step.orden} value={step.orden}>
                          Paso {step.orden} - {step.nombre || step.nombreVariable}
                        </option>
                      ))}
                    </select>
                    <small>Los datos de pasos anteriores se conservarán</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Variables a limpiar</label>
                    <div className={styles.variablesCheckboxList}>
                      {formData.steps
                        .filter(s => s.orden >= (formData.repetirWorkflow?.desdePaso || 1))
                        .map((step) => (
                          <label key={step.nombreVariable} className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={formData.repetirWorkflow?.variablesALimpiar?.includes(step.nombreVariable) || false}
                              onChange={(e) => {
                                const current = formData.repetirWorkflow?.variablesALimpiar || [];
                                const updated = e.target.checked
                                  ? [...current, step.nombreVariable]
                                  : current.filter(v => v !== step.nombreVariable);
                                handleChange('repetirWorkflow', {
                                  ...formData.repetirWorkflow,
                                  variablesALimpiar: updated
                                });
                              }}
                            />
                            {step.nombreVariable}
                          </label>
                        ))}
                    </div>
                    <small>Estas variables se borrarán al repetir</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Pregunta de repetición</label>
                    <input
                      type="text"
                      value={formData.repetirWorkflow?.pregunta || ''}
                      onChange={(e) => handleChange('repetirWorkflow', {
                        ...formData.repetirWorkflow,
                        pregunta: e.target.value
                      })}
                      placeholder="¿Deseas buscar otro producto?"
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formRow} style={{display: 'flex', gap: '1rem'}}>
                    <div className={styles.formGroup} style={{flex: 1}}>
                      <label>Texto opción repetir</label>
                      <input
                        type="text"
                        value={formData.repetirWorkflow?.opcionRepetir || ''}
                        onChange={(e) => handleChange('repetirWorkflow', {
                          ...formData.repetirWorkflow,
                          opcionRepetir: e.target.value
                        })}
                        placeholder="Buscar otro producto"
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup} style={{flex: 1}}>
                      <label>Texto opción finalizar</label>
                      <input
                        type="text"
                        value={formData.repetirWorkflow?.opcionFinalizar || ''}
                        onChange={(e) => handleChange('repetirWorkflow', {
                          ...formData.repetirWorkflow,
                          opcionFinalizar: e.target.value
                        })}
                        placeholder="Terminar"
                        className={styles.input}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className={styles.formGroup}>
                <label>Mensaje de Abandono</label>
                <textarea
                  value={formData.mensajeAbandonar || ''}
                  onChange={(e) => handleChange('mensajeAbandonar', e.target.value)}
                  placeholder="🚫 Búsqueda cancelada"
                  rows={2}
                  className={styles.textarea}
                />
                <small>Ejemplo: "🚫 Búsqueda cancelada. Escribí 'buscar' cuando quieras empezar de nuevo."</small>
              </div>
            </div>
          )}

          {/* Paso 5: Revisión */}
          {paso === 5 && (
            <div className={styles.paso}>
              <h3>👁️ Revisión Final</h3>
              <p className={styles.pasoDes}>Verifica la configuración antes de guardar</p>

              <div className={styles.revision}>
                <div className={styles.revisionSection}>
                  <h4>📋 Información</h4>
                  <div className={styles.revisionItem}>
                    <span>Nombre:</span>
                    <strong>{formData.nombre}</strong>
                  </div>
                  {formData.descripcion && (
                    <div className={styles.revisionItem}>
                      <span>Descripción:</span>
                      <strong>{formData.descripcion}</strong>
                    </div>
                  )}
                  <div className={styles.revisionItem}>
                    <span>Prioridad:</span>
                    <strong>{formData.prioridad}</strong>
                  </div>
                  <div className={styles.revisionItem}>
                    <span>Timeout:</span>
                    <strong>{formData.timeoutMinutos} minutos</strong>
                  </div>
                </div>

                <div className={styles.revisionSection}>
                  <h4>🎯 Activación</h4>
                  <div className={styles.revisionItem}>
                    <span>Tipo:</span>
                    <strong>
                      {formData.trigger.tipo === 'keyword' && 'Por Palabras Clave'}
                      {formData.trigger.tipo === 'primer_mensaje' && 'Primer Mensaje'}
                      {formData.trigger.tipo === 'manual' && 'Manual'}
                    </strong>
                  </div>
                  {formData.trigger.tipo === 'keyword' && (
                    <div className={styles.revisionItem}>
                      <span>Keywords:</span>
                      <div className={styles.keywordsList}>
                        {formData.trigger.keywords?.map((k, i) => (
                          <span key={i} className={styles.keywordItem}>{k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.revisionSection}>
                  <h4>📝 Pasos ({formData.steps.length})</h4>
                  {formData.steps.map((step, idx) => (
                    <div key={idx} className={styles.revisionStep}>
                      <span className={styles.stepNumber}>Paso {step.orden}</span>
                      <div>
                        <strong>
                          {step.tipo === 'recopilar' && '📝 Recopilar: '}
                          {step.tipo === 'consulta_filtrada' && '🔍 Consulta Filtrada: '}
                          {step.nombre || step.nombreVariable}
                        </strong>
                        {step.pregunta && <p>{step.pregunta}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.revisionSection}>
                  <h4>⚙️ Configuración</h4>
                  <div className={styles.revisionItem}>
                    <span>Estado:</span>
                    <strong>{formData.activo ? '✅ Activo' : '⏸️ Inactivo'}</strong>
                  </div>
                  <div className={styles.revisionItem}>
                    <span>Permitir cancelar:</span>
                    <strong>{formData.permitirAbandonar ? 'Sí' : 'No'}</strong>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => handleChange('activo', e.target.checked)}
                  />
                  Activar workflow inmediatamente
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.permitirAbandonar !== false}
                    onChange={(e) => handleChange('permitirAbandonar', e.target.checked)}
                  />
                  Permitir que el usuario cancele con "cancelar"
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones de navegación */}
        <div className={styles.footer}>
          <div className={styles.footerButtons}>
            {paso > 1 && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleAnterior}
                disabled={loading}
              >
                <ChevronLeft size={20} />
                Anterior
              </button>
            )}

            <div className={styles.footerRight}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>

              {paso < 5 ? (
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleSiguiente}
                  disabled={loading}
                >
                  Siguiente
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar Workflow'}
                </button>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
