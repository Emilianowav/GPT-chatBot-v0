'use client';

// 🧪 Probador de Endpoints
import { useState, useMemo } from 'react';
import styles from './detalle.module.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Props {
  api: any;
  endpoint: any;
  onClose: () => void;
}

export default function EndpointTester({ api, endpoint, onClose }: Props) {
  const [params, setParams] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState('');

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
      
      // Distribuir parámetros según su ubicación
      parametrosArray.forEach((param: any) => {
        const valor = params[param.nombre];
        console.log(`🔍 Procesando ${param.nombre} (${param.ubicacion}):`, valor);
        
        if (valor !== undefined && valor !== null && valor !== '') {
          if (param.ubicacion === 'query') {
            parametrosOrganizados.query[param.nombre] = valor;
          } else if (param.ubicacion === 'path') {
            parametrosOrganizados.path[param.nombre] = valor;
          } else if (param.ubicacion === 'body') {
            parametrosOrganizados.body[param.nombre] = valor;
          } else if (param.ubicacion === 'header') {
            parametrosOrganizados.headers[param.nombre] = valor;
          }
        }
      });

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
              fontSize: '0.85rem', 
              color: 'rgba(255, 255, 255, 0.6)',
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
                <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '1rem' }}>
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
