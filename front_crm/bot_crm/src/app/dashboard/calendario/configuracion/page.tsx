'use client';

// ⚙️ Página de Configuración del Módulo de Calendario
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ModuleGuard from '@/components/ModuleGuard';
import ConfiguracionModulo from '@/components/calendar/ConfiguracionModulo';
import styles from './configuracion.module.css';

export default function ConfiguracionPage() {
  const { isAuthenticated, loading: authLoading, empresa } = useAuth();
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  if (authLoading) {
    return <div className={styles.loading}>Cargando...</div>;
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
    <ModuleGuard moduleId="calendar_booking">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>⚙️ Configuración General</h1>
          <p>Personaliza el comportamiento del sistema de turnos, notificaciones y chatbot</p>
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
  );
}
