'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAgentes } from '@/hooks/useAgentes';
import { useClientes } from '@/hooks/useClientes';
import * as clientesApi from '@/lib/clientesApi';
import styles from './GestionClientesAgente.module.css';

interface GestionClientesAgenteProps {
  onClose?: () => void;
}

export default function GestionClientesAgente({ onClose }: GestionClientesAgenteProps) {
  const { agentes, loading: loadingAgentes } = useAgentes(true);
  const { clientes, loading: loadingClientes, recargar: recargarClientes } = useClientes(true);
  
  const [agenteSeleccionado, setAgenteSeleccionado] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [vistaActiva, setVistaActiva] = useState<'todos' | 'asignados' | 'sin-asignar'>('todos');

  // Filtrar clientes según la vista y búsqueda
  const clientesFiltrados = useMemo(() => {
    let resultado = clientes;

    // Filtrar por vista
    if (vistaActiva === 'asignados') {
      resultado = resultado.filter(c => c.agentesAsignados && c.agentesAsignados.length > 0);
    } else if (vistaActiva === 'sin-asignar') {
      resultado = resultado.filter(c => !c.agentesAsignados || c.agentesAsignados.length === 0);
    }

    // Filtrar por agente seleccionado
    if (agenteSeleccionado) {
      resultado = resultado.filter(c => c.agentesAsignados && c.agentesAsignados.includes(agenteSeleccionado));
    }

    // Filtrar por búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter(c =>
        c.nombre.toLowerCase().includes(termino) ||
        c.apellido.toLowerCase().includes(termino) ||
        c.telefono.includes(termino) ||
        c.email?.toLowerCase().includes(termino)
      );
    }

    return resultado;
  }, [clientes, vistaActiva, agenteSeleccionado, busqueda]);

  // Obtener nombre del agente por ID
  const getNombreAgente = (agenteId: string) => {
    const agente = agentes.find(a => a._id === agenteId);
    return agente ? `${agente.nombre} ${agente.apellido}` : 'Desconocido';
  };

  // Agregar agente a cliente
  const handleAgregarAgente = async (clienteId: string, agenteId: string) => {
    try {
      setGuardando(true);
      setMensaje(null);
      await clientesApi.agregarAgente(clienteId, agenteId);
      await recargarClientes();
      setMensaje({
        tipo: 'success',
        texto: 'Agente agregado correctamente'
      });
      setTimeout(() => setMensaje(null), 3000);
    } catch (error: any) {
      setMensaje({
        tipo: 'error',
        texto: error.message || 'Error al agregar agente'
      });
    } finally {
      setGuardando(false);
    }
  };

  // Remover agente de cliente
  const handleRemoverAgente = async (clienteId: string, agenteId: string) => {
    try {
      setGuardando(true);
      setMensaje(null);
      await clientesApi.removerAgente(clienteId, agenteId);
      await recargarClientes();
      setMensaje({
        tipo: 'success',
        texto: 'Agente removido correctamente'
      });
      setTimeout(() => setMensaje(null), 3000);
    } catch (error: any) {
      setMensaje({
        tipo: 'error',
        texto: error.message || 'Error al remover agente'
      });
    } finally {
      setGuardando(false);
    }
  };

  // Contar clientes por agente
  const contarClientesPorAgente = (agenteId: string) => {
    return clientes.filter(c => c.agentesAsignados && c.agentesAsignados.includes(agenteId)).length;
  };

  const clientesSinAgente = clientes.filter(c => !c.agentesAsignados || c.agentesAsignados.length === 0).length;

  if (loadingAgentes || loadingClientes) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h2>Gestión de Clientes por Agente</h2>
          <p>Asigna o modifica el agente vinculado a cada cliente</p>
        </div>
        {onClose && (
          <button className={styles.btnCerrar} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {mensaje && (
        <div className={`${styles.mensaje} ${styles[mensaje.tipo]}`}>
          {mensaje.texto}
        </div>
      )}

      <div className={styles.layout}>
        {/* Panel lateral de agentes */}
        <div className={styles.panelAgentes}>
          <h3>Agentes</h3>
          
          <div
            className={`${styles.agenteItem} ${!agenteSeleccionado && vistaActiva === 'todos' ? styles.activo : ''}`}
            onClick={() => {
              setAgenteSeleccionado(null);
              setVistaActiva('todos');
            }}
          >
            <div className={styles.agenteInfo}>
              <span className={styles.agenteNombre}>Todos los clientes</span>
            </div>
            <span className={styles.agenteBadge}>{clientes.length}</span>
          </div>

          <div
            className={`${styles.agenteItem} ${vistaActiva === 'sin-asignar' ? styles.activo : ''}`}
            onClick={() => {
              setAgenteSeleccionado(null);
              setVistaActiva('sin-asignar');
            }}
          >
            <div className={styles.agenteInfo}>
              <span className={styles.agenteNombre}>Sin agente asignado</span>
            </div>
            <span className={`${styles.agenteBadge} ${styles.sinAsignar}`}>{clientesSinAgente}</span>
          </div>

          <div className={styles.separador}></div>

          {agentes.map(agente => (
            <div
              key={agente._id}
              className={`${styles.agenteItem} ${agenteSeleccionado === agente._id ? styles.activo : ''}`}
              onClick={() => {
                setAgenteSeleccionado(agente._id);
                setVistaActiva('asignados');
              }}
            >
              <div className={styles.agenteInfo}>
                <span className={styles.agenteNombre}>{agente.nombre} {agente.apellido}</span>
                {agente.especialidad && (
                  <span className={styles.agenteEspecialidad}>{agente.especialidad}</span>
                )}
              </div>
              <span className={styles.agenteBadge}>{contarClientesPorAgente(agente._id)}</span>
            </div>
          ))}
        </div>

        {/* Panel principal de clientes */}
        <div className={styles.panelClientes}>
          <div className={styles.filtros}>
            <div className={styles.busqueda}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <span className={styles.contador}>
              {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className={styles.listaClientes}>
            {clientesFiltrados.length === 0 ? (
              <div className={styles.sinResultados}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                <p>No se encontraron clientes</p>
              </div>
            ) : (
              clientesFiltrados.map(cliente => (
                <div key={cliente._id} className={styles.clienteCard}>
                  <div className={styles.clienteInfo}>
                    <div className={styles.clienteNombre}>
                      {cliente.nombre} {cliente.apellido}
                    </div>
                    <div className={styles.clienteDetalles}>
                      <span>{cliente.telefono}</span>
                      {cliente.email && <span>{cliente.email}</span>}
                    </div>
                  </div>
                  
                  <div className={styles.clienteAgente}>
                    <label>Agentes asignados:</label>
                    <div className={styles.agentesLista}>
                      {cliente.agentesAsignados && cliente.agentesAsignados.length > 0 ? (
                        cliente.agentesAsignados.map(agenteId => (
                          <div key={agenteId} className={styles.agenteChip}>
                            <span>{getNombreAgente(agenteId)}</span>
                            <button
                              onClick={() => handleRemoverAgente(cliente._id, agenteId)}
                              disabled={guardando}
                              className={styles.btnRemover}
                              title="Remover agente"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className={styles.sinAgentes}>Sin agentes asignados</span>
                      )}
                    </div>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAgregarAgente(cliente._id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      disabled={guardando}
                      className={styles.selectAgregar}
                    >
                      <option value="">+ Agregar agente</option>
                      {agentes
                        .filter(agente => !cliente.agentesAsignados || !cliente.agentesAsignados.includes(agente._id))
                        .map(agente => (
                          <option key={agente._id} value={agente._id}>
                            {agente.nombre} {agente.apellido}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
