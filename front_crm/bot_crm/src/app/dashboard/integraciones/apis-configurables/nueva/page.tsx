'use client';

// 📝 Formulario de Nueva API Configurable
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { integrationsApiFetch } from '@/lib/integrations-api';
import styles from './nueva.module.css';

type AuthType = 'bearer' | 'api_key' | 'oauth2' | 'basic' | 'none';
type ApiType = 'rest' | 'graphql' | 'soap';

export default function NuevaApiPage() {
  const router = useRouter();
  const { empresa } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<ApiType>('rest');
  const [baseUrl, setBaseUrl] = useState('');
  const [version, setVersion] = useState('');
  
  // Auth state
  const [authType, setAuthType] = useState<AuthType>('bearer');
  const [token, setToken] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyName, setApiKeyName] = useState('X-API-Key');
  const [apiKeyLocation, setApiKeyLocation] = useState<'header' | 'query'>('header');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [customHeaders, setCustomHeaders] = useState<Array<{key: string, value: string}>>([]);
  
  // Config state
  const [timeout, setTimeout] = useState(30000);
  const [reintentos, setReintentos] = useState(3);

  const handleAddHeader = () => {
    setCustomHeaders([...customHeaders, { key: '', value: '' }]);
  };

  const handleRemoveHeader = (index: number) => {
    setCustomHeaders(customHeaders.filter((_, i) => i !== index));
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...customHeaders];
    newHeaders[index][field] = value;
    setCustomHeaders(newHeaders);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Empresa ID:', empresa?.empresaId);
    console.log('Empresa completa:', empresa);

    try {
      if (!nombre || !baseUrl) {
        setError('Nombre y URL base son requeridos');
        return;
      }
      setLoading(true);

      // Construir objeto de autenticación
      const autenticacion: any = {
        tipo: authType,
        configuracion: {}
      };

      if (authType === 'bearer') {
        autenticacion.configuracion.token = token;
        autenticacion.configuracion.headerName = 'Authorization';
      } else if (authType === 'api_key') {
        autenticacion.configuracion.apiKey = apiKey;
        autenticacion.configuracion.apiKeyName = apiKeyName;
        autenticacion.configuracion.apiKeyLocation = apiKeyLocation;
      } else if (authType === 'basic') {
        autenticacion.configuracion.username = username;
        autenticacion.configuracion.password = password;
      }

      // Custom headers
      if (customHeaders.length > 0) {
        const headersObj: Record<string, string> = {};
        customHeaders.forEach(h => {
          if (h.key && h.value) {
            headersObj[h.key] = h.value;
          }
        });
        if (Object.keys(headersObj).length > 0) {
          autenticacion.configuracion.customHeaders = headersObj;
        }
      }

      const apiData = {
        nombre,
        descripcion,
        tipo,
        baseUrl,
        version,
        autenticacion,
        configuracion: {
          timeout,
          reintentos,
          reintentarEn: [1000, 2000, 4000]
        }
      };

      const response = await integrationsApiFetch(empresa, '/apis', {
        method: 'POST',
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/dashboard/integraciones/apis-configurables/${result.data._id}`);
      } else {
        setError(result.message || 'Error al crear la API');
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear la API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Nueva API">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <button
            className={styles.backButton}
            onClick={() => router.push('/dashboard/integraciones/apis-configurables')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Volver
          </button>

          <div className={styles.titleSection}>
            <h1 className={styles.title}>Nueva API Configurable</h1>
            <p className={styles.subtitle}>
              Configura una nueva conexión con una API externa
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Información Básica */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Información Básica
            </h2>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="nombre">Nombre *</label>
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: API iCenter"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tipo">Tipo de API</label>
                <select
                  id="tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as ApiType)}
                >
                  <option value="rest">REST</option>
                  <option value="graphql">GraphQL</option>
                  <option value="soap">SOAP</option>
                </select>
              </div>

              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción de la API"
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="baseUrl">URL Base *</label>
                <input
                  id="baseUrl"
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.ejemplo.com/v1"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="version">Versión</label>
                <input
                  id="version"
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="v1"
                />
              </div>
            </div>
          </div>

          {/* Autenticación */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Autenticación
            </h2>

            <div className={styles.formGroup}>
              <label htmlFor="authType">Tipo de Autenticación</label>
              <select
                id="authType"
                value={authType}
                onChange={(e) => setAuthType(e.target.value as AuthType)}
              >
                <option value="bearer">Bearer Token</option>
                <option value="api_key">API Key</option>
                <option value="basic">Basic Auth</option>
                <option value="oauth2">OAuth 2.0 (Próximamente)</option>
                <option value="none">Sin Autenticación</option>
              </select>
            </div>

            {/* Bearer Token */}
            {authType === 'bearer' && (
              <div className={styles.formGroup}>
                <label htmlFor="token">Token *</label>
                <input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Tu token de autenticación"
                  required
                />
                <small>El token será encriptado antes de guardarse</small>
              </div>
            )}

            {/* API Key */}
            {authType === 'api_key' && (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="apiKey">API Key *</label>
                  <input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Tu API Key"
                    required
                  />
                  <small>La API Key será encriptada antes de guardarse</small>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="apiKeyName">Nombre del Header/Query</label>
                    <input
                      id="apiKeyName"
                      type="text"
                      value={apiKeyName}
                      onChange={(e) => setApiKeyName(e.target.value)}
                      placeholder="X-API-Key"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="apiKeyLocation">Ubicación</label>
                    <select
                      id="apiKeyLocation"
                      value={apiKeyLocation}
                      onChange={(e) => setApiKeyLocation(e.target.value as 'header' | 'query')}
                    >
                      <option value="header">Header</option>
                      <option value="query">Query Parameter</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Basic Auth */}
            {authType === 'basic' && (
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="username">Usuario *</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Usuario"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="password">Contraseña *</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    required
                  />
                </div>
              </div>
            )}

            {/* Custom Headers */}
            <div className={styles.customHeaders}>
              <div className={styles.customHeadersTitle}>
                <label>Headers Personalizados</label>
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={handleAddHeader}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Agregar Header
                </button>
              </div>

              {customHeaders.map((header, index) => (
                <div key={index} className={styles.headerRow}>
                  <input
                    type="text"
                    value={header.key}
                    onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                    placeholder="Nombre del header"
                  />
                  <input
                    type="text"
                    value={header.value}
                    onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                    placeholder="Valor"
                  />
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => handleRemoveHeader(index)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Configuración Avanzada */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2"/>
              </svg>
              Configuración Avanzada
            </h2>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="timeout">Timeout (ms)</label>
                <input
                  id="timeout"
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeout(Number(e.target.value))}
                  min="1000"
                  max="120000"
                />
                <small>Tiempo máximo de espera para las peticiones</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="reintentos">Reintentos</label>
                <input
                  id="reintentos"
                  type="number"
                  value={reintentos}
                  onChange={(e) => setReintentos(Number(e.target.value))}
                  min="0"
                  max="10"
                />
                <small>Número de reintentos en caso de error</small>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => router.push('/dashboard/integraciones/apis-configurables')}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  Creando...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Crear API
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
