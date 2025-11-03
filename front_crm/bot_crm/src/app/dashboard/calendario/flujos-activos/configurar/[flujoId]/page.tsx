'use client';

// 🔧 Página de Configuración de Flujo Individual
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ModuleGuard from '@/components/ModuleGuard';
import ConfiguracionBot from '@/components/calendar/ConfiguracionBot';
import styles from './configurar-flujo.module.css';

interface PageProps {
  params: Promise<{
    flujoId: string;
  }>;
}

const flujosTitulos: Record<string, { titulo: string; descripcion: string; icono: string }> = {
  'menu_principal': {
    titulo: 'Configurar Menú Principal',
    descripcion: 'Personaliza el flujo de reserva, consulta y cancelación de turnos',
    icono: '📋'
  },
  'confirmacion_turnos': {
    titulo: 'Configurar Confirmación de Turnos',
    descripcion: 'Configura los recordatorios y confirmaciones automáticas',
    icono: '✅'
  },
  'notificacion_viajes': {
    titulo: 'Configurar Notificaciones de Viajes',
    descripcion: 'Personaliza las notificaciones de estado de viajes',
    icono: '🚗'
  }
};

export default function ConfigurarFlujoPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { isAuthenticated, loading: authLoading, empresa } = useAuth();
  const router = useRouter();
  const flujoId = resolvedParams.flujoId;

  if (authLoading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  const flujoInfo = flujosTitulos[flujoId] || {
    titulo: 'Configurar Flujo',
    descripcion: 'Personaliza este flujo del chatbot',
    icono: '⚙️'
  };

  return (
    <ModuleGuard moduleId="calendar_booking">
      <div className={styles.container}>
        <div className={styles.header}>
          <button 
            className={styles.btnVolver}
            onClick={() => router.push('/dashboard/calendario/flujos-activos')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Volver a Flujos
          </button>
        </div>

        <div className={styles.titleSection}>
          <span className={styles.icono}>{flujoInfo.icono}</span>
          <div>
            <h1>{flujoInfo.titulo}</h1>
            <p>{flujoInfo.descripcion}</p>
          </div>
        </div>

        <div className={styles.content}>
          <ConfiguracionBot empresaId={empresa?.empresaId || ''} />
        </div>
      </div>
    </ModuleGuard>
  );
}
