import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Globe, Lock, ChevronDown, ChevronUp, Info, Play, Database, Variable } from 'lucide-react';
import { VariableSelector } from '../VariableSelector';
import { VariableChipInput } from './VariableChipInput';
import styles from './HTTPConfigModal.module.css';

interface HTTPConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: any) => void;
  initialConfig?: any;
  globalVariables?: string[];
  availableNodes?: Array<{ id: string; label: string; type: string }>;
  onTestRequest?: (config: any) => Promise<any>;
  onCreateVariable?: (name: string, value: string) => void;
}

export default function HTTPConfigModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialConfig,
  globalVariables = [],
  availableNodes = [],
  onTestRequest,
  onCreateVariable 
}: HTTPConfigModalProps) {
  // Estados para el selector de variables
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState({ x: 0, y: 0 });
  const [activeField, setActiveField] = useState<{ type: 'url' | 'queryParam' | 'header' | 'body' | 'auth'; index?: number; field?: 'key' | 'value' } | null>(null);
  const [url, setUrl] = useState(initialConfig?.url || '');
  const [method, setMethod] = useState(initialConfig?.method || 'GET');
  const [timeout, setTimeout] = useState(initialConfig?.timeout || 30000);
  
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>(
    initialConfig?.headers 
      ? Object.entries(initialConfig.headers).map(([key, value]) => ({ key, value: String(value) }))
      : []
  );
  
  const [queryParams, setQueryParams] = useState<Array<{ key: string; value: string }>>(
    initialConfig?.queryParams 
      ? Object.entries(initialConfig.queryParams).map(([key, value]) => ({ key, value: String(value) }))
      : []
  );
  
  const [body, setBody] = useState(initialConfig?.body || '');
  
  const [authType, setAuthType] = useState(initialConfig?.auth?.type || 'none');
  const [apiKey, setApiKey] = useState(initialConfig?.auth?.apiKey || '');
  const [apiKeyHeader, setApiKeyHeader] = useState(initialConfig?.auth?.apiKeyHeader || 'x-api-key');
  const [bearerToken, setBearerToken] = useState(initialConfig?.auth?.bearerToken || '');
  const [username, setUsername] = useState(initialConfig?.auth?.username || '');
  const [password, setPassword] = useState(initialConfig?.auth?.password || '');
  
  const [dataPath, setDataPath] = useState(initialConfig?.responseMapping?.dataPath || '');
  const [errorPath, setErrorPath] = useState(initialConfig?.responseMapping?.errorPath || '');
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAuth, setShowAuth] = useState(authType !== 'none');
  const [showVariables, setShowVariables] = useState(false);
  
  // Estados para testing y mapeo
  const [isTesting, setIsTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [showResponseMapper, setShowResponseMapper] = useState(false);
  const [showTestVariables, setShowTestVariables] = useState(false);
  
  // Variables de prueba para testing
  const [testVariables, setTestVariables] = useState<Record<string, string>>({
    telefono_usuario: '46027664' // Número de prueba por defecto
  });
  
  // Variables a guardar
  const [saveApiKeyAsVariable, setSaveApiKeyAsVariable] = useState(false);
  const [apiKeyVariableName, setApiKeyVariableName] = useState('api_key');
  const [variableMappings, setVariableMappings] = useState<Array<{ 
    responsePath: string; 
    variableName: string; 
    variableType: 'global' | 'topic';
  }>>(initialConfig?.variableMappings || []);

  // Función para enmascarar API keys
  const maskApiKey = (key: string): string => {
    if (!key || key.length < 8) return key;
    const visibleChars = 4;
    const start = key.substring(0, visibleChars);
    const end = key.substring(key.length - visibleChars);
    const masked = '•'.repeat(Math.min(key.length - (visibleChars * 2), 20));
    return `${start}${masked}${end}`;
  };

  // Detectar variables usadas en la configuración
  const detectUsedVariables = () => {
    const variables = new Set<string>();
    const regex = /\{\{\s*(\w+)\s*\}\}/g;
    
    // Buscar en URL
    let match;
    while ((match = regex.exec(url)) !== null) {
      variables.add(match[1]);
    }
    
    // Buscar en query params
    queryParams.forEach(param => {
      const paramRegex = /\{\{\s*(\w+)\s*\}\}/g;
      let paramMatch;
      while ((paramMatch = paramRegex.exec(param.value)) !== null) {
        variables.add(paramMatch[1]);
      }
    });
    
    // Buscar en body
    if (body) {
      const bodyRegex = /\{\{\s*(\w+)\s*\}\}/g;
      let bodyMatch;
      while ((bodyMatch = bodyRegex.exec(body)) !== null) {
        variables.add(bodyMatch[1]);
      }
    }
    
    return Array.from(variables);
  };

  // Actualizar todos los estados cuando initialConfig cambie o el modal se abra
  useEffect(() => {
    console.log('🔧 HTTPConfigModal useEffect:', { isOpen, initialConfig });
    if (isOpen && initialConfig) {
      console.log('✅ Cargando configuración guardada:', JSON.stringify(initialConfig, null, 2));
      setUrl(initialConfig.url || '');
      setMethod(initialConfig.method || 'GET');
      setTimeout(initialConfig.timeout || 30000);
      
      setHeaders(
        initialConfig.headers 
          ? Object.entries(initialConfig.headers).map(([key, value]) => ({ key, value: String(value) }))
          : []
      );
      
      setQueryParams(
        initialConfig.queryParams 
          ? Object.entries(initialConfig.queryParams).map(([key, value]) => ({ key, value: String(value) }))
          : []
      );
      
      setBody(initialConfig.body || '');
      
      setAuthType(initialConfig.auth?.type || 'none');
      setApiKey(initialConfig.auth?.apiKey || '');
      setApiKeyHeader(initialConfig.auth?.apiKeyHeader || 'x-api-key');
      setBearerToken(initialConfig.auth?.bearerToken || '');
      setUsername(initialConfig.auth?.username || '');
      setPassword(initialConfig.auth?.password || '');
      
      setDataPath(initialConfig.responseMapping?.dataPath || '');
      setErrorPath(initialConfig.responseMapping?.errorPath || '');
      
      setSaveApiKeyAsVariable(initialConfig.saveApiKeyAsVariable || false);
      setApiKeyVariableName(initialConfig.apiKeyVariableName || 'api_key');
      setVariableMappings(initialConfig.variableMappings || []);
      
      setShowAuth(initialConfig.auth?.type !== 'none');
    } else if (isOpen && !initialConfig) {
      // Resetear a valores por defecto si no hay initialConfig
      setUrl('');
      setMethod('GET');
      setTimeout(30000);
      setHeaders([]);
      setQueryParams([]);
      setBody('');
      setAuthType('none');
      setApiKey('');
      setApiKeyHeader('x-api-key');
      setBearerToken('');
      setUsername('');
      setPassword('');
      setDataPath('');
      setErrorPath('');
      setSaveApiKeyAsVariable(false);
      setApiKeyVariableName('api_key');
      setVariableMappings([]);
      setShowAuth(false);
      setTestResponse(null);
      setTestError(null);
      setShowResponseMapper(false);
    }
  }, [isOpen, initialConfig]);

  const handleSave = () => {
    const headersObj = headers.reduce((acc, { key, value }) => {
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const queryParamsObj = queryParams.reduce((acc, { key, value }) => {
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    if (authType === 'api-key' && apiKey && apiKeyHeader) {
      headersObj[apiKeyHeader] = apiKey;
    } else if (authType === 'bearer' && bearerToken) {
      headersObj['Authorization'] = `Bearer ${bearerToken}`;
    } else if (authType === 'basic' && username && password) {
      headersObj['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`;
    }

    onSave({
      url,
      method,
      headers: headersObj,
      queryParams: queryParamsObj,
      body: method !== 'GET' ? body : undefined,
      timeout,
      auth: {
        type: authType,
        apiKey: authType === 'api-key' ? apiKey : undefined,
        apiKeyHeader: authType === 'api-key' ? apiKeyHeader : undefined,
        bearerToken: authType === 'bearer' ? bearerToken : undefined,
        username: authType === 'basic' ? username : undefined,
        password: authType === 'basic' ? password : undefined,
      },
      responseMapping: { dataPath, errorPath },
      variableMappings,
      saveApiKeyAsVariable: authType === 'api-key' ? saveApiKeyAsVariable : false,
      apiKeyVariableName: authType === 'api-key' && saveApiKeyAsVariable ? apiKeyVariableName : undefined,
    });
  };

  const openVariableSelector = (event: React.MouseEvent, type: 'url' | 'queryParam' | 'header' | 'body' | 'auth', index?: number, field?: 'key' | 'value') => {
    event.preventDefault();
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setSelectorPosition({ x: rect.right + 10, y: rect.top });
    setActiveField({ type, index, field });
    setShowVariableSelector(true);
  };

  const handleVariableSelect = (variable: string) => {
    if (!activeField) return;

    switch (activeField.type) {
      case 'url':
        setUrl((prev: string) => prev + variable);
        break;
      case 'queryParam':
        if (activeField.index !== undefined && activeField.field) {
          updateQueryParam(activeField.index, activeField.field, queryParams[activeField.index][activeField.field] + variable);
        }
        break;
      case 'header':
        if (activeField.index !== undefined && activeField.field) {
          updateHeader(activeField.index, activeField.field, headers[activeField.index][activeField.field] + variable);
        }
        break;
      case 'body':
        setBody((prev: string) => prev + variable);
        break;
      case 'auth':
        if (authType === 'api-key') {
          setApiKey((prev: string) => prev + variable);
        } else if (authType === 'bearer') {
          setBearerToken((prev: string) => prev + variable);
        }
        break;
    }

    setShowVariableSelector(false);
    setActiveField(null);
  };

  const addHeader = () => {
    console.log('🔧 Agregando header...');
    setHeaders([...headers, { key: '', value: '' }]);
  };
  const removeHeader = (index: number) => setHeaders(headers.filter((_, i) => i !== index));
  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const addQueryParam = () => {
    console.log('🔧 Agregando query param...');
    setQueryParams([...queryParams, { key: '', value: '' }]);
  };
  const removeQueryParam = (index: number) => setQueryParams(queryParams.filter((_, i) => i !== index));
  const updateQueryParam = (index: number, field: 'key' | 'value', value: string) => {
    const newParams = [...queryParams];
    newParams[index][field] = value;
    setQueryParams(newParams);
  };

  const handleTestRequest = async () => {
    if (!onTestRequest) return;
    
    setIsTesting(true);
    setTestError(null);
    setTestResponse(null);
    
    try {
      const config = buildConfig();
      // Pasar las variables de prueba junto con la configuración
      const response = await onTestRequest({ ...config, testVariables });
      setTestResponse(response);
      setShowResponseMapper(true);
    } catch (error: any) {
      setTestError(error.message || 'Error al ejecutar la solicitud');
    } finally {
      setIsTesting(false);
    }
  };

  const updateTestVariable = (name: string, value: string) => {
    setTestVariables({ ...testVariables, [name]: value });
  };

  const buildConfig = () => {
    const headersObj = headers.reduce((acc, { key, value }) => {
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const queryParamsObj = queryParams.reduce((acc, { key, value }) => {
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    if (authType === 'api-key' && apiKey && apiKeyHeader) {
      headersObj[apiKeyHeader] = apiKey;
    } else if (authType === 'bearer' && bearerToken) {
      headersObj['Authorization'] = `Bearer ${bearerToken}`;
    } else if (authType === 'basic' && username && password) {
      headersObj['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`;
    }

    return {
      url,
      method,
      headers: headersObj,
      queryParams: queryParamsObj,
      body: method !== 'GET' ? body : undefined,
      timeout,
    };
  };

  const extractFieldsFromResponse = (obj: any, prefix = ''): string[] => {
    const fields: string[] = [];
    
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        const path = prefix ? `${prefix}.${key}` : key;
        fields.push(path);
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          fields.push(...extractFieldsFromResponse(obj[key], path));
        }
      });
    }
    
    return fields;
  };

  const addVariableMapping = (responsePath: string, variableName: string, variableType: 'global' | 'topic') => {
    setVariableMappings([...variableMappings, { responsePath, variableName, variableType }]);
  };

  const removeVariableMapping = (index: number) => {
    setVariableMappings(variableMappings.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.appIcon}>
              <Globe size={28} color="white" strokeWidth={2} />
            </div>
            <div>
              <h2 className={styles.modalTitle}>HTTP Request</h2>
              <span className={styles.verifiedBadge}>✓ No-Code API Integration</span>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              URL del Endpoint <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              className={styles.input}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/endpoint"
            />
            <p className={styles.helpText}>
              💡 Usa variables: <code>{'{'}{'{'} telefono {'}'}{'}'}</code>, <code>{'{'}{'{'} comitente {'}'}{'}'}</code>
            </p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Método HTTP <span className={styles.required}>*</span></label>
            <select className={styles.select} value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="GET">GET - Obtener datos</option>
              <option value="POST">POST - Crear/Enviar datos</option>
              <option value="PUT">PUT - Actualizar datos</option>
              <option value="DELETE">DELETE - Eliminar datos</option>
              <option value="PATCH">PATCH - Actualizar parcialmente</option>
            </select>
          </div>

          <div className={styles.section}>
            <button className={styles.sectionHeader} onClick={() => setShowAuth(!showAuth)} type="button">
              <Lock size={18} />
              <span>Autenticación</span>
              {showAuth ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showAuth && (
              <div className={styles.sectionContent}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tipo de Autenticación</label>
                  <select className={styles.select} value={authType} onChange={(e) => setAuthType(e.target.value)}>
                    <option value="none">Sin autenticación</option>
                    <option value="api-key">API Key (Header personalizado)</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth (Usuario/Contraseña)</option>
                  </select>
                </div>
                {authType === 'api-key' && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Nombre del Header</label>
                      <input type="text" className={styles.input} value={apiKeyHeader} onChange={(e) => setApiKeyHeader(e.target.value)} placeholder="x-api-key" />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>API Key</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="text" 
                          className={styles.input} 
                          value={apiKey ? maskApiKey(apiKey) : ''} 
                          onFocus={(e) => {
                            if (apiKey) {
                              e.target.value = apiKey;
                              e.target.type = 'text';
                            }
                          }}
                          onBlur={(e) => {
                            e.target.type = 'text';
                          }}
                          onChange={(e) => setApiKey(e.target.value)} 
                          placeholder="tu_api_key_aqui" 
                        />
                      </div>
                    </div>
                  </>
                )}
                {authType === 'bearer' && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Bearer Token</label>
                    <input 
                      type="text" 
                      className={styles.input} 
                      value={bearerToken ? maskApiKey(bearerToken) : ''} 
                      onFocus={(e) => {
                        if (bearerToken) {
                          e.target.value = bearerToken;
                        }
                      }}
                      onChange={(e) => setBearerToken(e.target.value)} 
                    />
                  </div>
                )}
                {authType === 'basic' && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Usuario</label>
                      <input type="text" className={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Contraseña</label>
                      <input type="password" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Query Parameters (URL)</label>
            {queryParams.map((param, index) => (
              <div key={index} className={styles.paramRow}>
                <input 
                  type="text" 
                  className={styles.inputKey} 
                  value={param.key} 
                  onChange={(e) => updateQueryParam(index, 'key', e.target.value)} 
                  placeholder="parametro" 
                />
                <VariableChipInput
                  value={param.value}
                  onChange={(value) => updateQueryParam(index, 'value', value)}
                  onOpenVariableSelector={(e) => openVariableSelector(e, 'queryParam', index, 'value')}
                  placeholder="valor o {{variable}}"
                  className={styles.chipInput}
                />
                <button onClick={() => removeQueryParam(index)} className={styles.btnDelete} type="button">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button onClick={addQueryParam} className={styles.btnAdd} type="button">
              <Plus size={16} /> Agregar Parámetro
            </button>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Headers Personalizados</label>
            {headers.map((header, index) => (
              <div key={index} className={styles.paramRow}>
                <input 
                  type="text" 
                  className={styles.inputKey} 
                  value={header.key} 
                  onChange={(e) => updateHeader(index, 'key', e.target.value)} 
                  placeholder="Content-Type" 
                />
                <VariableChipInput
                  value={header.value}
                  onChange={(value) => updateHeader(index, 'value', value)}
                  onOpenVariableSelector={(e) => openVariableSelector(e, 'header', index, 'value')}
                  placeholder="valor o {{variable}}"
                  className={styles.chipInput}
                />
                <button onClick={() => removeHeader(index)} className={styles.btnDelete} type="button">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button onClick={addHeader} className={styles.btnAdd} type="button">
              <Plus size={16} /> Agregar Header
            </button>
          </div>

          {method !== 'GET' && method !== 'DELETE' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Body (JSON)</label>
              <div style={{ position: 'relative' }}>
                <textarea className={styles.textarea} value={body} onChange={(e) => setBody(e.target.value)} placeholder='{"key": "value"}' rows={8} />
                <button 
                  onClick={(e) => openVariableSelector(e, 'body')} 
                  className={styles.btnVariableTextarea}
                  type="button"
                  title="Seleccionar variable"
                >
                  <Variable size={16} />
                </button>
              </div>
            </div>
          )}

          <div className={styles.section}>
            <button className={styles.sectionHeader} onClick={() => setShowAdvanced(!showAdvanced)} type="button">
              <Info size={18} />
              <span>Configuración Avanzada</span>
              {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showAdvanced && (
              <div className={styles.sectionContent}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Timeout (ms)</label>
                  <input type="number" className={styles.input} value={timeout} onChange={(e) => setTimeout(Number(e.target.value))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Ruta de Datos en Respuesta</label>
                  <input type="text" className={styles.input} value={dataPath} onChange={(e) => setDataPath(e.target.value)} placeholder="data" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Ruta de Error en Respuesta</label>
                  <input type="text" className={styles.input} value={errorPath} onChange={(e) => setErrorPath(e.target.value)} placeholder="error" />
                </div>
              </div>
            )}
          </div>

          {/* Sección de Variables Globales */}
          <div className={styles.section}>
            <button className={styles.sectionHeader} onClick={() => setShowVariables(!showVariables)} type="button">
              <Database size={18} />
              <span>Variables Globales y Mapeo</span>
              {showVariables ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showVariables && (
              <div className={styles.sectionContent}>
                {authType === 'api-key' && (
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={saveApiKeyAsVariable}
                        onChange={(e) => setSaveApiKeyAsVariable(e.target.checked)}
                      />
                      <span>Guardar API Key como variable global</span>
                    </label>
                    {saveApiKeyAsVariable && (
                      <input
                        type="text"
                        className={styles.input}
                        value={apiKeyVariableName}
                        onChange={(e) => setApiKeyVariableName(e.target.value)}
                        placeholder="Nombre de la variable"
                        style={{ marginTop: '8px' }}
                      />
                    )}
                    <p className={styles.helpText}>
                      💡 Otros nodos HTTP podrán usar <code>{'{'}{'{'} {apiKeyVariableName} {'}'}{'}'}</code>
                    </p>
                  </div>
                )}

                {/* Sección de Test Variables */}
                {onTestRequest && (
                  <div className={styles.formGroup}>
                    <button 
                      className={styles.sectionHeader} 
                      onClick={() => setShowTestVariables(!showTestVariables)} 
                      type="button"
                      style={{ marginBottom: '12px' }}
                    >
                      <Play size={18} />
                      <span>🧪 Probar Request</span>
                      {showTestVariables ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    
                    {showTestVariables && (
                      <div style={{ 
                        background: '#f8fafc', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px', 
                        padding: '16px',
                        marginBottom: '12px'
                      }}>
                        <p className={styles.helpText} style={{ marginBottom: '12px' }}>
                          💡 Configura valores de prueba para las variables usadas en tu request:
                        </p>
                        
                        {detectUsedVariables().length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {detectUsedVariables().map((varName) => (
                              <div key={varName} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                                  <code style={{ color: '#6366f1' }}>{'{'}{'{'} {varName} {'}'}{'}'}</code>
                                </label>
                                <input
                                  type="text"
                                  className={styles.input}
                                  value={testVariables[varName] || ''}
                                  onChange={(e) => updateTestVariable(varName, e.target.value)}
                                  placeholder={`Valor de prueba para ${varName}`}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className={styles.helpText}>
                            No se detectaron variables en tu configuración. Usa <code>{'{'}{'{'} nombre_variable {'}'}{'}'}</code> en la URL o parámetros.
                          </p>
                        )}
                        
                        <button
                          onClick={handleTestRequest}
                          className={styles.btnTest}
                          type="button"
                          disabled={isTesting || !url}
                          style={{ marginTop: '16px', width: '100%' }}
                        >
                          <Play size={16} />
                          {isTesting ? 'Probando...' : 'Ejecutar Request de Prueba'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.label}>Variables a Guardar</label>
                  {variableMappings.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      {variableMappings.map((mapping, index) => (
                        <div key={index} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: '#f3f4f6',
                          borderRadius: '20px',
                          fontSize: '13px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <code style={{ color: '#6366f1', fontWeight: 500 }}>{mapping.variableName}</code>
                          <span style={{ color: '#9ca3af' }}>←</span>
                          <code style={{ color: '#64748b', fontSize: '11px' }}>{mapping.responsePath}</code>
                          <button
                            onClick={() => removeVariableMapping(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              color: '#ef4444'
                            }}
                            type="button"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.helpText}>Prueba el request para detectar campos disponibles</p>
                  )}

                  {testError && (
                    <div className={styles.errorBox}>
                      <p>❌ {testError}</p>
                    </div>
                  )}

                  {testResponse && showResponseMapper && (
                    <div className={styles.responseMapper}>
                      <h4 className={styles.mapperTitle}>✅ Campos Detectados</h4>
                      <p className={styles.helpText} style={{ marginBottom: '12px' }}>
                        Click en los campos que quieres guardar como variables:
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                        {extractFieldsFromResponse(testResponse).map((field) => {
                          const isSelected = variableMappings.some(m => m.responsePath === field);
                          return (
                            <button
                              key={field}
                              onClick={() => {
                                if (!isSelected) {
                                  const varName = field.split('.').pop() || field;
                                  addVariableMapping(field, varName, 'global');
                                }
                              }}
                              style={{
                                padding: '8px 14px',
                                background: isSelected ? '#6366f1' : '#ffffff',
                                color: isSelected ? '#ffffff' : '#374151',
                                border: isSelected ? '1px solid #6366f1' : '1px solid #d1d5db',
                                borderRadius: '20px',
                                cursor: isSelected ? 'default' : 'pointer',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              type="button"
                              disabled={isSelected}
                            >
                              {isSelected && <span>✓</span>}
                              <code style={{ color: 'inherit' }}>{field}</code>
                            </button>
                          );
                        })}
                      </div>
                      <details style={{ marginTop: '12px' }}>
                        <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '13px' }}>Ver JSON completo</summary>
                        <div className={styles.responsePreview} style={{ marginTop: '8px' }}>
                          <pre>{JSON.stringify(testResponse, null, 2)}</pre>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose}>Cancelar</button>
          <button className={styles.btnSave} onClick={handleSave}>Guardar Configuración</button>
        </div>
        </div>
      </div>

      {/* Variable Selector */}
      <VariableSelector
        isOpen={showVariableSelector}
        onClose={() => {
          setShowVariableSelector(false);
          setActiveField(null);
        }}
        onSelect={handleVariableSelect}
        position={selectorPosition}
        availableNodes={availableNodes}
        globalVariables={globalVariables}
      />
    </>
  );
}
