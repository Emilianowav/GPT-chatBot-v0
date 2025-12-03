'use client';

// 📋 Lista de APIs Configurables
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { getIntegrationsApiUrl } from '@/lib/integrations-api';
import styles from './apis.module.css';

interface ApiConfig {
  _id: string;
  nombre: string;
  descripcion?: string;
  tipo: 'rest' | 'graphql' | 'soap';
  estado: 'activo' | 'inactivo' | 'error';
  baseUrl: string;
  endpoints: any[];
  estadisticas: {
    totalLlamadas: number;
    llamadasExitosas: number;
    llamadasFallidas: number;
    tiempoPromedioRespuesta: number;
  };
  createdAt: string;
}

export default function ApisConfigurablesPage() {
  const router = useRouter();
  const { empresa } = useAuth();
  const [apis, setApis] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todas' | 'activo' | 'inactivo'>('todas');

  useEffect(() => {
    if (empresa?.empresaId) {
      cargarApis();
    }
  }, [empresa, filter]);

  const cargarApis = async () => {
    try {
      setLoading(true);
      const baseUrl = getIntegrationsApiUrl(empresa);
      const url = filter === 'todas'
        ? `${baseUrl}/apis`
        : `${baseUrl}/apis?estado=${filter}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setApis(data.data);
      }
    } catch (error) {
      console.error('Error al cargar APIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return styles.statusActive;
      case 'inactivo':
        return styles.statusInactive;
      case 'error':
        return styles.statusError;
      default:
        return '';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'rest':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
        );
      case 'graphql':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
        );
      case 'soap':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout title="APIs Configurables">
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <button
            className={styles.backButton}
            onClick={() => router.push('/dashboard/integraciones')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Volver
          </button>

          <div className={styles.titleSection}>
            <h1 className={styles.title}>APIs Configurables</h1>
            <p className={styles.subtitle}>
              Gestiona tus conexiones con APIs externas
            </p>
          </div>

          <button
            className={styles.primaryButton}
            onClick={() => router.push('/dashboard/integraciones/apis-configurables/nueva')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva API
          </button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <button
            className={`${styles.filterButton} ${filter === 'todas' ? styles.filterActive : ''}`}
            onClick={() => setFilter('todas')}
          >
            Todas
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'activo' ? styles.filterActive : ''}`}
            onClick={() => setFilter('activo')}
          >
            Activas
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'inactivo' ? styles.filterActive : ''}`}
            onClick={() => setFilter('inactivo')}
          >
            Inactivas
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Cargando APIs...</p>
          </div>
        ) : apis.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>No hay APIs configuradas</h3>
            <p className={styles.emptyDescription}>
              Crea tu primera API para comenzar a integrar servicios externos
            </p>
            <button
              className={styles.primaryButton}
              onClick={() => router.push('/dashboard/integraciones/apis-configurables/nueva')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Crear Primera API
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {apis.map((api) => (
              <div
                key={api._id}
                className={styles.apiCard}
                onClick={() => router.push(`/dashboard/integraciones/apis-configurables/${api._id}`)}
              >
                <div className={styles.apiHeader}>
                  <div className={styles.apiIcon}>
                    {getTipoIcon(api.tipo)}
                  </div>
                  <span className={`${styles.status} ${getEstadoColor(api.estado)}`}>
                    {api.estado}
                  </span>
                </div>

                <h3 className={styles.apiTitle}>{api.nombre}</h3>
                {api.descripcion && (
                  <p className={styles.apiDescription}>{api.descripcion}</p>
                )}

                <div className={styles.apiUrl}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  {api.baseUrl}
                </div>

                <div className={styles.apiStats}>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{api.endpoints?.length || 0}</span>
                    <span className={styles.statLabel}>Endpoints</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{api.estadisticas?.totalLlamadas || 0}</span>
                    <span className={styles.statLabel}>Llamadas</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>
                      {api.estadisticas?.tiempoPromedioRespuesta 
                        ? `${api.estadisticas.tiempoPromedioRespuesta.toFixed(1)}ms`
                        : '-'}
                    </span>
                    <span className={styles.statLabel}>Promedio</span>
                  </div>
                </div>

                <div className={styles.apiFooter}>
                  <span className={styles.apiType}>
                    {api.tipo.toUpperCase()}
                  </span>
                  <span className={styles.apiDate}>
                    {new Date(api.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </DashboardLayout>
  );
}
