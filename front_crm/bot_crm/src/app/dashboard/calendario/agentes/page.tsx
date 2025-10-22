'use client';

// 👨‍⚕️ Página de gestión de agentes
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import ModuleGuard from '@/components/ModuleGuard';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { useAgentes } from '@/hooks/useAgentes';
import ListaAgentes from '@/components/calendar/ListaAgentes';
import FormularioAgente from '@/components/calendar/FormularioAgente';
import styles from './agentes.module.css';

export default function AgentesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { agentes, loading, error, crearAgente, actualizarAgente, eliminarAgente } = useAgentes();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [agenteEditar, setAgenteEditar] = useState<any>(null);

  if (authLoading) {
    return (
      <DashboardLayout title="Agentes">
        <div className={styles.loading}>Cargando...</div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  const handleCrear = async (data: any) => {
    await crearAgente(data);
    setMostrarFormulario(false);
  };

  const handleEditar = (agente: any) => {
    setAgenteEditar(agente);
    setMostrarFormulario(true);
  };

  const handleActualizar = async (data: any) => {
    if (agenteEditar) {
      await actualizarAgente(agenteEditar._id, data);
      setMostrarFormulario(false);
      setAgenteEditar(null);
    }
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setAgenteEditar(null);
  };

  const handleDesactivar = async (agente: any) => {
    const accion = agente.activo ? 'desactivar' : 'activar';
    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas ${accion} al agente ${agente.nombre} ${agente.apellido}?`
    );
    
    if (confirmacion) {
      try {
        await actualizarAgente(agente._id, { activo: !agente.activo } as any);
      } catch (err) {
        alert(`Error al ${accion} el agente. Por favor, intenta nuevamente.`);
      }
    }
  };

  const handleEliminarPermanente = async (agente: any) => {
    const confirmacion = window.confirm(
      `⚠️ ADVERTENCIA: ¿Estás seguro de que deseas ELIMINAR PERMANENTEMENTE al agente ${agente.nombre} ${agente.apellido}?\n\nEsta acción NO se puede deshacer y eliminará todos los datos asociados.\n\nSi solo deseas desactivarlo temporalmente, usa el botón "Desactivar".`
    );
    
    if (confirmacion) {
      const segundaConfirmacion = window.confirm(
        `¿Realmente deseas eliminar permanentemente a ${agente.nombre} ${agente.apellido}? Esta es tu última oportunidad para cancelar.`
      );
      
      if (segundaConfirmacion) {
        try {
          await eliminarAgente(agente._id);
        } catch (err) {
          alert('Error al eliminar el agente. Por favor, intenta nuevamente.');
        }
      }
    }
  };

  return (
    <DashboardLayout title="Calendario">
      <ModuleGuard moduleId="calendar_booking">
        <div className={styles.container}>
          <Breadcrumb 
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Calendario', href: '/dashboard/calendario', icon: '📅' },
              { label: 'Agentes', icon: '👨‍⚕️' }
            ]}
          />
          
          {!mostrarFormulario ? (
            <>
              <div className={styles.header}>
                <div>
                  <h1>👨‍⚕️ Gestión de Agentes</h1>
                  <p>Administra los profesionales que atienden turnos</p>
                </div>
                <button 
                  className={styles.btnNuevo}
                  onClick={() => setMostrarFormulario(true)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Nuevo Agente
                </button>
              </div>

              {error && (
                <div className={styles.error}>
                  Error al cargar agentes: {error}
                </div>
              )}

              {loading ? (
                <div className={styles.loading}>
                  <div className={styles.spinner}></div>
                  <p>Cargando agentes...</p>
                </div>
              ) : (
                <ListaAgentes 
                  agentes={agentes}
                  onEditar={handleEditar}
                  onDesactivar={handleDesactivar}
                  onEliminar={handleEliminarPermanente}
                />
              )}
            </>
          ) : (
            <div className={styles.formularioContainer}>
              <FormularioAgente
                onSubmit={agenteEditar ? handleActualizar : handleCrear}
                onCancel={handleCancelar}
                agenteInicial={agenteEditar}
              />
            </div>
          )}
        </div>
      </ModuleGuard>
    </DashboardLayout>
  );
}
