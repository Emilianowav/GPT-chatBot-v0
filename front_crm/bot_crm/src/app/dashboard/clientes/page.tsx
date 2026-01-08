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
  const [paginaActual, setPaginaActual] = useState(1);
  
  const [busqueda, setBusqueda] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('mas-recientes');

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

  const clientesFiltrados = clientes
    .filter(cliente => {
      // Filtro de búsqueda
      if (busqueda) {
        const busquedaLower = busqueda.toLowerCase();
        const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`.toLowerCase();
        const telefono = cliente.telefono?.toLowerCase() || '';
        const email = cliente.email?.toLowerCase() || '';
        
        if (!nombreCompleto.includes(busquedaLower) && 
            !telefono.includes(busquedaLower) && 
            !email.includes(busquedaLower)) {
          return false;
        }
      }
      
      // Filtros específicos según ordenamiento
      if (ordenarPor === 'origen-chatbot') {
        return cliente.origen === 'chatbot';
      }
      if (ordenarPor === 'origen-manual') {
        return cliente.origen === 'manual';
      }
      if (ordenarPor === 'activos') {
        return cliente.activo === true;
      }
      if (ordenarPor === 'inactivos') {
        return cliente.activo === false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Ordenamiento según selección
      if (ordenarPor === 'mas-recientes') {
        return new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime();
      }
      if (ordenarPor === 'mas-antiguos') {
        return new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime();
      }
      if (ordenarPor === 'nombre-az') {
        return `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`);
      }
      if (ordenarPor === 'nombre-za') {
        return `${b.nombre} ${b.apellido}`.localeCompare(`${a.nombre} ${a.apellido}`);
      }
      // Para filtros de origen y estado, mantener orden por fecha reciente
      return new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime();
    });

  return (
    <DashboardLayout title="Clientes">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Gestión de Clientes</h1>
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
          <div className={styles.filtrosGrid}>
            <div className={styles.filtroItem}>
              <label>Buscar</label>
              <input
                type="text"
                placeholder="Nombre, teléfono o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className={styles.filtroItem}>
              <label>Ordenar por</label>
              <select
                value={ordenarPor}
                onChange={(e) => setOrdenarPor(e.target.value)}
              >
                <option value="mas-recientes">Más recientes</option>
                <option value="mas-antiguos">Más antiguos</option>
                <option value="nombre-az">Nombre (A-Z)</option>
                <option value="nombre-za">Nombre (Z-A)</option>
                <option value="origen-chatbot">Origen: Chatbot</option>
                <option value="origen-manual">Origen: Manual</option>
                <option value="activos">Solo activos</option>
                <option value="inactivos">Solo inactivos</option>
              </select>
            </div>

            <div className={styles.filtroItem}>
              <label>&nbsp;</label>
              <button 
                className={styles.btnLimpiar}
                onClick={() => {
                  setBusqueda('');
                  setOrdenarPor('mas-recientes');
                }}
              >
                Limpiar
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
            currentPage={paginaActual}
            onPageChange={setPaginaActual}
          />
        )}

        {/* Modal de formulario como overlay */}
        {mostrarFormulario && (
          <FormularioCliente
            onSubmit={clienteEditar ? handleActualizar : handleCrear}
            onCancel={handleCancelar}
            clienteInicial={clienteEditar}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
