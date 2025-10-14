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
                <h3>👥 Usuarios</h3>
                <span className={styles.cardIcon}>📊</span>
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
                <h3>💬 Interacciones</h3>
                <span className={styles.cardIcon}>📈</span>
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
                <h3>🪙 Tokens</h3>
                <span className={styles.cardIcon}>💰</span>
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
                <h3>📨 Mensajes</h3>
                <span className={styles.cardIcon}>✉️</span>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.mainStat}>{stats.estadisticas.totalMensajesEnviados + stats.estadisticas.totalMensajesRecibidos}</p>
                <p className={styles.subStat}>
                  ↗️ {stats.estadisticas.totalMensajesEnviados} enviados | 
                  ↙️ {stats.estadisticas.totalMensajesRecibidos} recibidos
                </p>
              </div>
            </div>
          </div>

          {/* Gráfico de Interacciones */}
          {stats.interaccionesPorDia && stats.interaccionesPorDia.length > 0 && (
            <div className={styles.chartSection}>
              <h2>📊 Tendencia de Interacciones</h2>
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
            <h2>🏆 Top 10 Usuarios Más Activos</h2>
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
    </DashboardLayout>
  );
}
