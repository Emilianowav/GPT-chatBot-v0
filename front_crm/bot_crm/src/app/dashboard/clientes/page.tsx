'use client';

// 👤 Página de gestión de clientes
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { useClientes } from '@/hooks/useClientes';
import ListaClientes from '@/components/clientes/ListaClientes';
import FormularioCliente from '@/components/clientes/FormularioCliente';
import styles from './clientes.module.css';

export default function ClientesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { clientes, loading, error, crearCliente, actualizarCliente, eliminarCliente } = useClientes();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteEditar, setClienteEditar] = useState<any>(null);
  
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: 'todos',
    origen: 'todos'
  });

  if (authLoading) {
    return (
      <DashboardLayout title="Clientes">
        <div className={styles.loading}>Cargando...</div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  const handleCrear = async (data: any) => {
    await crearCliente(data);
    setMostrarFormulario(false);
  };

  const handleEditar = (cliente: any) => {
    setClienteEditar(cliente);
    setMostrarFormulario(true);
  };

  const handleActualizar = async (data: any) => {
    if (clienteEditar) {
      await actualizarCliente(clienteEditar._id, data);
      setMostrarFormulario(false);
      setClienteEditar(null);
    }
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setClienteEditar(null);
  };

  const handleEliminar = async (cliente: any) => {
    const confirmacion = window.confirm(
      `⚠️ ADVERTENCIA: ¿Estás seguro de que deseas ELIMINAR PERMANENTEMENTE al cliente ${cliente.nombre} ${cliente.apellido}?\n\nEsta acción NO se puede deshacer y eliminará todos los datos asociados.`
    );
    
    if (confirmacion) {
      const segundaConfirmacion = window.confirm(
        `¿Realmente deseas eliminar permanentemente a ${cliente.nombre} ${cliente.apellido}? Esta es tu última oportunidad para cancelar.`
      );
      
      if (segundaConfirmacion) {
        try {
          await eliminarCliente(cliente._id);
        } catch (err) {
          alert('Error al eliminar el cliente. Por favor, intenta nuevamente.');
        }
      }
    }
  };

  const clientesFiltrados = clientes.filter(cliente => {
    // Filtro de búsqueda
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`.toLowerCase();
      const telefono = cliente.telefono?.toLowerCase() || '';
      const email = cliente.email?.toLowerCase() || '';
      
      if (!nombreCompleto.includes(busqueda) && 
          !telefono.includes(busqueda) && 
          !email.includes(busqueda)) {
        return false;
      }
    }
    
    // Filtro de estado
    if (filtros.estado !== 'todos') {
      const activo = filtros.estado === 'activo';
      if (cliente.activo !== activo) {
        return false;
      }
    }
    
    // Filtro de origen
    if (filtros.origen !== 'todos') {
      if (cliente.origen !== filtros.origen) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <DashboardLayout title="Clientes">
      <div className={styles.container}>
        
        {!mostrarFormulario ? (
          <>
            <div className={styles.header}>
              <div>
                <h1>👤 Gestión de Clientes</h1>
                <p>Administra tu base de datos de clientes</p>
              </div>
              <button 
                className={styles.btnNuevo}
                onClick={() => setMostrarFormulario(true)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Nuevo Cliente
              </button>
            </div>

            {/* Filtros */}
            <div className={styles.filtrosCard}>
              <h3>🔍 Filtros</h3>
              <div className={styles.filtrosGrid}>
                <div className={styles.filtroItem}>
                  <label>Buscar</label>
                  <input
                    type="text"
                    placeholder="Nombre, teléfono o email..."
                    value={filtros.busqueda}
                    onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                  />
                </div>

                <div className={styles.filtroItem}>
                  <label>Estado</label>
                  <select
                    value={filtros.estado}
                    onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                  >
                    <option value="todos">Todos</option>
                    <option value="activo">Activos</option>
                    <option value="inactivo">Inactivos</option>
                  </select>
                </div>

                <div className={styles.filtroItem}>
                  <label>Origen</label>
                  <select
                    value={filtros.origen}
                    onChange={(e) => setFiltros({ ...filtros, origen: e.target.value })}
                  >
                    <option value="todos">Todos</option>
                    <option value="chatbot">Chatbot</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                <div className={styles.filtroItem}>
                  <label>&nbsp;</label>
                  <button 
                    className={styles.btnLimpiar}
                    onClick={() => setFiltros({ busqueda: '', estado: 'todos', origen: 'todos' })}
                  >
                    Limpiar Filtros
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                Error al cargar clientes: {error}
              </div>
            )}

            {/* Contador de resultados */}
            <div className={styles.resultadosHeader}>
              <h3>📋 Clientes ({clientesFiltrados.length})</h3>
            </div>

            {loading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Cargando clientes...</p>
              </div>
            ) : (
              <ListaClientes 
                clientes={clientesFiltrados}
                onEditar={handleEditar}
                onEliminar={handleEliminar}
              />
            )}
          </>
        ) : (
          <div className={styles.formularioContainer}>
            <FormularioCliente
              onSubmit={clienteEditar ? handleActualizar : handleCrear}
              onCancel={handleCancelar}
              clienteInicial={clienteEditar}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
