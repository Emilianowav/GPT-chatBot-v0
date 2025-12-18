'use client';

// 🔗 Página Principal del Módulo de Integraciones
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import styles from './integraciones.module.css';

// URL del backend de MP (configurable via env)
const MP_API_URL = process.env.NEXT_PUBLIC_MP_API_URL || 'http://localhost:3001';

interface MPConnectionStatus {
  connected: boolean;
  userId?: string;
  loading: boolean;
  error?: string;
}

export default function IntegracionesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'marketplace' | 'devs'>('marketplace');
  const [mpStatus, setMpStatus] = useState<MPConnectionStatus>({
    connected: false,
    loading: false
  });

  // Verificar parámetros de URL al montar (callback de OAuth)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const mpStatusParam = params.get('mp_status');
    const mpUserId = params.get('mp_user_id');
    const mpError = params.get('mp_error');

    if (mpStatusParam === 'success' && mpUserId) {
      setMpStatus({ connected: true, userId: mpUserId, loading: false });
      setActiveTab('marketplace');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (mpStatusParam === 'error') {
      setMpStatus({ connected: false, loading: false, error: mpError || 'Error al conectar' });
      setActiveTab('marketplace');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  // Conectar con Mercado Pago
  const handleMPConnect = () => {
    setMpStatus(prev => ({ ...prev, loading: true, error: undefined }));
    
    const empresaId = localStorage.getItem('empresa_id') || 'default';
    const redirectUrl = `${window.location.origin}/dashboard/integraciones`;
    
    const authUrl = `${MP_API_URL}/oauth/authorize?internalId=${encodeURIComponent(empresaId)}&redirectUrl=${encodeURIComponent(redirectUrl)}`;
    window.location.href = authUrl;
  };

  // Desconectar Mercado Pago
  const handleMPDisconnect = async () => {
    if (!mpStatus.userId) return;
    
    const confirmacion = window.confirm(
      '¿Estás seguro de que deseas desconectar tu cuenta de Mercado Pago?'
    );
    
    if (!confirmacion) return;
    
    setMpStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await fetch(`${MP_API_URL}/oauth/disconnect/${mpStatus.userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Error al desconectar');
      
      setMpStatus({ connected: false, loading: false });
    } catch (err) {
      setMpStatus(prev => ({ ...prev, loading: false, error: 'Error al desconectar' }));
    }
  };

  return (
    <DashboardLayout title="Integraciones">
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Integraciones
            </h1>
            <p className={styles.subtitle}>
              Conecta tu CRM con APIs externas y aplicaciones populares
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'marketplace' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('marketplace')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Marketplace
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'devs' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('devs')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
            Área para Devs
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'devs' ? (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>APIs Configurables</h2>
                <p className={styles.sectionDescription}>
                  Conecta cualquier API REST, GraphQL o SOAP de forma personalizada
                </p>
              </div>
              <button
                className={styles.primaryButton}
                onClick={() => handleNavigate('/dashboard/integraciones/apis-configurables/nueva')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Nueva API
              </button>
            </div>

            {/* Botón destacado para gestionar APIs */}
            <div className={styles.quickAccess}>
              <button
                className={styles.largeButton}
                onClick={() => handleNavigate('/dashboard/integraciones/apis-configurables')}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                <div>
                  <h3>Gestionar APIs Configurables</h3>
                  <p>Ver, crear y configurar endpoints CRUD</p>
                </div>
              </button>
            </div>

            {/* Cards de características */}
            <div className={styles.grid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6"/>
                    <polyline points="8 6 2 12 8 18"/>
                  </svg>
                </div>
                <h3 className={styles.featureTitle}>APIs REST</h3>
                <p className={styles.featureDescription}>
                  Configura endpoints, parámetros y autenticación sin escribir código
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </div>
                <h3 className={styles.featureTitle}>Endpoints CRUD</h3>
                <p className={styles.featureDescription}>
                  Crea y configura endpoints GET, POST, PUT, DELETE con parámetros personalizados
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                </div>
                <h3 className={styles.featureTitle}>Probador Integrado</h3>
                <p className={styles.featureDescription}>
                  Prueba tus endpoints en tiempo real sin salir de la interfaz
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>0</div>
                <div className={styles.statLabel}>APIs Configuradas</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>0</div>
                <div className={styles.statLabel}>Endpoints Activos</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>0</div>
                <div className={styles.statLabel}>Llamadas Hoy</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>-</div>
                <div className={styles.statLabel}>Tiempo Promedio</div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.section}>
            {/* Marketplace Header */}
            <div className={styles.marketplaceHeader}>
              <div className={styles.marketplaceInfo}>
                <h2>Marketplace de Integraciones</h2>
                <p>Conecta con aplicaciones populares en un click y potencia tu negocio</p>
              </div>
            </div>

            {/* Error de MP */}
            {mpStatus.error && (
              <div className={styles.errorBanner}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {mpStatus.error}
              </div>
            )}

            {/* Grid de integraciones */}
            <div className={styles.marketplaceGrid}>
              {/* Mercado Pago */}
              <div className={`${styles.integrationCard} ${mpStatus.connected ? styles.integrationCardConnected : ''}`}>
                <div className={styles.integrationHeader}>
                  <div className={styles.integrationLogo}>
                    <img src="/logos tecnologias/mp-logo.png" alt="Mercado Pago" width="32" height="32" style={{ objectFit: 'contain' }} />
                  </div>
                  <div className={styles.integrationInfo}>
                    <h3 className={styles.integrationTitle}>Mercado Pago</h3>
                    <p className={styles.integrationDescription}>
                      Acepta pagos online y cobra comisiones como marketplace SaaS
                    </p>
                  </div>
                  <span className={`${styles.badge} ${mpStatus.connected ? styles.badgeConnected : styles.badgeActive}`}>
                    {mpStatus.connected ? 'Conectado' : 'Disponible'}
                  </span>
                </div>
                <div className={styles.integrationFeatures}>
                  <span className={styles.feature}>✓ Cobrar Productos</span>
                  <span className={styles.feature}>✓ Cobrar Suscripciones</span>
                  <span className={styles.feature}>✓ Split Payments</span>
                </div>
                
                {mpStatus.connected ? (
                  <div className={styles.connectedInfo}>
                    <div className={styles.connectedStatus}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      <span>Cuenta conectada</span>
                    </div>
                    <div className={styles.connectedActions}>
                      <button 
                        className={styles.configureButton}
                        onClick={() => handleNavigate('/dashboard/integraciones/mercadopago')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        Configurar
                      </button>
                      <button 
                        className={styles.disconnectButton}
                        onClick={handleMPDisconnect}
                        disabled={mpStatus.loading}
                      >
                        {mpStatus.loading ? '...' : 'Desconectar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    className={`${styles.integrationButton} ${styles.integrationButtonActive}`}
                    onClick={handleMPConnect}
                    disabled={mpStatus.loading}
                  >
                    {mpStatus.loading ? (
                      <>
                        <div className={styles.spinnerSmall}></div>
                        Conectando...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                        Conectar con Mercado Pago
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Google Calendar */}
              <div className={`${styles.integrationCard} ${styles.integrationCardDisabled}`}>
                <div className={styles.integrationHeader}>
                  <div className={styles.integrationLogo} style={{ background: '#4285F4' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6" stroke="white" strokeWidth="2"/>
                      <line x1="8" y1="2" x2="8" y2="6" stroke="white" strokeWidth="2"/>
                      <line x1="3" y1="10" x2="21" y2="10" stroke="white" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className={styles.integrationInfo}>
                    <h3 className={styles.integrationTitle}>Google Calendar</h3>
                    <p className={styles.integrationDescription}>
                      Sincroniza turnos y citas automáticamente con Google Calendar
                    </p>
                  </div>
                  <span className={styles.badge}>Próximamente</span>
                </div>
                <div className={styles.integrationFeatures}>
                  <span className={styles.feature}>✓ Sincronización bidireccional</span>
                  <span className={styles.feature}>✓ Notificaciones automáticas</span>
                  <span className={styles.feature}>✓ Múltiples calendarios</span>
                </div>
                <button className={styles.integrationButton} disabled>
                  Próximamente
                </button>
              </div>

              {/* Outlook Calendar */}
              <div className={`${styles.integrationCard} ${styles.integrationCardDisabled}`}>
                <div className={styles.integrationHeader}>
                  <div className={styles.integrationLogo} style={{ background: '#0078D4' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6" stroke="white" strokeWidth="2"/>
                      <line x1="8" y1="2" x2="8" y2="6" stroke="white" strokeWidth="2"/>
                      <line x1="3" y1="10" x2="21" y2="10" stroke="white" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className={styles.integrationInfo}>
                    <h3 className={styles.integrationTitle}>Outlook Calendar</h3>
                    <p className={styles.integrationDescription}>
                      Integra turnos y citas con Microsoft Outlook y Office 365
                    </p>
                  </div>
                  <span className={styles.badge}>Próximamente</span>
                </div>
                <div className={styles.integrationFeatures}>
                  <span className={styles.feature}>✓ Sincronización en tiempo real</span>
                  <span className={styles.feature}>✓ Invitaciones automáticas</span>
                  <span className={styles.feature}>✓ Teams integration</span>
                </div>
                <button className={styles.integrationButton} disabled>
                  Próximamente
                </button>
              </div>

              {/* Google Sheets */}
              <div className={`${styles.integrationCard} ${styles.integrationCardDisabled}`}>
                <div className={styles.integrationHeader}>
                  <div className={styles.integrationLogo} style={{ background: '#0F9D58' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="8" y1="13" x2="16" y2="13"/>
                      <line x1="8" y1="17" x2="16" y2="17"/>
                    </svg>
                  </div>
                  <div className={styles.integrationInfo}>
                    <h3 className={styles.integrationTitle}>Google Sheets</h3>
                    <p className={styles.integrationDescription}>
                      Exporta y sincroniza datos con hojas de cálculo de Google
                    </p>
                  </div>
                  <span className={styles.badge}>Próximamente</span>
                </div>
                <div className={styles.integrationFeatures}>
                  <span className={styles.feature}>✓ Exportación automática</span>
                  <span className={styles.feature}>✓ Actualización en tiempo real</span>
                  <span className={styles.feature}>✓ Reportes personalizados</span>
                </div>
                <button className={styles.integrationButton} disabled>
                  Próximamente
                </button>
              </div>

              {/* Zapier */}
              <div className={`${styles.integrationCard} ${styles.integrationCardDisabled}`}>
                <div className={styles.integrationHeader}>
                  <div className={styles.integrationLogo} style={{ background: '#FF4A00' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                  </div>
                  <div className={styles.integrationInfo}>
                    <h3 className={styles.integrationTitle}>Zapier</h3>
                    <p className={styles.integrationDescription}>
                      Conecta con más de 5,000 aplicaciones y automatiza flujos
                    </p>
                  </div>
                  <span className={styles.badge}>Próximamente</span>
                </div>
                <div className={styles.integrationFeatures}>
                  <span className={styles.feature}>✓ Automatizaciones ilimitadas</span>
                  <span className={styles.feature}>✓ Workflows personalizados</span>
                  <span className={styles.feature}>✓ 5,000+ integraciones</span>
                </div>
                <button className={styles.integrationButton} disabled>
                  Próximamente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </DashboardLayout>
  );
}
