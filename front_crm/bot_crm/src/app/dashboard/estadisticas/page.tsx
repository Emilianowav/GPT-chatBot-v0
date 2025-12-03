'use client';

// 📈 Página de Estadísticas
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import styles from './estadisticas.module.css';

export default function EstadisticasPage() {
  const { isAuthenticated, empresa, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated && empresa) {
      loadStats();
    }
  }, [isAuthenticated, authLoading, empresa, router]);

  const loadStats = async () => {
    if (!empresa) return;
    
    try {
      setLoading(true);
      const data = await apiClient.getEmpresaStats(empresa.empresaId);
      setStats(data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <DashboardLayout title="Estadísticas">
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando estadísticas...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Estadísticas Detalladas">
      {/* Selector de Rango */}
      <div className={styles.container}>

      <div className={styles.rangeSelector}>
        <button 
          className={`${styles.rangeButton} ${timeRange === '7d' ? styles.active : ''}`}
          onClick={() => setTimeRange('7d')}
        >
          Últimos 7 días
        </button>
        <button 
          className={`${styles.rangeButton} ${timeRange === '30d' ? styles.active : ''}`}
          onClick={() => setTimeRange('30d')}
        >
          Últimos 30 días
        </button>
        <button 
          className={`${styles.rangeButton} ${timeRange === '90d' ? styles.active : ''}`}
          onClick={() => setTimeRange('90d')}
        >
          Últimos 90 días
        </button>
      </div>

      {stats && (
        <>
          {/* Resumen General */}
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.cardHeader}>
                <h3>Total Usuarios</h3>
                <div className={styles.cardIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.mainStat}>{stats.estadisticas.totalUsuarios}</p>
                <p className={styles.subStat}>
                  {stats.estadisticas.usuariosActivos} activos (7d)
                </p>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progress} 
                    style={{ width: `${(stats.estadisticas.usuariosActivos / stats.estadisticas.totalUsuarios) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.cardHeader}>
                <h3>Interacciones</h3>
                <div className={styles.cardIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.mainStat}>{stats.estadisticas.totalInteracciones}</p>
                <p className={styles.subStat}>
                  Promedio: {stats.estadisticas.promedioInteracciones} por usuario
                </p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.cardHeader}>
                <h3>Tokens Consumidos</h3>
                <div className={styles.cardIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                    <path d="M12 18V6"/>
                  </svg>
                </div>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.mainStat}>{parseInt(stats.estadisticas.totalTokens).toLocaleString()}</p>
                <p className={styles.subStat}>
                  Promedio: {parseInt(stats.estadisticas.promedioTokens).toLocaleString()} por usuario
                </p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.cardHeader}>
                <h3>Usuarios Activos</h3>
                <div className={styles.cardIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.mainStat}>{stats.estadisticas.usuariosActivos}</p>
                <p className={styles.subStat}>
                  Últimos 7 días
                </p>
              </div>
            </div>
          </div>

          {/* Gráfico de Interacciones */}
          {stats.interaccionesPorDia && stats.interaccionesPorDia.length > 0 && (
            <div className={styles.chartSection}>
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}}>
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                Tendencia de Interacciones
              </h2>
              <div className={styles.chartContainer}>
                {stats.interaccionesPorDia.map((dia: any, index: number) => {
                  const maxValue = Math.max(...stats.interaccionesPorDia.map((d: any) => d.cantidad));
                  const height = (dia.cantidad / maxValue) * 200;
                  
                  return (
                    <div key={dia.fecha} className={styles.chartBar}>
                      <div 
                        className={styles.bar} 
                        style={{ height: `${height}px` }}
                        title={`${dia.cantidad} interacciones`}
                      >
                        <span className={styles.barValue}>{dia.cantidad}</span>
                      </div>
                      <span className={styles.barLabel}>
                        {new Date(dia.fecha).toLocaleDateString('es', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Usuarios */}
          <div className={styles.topSection}>
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Top 10 Usuarios Más Activos
            </h2>
            <div className={styles.topList}>
              {stats.usuariosRecientes
                .sort((a: any, b: any) => b.interacciones - a.interacciones)
                .slice(0, 10)
                .map((usuario: any, index: number) => (
                  <div key={usuario.id} className={styles.topItem}>
                    <div className={styles.topRank}>#{index + 1}</div>
                    <div className={styles.topInfo}>
                      <p className={styles.topName}>{usuario.nombre || 'Sin nombre'}</p>
                      <p className={styles.topPhone}>{usuario.numero}</p>
                    </div>
                    <div className={styles.topStats}>
                      <span className={styles.topInteractions}>
                        💬 {usuario.interacciones}
                      </span>
                      <span className={styles.topTokens}>
                        🪙 {usuario.tokens_consumidos?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
      </div>
    </DashboardLayout>
  );
}
