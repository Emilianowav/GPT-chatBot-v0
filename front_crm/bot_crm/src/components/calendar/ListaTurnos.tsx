// 📋 Lista de turnos con acciones
'use client';

import { useState } from 'react';
import type { Turno } from '@/lib/calendarApi';
import type { ConfiguracionModulo } from '@/lib/configuracionApi';
import { formatearHora } from '@/lib/fechaUtils';
import styles from './ListaTurnos.module.css';

interface ListaTurnosProps {
  turnos: Turno[];
  configuracion?: ConfiguracionModulo | null;
  onCancelar?: (turnoId: string, motivo: string) => Promise<void>;
  onActualizarEstado?: (turnoId: string, estado: string) => Promise<void>;
}

export default function ListaTurnos({ turnos, configuracion, onCancelar, onActualizarEstado }: ListaTurnosProps) {
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<string | null>(null);
  const [mostrarModalCancelar, setMostrarModalCancelar] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [loading, setLoading] = useState(false);

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
      <div className={styles.lista}>
        {turnos.map(turno => {
          const agente = turno.agenteId as any;
          const fechaInicio = new Date(turno.fechaInicio);
          
          return (
            <div key={turno._id} className={styles.turnoCard}>
              <div className={styles.turnoHeader}>
                <div className={styles.turnoHora}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {formatearHora(fechaInicio)}
                </div>
                <div 
                  className={styles.turnoEstado}
                  style={{ background: getEstadoColor(turno.estado) }}
                >
                  {getEstadoTexto(turno.estado)}
                </div>
              </div>

              <div className={styles.turnoBody}>
                <div className={styles.turnoInfo}>
                  <div className={styles.infoItem}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>
                      <strong>Agente:</strong> {agente?.nombre} {agente?.apellido}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>
                      <strong>Cliente:</strong> {
                        (turno as any).clienteInfo 
                          ? `${(turno as any).clienteInfo.nombre} ${(turno as any).clienteInfo.apellido}`
                          : `ID: ${turno.clienteId.substring(0, 8)}...`
                      }
                      {(turno as any).clienteInfo?.documento && (
                        <span style={{ marginLeft: '0.5rem', color: '#888' }}>
                          (DNI: {(turno as any).clienteInfo.documento})
                        </span>
                      )}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>
                      <strong>Duración:</strong> {turno.duracion} minutos
                    </span>
                  </div>

                  {/* Campos personalizados configurados */}
                  {configuracion?.camposPersonalizados
                    ?.filter(campo => campo.mostrarEnLista)
                    .sort((a, b) => a.orden - b.orden)
                    .map(campo => {
                      const valor = turno.datos?.[campo.clave];
                      if (!valor) return null;
                      
                      return (
                        <div key={campo.clave} className={styles.infoItem}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                          </svg>
                          <span>
                            <strong>{campo.etiqueta}:</strong> {
                              typeof valor === 'boolean' 
                                ? (valor ? 'Sí' : 'No')
                                : Array.isArray(valor)
                                  ? valor.join(', ')
                                  : valor
                            }
                          </span>
                        </div>
                      );
                    })
                  }

                  {turno.notas && (
                    <div className={styles.turnoNotas}>
                      <strong>Notas:</strong> {turno.notas}
                    </div>
                  )}
                </div>

                {(onCancelar || onActualizarEstado) && turno.estado !== 'cancelado' && turno.estado !== 'completado' && (
                  <div className={styles.turnoAcciones}>
                    {turno.estado === 'pendiente' && onActualizarEstado && (
                      <button
                        onClick={() => handleActualizarEstado(turno._id, 'confirmado')}
                        className={styles.btnConfirmar}
                        disabled={loading}
                      >
                        Confirmar
                      </button>
                    )}
                    
                    {turno.estado === 'confirmado' && onActualizarEstado && (
                      <button
                        onClick={() => handleActualizarEstado(turno._id, 'completado')}
                        className={styles.btnCompletar}
                        disabled={loading}
                      >
                        Completar
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
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
