'use client';

// 📅 Página principal del módulo de Calendario/Turnos
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import ModuleGuard from '@/components/ModuleGuard';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { useTurnos, useEstadisticas } from '@/hooks/useTurnos';
import { useAgentes } from '@/hooks/useAgentes';
import ListaTurnos from '@/components/calendar/ListaTurnos';
import CalendarioMensual from '@/components/calendar/CalendarioMensual';
import ModalTurno from '@/components/calendar/ModalTurno';
import styles from './calendario.module.css';

export default function CalendarioPage() {
  const { isAuthenticated, empresa, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const { turnos, loading: loadingTurnos, cargarTurnos, cargarTurnosDelDia, crearTurno, cancelarTurno, actualizarEstado } = useTurnos();
  const { estadisticas } = useEstadisticas();
  const { agentes } = useAgentes(true);
  
  const [modalNuevoTurno, setModalNuevoTurno] = useState(false);
  const [vistaCalendario, setVistaCalendario] = useState(true); // true = calendario, false = lista
  const [mesActual, setMesActual] = useState(new Date());
  const empresaId = typeof window !== 'undefined' ? localStorage.getItem('empresa_id') || '' : '';

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);
  
  // Carga inicial del mes actual - SIN dependencias circulares
  useEffect(() => {
    if (isAuthenticated) {
      const year = mesActual.getFullYear();
      const month = mesActual.getMonth();
      const primerDia = new Date(year, month, 1, 0, 0, 0, 0);
      const ultimoDia = new Date(year, month + 1, 0, 23, 59, 59, 999);
      
      console.log('📅 Cargando turnos del mes:', {
        desde: primerDia.toLocaleDateString('es-AR'),
        hasta: ultimoDia.toLocaleDateString('es-AR')
      });
      
      cargarTurnos({
        fechaDesde: primerDia.toISOString(),
        fechaHasta: ultimoDia.toISOString()
      });
    }
  }, [isAuthenticated, mesActual]); // Solo depende de mesActual, NO de funciones
  
  // Función para recargar el mes actual
  const recargarTurnosMes = useCallback(() => {
    const year = mesActual.getFullYear();
    const month = mesActual.getMonth();
    const primerDia = new Date(year, month, 1, 0, 0, 0, 0);
    const ultimoDia = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    console.log('🔄 Recargando turnos del mes actual');
    
    cargarTurnos({
      fechaDesde: primerDia.toISOString(),
      fechaHasta: ultimoDia.toISOString()
    });
  }, [mesActual, cargarTurnos]);

  // Handler para cuando el calendario cambia de mes
  const handleCambiarMes = useCallback((primerDia: Date, ultimoDia: Date) => {
    console.log('📆 Cambiando a mes:', {
      desde: primerDia.toLocaleDateString('es-AR'),
      hasta: ultimoDia.toLocaleDateString('es-AR')
    });
    
    // Solo actualizar el estado, el useEffect se encargará de cargar
    setMesActual(new Date(primerDia.getFullYear(), primerDia.getMonth(), 1));
  }, []);

  const handleCrearTurno = async (data: any) => {
    await crearTurno(data);
    setModalNuevoTurno(false);
    recargarTurnosMes();
  };
  
  const handleCancelarTurno = async (turnoId: string, motivo: string) => {
    await cancelarTurno(turnoId, motivo);
    recargarTurnosMes();
  };
  
  const handleActualizarEstado = async (turnoId: string, estado: string) => {
    await actualizarEstado(turnoId, estado);
    recargarTurnosMes();
  };

  if (authLoading) {
    return (
      <DashboardLayout title="Calendario">
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
    <DashboardLayout title="Calendario">
      <ModuleGuard moduleId="calendar_booking">
        <div className={styles.container}>
          <Breadcrumb 
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Calendario', icon: '📅' }
            ]}
          />
          
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <h1>📅 Calendario de Turnos</h1>
              <p>Gestiona los turnos de tus agentes y clientes</p>
            </div>
            <div className={styles.headerRight}>
              {empresa?.role === 'admin' && (
                <Link href="/dashboard/usuarios">
                  <button className={styles.btnSecondary}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    Usuarios
                  </button>
                </Link>
              )}
              <Link href="/dashboard/calendario/configuracion">
                <button className={styles.btnSecondary}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6M1 12h6m6 0h6"/>
                  </svg>
                  Configuración
                </button>
              </Link>
              <Link href="/dashboard/calendario/agentes">
                <button className={styles.btnSecondary}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                  </svg>
                  Gestionar Agentes
                </button>
              </Link>
              <Link href="/dashboard/calendario/gestion-turnos">
                <button className={styles.btnSecondary}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                  Gestión de Turnos
                </button>
              </Link>
              <button 
                className={styles.btnPrimary}
                onClick={() => setModalNuevoTurno(true)}
                disabled={agentes.length === 0}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Nuevo Turno
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#e3f2fd' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <h3>Turnos Hoy</h3>
                <p className={styles.statNumber}>{turnos.length}</p>
                <span className={styles.statChange}>
                  {turnos.length === 0 ? 'Sin turnos agendados' : `${turnos.filter(t => t.estado === 'confirmado').length} confirmados`}
                </span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#f3e5f5' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9c27b0" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <h3>Agentes Activos</h3>
                <p className={styles.statNumber}>{agentes.length}</p>
                <span className={styles.statChange}>
                  {agentes.length === 0 ? 'Agrega tu primer agente' : 'Disponibles'}
                </span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#e8f5e9' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <h3>Completados</h3>
                <p className={styles.statNumber}>{estadisticas?.turnosCompletados || 0}</p>
                <span className={styles.statChange}>Total</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#fff3e0' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff9800" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <h3>Próximo Turno</h3>
                <p className={styles.statNumber}>
                  {(() => {
                    const ahora = new Date();
                    const proximoTurno = turnos
                      .filter(t => new Date(t.fechaInicio) > ahora)
                      .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())[0];
                    
                    return proximoTurno
                      ? new Date(proximoTurno.fechaInicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                      : '--:--';
                  })()}
                </p>
                <span className={styles.statChange}>
                  {(() => {
                    const ahora = new Date();
                    const proximoTurno = turnos
                      .filter(t => new Date(t.fechaInicio) > ahora)
                      .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())[0];
                    
                    return proximoTurno ? 'Hoy' : 'No hay turnos pendientes';
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className={styles.mainContent}>
              {/* Turnos / Calendario */}
              <div className={styles.turnosSection}>
                <div className={styles.sectionHeader}>
                  <h2>{vistaCalendario ? 'Calendario Mensual' : 'Turnos del Día'}</h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className={`${styles.btnToggle} ${vistaCalendario ? styles.btnToggleActive : ''}`}
                      onClick={() => setVistaCalendario(true)}
                      title="Vista Calendario"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Calendario
                    </button>
                    <button 
                      className={`${styles.btnToggle} ${!vistaCalendario ? styles.btnToggleActive : ''}`}
                      onClick={() => setVistaCalendario(false)}
                      title="Vista Lista"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6"/>
                        <line x1="8" y1="12" x2="21" y2="12"/>
                        <line x1="8" y1="18" x2="21" y2="18"/>
                        <line x1="3" y1="6" x2="3.01" y2="6"/>
                        <line x1="3" y1="12" x2="3.01" y2="12"/>
                        <line x1="3" y1="18" x2="3.01" y2="18"/>
                      </svg>
                      Lista
                    </button>
                    {!vistaCalendario && (
                      <button 
                        className={styles.btnText}
                        onClick={() => cargarTurnosDelDia()}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 4 23 10 17 10"/>
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                        </svg>
                        Actualizar
                      </button>
                    )}
                  </div>
                </div>
                {loadingTurnos ? (
                  <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Cargando turnos...</p>
                  </div>
                ) : vistaCalendario ? (
                  <CalendarioMensual
                    turnos={turnos}
                    agentes={agentes.map(a => ({ id: a._id, nombre: a.nombre, apellido: a.apellido }))}
                    mesInicial={mesActual}
                    onCambiarMes={handleCambiarMes}
                    onSeleccionarTurno={(turno) => {
                      console.log('Turno seleccionado:', turno);
                      // Aquí puedes abrir un modal con detalles del turno
                    }}
                  />
                ) : (
                  <ListaTurnos 
                    turnos={turnos}
                    onCancelar={handleCancelarTurno}
                    onActualizarEstado={handleActualizarEstado}
                  />
                )}
              </div>
            </div>

          {/* Info Banner */}
          <div className={styles.infoBanner}>
              <div className={styles.bannerIcon}>💡</div>
              <div className={styles.bannerContent}>
                <h3>¿Cómo funciona el módulo de Calendario?</h3>
                <p>
                  {agentes.length === 0 ? (
                    <>
                      <strong>Paso 1:</strong> Agrega agentes haciendo click en "Gestionar Agentes"<br/>
                      <strong>Paso 2:</strong> Configura sus horarios de disponibilidad<br/>
                      <strong>Paso 3:</strong> Comienza a crear turnos desde este dashboard
                    </>
                  ) : (
                    <>
                      1. Los clientes pueden reservar turnos vía WhatsApp<br/>
                      2. Reciben recordatorios automáticos 24hs y 1hr antes<br/>
                      3. Gestiona todo desde este dashboard<br/>
                      4. Visualiza estadísticas y reportes
                    </>
                  )}
                </p>
              </div>
              <Link href="/dashboard/calendario/agentes">
                <button className={styles.bannerBtn}>
                  {agentes.length === 0 ? 'Agregar Primer Agente' : 'Gestionar Agentes'}
                </button>
              </Link>
            </div>

          {/* Modales */}
          <ModalTurno
            isOpen={modalNuevoTurno}
            onClose={() => setModalNuevoTurno(false)}
            onSubmit={handleCrearTurno}
          />
        </div>
      </ModuleGuard>
    </DashboardLayout>
  );
}
