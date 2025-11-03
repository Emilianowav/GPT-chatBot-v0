// 🔄 Componente para gestionar flujos activos
'use client';

import { useState } from 'react';
import { useFlujosActivos } from '@/hooks/useFlujosActivos';
import styles from './FlujosActivos.module.css';

export default function FlujosActivos() {
  const empresaId = typeof window !== 'undefined' ? localStorage.getItem('empresa_id') || '' : '';
  const { flujos, loading, error, pausarFlujo, reanudarFlujo, cancelarFlujo, cargarFlujos } = useFlujosActivos(empresaId);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handlePausar = async (telefono: string) => {
    try {
      setActionLoading(telefono);
      setActionError(null);
      await pausarFlujo(telefono);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReanudar = async (telefono: string) => {
    try {
      setActionLoading(telefono);
      setActionError(null);
      await reanudarFlujo(telefono);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelar = async (telefono: string) => {
    if (!confirm('¿Estás seguro de cancelar este flujo? El usuario perderá todo el progreso.')) {
      return;
    }

    try {
      setActionLoading(telefono);
      setActionError(null);
      await cancelarFlujo(telefono);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    const ahora = new Date();
    const diff = ahora.getTime() - date.getTime();
    const minutos = Math.floor(diff / 60000);
    
    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (minutos < 1440) return `Hace ${Math.floor(minutos / 60)} h`;
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getNombreFlujo = (flujo: string) => {
    const nombres: Record<string, string> = {
      'menu_principal': 'Menú Principal',
      'notificacion_viajes': 'Notificación de Viajes',
      'reserva_turno': 'Reserva de Turno'
    };
    return nombres[flujo] || flujo;
  };

  const getEstadoLegible = (estado: string) => {
    const estados: Record<string, string> = {
      'esperando_opcion': 'Esperando opción',
      'reserva_esperando_origen': 'Ingresando origen',
      'reserva_esperando_destino': 'Ingresando destino',
      'reserva_esperando_pasajeros': 'Ingresando pasajeros',
      'reserva_esperando_fecha': 'Ingresando fecha',
      'reserva_esperando_hora': 'Ingresando hora',
      'esperando_confirmacion': 'Esperando confirmación',
      'esperando_origen': 'Esperando origen',
      'esperando_destino': 'Esperando destino'
    };
    return estados[estado] || estado;
  };

  if (loading && flujos.length === 0) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando flujos activos...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>🔄 Flujos Activos</h2>
          <span className={styles.badge}>{flujos.length}</span>
        </div>
        <button 
          onClick={cargarFlujos} 
          className={styles.btnRefresh}
          disabled={loading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          Actualizar
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {actionError && (
        <div className={styles.error}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {actionError}
        </div>
      )}

      {flujos.length === 0 ? (
        <div className={styles.empty}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          <h3>No hay flujos activos</h3>
          <p>Los flujos aparecerán aquí cuando los usuarios interactúen con el bot</p>
        </div>
      ) : (
        <div className={styles.list}>
          {flujos.map((flujo) => (
            <div key={flujo.telefono} className={`${styles.card} ${flujo.pausado ? styles.pausado : ''}`}>
              <div className={styles.cardHeader}>
                <div className={styles.cardInfo}>
                  <h3>{flujo.telefono}</h3>
                  <span className={styles.flujoNombre}>{getNombreFlujo(flujo.flujo)}</span>
                </div>
                <div className={styles.badges}>
                  {flujo.pausado && (
                    <span className={styles.badgePausado}>
                      ⏸️ Pausado
                    </span>
                  )}
                  <span className={`${styles.badgePrioridad} ${styles[flujo.prioridad]}`}>
                    {flujo.prioridad === 'urgente' && '🔴'}
                    {flujo.prioridad === 'normal' && '🟡'}
                    {flujo.prioridad === 'baja' && '🟢'}
                    {flujo.prioridad}
                  </span>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.estado}>
                  <strong>Estado:</strong> {getEstadoLegible(flujo.estado)}
                </div>
                <div className={styles.tiempo}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  {formatearFecha(flujo.ultimaInteraccion)}
                </div>

                {flujo.data && Object.keys(flujo.data).length > 0 && (
                  <details className={styles.details}>
                    <summary>Ver datos del flujo</summary>
                    <div className={styles.data}>
                      {Object.entries(flujo.data).map(([key, value]) => (
                        <div key={key} className={styles.dataItem}>
                          <strong>{key}:</strong> {JSON.stringify(value)}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>

              <div className={styles.cardActions}>
                {flujo.pausado ? (
                  <button
                    onClick={() => handleReanudar(flujo.telefono)}
                    className={styles.btnReanudar}
                    disabled={actionLoading === flujo.telefono}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    {actionLoading === flujo.telefono ? 'Reanudando...' : 'Reanudar'}
                  </button>
                ) : (
                  <button
                    onClick={() => handlePausar(flujo.telefono)}
                    className={styles.btnPausar}
                    disabled={actionLoading === flujo.telefono}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="4" width="4" height="16"/>
                      <rect x="14" y="4" width="4" height="16"/>
                    </svg>
                    {actionLoading === flujo.telefono ? 'Pausando...' : 'Pausar'}
                  </button>
                )}
                <button
                  onClick={() => handleCancelar(flujo.telefono)}
                  className={styles.btnCancelar}
                  disabled={actionLoading === flujo.telefono}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  {actionLoading === flujo.telefono ? 'Cancelando...' : 'Cancelar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
