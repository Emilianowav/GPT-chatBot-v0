'use client';

// 📋 Página de Detalles y Gestión de API
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { getIntegrationsApiUrl } from '@/lib/integrations-api';
import EndpointManager from './EndpointManager';
import EndpointTester from './EndpointTester';
import ChatbotIntegration from './ChatbotIntegration';
import WorkflowManager from './WorkflowManager';
import styles from './detalle.module.css';

interface ApiConfig {
  _id: string;
  nombre: string;
  descripcion?: string;
  tipo: 'rest' | 'graphql' | 'soap';
  estado: 'activo' | 'inactivo' | 'error';
  baseUrl: string;
  version?: string;
  endpoints: Endpoint[];
  workflows?: any[];
  autenticacion: any;
  estadisticas: {
    totalLlamadas: number;
    llamadasExitosas: number;
    llamadasFallidas: number;
    tiempoPromedioRespuesta: number;
  };
  chatbotIntegration?: {
    habilitado: boolean;
    chatbotId: string;
    keywords: any[];
    mensajeAyuda?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Endpoint {
  _id: string;
  nombre: string;
  descripcion?: string;
  metodo: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  ruta: string;
  parametros?: Parameter[];
  headers?: Record<string, string>;
  body?: any;
  respuestaEjemplo?: any;
}

interface Parameter {
  nombre: string;
  tipo: 'string' | 'number' | 'boolean' | 'object' | 'array';
  requerido: boolean;
  ubicacion: 'query' | 'path' | 'body' | 'header';
  descripcion?: string;
  valorPorDefecto?: any;
}

export default function ApiDetallePage() {
  const router = useRouter();
  const params = useParams();
  const { empresa } = useAuth();
  const [api, setApi] = useState<ApiConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'endpoints' | 'config' | 'chatbot' | 'flujos' | 'stats' | 'logs'>('endpoints');
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [showTester, setShowTester] = useState(false);
  const [showEditApi, setShowEditApi] = useState(false);

  useEffect(() => {
    if (empresa && params.id) {
      loadApi();
    }
  }, [empresa, params.id]);

  const loadApi = async () => {
    try {
      setLoading(true);
      const baseUrl = getIntegrationsApiUrl(empresa);
      // Incluir credenciales para obtener el token de autenticación
      const response = await fetch(`${baseUrl}/apis/${params.id}?incluirCredenciales=true`);
      const result = await response.json();

      if (result.success) {
        console.log('🔍 API cargada desde backend:', result.data);
        console.log('  - baseUrl:', result.data.baseUrl);
        console.log('  - autenticacion:', result.data.autenticacion);
        setApi(result.data);
      } else {
        throw new Error(result.message || 'Error al cargar la API');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar la API');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEstado = async () => {
    if (!api) return;

    try {
      const nuevoEstado = api.estado === 'activo' ? 'inactivo' : 'activo';
      const baseUrl = getIntegrationsApiUrl(empresa);
      const response = await fetch(`${baseUrl}/apis/${api._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const result = await response.json();
      if (result.success) {
        setApi({ ...api, estado: nuevoEstado });
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    }
  };

  const handleTestEndpoint = (endpoint: Endpoint) => {
    setSelectedEndpoint(endpoint);
    setShowTester(true);
  };

  if (loading) {
    return (
      <DashboardLayout title="Cargando...">
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando API...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !api) {
    return (
      <DashboardLayout title="Error">
        <div className={styles.error}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h2>{error || 'API no encontrada'}</h2>
          <button onClick={() => router.push('/dashboard/integraciones/apis-configurables')}>
            Volver a la lista
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={api.nombre}>
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

          <div className={styles.headerContent}>
            <div className={styles.titleSection}>
              <div className={styles.titleRow}>
                <h1 className={styles.title}>{api.nombre}</h1>
                <span className={`${styles.status} ${styles[`status${api.estado.charAt(0).toUpperCase() + api.estado.slice(1)}`]}`}>
                  {api.estado}
                </span>
              </div>
              {api.descripcion && (
                <p className={styles.subtitle}>{api.descripcion}</p>
              )}
              <div className={styles.apiMeta}>
                <span className={styles.metaItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  </svg>
                  {api.baseUrl}
                </span>
                <span className={styles.metaItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  </svg>
                  {api.tipo.toUpperCase()}
                </span>
                {api.version && (
                  <span className={styles.metaItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {api.version}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.headerActions}>
              <button
                className={styles.toggleButton}
                onClick={handleToggleEstado}
              >
                {api.estado === 'activo' ? 'Desactivar' : 'Activar'}
              </button>
              <button className={styles.editButton} onClick={() => setShowEditApi(true)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Editar
              </button>
            </div>
            
        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'endpoints' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('endpoints')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            Endpoints ({api.endpoints.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'config' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('config')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6"/>
            </svg>
            Configuración
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'stats' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Estadísticas
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'chatbot' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('chatbot')}
          >
            🤖 Chatbot
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'flujos' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('flujos')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
            Flujos
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'logs' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Logs
          </button>
        </div>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Total Llamadas</span>
              <span className={styles.statValue}>{api.estadisticas.totalLlamadas}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Exitosas</span>
              <span className={styles.statValue}>{api.estadisticas.llamadasExitosas}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Fallidas</span>
              <span className={styles.statValue}>{api.estadisticas.llamadasFallidas}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Tiempo Promedio</span>
              <span className={styles.statValue}>{api.estadisticas.tiempoPromedioRespuesta.toFixed(1)}ms</span>
            </div>
          </div>
        </div>


        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'endpoints' && (
            <EndpointManager
              api={api}
              onUpdate={loadApi}
              onTest={handleTestEndpoint}
            />
          )}

          {activeTab === 'config' && (
            <div className={styles.configSection}>
              <h3>Configuración de la API</h3>
              <p>Sección de configuración en desarrollo...</p>
            </div>
          )}

          {activeTab === 'chatbot' && (
            <ChatbotIntegration
              apiId={api._id}
              endpoints={api.endpoints}
              integration={api.chatbotIntegration}
              onSave={async (data) => {
                try {
                  const baseUrl = getIntegrationsApiUrl(empresa);
                  const response = await fetch(`${baseUrl}/apis/${api._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chatbotIntegration: data }),
                  });

                  const result = await response.json();
                  if (result.success) {
                    setApi(result.data);
                    alert('Configuración guardada exitosamente');
                  } else {
                    alert(result.message || 'Error al guardar configuración');
                  }
                } catch (err: any) {
                  alert(err.message || 'Error al guardar configuración');
                }
              }}
            />
          )}

          {activeTab === 'flujos' && (
            <WorkflowManager
              apiId={api._id}
              endpoints={api.endpoints}
              apiBaseUrl={api.baseUrl}
              apiAuth={api.autenticacion}
              workflows={api.workflows || []}
              onUpdate={loadApi}
            />
          )}

          {activeTab === 'stats' && (
            <div className={styles.statsSection}>
              <h3>Estadísticas Detalladas</h3>
              <p>Gráficos y métricas en desarrollo...</p>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className={styles.logsSection}>
              <h3>Registro de Llamadas</h3>
              <p>Logs en desarrollo...</p>
            </div>
          )}
        </div>

        {/* Endpoint Tester Modal */}
        {showTester && selectedEndpoint && (
          <EndpointTester
            api={api}
            endpoint={selectedEndpoint}
            onClose={() => {
              setShowTester(false);
              setSelectedEndpoint(null);
            }}
          />
        )}

        {/* Edit API Modal */}
        {showEditApi && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>Editar API</h2>
                <button
                  className={styles.closeButton}
                  onClick={() => setShowEditApi(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  nombre: formData.get('nombre'),
                  descripcion: formData.get('descripcion'),
                  baseUrl: formData.get('baseUrl'),
                  version: formData.get('version')
                };

                try {
                  const baseUrl = getIntegrationsApiUrl(empresa);
                  const response = await fetch(`${baseUrl}/apis/${api._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  });

                  const result = await response.json();
                  if (result.success) {
                    setApi(result.data);
                    setShowEditApi(false);
                  } else {
                    alert(result.message || 'Error al actualizar la API');
                  }
                } catch (err: any) {
                  alert(err.message || 'Error al actualizar la API');
                }
              }}>
                <div className={styles.formGroup}>
                  <label>Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    defaultValue={api.nombre}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Descripción</label>
                  <textarea
                    name="descripcion"
                    defaultValue={api.descripcion}
                    rows={3}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>URL Base *</label>
                  <input
                    type="url"
                    name="baseUrl"
                    defaultValue={api.baseUrl}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Versión</label>
                  <input
                    type="text"
                    name="version"
                    defaultValue={api.version}
                  />
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setShowEditApi(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className={styles.submitButton}>
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
