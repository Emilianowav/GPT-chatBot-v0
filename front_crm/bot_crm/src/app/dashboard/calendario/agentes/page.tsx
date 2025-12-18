'use client';

// 👨‍⚕️ Página de gestión de agentes
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ModuleGuard from '@/components/ModuleGuard';
import { useAgentes } from '@/hooks/useAgentes';
import ListaAgentes from '@/components/calendar/ListaAgentes';
import ModalAgente from '@/components/calendar/ModalAgente';
import FiltrosCalendario, { FiltrosState } from '@/components/calendar/FiltrosCalendario';
import styles from './agentes.module.css';

export default function AgentesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { agentes, loading, error, crearAgente, actualizarAgente, eliminarAgente } = useAgentes();

  const [modalFormulario, setModalFormulario] = useState(false);
  const [agenteEditar, setAgenteEditar] = useState<any>(null);
  const [filtros, setFiltros] = useState<FiltrosState>({
    estado: 'todos',
    agenteId: '',
    fechaDesde: '',
    fechaHasta: '',
    busqueda: ''
  });

  // Filtrar agentes
  const agentesFiltrados = useMemo(() => {
    let resultado = agentes;
    
    // Filtrar por estado (activo/inactivo)
    if (filtros.estado === 'activo') {
      resultado = resultado.filter(a => a.activo);
    } else if (filtros.estado === 'inactivo') {
      resultado = resultado.filter(a => !a.activo);
    }
    
    // Filtrar por búsqueda
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      resultado = resultado.filter(a => 
        a.nombre.toLowerCase().includes(busqueda) ||
        a.apellido.toLowerCase().includes(busqueda) ||
        a.email?.toLowerCase().includes(busqueda) ||
        a.especialidad?.toLowerCase().includes(busqueda)
      );
    }
    
    return resultado;
  }, [agentes, filtros]);

  const handleFiltrar = (nuevosFiltros: FiltrosState) => {
    setFiltros(nuevosFiltros);
  };

  if (authLoading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  const handleCrear = async (data: any) => {
    await crearAgente(data);
    setModalFormulario(false);
  };

  const handleEditar = (agente: any) => {
    setAgenteEditar(agente);
    setModalFormulario(true);
  };

  const handleActualizar = async (data: any) => {
    if (agenteEditar) {
      await actualizarAgente(agenteEditar._id, data);
      setModalFormulario(false);
      setAgenteEditar(null);
    }
  };

  const handleCancelar = () => {
    setModalFormulario(false);
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
    <ModuleGuard moduleId="calendar_booking">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Gestión de Agentes</h1>
            <p>Administra los profesionales que atienden turnos</p>
          </div>
          <button 
            className={styles.btnNuevo}
            onClick={() => setModalFormulario(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Nuevo Agente
          </button>
        </div>

        {/* Filtros */}
        <FiltrosCalendario
          agentes={[]}
          onFiltrar={handleFiltrar}
          mostrarEstado={true}
          mostrarFechas={false}
          mostrarAgente={false}
          mostrarBusqueda={true}
          fechaDefecto="ninguna"
          titulo="Filtros de Agentes"
          opcionesEstado={[
            { value: 'todos', label: 'Todos' },
            { value: 'activo', label: 'Activos' },
            { value: 'inactivo', label: 'Inactivos' }
          ]}
        />

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
            agentes={agentesFiltrados}
            onEditar={handleEditar}
            onDesactivar={handleDesactivar}
            onEliminar={handleEliminarPermanente}
          />
        )}

        {/* Modal Agente */}
        <ModalAgente
          isOpen={modalFormulario}
          onClose={handleCancelar}
          onSubmit={agenteEditar ? handleActualizar : handleCrear}
          agenteInicial={agenteEditar}
        />
      </div>
    </ModuleGuard>
  );
}
