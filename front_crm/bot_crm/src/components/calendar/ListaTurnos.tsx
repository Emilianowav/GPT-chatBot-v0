// 📋 Lista de turnos con acciones
'use client';

import { useState, useMemo } from 'react';
import type { Turno } from '@/lib/calendarApi';
import type { ConfiguracionModulo } from '@/lib/configuracionApi';
import { formatearHora } from '@/lib/fechaUtils';
import Pagination from '@/components/ui/Pagination';
import styles from './ListaTurnos.module.css';

interface ListaTurnosProps {
  turnos: Turno[];
  configuracion?: ConfiguracionModulo | null;
  onCancelar?: (turnoId: string, motivo: string) => Promise<void>;
  onActualizarEstado?: (turnoId: string, estado: string) => Promise<void>;
  itemsPerPage?: number;
}

export default function ListaTurnos({ turnos, configuracion, onCancelar, onActualizarEstado, itemsPerPage = 10 }: ListaTurnosProps) {
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<string | null>(null);
  const [mostrarModalCancelar, setMostrarModalCancelar] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Ordenar turnos por fecha descendente (más recientes primero) y paginar
  const totalPages = Math.ceil(turnos.length / itemsPerPage);
  const turnosPaginados = useMemo(() => {
    const turnosOrdenados = [...turnos].sort((a, b) => {
      return new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime();
    });
    const start = (currentPage - 1) * itemsPerPage;
    return turnosOrdenados.slice(start, start + itemsPerPage);
  }, [turnos, currentPage, itemsPerPage]);

  const getEstadoColor = (estado: string) => {
    const colores: any = {
      pendiente: '#f39c12',
      confirmado: '#3498db',
      en_curso: '#9b59b6',
      completado: '#27ae60',
      cancelado: '#e74c3c',
      no_asistio: '#95a5a6'
    };
    return colores[estado] || '#95a5a6';
  };

  const getEstadoTexto = (estado: string) => {
    const textos: any = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmado',
      en_curso: 'En Curso',
      completado: 'Completado',
      cancelado: 'Cancelado',
      no_asistio: 'No Asistió'
    };
    return textos[estado] || estado;
  };

  const handleCancelar = async () => {
    if (!turnoSeleccionado || !motivoCancelacion.trim()) return;

    try {
      setLoading(true);
      await onCancelar?.(turnoSeleccionado, motivoCancelacion);
      setMostrarModalCancelar(false);
      setMotivoCancelacion('');
      setTurnoSeleccionado(null);
    } catch (error) {
      console.error('Error al cancelar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActualizarEstado = async (turnoId: string, nuevoEstado: string) => {
    try {
      setLoading(true);
      await onActualizarEstado?.(turnoId, nuevoEstado);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    } finally {
      setLoading(false);
    }
  };

  if (turnos.length === 0) {
    return (
      <div className={styles.empty}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p>No hay turnos para mostrar</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Cliente</th>
              <th>Agente</th>
              <th>Duración</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {turnosPaginados.map(turno => {
              const agente = turno.agenteId as any;
              const fechaInicio = new Date(turno.fechaInicio);
              const clienteInfo = (turno as any).clienteInfo;
              
              return (
                <tr key={turno._id}>
                  <td className={styles.tdFecha}>
                    {fechaInicio.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </td>
                  <td className={styles.tdHora}>
                    {formatearHora(fechaInicio)}
                  </td>
                  <td>
                    <div className={styles.clienteCell}>
                      <span className={styles.clienteNombre}>
                        {clienteInfo 
                          ? `${clienteInfo.nombre} ${clienteInfo.apellido}`
                          : `ID: ${turno.clienteId.substring(0, 8)}...`
                        }
                      </span>
                      {clienteInfo?.documento && (
                        <span className={styles.clienteDoc}>DNI: {clienteInfo.documento}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {agente?.nombre} {agente?.apellido}
                  </td>
                  <td>
                    {turno.duracion} min
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
                    {(onCancelar || onActualizarEstado) && turno.estado !== 'cancelado' && turno.estado !== 'completado' ? (
                      <div className={styles.acciones}>
                        {turno.estado === 'pendiente' && onActualizarEstado && (
                          <button
                            onClick={() => handleActualizarEstado(turno._id, 'confirmado')}
                            className={styles.btnConfirmar}
                            disabled={loading}
                            title="Confirmar"
                          >
                            ✓
                          </button>
                        )}
                        
                        {turno.estado === 'confirmado' && onActualizarEstado && (
                          <button
                            onClick={() => handleActualizarEstado(turno._id, 'completado')}
                            className={styles.btnCompletar}
                            disabled={loading}
                            title="Completar"
                          >
                            ✓✓
                          </button>
                        )}

                        {onCancelar && (
                          <button
                            onClick={() => {
                              setTurnoSeleccionado(turno._id);
                              setMostrarModalCancelar(true);
                            }}
                            className={styles.btnCancelar}
                            disabled={loading}
                            title="Cancelar"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className={styles.sinAcciones}>-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={turnos.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Modal de cancelación */}
      {mostrarModalCancelar && (
        <div className={styles.modal} onClick={() => setMostrarModalCancelar(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>Cancelar Turno</h3>
            <p>Por favor, indica el motivo de la cancelación:</p>
            <textarea
              value={motivoCancelacion}
              onChange={e => setMotivoCancelacion(e.target.value)}
              placeholder="Motivo de cancelación..."
              rows={4}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button
                onClick={() => setMostrarModalCancelar(false)}
                className={styles.btnModalCancel}
                disabled={loading}
              >
                Volver
              </button>
              <button
                onClick={handleCancelar}
                className={styles.btnModalConfirm}
                disabled={loading || !motivoCancelacion.trim()}
              >
                {loading ? 'Cancelando...' : 'Confirmar Cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
