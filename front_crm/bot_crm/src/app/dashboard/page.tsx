'use client';

// 📊 Dashboard Principal
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import styles from './dashboard.module.css';

interface EmpresaStats {
  success: boolean;
  empresa: {
    nombre: string;
    categoria: string;
    telefono: string;
    email?: string;
    modelo: string;
  };
  estadisticas: {
    totalUsuarios: number;
    totalInteracciones: number;
    totalTokens: number;
    totalMensajesEnviados: number;
    totalMensajesRecibidos: number;
    usuariosActivos: number;
    promedioInteracciones: string;
    promedioTokens: string;
  };
  botPasos?: {
    turnosHoy: number;
    turnosMes: number;
    turnosPendientes: number;
    turnosConfirmados: number;
    turnosCompletados: number;
    turnosCancelados: number;
    tasaConfirmacion: number;
    totalClientes: number;
  };
  usuariosRecientes: Array<{
    id: string;
    nombre?: string;
    numero: string;
    interacciones: number;
    ultimaInteraccion: string;
    tokens_consumidos?: number;
  }>;
  interaccionesPorDia: Array<{
    fecha: string;
    cantidad: number;
  }>;
}

export default function DashboardPage() {
  const { isAuthenticated, empresa, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<EmpresaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && empresa) {
      loadStats();
    }
  }, [isAuthenticated, empresa]);

  const loadStats = async () => {
    if (!empresa) return;
    
    try {
      setLoading(true);
      const data = await apiClient.getEmpresaStats(empresa.empresaId) as unknown as EmpresaStats;
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout title="Dashboard">
        {/* Línea de colores decorativa */}
        <div className={styles.colorLine}></div>
        
        {error && (
          <div className={styles.error}>
            ⚠️ {error}
            <button onClick={loadStats}>Reintentar</button>
          </div>
        )}

        {stats && (
          <>
            {/* Estadísticas del Bot de Pasos */}
            {stats.botPasos && (
              <div className={styles.botPasosSection}>
                <h2 className={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Bot de Pasos - Turnos del Mes
                </h2>
                <div className={styles.botPasosGrid}>
                  <div className={`${styles.botPasosCard} ${styles.cardHoy}`}>
                    <div className={styles.botPasosIcon}>📅</div>
                    <div className={styles.botPasosContent}>
                      <span className={styles.botPasosNumber}>{stats.botPasos.turnosHoy}</span>
                      <span className={styles.botPasosLabel}>Turnos Hoy</span>
                    </div>
                  </div>
                  <div className={`${styles.botPasosCard} ${styles.cardMes}`}>
                    <div className={styles.botPasosIcon}>📊</div>
                    <div className={styles.botPasosContent}>
                      <span className={styles.botPasosNumber}>{stats.botPasos.turnosMes}</span>
                      <span className={styles.botPasosLabel}>Total Mes</span>
                    </div>
                  </div>
                  <div className={`${styles.botPasosCard} ${styles.cardConfirmados}`}>
                    <div className={styles.botPasosIcon}>✅</div>
                    <div className={styles.botPasosContent}>
                      <span className={styles.botPasosNumber}>{stats.botPasos.turnosConfirmados}</span>
                      <span className={styles.botPasosLabel}>Confirmados</span>
                    </div>
                  </div>
                  <div className={`${styles.botPasosCard} ${styles.cardPendientes}`}>
                    <div className={styles.botPasosIcon}>⏳</div>
                    <div className={styles.botPasosContent}>
                      <span className={styles.botPasosNumber}>{stats.botPasos.turnosPendientes}</span>
                      <span className={styles.botPasosLabel}>Pendientes</span>
                    </div>
                  </div>
                  <div className={`${styles.botPasosCard} ${styles.cardCompletados}`}>
                    <div className={styles.botPasosIcon}>🎯</div>
                    <div className={styles.botPasosContent}>
                      <span className={styles.botPasosNumber}>{stats.botPasos.turnosCompletados}</span>
                      <span className={styles.botPasosLabel}>Completados</span>
                    </div>
                  </div>
                  <div className={`${styles.botPasosCard} ${styles.cardCancelados}`}>
                    <div className={styles.botPasosIcon}>❌</div>
                    <div className={styles.botPasosContent}>
                      <span className={styles.botPasosNumber}>{stats.botPasos.turnosCancelados}</span>
                      <span className={styles.botPasosLabel}>Cancelados</span>
                    </div>
                  </div>
                  <div className={`${styles.botPasosCard} ${styles.cardTasa}`}>
                    <div className={styles.botPasosIcon}>📈</div>
                    <div className={styles.botPasosContent}>
                      <span className={styles.botPasosNumber}>{stats.botPasos.tasaConfirmacion}%</span>
                      <span className={styles.botPasosLabel}>Tasa Confirmación</span>
                    </div>
                  </div>
                  <div className={`${styles.botPasosCard} ${styles.cardClientes}`}>
                    <div className={styles.botPasosIcon}>👥</div>
                    <div className={styles.botPasosContent}>
                      <span className={styles.botPasosNumber}>{stats.botPasos.totalClientes}</span>
                      <span className={styles.botPasosLabel}>Total Clientes</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Información de la Empresa */}
            <div className={styles.empresaInfo}>
              <div className={styles.empresaHeader}>
                <h2>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  {stats.empresa.nombre}
                </h2>
                <span className={styles.categoriaBadge}>{stats.empresa.categoria}</span>
              </div>
              <div className={styles.empresaDetails}>
                <p>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '6px', verticalAlign: 'middle'}}>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  {stats.empresa.telefono}
                </p>
                {stats.empresa.email && (
                  <p>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '6px', verticalAlign: 'middle'}}>
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    {stats.empresa.email}
                  </p>
                )}
                <p>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '6px', verticalAlign: 'middle'}}>
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                  Modelo: {stats.empresa.modelo}
                </p>
              </div>
            </div>

            {/* Cards de Estadísticas */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <h3>Total Usuarios</h3>
                  <p className={styles.statNumber}>{stats.estadisticas.totalUsuarios}</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <h3>Interacciones</h3>
                  <p className={styles.statNumber}>{stats.estadisticas.totalInteracciones}</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <h3>Usuarios Activos</h3>
                  <p className={styles.statNumber}>{stats.estadisticas.usuariosActivos}</p>
                  <span className={styles.statSubtext}>Últimos 7 días</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="6"/>
                    <circle cx="12" cy="12" r="2"/>
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <h3>Promedio</h3>
                  <p className={styles.statNumber}>{stats.estadisticas.promedioInteracciones}</p>
                  <span className={styles.statSubtext}>interacciones/usuario</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <h3>Mensajes Enviados</h3>
                  <p className={styles.statNumber}>{stats.estadisticas.totalMensajesEnviados}</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <h3>Mensajes Recibidos</h3>
                  <p className={styles.statNumber}>{stats.estadisticas.totalMensajesRecibidos}</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                    <path d="M12 18V6"/>
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <h3>Tokens Consumidos</h3>
                  <p className={styles.statNumber}>{parseInt(stats.estadisticas.totalTokens.toString()).toLocaleString()}</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <h3>Promedio Tokens</h3>
                  <p className={styles.statNumber}>{parseInt(stats.estadisticas.promedioTokens).toLocaleString()}</p>
                  <span className={styles.statSubtext}>tokens/usuario</span>
                </div>
              </div>
            </div>

            {/* Usuarios Recientes */}
            <div className={styles.section}>
              <h2>👥 Usuarios Recientes</h2>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Teléfono</th>
                      <th>Interacciones</th>
                      <th>Tokens</th>
                      <th>Última Interacción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.usuariosRecientes.map((usuario) => (
                      <tr key={usuario.id}>
                        <td>{usuario.nombre || 'Sin nombre'}</td>
                        <td>{usuario.numero}</td>
                        <td>{usuario.interacciones}</td>
                        <td>{usuario.tokens_consumidos?.toLocaleString() || 0}</td>
                        <td>{new Date(usuario.ultimaInteraccion).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gráfico de Interacciones */}
            {stats.interaccionesPorDia.length > 0 && (
              <div className={styles.section}>
                <h2>📈 Interacciones por Día (Últimos 30 días)</h2>
                <div className={styles.chartContainer}>
                  {stats.interaccionesPorDia.map((dia) => (
                    <div key={dia.fecha} className={styles.chartBar}>
                      <div 
                        className={styles.bar} 
                        style={{ height: `${Math.min((dia.cantidad / Math.max(...stats.interaccionesPorDia.map(d => d.cantidad))) * 200, 200)}px` }}
                      >
                        <span className={styles.barValue}>{dia.cantidad}</span>
                      </div>
                      <span className={styles.barLabel}>{new Date(dia.fecha).toLocaleDateString('es', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
    </DashboardLayout>
  );
}
