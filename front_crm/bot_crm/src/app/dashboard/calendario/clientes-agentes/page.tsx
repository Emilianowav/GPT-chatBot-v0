'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ModuleGuard from '@/components/ModuleGuard';
import GestionClientesAgente from '@/components/calendar/GestionClientesAgente';
import styles from './clientes-agentes.module.css';

export default function ClientesAgentesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ModuleGuard moduleId="calendar_booking">
      <div className={styles.container}>
        <GestionClientesAgente />
      </div>
    </ModuleGuard>
  );
}
