'use client';

// 🔧 Página de Gestión de Turnos
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ModuleGuard from '@/components/ModuleGuard';
import { useTurnos } from '@/hooks/useTurnos';
import { useAgentes } from '@/hooks/useAgentes';
import Pagination from '@/components/ui/Pagination';
import FiltrosCalendario, { FiltrosState } from '@/components/calendar/FiltrosCalendario';
import type { Turno } from '@/lib/calendarApi';
import styles from './gestion.module.css';

export default function GestionTurnosPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { turnos, loading, cargarTurnos, actualizarEstado, cancelarTurno } = useTurnos();
  const { agentes } = useAgentes(true);

  // Por defecto cargar turnos del día actual
  const hoy = new Date();
  const fechaHoy = hoy.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  
  const [filtros, setFiltros] = useState<FiltrosState>({
    estado: 'todos',
    agenteId: '',
    fechaDesde: hoy.toISOString().split('T')[0],
    fechaHasta: hoy.toISOString().split('T')[0],
    busqueda: ''
  });
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  
  // Estado para formulario de edición
  const [formEdicion, setFormEdicion] = useState({
    agenteId: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    notas: '',
    datos: {} as any
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      cargarTurnosConFiltros();
    }
  }, [isAuthenticated]);

  const cargarTurnosConFiltros = (nuevosFiltros?: FiltrosState) => {
    const f = nuevosFiltros || filtros;
    const filtrosApi: any = {};
    
    if (f.estado !== 'todos') {
      filtrosApi.estado = f.estado;
    }
    
    if (f.agenteId) {
      filtrosApi.agenteId = f.agenteId;
    }
    
    if (f.fechaDesde) {
      filtrosApi.fechaDesde = new Date(f.fechaDesde).toISOString();
    }
    
    if (f.fechaHasta) {
      const fecha = new Date(f.fechaHasta);
      fecha.setHours(23, 59, 59, 999);
      filtrosApi.fechaHasta = fecha.toISOString();
    }
    
    cargarTurnos(filtrosApi);
  };

  const handleFiltrar = (nuevosFiltros: FiltrosState) => {
    setFiltros(nuevosFiltros);
    cargarTurnosConFiltros(nuevosFiltros);
    setCurrentPage(1);
  };

  const turnosFiltrados = useMemo(() => {
    return turnos.filter(turno => {
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        const clienteNombre = turno.clienteInfo?.nombre?.toLowerCase() || '';
        const clienteApellido = turno.clienteInfo?.apellido?.toLowerCase() || '';
        const agenteNombre = (turno.agenteId as any)?.nombre?.toLowerCase() || '';
        
        return clienteNombre.includes(busqueda) || 
               clienteApellido.includes(busqueda) ||
               agenteNombre.includes(busqueda);
      }
      return true;
    });
  }, [turnos, filtros.busqueda]);

  // Paginación de turnos
  const totalPages = Math.ceil(turnosFiltrados.length / itemsPerPage);
  const turnosPaginados = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return turnosFiltrados.slice(start, start + itemsPerPage);
  }, [turnosFiltrados, currentPage, itemsPerPage]);

  const handleCambiarEstado = async (turnoId: string, nuevoEstado: string) => {
    try {
      await actualizarEstado(turnoId, nuevoEstado);
      cargarTurnosConFiltros();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  const handleCancelarTurno = async () => {
    if (!turnoSeleccionado) return;
    
    try {
      await cancelarTurno(turnoSeleccionado._id, motivoCancelacion);
      setModalCancelar(false);
      setTurnoSeleccionado(null);
      setMotivoCancelacion('');
      cargarTurnosConFiltros();
    } catch (error) {
      console.error('Error al cancelar turno:', error);
    }
  };

  const abrirModalEdicion = (turno: Turno) => {
    setTurnoSeleccionado(turno);
    
    const fechaInicio = new Date(turno.fechaInicio);
    const fechaFin = turno.fechaFin ? new Date(turno.fechaFin) : null;
    
    // Cargar datos del turno en el formulario (usar hora local, no UTC)
    setFormEdicion({
      agenteId: typeof turno.agenteId === 'string' ? turno.agenteId : (turno.agenteId as any)?._id || '',
      fecha: fechaInicio.toLocaleDateString('en-CA'), // Formato YYYY-MM-DD
      horaInicio: `${fechaInicio.getHours().toString().padStart(2, '0')}:${fechaInicio.getMinutes().toString().padStart(2, '0')}`,
      horaFin: fechaFin ? `${fechaFin.getHours().toString().padStart(2, '0')}:${fechaFin.getMinutes().toString().padStart(2, '0')}` : '',
      notas: turno.notas || '',
      datos: turno.datos || {}
    });
    
    setModalEditar(true);
  };

  const handleGuardarEdicion = async () => {
    if (!turnoSeleccionado) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      console.log('🔧 Actualizando turno:', turnoSeleccionado._id);
      console.log('📡 URL:', `${apiUrl}/api/modules/calendar/turnos/${turnoSeleccionado._id}`);
      
      // Construir fechaInicio y fechaFin
      const fechaInicio = new Date(`${formEdicion.fecha}T${formEdicion.horaInicio}:00`);
      let fechaFin = null;
      
      if (formEdicion.horaFin) {
        fechaFin = new Date(`${formEdicion.fecha}T${formEdicion.horaFin}:00`);
      }
      
      const body = {
        agenteId: formEdicion.agenteId,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin ? fechaFin.toISOString() : null,
        notas: formEdicion.notas,
        datos: formEdicion.datos
      };
      
      console.log('📤 Body:', body);
      
      const response = await fetch(`${apiUrl}/api/modules/calendar/turnos/${turnoSeleccionado._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.message || 'Error al actualizar turno');
      }

      const data = await response.json();
      console.log('✅ Turno actualizado:', data);
      
      setModalEditar(false);
      setTurnoSeleccionado(null);
      cargarTurnosConFiltros();
      
      alert('✅ Turno actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error al guardar edición:', error);
      alert(`Error al guardar los cambios: ${(error as Error).message}`);
    }
  };

  const actualizarDatosCampo = (campo: string, valor: any) => {
    setFormEdicion({
      ...formEdicion,
      datos: {
        ...formEdicion.datos,
        [campo]: valor
      }
    });
  };

  const getEstadoColor = (estado: string) => {
    const colores: any = {
      pendiente: '#f39c12',
      confirmado: '#3498db',
      en_curso: '#9b59b6',
      completado: '#27ae60',
      cancelado: '#e74c3c'
    };
    return colores[estado] || '#95a5a6';
  };

  const getEstadoTexto = (estado: string) => {
    const textos: any = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmado',
      en_curso: 'En Curso',
      completado: 'Completado',
      cancelado: 'Cancelado'
    };
    return textos[estado] || estado;
  };

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
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1>Gestión de Turnos</h1>
            <p>Administra y gestiona los turnos programados</p>
          </div>
        </div>

        {/* Filtros */}
        <FiltrosCalendario
          agentes={agentes}
          onFiltrar={handleFiltrar}
          mostrarEstado={true}
          mostrarFechas={true}
          mostrarAgente={true}
          mostrarBusqueda={true}
          fechaDefecto="hoy"
          titulo="Filtros de Turnos"
        />

        {/* Tabla de Turnos */}
        <div className={styles.turnosCard}>
          <div className={styles.turnosHeader}>
            <h3>Turnos para el día de hoy: {fechaHoy} ({turnosFiltrados.length})</h3>
          </div>

            {loading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Cargando turnos...</p>
              </div>
            ) : turnosFiltrados.length === 0 ? (
              <div className={styles.empty}>
                <p>No se encontraron turnos con los filtros seleccionados</p>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Fecha y Hora</th>
                      <th>Cliente</th>
                      <th>Agente</th>
                      <th>Estado</th>
                      <th>Detalles</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turnosPaginados.map(turno => (
                      <tr key={turno._id}>
                        <td>
                          <div className={styles.fechaCell}>
                            <span className={styles.fecha}>
                              {new Date(turno.fechaInicio).toLocaleDateString('es-AR')}
                            </span>
                            <span className={styles.hora}>
                              {new Date(turno.fechaInicio).toLocaleTimeString('es-AR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.clienteCell}>
                            <span className={styles.nombre}>
                              {turno.clienteInfo?.nombre} {turno.clienteInfo?.apellido}
                            </span>
                            {turno.clienteInfo?.telefono && (
                              <span className={styles.telefono}>
                                📱 {turno.clienteInfo.telefono}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={styles.agente}>
                            {(turno.agenteId as any)?.nombre} {(turno.agenteId as any)?.apellido}
                          </span>
                        </td>
                        <td>
                          <span 
                            className={styles.estadoBadge}
                            style={{ background: getEstadoColor(turno.estado) }}
                          >
                            {getEstadoTexto(turno.estado)}
                          </span>
                        </td>
                        <td>
                          <div className={styles.detallesCell}>
                            {turno.datos?.origen && (
                              <span>📍 {turno.datos.origen}</span>
                            )}
                            {turno.datos?.destino && (
                              <span>🎯 {turno.datos.destino}</span>
                            )}
                            {turno.datos?.pasajeros && (
                              <span>👥 {turno.datos.pasajeros}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={styles.acciones}>
                            {turno.estado !== 'cancelado' && turno.estado !== 'completado' && (
                              <>
                                <button
                                  className={styles.btnEditar}
                                  onClick={() => abrirModalEdicion(turno)}
                                  title="Editar turno"
                                >
                                  ✏️
                                </button>
                                
                                <select
                                  className={styles.selectEstado}
                                  defaultValue={turno.estado}
                                  onChange={(e) => handleCambiarEstado(turno._id, e.target.value)}
                                >
                                  <option value="pendiente">Pendiente</option>
                                  <option value="confirmado">Confirmado</option>
                                  <option value="en_curso">En Curso</option>
                                  <option value="completado">Completado</option>
                                </select>
                                
                                <button
                                  className={styles.btnCancelar}
                                  onClick={() => {
                                    setTurnoSeleccionado(turno);
                                    setModalCancelar(true);
                                  }}
                                  title="Cancelar turno"
                                >
                                  ❌
                                </button>
                              </>
                            )}
                            {(turno.estado === 'cancelado' || turno.estado === 'completado') && (
                              <span className={styles.estadoFinal}>
                                {turno.estado === 'cancelado' ? '❌ Cancelado' : '✅ Completado'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={turnosFiltrados.length}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            )}
          </div>

          {/* Modal Editar */}
          {modalEditar && turnoSeleccionado && (
            <div className={styles.modal}>
              <div className={styles.modalContent} style={{ maxWidth: '700px' }}>
                <div className={styles.modalHeader}>
                  <h3>✏️ Editar Turno</h3>
                  <button 
                    className={styles.modalClose}
                    onClick={() => {
                      setModalEditar(false);
                      setTurnoSeleccionado(null);
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className={styles.modalBody}>
                  <div className={styles.turnoInfo}>
                    <p><strong>Cliente:</strong> {turnoSeleccionado.clienteInfo?.nombre} {turnoSeleccionado.clienteInfo?.apellido}</p>
                    <p><strong>Teléfono:</strong> {turnoSeleccionado.clienteInfo?.telefono}</p>
                  </div>

                  <div className={styles.formGrid}>
                    {/* Agente */}
                    <div className={styles.field}>
                      <label>👤 Agente *</label>
                      <select
                        value={formEdicion.agenteId}
                        onChange={(e) => setFormEdicion({ ...formEdicion, agenteId: e.target.value })}
                      >
                        <option value="">Seleccionar agente...</option>
                        {agentes.map(agente => (
                          <option key={agente._id} value={agente._id}>
                            {agente.nombre} {agente.apellido}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Fecha */}
                    <div className={styles.field}>
                      <label>📅 Fecha *</label>
                      <input
                        type="date"
                        value={formEdicion.fecha}
                        onChange={(e) => setFormEdicion({ ...formEdicion, fecha: e.target.value })}
                      />
                    </div>

                    {/* Hora de Inicio */}
                    <div className={styles.field}>
                      <label>⏰ Hora de Inicio *</label>
                      <input
                        type="text"
                        value={formEdicion.horaInicio}
                        onChange={(e) => {
                          let valor = e.target.value.replace(/[^0-9:]/g, '');
                          if (valor.length === 2 && !valor.includes(':')) {
                            valor = valor + ':';
                          }
                          if (valor.length <= 5) {
                            setFormEdicion({ ...formEdicion, horaInicio: valor });
                          }
                        }}
                        placeholder="HH:MM (ej: 14:30)"
                        maxLength={5}
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>

                    {/* Hora de Fin */}
                    <div className={styles.field}>
                      <label>⏰ Hora de Fin</label>
                      <input
                        type="text"
                        value={formEdicion.horaFin}
                        onChange={(e) => {
                          let valor = e.target.value.replace(/[^0-9:]/g, '');
                          if (valor.length === 2 && !valor.includes(':')) {
                            valor = valor + ':';
                          }
                          if (valor.length <= 5) {
                            setFormEdicion({ ...formEdicion, horaFin: valor });
                          }
                        }}
                        placeholder="HH:MM (ej: 15:00)"
                        maxLength={5}
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>

                    {/* Notas */}
                    <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                      <label>📝 Notas</label>
                      <textarea
                        value={formEdicion.notas}
                        onChange={(e) => setFormEdicion({ ...formEdicion, notas: e.target.value })}
                        placeholder="Notas adicionales..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Campos personalizados */}
                  <div className={styles.camposPersonalizados}>
                    <h4>📋 Detalles del Turno</h4>
                    <div className={styles.formGrid}>
                      {/* Origen */}
                      <div className={styles.field}>
                        <label>📍 Origen</label>
                        <input
                          type="text"
                          value={formEdicion.datos?.origen || ''}
                          onChange={(e) => actualizarDatosCampo('origen', e.target.value)}
                          placeholder="Dirección de origen..."
                        />
                      </div>

                      {/* Destino */}
                      <div className={styles.field}>
                        <label>🎯 Destino</label>
                        <input
                          type="text"
                          value={formEdicion.datos?.destino || ''}
                          onChange={(e) => actualizarDatosCampo('destino', e.target.value)}
                          placeholder="Dirección de destino..."
                        />
                      </div>

                      {/* Pasajeros */}
                      <div className={styles.field}>
                        <label>👥 Pasajeros</label>
                        <input
                          type="number"
                          value={formEdicion.datos?.pasajeros || ''}
                          onChange={(e) => actualizarDatosCampo('pasajeros', e.target.value)}
                          placeholder="Número de pasajeros..."
                          min="1"
                        />
                      </div>

                      {/* Equipaje */}
                      <div className={styles.field}>
                        <label>🧳 Equipaje</label>
                        <input
                          type="text"
                          value={formEdicion.datos?.equipaje || ''}
                          onChange={(e) => actualizarDatosCampo('equipaje', e.target.value)}
                          placeholder="Descripción del equipaje..."
                        />
                      </div>

                      {/* Observaciones */}
                      <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                        <label>💬 Observaciones</label>
                        <textarea
                          value={formEdicion.datos?.observaciones || ''}
                          onChange={(e) => actualizarDatosCampo('observaciones', e.target.value)}
                          placeholder="Observaciones adicionales..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button 
                    className={styles.btnSecondary}
                    onClick={() => {
                      setModalEditar(false);
                      setTurnoSeleccionado(null);
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    className={styles.btnPrimary}
                    onClick={handleGuardarEdicion}
                    disabled={!formEdicion.agenteId || !formEdicion.fecha || !formEdicion.horaInicio}
                  >
                    💾 Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Cancelar */}
          {modalCancelar && turnoSeleccionado && (
            <div className={styles.modal}>
              <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                  <h3>❌ Cancelar Turno</h3>
                  <button 
                    className={styles.modalClose}
                    onClick={() => {
                      setModalCancelar(false);
                      setTurnoSeleccionado(null);
                      setMotivoCancelacion('');
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className={styles.modalBody}>
                  <p>¿Estás seguro de que deseas cancelar este turno?</p>
                  <div className={styles.turnoInfo}>
                    <p><strong>Cliente:</strong> {turnoSeleccionado.clienteInfo?.nombre} {turnoSeleccionado.clienteInfo?.apellido}</p>
                    <p><strong>Fecha:</strong> {new Date(turnoSeleccionado.fechaInicio).toLocaleDateString('es-AR')}</p>
                    <p><strong>Hora:</strong> {new Date(turnoSeleccionado.fechaInicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className={styles.field}>
                    <label>Motivo de cancelación</label>
                    <textarea
                      value={motivoCancelacion}
                      onChange={(e) => setMotivoCancelacion(e.target.value)}
                      placeholder="Escribe el motivo de la cancelación..."
                      rows={4}
                    />
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button 
                    className={styles.btnSecondary}
                    onClick={() => {
                      setModalCancelar(false);
                      setTurnoSeleccionado(null);
                      setMotivoCancelacion('');
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    className={styles.btnDanger}
                    onClick={handleCancelarTurno}
                    disabled={!motivoCancelacion.trim()}
                  >
                    Confirmar Cancelación
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ModuleGuard>
  );
}
