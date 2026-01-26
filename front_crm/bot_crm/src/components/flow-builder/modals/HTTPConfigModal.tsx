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
  availableNodes?: Array<{ id: string; label: string; type: string; data?: any }>;
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
  const [baseUrl, setBaseUrl] = useState('');
  const [endpointPath, setEndpointPath] = useState('');
  const [saveBaseUrl, setSaveBaseUrl] = useState(true); // Toggle para guardar URL base
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

  // Inicializar baseUrl y endpointPath desde initialConfig
  useEffect(() => {
    if (initialConfig?.url) {
      try {
        const urlObj = new URL(initialConfig.url);
        const base = `${urlObj.protocol}//${urlObj.host}`;
        const path = urlObj.pathname + urlObj.search + urlObj.hash;
        setBaseUrl(base);
        setEndpointPath(path);
      } catch (e) {
        // Si no es una URL válida, usar como está
        setBaseUrl('');
        setEndpointPath(initialConfig.url);
      }
    } else {
      // Limpiar campos si no hay initialConfig
      setBaseUrl('');
      setEndpointPath('');
    }
  }, [initialConfig?.url, isOpen]);

  // Función para enmascarar API keys
  const maskApiKey = (key: string): string => {
    if (!key || key.length < 8) return key;
    const visibleChars = 4;
    const start = key.substring(0, visibleChars);
    const end = key.substring(key.length - visibleChars);
    const masked = '•'.repeat(Math.min(key.length - (visibleChars * 2), 20));
    return `${start}${masked}${end}`;
  };

  // Detectar API Keys únicas de nodos anteriores
  const detectAvailableApiKeys = () => {
    const apiKeys: Array<{ nodeId: string; nodeLabel: string; headerName: string; value: string }> = [];
    const seenKeys = new Set<string>();

    availableNodes.filter(n => n.type === 'http').forEach(node => {
      // Buscar en initialConfig de otros nodos (esto vendría del backend idealmente)
      // Por ahora, sugerimos usar variables de nodos anteriores
      const apiKeyVar = `{{${node.id}.api_key}}`;
      const accessTokenVar = `{{${node.id}.access_token}}`;
      const tokenVar = `{{${node.id}.token}}`;

      if (!seenKeys.has(apiKeyVar)) {
        apiKeys.push({ nodeId: node.id, nodeLabel: node.label, headerName: 'x-api-key', value: apiKeyVar });
        seenKeys.add(apiKeyVar);
      }
    });

    return apiKeys;
  };

  // Detectar URL base de nodos anteriores
  const detectAvailableBaseUrls = () => {
    const baseUrls: Array<{ nodeId: string; nodeLabel: string; baseUrl: string }> = [];
    const seenUrls = new Set<string>();

    availableNodes.filter(n => n.type === 'http').forEach(node => {
      // Leer URL base guardada explícitamente en node.data.config.baseUrl
      if (node.data?.config?.baseUrl) {
        const baseUrl = node.data.config.baseUrl;
        if (!seenUrls.has(baseUrl)) {
          baseUrls.push({ nodeId: node.id, nodeLabel: node.label, baseUrl });
          seenUrls.add(baseUrl);
        }
      }
    });

    return baseUrls;
  };

  // Detectar Headers comunes de nodos anteriores
  const detectAvailableHeaders = () => {
    const headers: Array<{ nodeId: string; nodeLabel: string; key: string; value: string }> = [];
    const seenHeaders = new Set<string>();
    
    // Agregar headers comunes SIEMPRE (para usuarios desde cero)
    const commonHeaders = [
      { key: 'Content-Type', value: 'application/json', nodeLabel: 'Común' },
      { key: 'Accept', value: 'application/json', nodeLabel: 'Común' }
    ];
    
    commonHeaders.forEach(header => {
      if (!seenHeaders.has(header.key)) {
        headers.push({ nodeId: 'common', nodeLabel: header.nodeLabel, key: header.key, value: header.value });
        seenHeaders.add(header.key);
      }
    });
    
    availableNodes.filter(n => n.type === 'http').forEach(node => {
      // Extraer headers reales del nodo anterior
      if (node.data?.config?.headers) {
        Object.entries(node.data.config.headers).forEach(([key, value]) => {
          const headerKey = `${node.id}-${key}`;
          if (!seenHeaders.has(headerKey) && !seenHeaders.has(key)) {
            headers.push({ nodeId: node.id, nodeLabel: node.label, key, value: String(value) });
            seenHeaders.add(headerKey);
          }
        });
      }
      
      // Agregar solo UN Authorization por nodo (priorizar token sobre access_token)
      const authKey = `${node.id}-Authorization`;
      if (!seenHeaders.has(authKey) && !seenHeaders.has('Authorization')) {
        headers.push({ 
          nodeId: node.id, 
          nodeLabel: node.label, 
          key: 'Authorization', 
          value: `Bearer {{${node.id}.token}}` 
        });
        seenHeaders.add(authKey);
      }
      
      // Agregar x-api-key si no existe
      const apiKeyKey = `${node.id}-x-api-key`;
      if (!seenHeaders.has(apiKeyKey) && !seenHeaders.has('x-api-key')) {
        headers.push({ 
          nodeId: node.id, 
          nodeLabel: node.label, 
          key: 'x-api-key', 
          value: `{{${node.id}.api_key}}` 
        });
        seenHeaders.add(apiKeyKey);
      }
    });

    return headers;
  };

  // Detectar Query Parameters comunes de nodos anteriores
  const detectAvailableQueryParams = () => {
    const params: Array<{ nodeId: string; nodeLabel: string; key: string; value: string }> = [];
    const seenParams = new Set<string>();
    
    availableNodes.filter(n => n.type === 'http').forEach(node => {
      // Extraer query params reales del nodo anterior
      if (node.data?.config?.queryParams) {
        Object.entries(node.data.config.queryParams).forEach(([key, value]) => {
          const paramKey = `${node.id}-${key}`;
          if (!seenParams.has(paramKey)) {
            params.push({ nodeId: node.id, nodeLabel: node.label, key, value: String(value) });
            seenParams.add(paramKey);
          }
        });
      }
      
      // Agregar también variables comunes de respuesta
      const commonVars = [
        { key: 'api_key', value: `{{${node.id}.api_key}}` },
        { key: 'token', value: `{{${node.id}.token}}` },
        { key: 'access_token', value: `{{${node.id}.access_token}}` }
      ];

      commonVars.forEach(param => {
        const paramKey = `${node.id}-${param.key}`;
        if (!seenParams.has(paramKey)) {
          params.push({ nodeId: node.id, nodeLabel: node.label, ...param });
          seenParams.add(paramKey);
        }
      });
    });

    return params;
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

    // Combinar baseUrl + endpointPath
    const finalUrl = baseUrl && endpointPath 
      ? `${baseUrl}${endpointPath.startsWith('/') ? endpointPath : '/' + endpointPath}`
      : url;

    onSave({
      url: finalUrl,
      baseUrl: saveBaseUrl && baseUrl ? baseUrl : undefined, // Guardar URL base si el toggle está activo
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

  // Filtrar nodos HTTP anteriores para mostrar variables sugeridas
  const httpNodes = availableNodes.filter(node => node.type === 'http');
  const hasHttpNodes = httpNodes.length > 0;

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.appIcon}>
              <Globe size={16} color="white" strokeWidth={2} />
            </div>
            <div>
              <h2 className={styles.modalTitle}>HTTP Request</h2>
              <span className={styles.verifiedBadge}>✓ No-Code API Integration</span>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Acciones Rápidas - Configuración con 1 click */}
          {hasHttpNodes && (
            <div className={styles.quickActions}>
              <div className={styles.quickActionsHeader}>
                <span className={styles.quickActionsTitle}>⚡ Acciones Rápidas</span>
                <span className={styles.quickActionsSubtitle}>Configura todo con 1 click</span>
              </div>
              
              <div className={styles.actionCards}>
                {httpNodes.map((node, idx) => (
                  <div key={idx} className={styles.actionCard}>
                    <div className={styles.actionCardHeader}>
                      <Globe size={14} />
                      <span className={styles.actionCardTitle}>{node.label}</span>
                    </div>
                    <div className={styles.actionCardButtons}>
                      {/* Botón: Usar misma URL base */}
                      {node.data?.config?.url && (
                        <button
                          type="button"
                          className={styles.actionButton}
                          onClick={() => {
                            try {
                              const urlObj = new URL(node.data.config.url);
                              setUrl(`${urlObj.protocol}//${urlObj.host}`);
                            } catch (e) {}
                          }}
                          title="Usar la misma URL base"
                        >
                          📍 Misma URL base
                        </button>
                      )}
                      
                      {/* Botón: Usar token de respuesta */}
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => {
                          const tokenHeader = { key: 'Authorization', value: `Bearer {{${node.id}.token}}` };
                          const exists = headers.some(h => h.key === 'Authorization');
                          if (!exists) {
                            setHeaders([...headers, tokenHeader]);
                          }
                        }}
                        title="Usar token de la respuesta"
                      >
                        🔐 Usar su token
                      </button>
                      
                      {/* Botón: Usar API Key de respuesta */}
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => {
                          const apiKeyHeader = { key: 'x-api-key', value: `{{${node.id}.api_key}}` };
                          const exists = headers.some(h => h.key === 'x-api-key');
                          if (!exists) {
                            setHeaders([...headers, apiKeyHeader]);
                          }
                        }}
                        title="Usar API Key de la respuesta"
                      >
                        🔑 Usar su API Key
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* URL Base */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              URL Base <span className={styles.required}>*</span>
            </label>
            
            {/* Botones inteligentes para URL Base */}
            {detectAvailableBaseUrls().length > 0 && (
              <div style={{ marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {detectAvailableBaseUrls().map((urlInfo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={styles.smartButton}
                    onClick={() => setBaseUrl(urlInfo.baseUrl)}
                    title={`Usar URL base de ${urlInfo.nodeLabel}`}
                  >
                    <Globe size={12} />
                    <span className={styles.smartButtonKey}>{urlInfo.baseUrl}</span>
                    <span className={styles.smartButtonNode}>{urlInfo.nodeLabel}</span>
                  </button>
                ))}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <input
                type="text"
                className={styles.input}
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className={`${styles.btnSaveUrl} ${saveBaseUrl ? styles.btnSaveUrlActive : ''}`}
                onClick={() => setSaveBaseUrl(!saveBaseUrl)}
                title={saveBaseUrl ? "Guardar URL base para reutilizar" : "No guardar URL base"}
              >
                <Database size={16} />
              </button>
            </div>
            <p className={styles.helpText}>
              💡 Protocolo + dominio (sin path). Ej: https://api.intercapital.com.ar
            </p>
          </div>

          {/* Path del Endpoint */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Path del Endpoint <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              className={styles.input}
              value={endpointPath}
              onChange={(e) => setEndpointPath(e.target.value)}
              placeholder="/api/v1/endpoint"
            />
            <p className={styles.helpText}>
              💡 Usa variables: <code>{'{'}{'{'} telefono {'}'}{'}'}</code>, <code>{'{'}{'{'} comitente {'}'}{'}'}</code>
            </p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Método HTTP <span className={styles.required}>*</span></label>
            <div className={styles.methodButtons}>
              <button
                type="button"
                className={`${styles.methodButton} ${method === 'GET' ? styles.methodButtonActive : ''}`}
                onClick={() => setMethod('GET')}
              >
                <span className={styles.methodLabel}>GET</span>
                <span className={styles.methodDescription}>Obtener datos</span>
              </button>
              <button
                type="button"
                className={`${styles.methodButton} ${method === 'POST' ? styles.methodButtonActive : ''}`}
                onClick={() => setMethod('POST')}
              >
                <span className={styles.methodLabel}>POST</span>
                <span className={styles.methodDescription}>Crear/Enviar</span>
              </button>
              <button
                type="button"
                className={`${styles.methodButton} ${method === 'PUT' ? styles.methodButtonActive : ''}`}
                onClick={() => setMethod('PUT')}
              >
                <span className={styles.methodLabel}>PUT</span>
                <span className={styles.methodDescription}>Actualizar</span>
              </button>
              <button
                type="button"
                className={`${styles.methodButton} ${method === 'DELETE' ? styles.methodButtonActive : ''}`}
                onClick={() => setMethod('DELETE')}
              >
                <span className={styles.methodLabel}>DELETE</span>
                <span className={styles.methodDescription}>Eliminar</span>
              </button>
              <button
                type="button"
                className={`${styles.methodButton} ${method === 'PATCH' ? styles.methodButtonActive : ''}`}
                onClick={() => setMethod('PATCH')}
              >
                <span className={styles.methodLabel}>PATCH</span>
                <span className={styles.methodDescription}>Actualizar parcial</span>
              </button>
            </div>
          </div>

          {/* Query Parameters */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Query Parameters (URL)</label>
            
            {/* Botones inteligentes para Query Params */}
            {hasHttpNodes && detectAvailableQueryParams().length > 0 && (
              <div style={{ marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {detectAvailableQueryParams().slice(0, 4).map((paramInfo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={styles.smartButton}
                    onClick={() => {
                      const exists = queryParams.some(p => p.key === paramInfo.key);
                      if (!exists) {
                        setQueryParams([...queryParams, { key: paramInfo.key, value: paramInfo.value }]);
                      }
                    }}
                    title={`Cargar ${paramInfo.key} de ${paramInfo.nodeLabel}`}
                  >
                    <Plus size={12} />
                    <span className={styles.smartButtonKey}>{paramInfo.key}</span>
                    <span className={styles.smartButtonNode}>{paramInfo.nodeLabel}</span>
                  </button>
                ))}
              </div>
            )}
            
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
                  availableNodes={availableNodes}
                />
                <button onClick={() => removeQueryParam(index)} className={styles.btnDelete} type="button">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button onClick={addQueryParam} className={styles.btnManual} type="button" title="Agregar parámetro manual">
              <Plus size={14} />
            </button>
          </div>

          {/* Headers Personalizados */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Headers Personalizados</label>
            
            {/* Botones inteligentes para Headers */}
            {detectAvailableHeaders().length > 0 && (
              <div style={{ marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {detectAvailableHeaders().slice(0, 5).map((headerInfo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={styles.smartButton}
                    onClick={() => {
                      const exists = headers.some(h => h.key === headerInfo.key && h.value === headerInfo.value);
                      if (!exists) {
                        setHeaders([...headers, { key: headerInfo.key, value: headerInfo.value }]);
                      }
                    }}
                    title={`Cargar ${headerInfo.key} de ${headerInfo.nodeLabel}`}
                  >
                    <Plus size={12} />
                    <span className={styles.smartButtonKey}>{headerInfo.key}</span>
                    <span className={styles.smartButtonNode}>{headerInfo.nodeLabel}</span>
                  </button>
                ))}
              </div>
            )}
            
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
                  availableNodes={availableNodes}
                />
                <button onClick={() => removeHeader(index)} className={styles.btnIcon} type="button">
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
            <button onClick={addHeader} className={styles.btnManual} type="button" title="Agregar header manual">
              <Plus size={14} />
            </button>
          </div>

          {/* Body - Solo para POST, PUT, PATCH */}
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
                      >
                        {isSelected && <span>✓</span>}
                        <code>{field}</code>
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
