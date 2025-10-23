'use client';

// ⚙️ Página de Configuración del Módulo de Calendario
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import ModuleGuard from '@/components/ModuleGuard';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import ConfiguracionModulo from '@/components/calendar/ConfiguracionModulo';
import styles from './configuracion.module.css';

export default function ConfiguracionPage() {
  const { isAuthenticated, loading: authLoading, empresa } = useAuth();
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  if (authLoading) {
    return (
      <DashboardLayout title="Configuración">
        <div className={styles.loading}>Cargando...</div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  const handleGuardar = () => {
    setMensaje({
      tipo: 'success',
      texto: '✅ Configuración guardada exitosamente'
    });
    
    setTimeout(() => {
      setMensaje(null);
    }, 3000);
  };

  return (
    <DashboardLayout title="Calendario">
      <ModuleGuard moduleId="calendar_booking">
        <div className={styles.container}>
          <Breadcrumb 
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Calendario', href: '/dashboard/calendario', icon: '📅' },
              { label: 'Configuración', icon: '⚙️' }
            ]}
          />
          
          <div className={styles.header}>
            <div>
              <h1>⚙️ Configuración del Módulo</h1>
              <p>Personaliza el comportamiento del sistema de turnos, notificaciones y chatbot</p>
            </div>
          </div>

          {mensaje && (
            <div className={`${styles.mensaje} ${styles[mensaje.tipo]}`}>
              {mensaje.texto}
            </div>
          )}

          <div className={styles.content}>
            <ConfiguracionModulo 
              empresaId={empresa?.empresaId || ''} 
              onGuardar={handleGuardar}
            />
          </div>
        </div>
      </ModuleGuard>
    </DashboardLayout>
  );
}
