'use client';

// 🔐 Dashboard de Super Administrador
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import type { EmpresaListItem, SuperAdminFilters } from '@/types';
import OnboardingModal from '@/components/superadmin/OnboardingModal';
import EmpresaDetailModal from '@/components/superadmin/EmpresaDetailModal';
import styles from './superadmin.module.css';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { empresa, loading: authLoading, logout } = useAuth();
  const [empresas, setEmpresas] = useState<EmpresaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
  const [filtros, setFiltros] = useState<SuperAdminFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Verificar que es super_admin
  useEffect(() => {
    if (!authLoading && (!empresa || empresa.role !== 'super_admin')) {
      router.push('/login');
    }
  }, [empresa, authLoading, router]);

  // Cargar empresas
  useEffect(() => {
    if (empresa?.role === 'super_admin') {
      cargarEmpresas();
    }
  }, [empresa, filtros]);

  const cargarEmpresas = async () => {
    try {
      setLoading(true);
      const response = await apiClient.superAdminGetEmpresas(filtros);
      if (response.success) {
        setEmpresas(response.empresas as unknown as EmpresaListItem[]);
      }
    } catch (error) {
      console.error('Error al cargar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarBusqueda = () => {
    setFiltros({ ...filtros, nombre: searchTerm });
  };

  const limpiarFiltros = () => {
    setFiltros({});
    setSearchTerm('');
  };

  const exportarDatos = () => {
    const csv = [
      ['Nombre', 'Email', 'Plan', 'Mensajes', 'Límite', '% Uso', 'Estado', 'WhatsApp'].join(','),
      ...empresas.map(e => [
        e.nombre,
        e.email,
        e.plan,
        e.mensajesEsteMes,
        e.limitesMensajes,
        e.porcentajeUso,
        e.estadoFacturacion,
        e.whatsappConectado ? 'Sí' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `empresas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Calcular métricas globales
  const metricasGlobales = {
    totalEmpresas: empresas.length,
    totalMensajes: empresas.reduce((sum, e) => sum + e.mensajesEsteMes, 0),
    totalUsuarios: empresas.reduce((sum, e) => sum + e.usuariosActivos, 0),
    empresasActivas: empresas.filter(e => e.estadoFacturacion === 'activo').length,
    empresasCercaLimite: empresas.filter(e => parseFloat(e.porcentajeUso) > 80).length,
    empresasSinUso: empresas.filter(e => e.mensajesEsteMes === 0).length,
  };

  if (authLoading || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando panel de administración...</p>
      </div>
    );
  }

  if (!empresa || empresa.role !== 'super_admin') {
    return null;
  }

  return (
    <div className={styles.container} data-page="superadmin">
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <span>🏢</span>
            </div>
            <div className={styles.headerTitle}>
              <h1>Panel SuperAdmin</h1>
              <p>Gestión global de empresas</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.userInfo}>
              {empresa.username} • <span className={styles.userRole}>MOMENTO</span>
            </span>
            <button onClick={logout} className={styles.logoutBtn}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Métricas Globales */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <span>🏢</span>
            </div>
            <div className={styles.statContent}>
              <h3>Total Empresas</h3>
              <p className={styles.statNumber}>{metricasGlobales.totalEmpresas}</p>
              <span className={styles.statSubtext}>{metricasGlobales.empresasActivas} activas</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <span>💬</span>
            </div>
            <div className={styles.statContent}>
              <h3>Mensajes Totales</h3>
              <p className={styles.statNumber}>{metricasGlobales.totalMensajes.toLocaleString()}</p>
              <span className={styles.statSubtext}>Este mes</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <span>👥</span>
            </div>
            <div className={styles.statContent}>
              <h3>Usuarios Activos</h3>
              <p className={styles.statNumber}>{metricasGlobales.totalUsuarios.toLocaleString()}</p>
              <span className={styles.statSubtext}>Todos los clientes</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <span>⚠️</span>
            </div>
            <div className={styles.statContent}>
              <h3>Alertas</h3>
              <p className={styles.statNumber}>{metricasGlobales.empresasCercaLimite}</p>
              <span className={styles.statSubtext}>Cerca del límite</span>
            </div>
          </div>
        </div>

        {/* Barra de acciones */}
        <div className={styles.actionsBar}>
          <div className={styles.actionsTop}>
            <div className={styles.searchRow}>
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && aplicarBusqueda()}
                  className={styles.searchInput}
                />
              </div>
              <button onClick={aplicarBusqueda} className={styles.btnSearch}>
                Buscar
              </button>
            </div>
            <div className={styles.buttonsRow}>
              <button onClick={() => setShowFilters(!showFilters)} className={styles.btnSecondary}>
                🔍 Filtros
              </button>
              <button onClick={exportarDatos} className={styles.btnSecondary}>
                📥 Exportar
              </button>
              <button onClick={() => setShowOnboarding(true)} className={styles.btnPrimary}>
                ➕ Nueva Empresa
              </button>
            </div>
          </div>

          {/* Panel de filtros */}
          {showFilters && (
            <div className={styles.filtersPanel}>
              <select
                value={filtros.plan || ''}
                onChange={(e) => setFiltros({ ...filtros, plan: e.target.value || undefined })}
                className={styles.filterSelect}
              >
                <option value="">Todos los planes</option>
                <option value="basico">Básico</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>

              <select
                value={filtros.estadoFacturacion || ''}
                onChange={(e) => setFiltros({ ...filtros, estadoFacturacion: e.target.value || undefined })}
                className={styles.filterSelect}
              >
                <option value="">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="suspendido">Suspendido</option>
                <option value="prueba">Prueba</option>
              </select>

              <label className={styles.filterCheckbox}>
                <input
                  type="checkbox"
                  checked={filtros.sinUso || false}
                  onChange={(e) => setFiltros({ ...filtros, sinUso: e.target.checked || undefined })}
                />
                <span>Sin uso</span>
              </label>

              <label className={styles.filterCheckbox}>
                <input
                  type="checkbox"
                  checked={filtros.cercaLimite || false}
                  onChange={(e) => setFiltros({ ...filtros, cercaLimite: e.target.checked || undefined })}
                />
                <span>Cerca del límite</span>
              </label>

              <button onClick={limpiarFiltros} className={styles.btnSecondary}>
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Tabla de empresas */}
        <div className={styles.tableSection}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Plan</th>
                  <th>Uso Mensajes</th>
                  <th>Usuarios</th>
                  <th>Estado</th>
                  <th>WhatsApp</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empresas.map((empresa) => {
                  const porcentaje = parseFloat(empresa.porcentajeUso);
                  const progressClass = porcentaje > 80 ? styles.progressRed : porcentaje > 60 ? styles.progressOrange : styles.progressGreen;
                  
                  return (
                    <tr key={empresa.id}>
                      <td>
                        <div className={styles.empresaCell}>
                          <span className={styles.empresaNombre}>{empresa.nombre}</span>
                          <span className={styles.empresaEmail}>{empresa.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${
                          empresa.plan === 'enterprise' ? styles.badgeEnterprise :
                          empresa.plan === 'premium' ? styles.badgePremium :
                          empresa.plan === 'standard' ? styles.badgeStandard :
                          styles.badgeBasico
                        }`}>
                          {empresa.plan}
                        </span>
                      </td>
                      <td>
                        <div className={styles.usoCell}>
                          <div className={styles.usoNumbers}>
                            <span>{empresa.mensajesEsteMes.toLocaleString()} / {empresa.limitesMensajes.toLocaleString()}</span>
                          </div>
                          <div className={styles.progressBar}>
                            <div
                              className={`${styles.progressFill} ${progressClass}`}
                              style={{ width: empresa.porcentajeUso }}
                            />
                          </div>
                          <span className={styles.usoPercent}>{empresa.porcentajeUso}</span>
                        </div>
                      </td>
                      <td>{empresa.usuariosActivos}</td>
                      <td>
                        <span className={`${styles.badge} ${
                          empresa.estadoFacturacion === 'activo' ? styles.badgeActivo :
                          empresa.estadoFacturacion === 'suspendido' ? styles.badgeSuspendido :
                          styles.badgePrueba
                        }`}>
                          {empresa.estadoFacturacion}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${
                          empresa.whatsappConectado ? styles.statusConnected : styles.statusDisconnected
                        }`}>
                          <span className={styles.statusDot}></span>
                          {empresa.whatsappConectado ? 'Conectado' : 'Desconectado'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setSelectedEmpresaId(empresa.nombre);
                            setShowDetail(true);
                          }}
                          className={styles.linkButton}
                        >
                          Ver detalle →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {empresas.length === 0 && !loading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🏢</div>
              <p>No se encontraron empresas</p>
              <button onClick={() => setShowOnboarding(true)} className={styles.emptyButton}>
                Crear primera empresa
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Onboarding */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onSuccess={() => {
          cargarEmpresas();
          setShowOnboarding(false);
        }}
      />

      {/* Modal de Detalle de Empresa */}
      <EmpresaDetailModal
        isOpen={showDetail}
        empresaId={selectedEmpresaId}
        onClose={() => {
          setShowDetail(false);
          setSelectedEmpresaId('');
        }}
        onUpdate={() => {
          cargarEmpresas();
        }}
      />
    </div>
  );
}
