'use client';

// 🧪 Probador de Endpoints
import { useState, useMemo, useEffect } from 'react';
import styles from './detalle.module.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Props {
  api: any;
  endpoint: any;
  onClose: () => void;
}

export default function EndpointTester({ api, endpoint, onClose }: Props) {
  const [params, setParams] = useState<Record<string, any>>({});
  const [bodyJson, setBodyJson] = useState<string>('');
  const [bodyFields, setBodyFields] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState('');

  // Determinar si el endpoint necesita body (POST, PUT, PATCH)
  const needsBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.metodo);

  // Extraer parámetros de body del endpoint
  const bodyParams = useMemo(() => {
    if (!endpoint.parametros) return [];
    
    if (Array.isArray(endpoint.parametros)) {
      return endpoint.parametros.filter((p: any) => p.ubicacion === 'body');
    } else if (endpoint.parametros.body && Array.isArray(endpoint.parametros.body)) {
      return endpoint.parametros.body;
    }
    return [];
  }, [endpoint.parametros]);

  // Generar template de body basado en los parámetros
  const bodyTemplate = useMemo(() => {
    if (bodyParams.length === 0) return '{}';
    
    const template: Record<string, any> = {};
    bodyParams.forEach((param: any) => {
      if (param.tipo === 'number') {
        template[param.nombre] = param.valorPorDefecto ?? 0;
      } else if (param.tipo === 'boolean') {
        template[param.nombre] = param.valorPorDefecto ?? false;
      } else if (param.tipo === 'array') {
        template[param.nombre] = param.valorPorDefecto ?? [];
      } else if (param.tipo === 'object') {
        template[param.nombre] = param.valorPorDefecto ?? {};
      } else {
        template[param.nombre] = param.valorPorDefecto ?? '';
      }
    });
    
    return JSON.stringify(template, null, 2);
  }, [bodyParams]);

  // Pre-cargar bodyPrueba o valores por defecto cuando se monta el componente
  useEffect(() => {
    // Prioridad 1: Usar bodyPrueba si está definido en el endpoint
    if (endpoint.bodyPrueba) {
      try {
        const parsedBody = JSON.parse(endpoint.bodyPrueba);
        setBodyFields(parsedBody);
        setBodyJson(endpoint.bodyPrueba);
        return;
      } catch (e) {
        // Si no es JSON válido, usar como texto
        setBodyJson(endpoint.bodyPrueba);
        return;
      }
    }
    
    // Prioridad 2: Usar valores por defecto de los parámetros
    if (bodyParams.length > 0) {
      const initialFields: Record<string, any> = {};
      bodyParams.forEach((param: any) => {
        // Solo pre-cargar si tiene valorPorDefecto definido
        if (param.valorPorDefecto !== undefined && param.valorPorDefecto !== null && param.valorPorDefecto !== '') {
          initialFields[param.nombre] = param.valorPorDefecto;
        }
      });
      if (Object.keys(initialFields).length > 0) {
        setBodyFields(initialFields);
      }
    }
  }, [bodyParams, endpoint.bodyPrueba]);

  // Construir URL con parámetros (se recalcula automáticamente cuando cambian params)
  const currentUrl = useMemo(() => {
    let url = `${api.baseUrl}${endpoint.path}`;
    const queryParams = new URLSearchParams();
    
    // Obtener parámetros del endpoint (pueden estar en path o query)
    let parametrosArray: any[] = [];
    if (endpoint.parametros) {
      if (Array.isArray(endpoint.parametros)) {
        parametrosArray = endpoint.parametros;
      } else if (endpoint.parametros.query && Array.isArray(endpoint.parametros.query)) {
        parametrosArray = endpoint.parametros.query;
      } else if (endpoint.parametros.path && Array.isArray(endpoint.parametros.path)) {
        parametrosArray = endpoint.parametros.path;
      }
    }
    
    // Procesar cada parámetro según su ubicación
    parametrosArray.forEach((param: any) => {
      const valor = params[param.nombre];
      if (valor !== undefined && valor !== null && valor !== '') {
        if (param.ubicacion === 'query') {
          queryParams.append(param.nombre, String(valor));
        } else if (param.ubicacion === 'path') {
          // Reemplazar en la URL
          url = url.replace(`{${param.nombre}}`, String(valor));
          url = url.replace(`:${param.nombre}`, String(valor));
        }
      }
    });
    
    const queryString = queryParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }, [params, api.baseUrl, endpoint.path, endpoint.parametros]);

  const handleTest = async () => {
    setTesting(true);
    setError('');
    setResponse(null);

    try {
      // Extraer array de parámetros (pueden estar en query o path)
      let parametrosArray: any[] = [];
      
      if (endpoint.parametros) {
        if (Array.isArray(endpoint.parametros)) {
          parametrosArray = endpoint.parametros;
        } else if (endpoint.parametros.query && Array.isArray(endpoint.parametros.query)) {
          parametrosArray = endpoint.parametros.query;
        } else if (endpoint.parametros.path && Array.isArray(endpoint.parametros.path)) {
          parametrosArray = endpoint.parametros.path;
        }
      }
      
      console.log('📋 Parámetros del endpoint:', parametrosArray);
      console.log('📝 Valores ingresados:', params);
      
      const parametrosOrganizados = {
        query: {} as Record<string, any>,
        path: {} as Record<string, any>,
        body: {} as Record<string, any>,
        headers: {} as Record<string, any>
      };
      
      // Distribuir parámetros según su ubicación (excepto body que se maneja aparte)
      parametrosArray.forEach((param: any) => {
        const valor = params[param.nombre];
        console.log(`🔍 Procesando ${param.nombre} (${param.ubicacion}):`, valor);
        
        if (valor !== undefined && valor !== null && valor !== '') {
          if (param.ubicacion === 'query') {
            parametrosOrganizados.query[param.nombre] = valor;
          } else if (param.ubicacion === 'path') {
            parametrosOrganizados.path[param.nombre] = valor;
          } else if (param.ubicacion === 'header') {
            parametrosOrganizados.headers[param.nombre] = valor;
          }
          // Body se maneja con bodyFields
        }
      });

      // Agregar campos del body desde el formulario de campos individuales
      if (needsBody) {
        if (Object.keys(bodyFields).length > 0) {
          // Usar campos individuales
          Object.entries(bodyFields).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              parametrosOrganizados.body[key] = value;
            }
          });
        } else if (bodyJson.trim()) {
          // Usar JSON libre si no hay campos individuales
          try {
            const parsedJson = JSON.parse(bodyJson);
            Object.assign(parametrosOrganizados.body, parsedJson);
          } catch (e) {
            setError('El JSON del body no es válido');
            setTesting(false);
            return;
          }
        }
      }

      console.log('✅ Enviando parámetros:', parametrosOrganizados);
      console.log('📤 Body completo:', JSON.stringify({ parametros: parametrosOrganizados }, null, 2));

      const url = `${API_BASE_URL}/api/modules/integrations/${api.empresaId}/apis/${api._id}/ejecutar/${endpoint.id}`;
      const result = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parametros: parametrosOrganizados
        })
      });

      const data = await result.json();
      
      console.log('📬 Respuesta del backend:', {
        status: result.status,
        data
      });
      
      if (data.success) {
        setResponse(data);
      } else {
        const errorMsg = data.error?.mensaje || data.message || 'Error desconocido';
        console.error('❌ Error del backend:', errorMsg, data);
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || 'Error al ejecutar endpoint');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent} style={{ maxWidth: '800px' }}>
        <div className={styles.modalHeader}>
          <h3>Probar Endpoint: {endpoint.nombre}</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.testerContent}>
          {/* Request Info */}
          <div className={styles.requestInfo}>
            <div className={styles.requestLine}>
              <span className={styles.methodBadge} style={{ 
                backgroundColor: endpoint.metodo === 'GET' ? '#4CAF50' : 
                               endpoint.metodo === 'POST' ? '#2196F3' : 
                               endpoint.metodo === 'PUT' ? '#FF9800' : 
                               endpoint.metodo === 'DELETE' ? '#F44336' : '#9C27B0'
              }}>
                {endpoint.metodo}
              </span>
              <code className={styles.requestUrl}>{currentUrl}</code>
            </div>
            <small style={{ 
              fontSize: '0.75rem', 
              color: '#64748B',
              marginTop: '0.5rem',
              display: 'block'
            }}>
              La URL se actualiza automáticamente al cambiar los parámetros
            </small>
          </div>

          {/* Parameters */}
          {(() => {
            // Extraer parámetros del endpoint (pueden estar en query o path)
            let parametrosArray: any[] = [];
            if (endpoint.parametros) {
              if (Array.isArray(endpoint.parametros)) {
                parametrosArray = endpoint.parametros;
              } else if (endpoint.parametros.query && Array.isArray(endpoint.parametros.query)) {
                parametrosArray = endpoint.parametros.query;
              } else if (endpoint.parametros.path && Array.isArray(endpoint.parametros.path)) {
                parametrosArray = endpoint.parametros.path;
              }
            }
            
            return parametrosArray.length > 0 && (
              <div className={styles.parametersInput}>
                <h4>Parámetros</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1rem' }}>
                  Los parámetros marcados con * son requeridos. Los demás son opcionales.
                </p>
                {parametrosArray.map((param: any, index: number) => (
                  <div key={index} className={styles.paramInput}>
                    <label>
                      {param.nombre}
                      {param.requerido && <span className={styles.required}>*</span>}
                      <span className={styles.paramMeta}>
                        ({param.tipo} - {param.ubicacion})
                      </span>
                      {param.descripcion && (
                        <span className={styles.paramDescription}>
                          {param.descripcion}
                        </span>
                      )}
                    </label>
                    {param.tipo === 'boolean' ? (
                      <select
                        value={params[param.nombre] !== undefined ? String(params[param.nombre]) : ''}
                        onChange={(e) => {
                          if (e.target.value === '') {
                            const newParams = { ...params };
                            delete newParams[param.nombre];
                            setParams(newParams);
                          } else {
                            setParams({ ...params, [param.nombre]: e.target.value === 'true' });
                          }
                        }}
                      >
                        <option value="">-- No enviar --</option>
                        <option value="false">false</option>
                        <option value="true">true</option>
                      </select>
                    ) : param.tipo === 'number' ? (
                      <input
                        type="number"
                        value={params[param.nombre] !== undefined ? params[param.nombre] : ''}
                        onChange={(e) => {
                          if (e.target.value === '') {
                            const newParams = { ...params };
                            delete newParams[param.nombre];
                            setParams(newParams);
                          } else {
                            setParams({ ...params, [param.nombre]: Number(e.target.value) });
                          }
                        }}
                        placeholder={param.valorPorDefecto !== undefined 
                          ? `Default: ${param.valorPorDefecto}` 
                          : `Opcional`}
                        required={param.requerido}
                      />
                    ) : (
                      <input
                        type="text"
                        value={params[param.nombre] !== undefined ? params[param.nombre] : ''}
                        onChange={(e) => {
                          if (e.target.value === '') {
                            const newParams = { ...params };
                            delete newParams[param.nombre];
                            setParams(newParams);
                          } else {
                            setParams({ ...params, [param.nombre]: e.target.value });
                          }
                        }}
                        placeholder={param.valorPorDefecto !== undefined 
                          ? `Default: ${param.valorPorDefecto}` 
                          : `Opcional`}
                        required={param.requerido}
                      />
                    )}
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Body Fields for POST/PUT/PATCH */}
          {needsBody && (
            <div className={styles.parametersInput}>
              <h4>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Body (JSON)
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1rem' }}>
                Complete los campos del body para enviar con la petición {endpoint.metodo}
              </p>
              
              {/* Si hay bodyPrueba definido, mostrar editor JSON con el body pre-cargado */}
              {endpoint.bodyPrueba ? (
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#059669', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Body de prueba pre-cargado. Puede editarlo si lo necesita:
                  </p>
                  <textarea
                    value={bodyJson}
                    onChange={(e) => {
                      setBodyJson(e.target.value);
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setBodyFields(parsed);
                      } catch {
                        // Si no es JSON válido, mantener el texto
                      }
                    }}
                    rows={10}
                    style={{ 
                      width: '100%',
                      fontFamily: 'Monaco, Menlo, monospace', 
                      fontSize: '0.8rem',
                      background: '#F8FAFC',
                      border: '1px solid #10B981',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      color: '#1E3A5F',
                      lineHeight: '1.5'
                    }}
                  />
                </div>
              ) : bodyParams.length > 0 ? (
                <>
                  {/* Campos individuales del body */}
                  {bodyParams.map((param: any, index: number) => (
                    <div key={index} className={styles.paramInput}>
                      <label>
                        {param.nombre}
                        {param.requerido && <span className={styles.required}>*</span>}
                        <span className={styles.paramMeta}>
                          ({param.tipo})
                        </span>
                        {param.descripcion && (
                          <span className={styles.paramDescription}>
                            {param.descripcion}
                          </span>
                        )}
                      </label>
                      {param.tipo === 'boolean' ? (
                        <select
                          value={bodyFields[param.nombre] !== undefined ? String(bodyFields[param.nombre]) : ''}
                          onChange={(e) => {
                            if (e.target.value === '') {
                              const newFields = { ...bodyFields };
                              delete newFields[param.nombre];
                              setBodyFields(newFields);
                            } else {
                              setBodyFields({ ...bodyFields, [param.nombre]: e.target.value === 'true' });
                            }
                          }}
                        >
                          <option value="">-- Seleccionar --</option>
                          <option value="false">false</option>
                          <option value="true">true</option>
                        </select>
                      ) : param.tipo === 'number' ? (
                        <input
                          type="number"
                          value={bodyFields[param.nombre] !== undefined ? bodyFields[param.nombre] : ''}
                          onChange={(e) => {
                            if (e.target.value === '') {
                              const newFields = { ...bodyFields };
                              delete newFields[param.nombre];
                              setBodyFields(newFields);
                            } else {
                              setBodyFields({ ...bodyFields, [param.nombre]: Number(e.target.value) });
                            }
                          }}
                          placeholder={param.valorPorDefecto !== undefined 
                            ? `Default: ${param.valorPorDefecto}` 
                            : `Ingrese ${param.nombre}`}
                          required={param.requerido}
                        />
                      ) : param.tipo === 'object' || param.tipo === 'array' ? (
                        <textarea
                          value={bodyFields[param.nombre] !== undefined 
                            ? (typeof bodyFields[param.nombre] === 'string' 
                                ? bodyFields[param.nombre] 
                                : JSON.stringify(bodyFields[param.nombre], null, 2))
                            : ''}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              setBodyFields({ ...bodyFields, [param.nombre]: parsed });
                            } catch {
                              setBodyFields({ ...bodyFields, [param.nombre]: e.target.value });
                            }
                          }}
                          placeholder={param.tipo === 'array' ? '[]' : '{}'}
                          rows={3}
                          style={{ fontFamily: 'Monaco, Menlo, monospace', fontSize: '0.8rem' }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={bodyFields[param.nombre] !== undefined ? bodyFields[param.nombre] : ''}
                          onChange={(e) => {
                            if (e.target.value === '') {
                              const newFields = { ...bodyFields };
                              delete newFields[param.nombre];
                              setBodyFields(newFields);
                            } else {
                              setBodyFields({ ...bodyFields, [param.nombre]: e.target.value });
                            }
                          }}
                          placeholder={param.valorPorDefecto !== undefined 
                            ? `Default: ${param.valorPorDefecto}` 
                            : `Ingrese ${param.nombre}`}
                          required={param.requerido}
                        />
                      )}
                    </div>
                  ))}
                  
                  {/* Preview del JSON que se enviará */}
                  <div style={{ marginTop: '1rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.5rem', display: 'block' }}>
                      Vista previa del body:
                    </label>
                    <pre style={{ 
                      background: '#1E3A5F', 
                      color: '#10B981', 
                      padding: '0.75rem', 
                      borderRadius: '6px', 
                      fontSize: '0.75rem',
                      overflow: 'auto',
                      maxHeight: '150px'
                    }}>
                      {JSON.stringify(bodyFields, null, 2) || '{}'}
                    </pre>
                  </div>
                </>
              ) : (
                /* Editor JSON libre si no hay parámetros definidos */
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.5rem' }}>
                    No hay campos de body definidos. Ingrese el JSON manualmente:
                  </p>
                  <textarea
                    value={bodyJson}
                    onChange={(e) => setBodyJson(e.target.value)}
                    placeholder='{\n  "campo": "valor"\n}'
                    rows={6}
                    style={{ 
                      width: '100%',
                      fontFamily: 'Monaco, Menlo, monospace', 
                      fontSize: '0.8rem',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      color: '#1E3A5F'
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Test Button */}
          <button
            className={styles.testExecuteButton}
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? (
              <>
                <div className={styles.spinner}></div>
                Ejecutando...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Ejecutar Prueba
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className={styles.testError}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Response */}
          {response && (
            <div className={styles.responseSection}>
              <h4>Respuesta</h4>
              <div className={styles.responseBox}>
                <pre>{JSON.stringify(response, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
