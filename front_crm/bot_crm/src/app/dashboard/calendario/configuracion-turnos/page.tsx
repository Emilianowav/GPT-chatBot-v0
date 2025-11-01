'use client';

// 📋 Página de Consulta de Turnos - Configuración de Calendario
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import ModuleGuard from '@/components/ModuleGuard';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import ConfiguracionBot from '@/components/calendar/ConfiguracionBot';
import styles from './configuracion-turnos.module.css';

export default function ConfiguracionTurnosPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const empresaId = typeof window !== 'undefined' ? localStorage.getItem('empresa_id') || '' : '';

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <DashboardLayout>
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
    <DashboardLayout>
      <ModuleGuard moduleId="calendario">
        <div className={styles.container}>
          <Breadcrumb 
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Calendario', href: '/dashboard/calendario' },
              { label: 'Consulta de Turnos', href: '/dashboard/calendario/configuracion-turnos' }
            ]}
          />

          <div className={styles.header}>
            <h1>🤖 Consulta de Turnos por WhatsApp</h1>
            <p className={styles.subtitle}>
              Configura cómo los clientes pueden consultar y gestionar sus turnos a través del chatbot
            </p>
          </div>

          <div className={styles.content}>
            <ConfiguracionBot empresaId={empresaId} />
          </div>
        </div>
      </ModuleGuard>
    </DashboardLayout>
  );
}
