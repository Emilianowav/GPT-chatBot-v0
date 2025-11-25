'use client';

// 📝 Editor de Pasos de Workflow Conversacional

import { useState, useEffect } from 'react';
import { Database, Zap, Code2, Hash, Type } from 'lucide-react';
import CodeInput from './CodeInput';
import Tooltip from './Tooltip';
import EndpointFieldSelector from './EndpointFieldSelector';
import styles from './WorkflowManager.module.css';

type ValidationType = 'texto' | 'numero' | 'opcion' | 'regex';
type StepType = 'recopilar' | 'ejecutar' | 'validar';

interface StepValidation {
  tipo: ValidationType;
  opciones?: string[];
  regex?: string;
  mensajeError?: string;
}

interface EndpointResponseConfig {
  arrayPath: string;
  idField: string;
  displayField: string;
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
  nombre?: string;
  descripcion?: string;
  mensajeError?: string;
  intentosMaximos?: number;
}

interface Endpoint {
  _id?: string;
  id?: string;
  nombre: string;
  metodo: string;
}

interface Props {
  step: FlowStep;
  index: number;
  endpoints: Endpoint[];
  apiBaseUrl?: string;
  apiAuth?: any;
  variables: string[];
  onChange: (index: number, step: FlowStep) => void;
  onRemove: (index: number) => void;
}

export default function WorkflowStepEditor({ step, index, onChange, onRemove, endpoints, variables, apiBaseUrl, apiAuth }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Migración automática de datos antiguos al cargar
  useEffect(() => {
    if (step.tipo === 'recopilar' && step.validacion?.tipo === 'opcion' && !step.endpointResponseConfig) {
      // Migrar automáticamente datos del formato antiguo al nuevo
      const config = {
        arrayPath: step.validacion?.regex || 'data',
        idField: step.validacion?.opciones?.[0] || 'id',
        displayField: step.validacion?.opciones?.[1] || 'name'
      };
      
      onChange(index, {
        ...step,
        endpointResponseConfig: config
      });
    }
  }, [step, index, onChange]);

  const [newOption, setNewOption] = useState('');

  const handleChange = (field: string, value: any) => {
    onChange(index, { ...step, [field]: value });
  };

  const handleValidationChange = (field: string, value: any) => {
    onChange(index, {
      ...step,
      validacion: { ...step.validacion, [field]: value } as StepValidation
    });
  };

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    const opciones = step.validacion?.opciones || [];
    handleValidationChange('opciones', [...opciones, newOption.trim()]);
    setNewOption('');
  };

  const handleRemoveOption = (optionIndex: number) => {
    const opciones = step.validacion?.opciones || [];
    handleValidationChange('opciones', opciones.filter((_, i) => i !== optionIndex));
  };

  const handleMapeoChange = (paramName: string, varName: string) => {
    const mapeo = step.mapeoParametros || {};
    onChange(index, {
      ...step,
      mapeoParametros: { ...mapeo, [paramName]: varName }
    });
  };

  const handleEndpointConfigChange = (field: string, value: string) => {
    // Migrar datos antiguos si existen
    let config = step.endpointResponseConfig;
    if (!config) {
      config = {
        arrayPath: step.validacion?.regex || 'data',
        idField: step.validacion?.opciones?.[0] || 'id',
        displayField: step.validacion?.opciones?.[1] || 'name'
      };
    }
    
    onChange(index, {
      ...step,
      endpointResponseConfig: { ...config, [field]: value }
    });
  };

  return (
    <div className={styles.stepCard}>
      <div className={styles.stepHeader} onClick={() => setExpanded(!expanded)}>
        <div className={styles.stepInfo}>
          <span className={styles.stepNumber}>Paso {step.orden}</span>
          <span className={styles.stepType}>
            {step.tipo === 'recopilar' && '📝 Recopilar'}
            {step.tipo === 'ejecutar' && '⚡ Ejecutar'}
            {step.tipo === 'validar' && '✅ Validar'}
          </span>
          <span className={styles.stepName}>
            {step.nombre || step.pregunta || step.nombreVariable}
          </span>
        </div>
        <div className={styles.stepActions}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? '▼' : '▶'}
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
          >
            🗑️
          </button>
        </div>
      </div>

      {expanded && (
        <div className={styles.stepContent}>
          {/* Tipo de Paso */}
          <div className={styles.formGroup}>
            <label>Tipo de Paso</label>
            <select
              value={step.tipo}
              onChange={(e) => handleChange('tipo', e.target.value as StepType)}
              className={styles.select}
            >
              <option value="recopilar">📝 Recopilar - Consultar endpoint y mostrar opciones</option>
              <option value="ejecutar">⚡ Ejecutar - Endpoint final con todas las variables</option>
            </select>
            <small style={{marginTop: '0.5rem', display: 'block', color: 'rgba(255, 255, 255, 0.5)'}}>
              {step.tipo === 'recopilar' && 'Consulta un endpoint, muestra las opciones al usuario y guarda su selección'}
              {step.tipo === 'ejecutar' && 'Ejecuta el endpoint final usando todas las variables recopiladas'}
            </small>
          </div>

          {/* Nombre del Paso */}
          <div className={styles.formGroup}>
            <label>Nombre del Paso (opcional)</label>
            <input
              type="text"
              value={step.nombre || ''}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Ej: Seleccionar sucursal"
              className={styles.input}
            />
          </div>

          {/* Campos para Recopilar */}
          {step.tipo === 'recopilar' && (
            <>
              <div className={styles.formGroup}>
                <label>Endpoint a Consultar *</label>
                <select
                  value={step.endpointId || ''}
                  onChange={(e) => handleChange('endpointId', e.target.value)}
                  className={styles.select}
                >
                  <option value="">Seleccionar endpoint</option>
                  {endpoints.map((endpoint) => (
                    <option key={endpoint.id || endpoint._id} value={endpoint.id || endpoint._id}>
                      {endpoint.metodo} {endpoint.nombre}
                    </option>
                  ))}
                </select>
                <small>Este endpoint se consultará para obtener las opciones a mostrar</small>
              </div>

              {variables.length > 0 && (
                <div className={styles.formGroup}>
                  <label>Filtrar con variables anteriores (opcional)</label>
                  <p className={styles.helpText}>
                    Usa las variables recopiladas en pasos anteriores para filtrar este endpoint
                  </p>
                  <div className={styles.mapeoList}>
                    {variables.map((variable) => (
                      <div key={variable} className={styles.mapeoItem}>
                        <span className={styles.variableName}>{variable}</span>
                        <span>→</span>
                        <input
                          type="text"
                          placeholder="nombre_parametro"
                          value={step.mapeoParametros?.[variable] || ''}
                          onChange={(e) => handleMapeoChange(variable, e.target.value)}
                          className={styles.input}
                        />
                      </div>
                    ))}
                  </div>
                  <small>Ejemplo: Si la variable es "sucursal_id", el parámetro podría ser "sucursal"</small>
                </div>
              )}

              <CodeInput
                label="Mensaje al Usuario"
                value={step.pregunta || ''}
                onChange={(value) => handleChange('pregunta', value)}
                placeholder="Elegí tu sucursal:"
                tooltip="Este mensaje se mostrará antes de las opciones numeradas"
                required
                icon="💬"
              />

              <CodeInput
                label="Nombre de Variable"
                value={step.nombreVariable}
                onChange={(value) => handleChange('nombreVariable', value)}
                placeholder="sucursal_id"
                tooltip="La selección del usuario se guardará aquí. Usa snake_case. Ej: sucursal_id, categoria_id"
                suggestions={['sucursal_id', 'categoria_id', 'producto_id', 'user_id', 'item_id']}
                required
                icon="🔤"
                monospace
              />

              <div className={styles.divider}>
                <span>⚙️ Configuración de Respuesta del Endpoint</span>
              </div>

              <CodeInput
                label="Ruta al Array"
                value={step.endpointResponseConfig?.arrayPath || 'data'}
                onChange={(value) => handleEndpointConfigChange('arrayPath', value)}
                placeholder="data"
                tooltip="Ruta donde está el array en la respuesta JSON. Ej: data, results, items"
                suggestions={['data', 'results', 'items', 'list', 'records']}
                icon="📦"
                monospace
              />

              {step.endpointId && (
                <>
                  <EndpointFieldSelector
                    endpointId={step.endpointId}
                    endpoints={endpoints}
                    apiBaseUrl={apiBaseUrl}
                    apiAuth={apiAuth}
                    selectedField={step.endpointResponseConfig?.idField}
                    onFieldSelect={(field) => handleEndpointConfigChange('idField', field)}
                    label="🔑 Campo ID - Selecciona el identificador único"
                  />

                  <EndpointFieldSelector
                    endpointId={step.endpointId}
                    endpoints={endpoints}
                    apiBaseUrl={apiBaseUrl}
                    apiAuth={apiAuth}
                    selectedField={step.endpointResponseConfig?.displayField}
                    onFieldSelect={(field) => handleEndpointConfigChange('displayField', field)}
                    label="👁️ Campo a Mostrar - Selecciona qué mostrar al usuario"
                  />
                </>
              )}

              <div className={styles.ejemploBox} style={{marginTop: '1rem'}}>
                <strong>💡 Ejemplo de configuración:</strong>
                <p style={{fontSize: '0.875rem', margin: '0.5rem 0'}}>
                  Si tu endpoint devuelve:
                </p>
                <pre style={{fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', overflow: 'auto'}}>
{`{
  "success": true,
  "data": [
    {"id": "5", "name": "Buenos Aires"},
    {"id": "2", "name": "Corrientes"}
  ]
}`}
                </pre>
                <p style={{fontSize: '0.875rem', margin: '0.5rem 0 0'}}>
                  • <strong>Ruta al Array:</strong> <code>data</code><br/>
                  • <strong>Campo ID:</strong> <code>id</code><br/>
                  • <strong>Campo a Mostrar:</strong> <code>name</code><br/>
                  • <strong>Se mostrará:</strong> "1. Buenos Aires, 2. Corrientes"
                </p>
              </div>
            </>
          )}

          {/* Campos para Ejecutar */}
          {step.tipo === 'ejecutar' && (
            <>
              <div className={styles.formGroup}>
                <label>Endpoint a Ejecutar *</label>
                <select
                  value={step.endpointId || ''}
                  onChange={(e) => handleChange('endpointId', e.target.value)}
                  className={styles.select}
                >
                  <option value="">Seleccionar endpoint</option>
                  {endpoints.map((endpoint) => (
                    <option key={endpoint.id || endpoint._id} value={endpoint.id || endpoint._id}>
                      {endpoint.metodo} {endpoint.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Mapeo de Parámetros</label>
                <p className={styles.helpText}>
                  Mapea las variables recopiladas a los parámetros del endpoint
                </p>
                <div className={styles.mapeoList}>
                  {variables.map((variable) => (
                    <div key={variable} className={styles.mapeoItem}>
                      <span className={styles.variableName}>{variable}</span>
                      <span>→</span>
                      <input
                        type="text"
                        placeholder="nombre_parametro"
                        value={step.mapeoParametros?.[variable] || ''}
                        onChange={(e) => handleMapeoChange(variable, e.target.value)}
                        className={styles.input}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
