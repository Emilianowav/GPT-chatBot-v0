// 📋 Modal de Detalle del Turno
'use client';

import { useState } from 'react';
import type { Turno } from '@/lib/calendarApi';
import styles from './DetalleTurno.module.css';

interface DetalleTurnoProps {
  turno: Turno | null;
  onCerrar: () => void;
  onEditar?: (turno: Turno) => void;
  onCancelar?: (turno: Turno) => void;
  onCambiarEstado?: (turno: Turno, nuevoEstado: string) => void;
}

export default function DetalleTurno({ 
  turno, 
  onCerrar, 
  onEditar, 
  onCancelar,
  onCambiarEstado 
}: DetalleTurnoProps) {
  if (!turno) return null;

  const agente = turno.agenteId as any;
  const clienteInfo = (turno as any).clienteInfo;
  
  const fechaInicio = new Date(turno.fechaInicio);
  const fechaFin = new Date(turno.fechaFin);
  
  const horaInicio = fechaInicio.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const horaFin = fechaFin.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const fecha = fechaInicio.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getEstadoColor = (estado: string) => {
    const colores: any = {
      'pendiente': '#ff9800',
      'confirmado': '#2196f3',
      'en_curso': '#9c27b0',
      'completado': '#4caf50',
      'cancelado': '#f44336'
    };
    return colores[estado] || '#999';
  };

  const getEstadoTexto = (estado: string) => {
    const textos: any = {
      'pendiente': 'Pendiente',
      'confirmado': 'Confirmado',
      'en_curso': 'En Curso',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };
    return textos[estado] || estado;
  };

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.titulo}>Detalle del Turno</h2>
            <p className={styles.subtitulo}>{fecha}</p>
          </div>
          <button className={styles.btnCerrar} onClick={onCerrar}>
            ✕
          </button>
        </div>

        {/* Estado */}
        <div className={styles.estadoContainer}>
          <span 
            className={styles.estadoBadge}
            style={{ background: getEstadoColor(turno.estado) }}
          >
            {getEstadoTexto(turno.estado)}
          </span>
        </div>

        {/* Información Principal */}
        <div className={styles.seccion}>
          <h3 className={styles.seccionTitulo}>⏰ Horario</h3>
          <div className={styles.horario}>
            <div className={styles.horarioItem}>
              <span className={styles.label}>Inicio:</span>
              <span className={styles.valor}>{horaInicio}</span>
            </div>
            <div className={styles.horarioItem}>
              <span className={styles.label}>Fin:</span>
              <span className={styles.valor}>{horaFin}</span>
            </div>
            {turno.duracion && (
              <div className={styles.horarioItem}>
                <span className={styles.label}>Duración:</span>
                <span className={styles.valor}>{turno.duracion} minutos</span>
              </div>
            )}
          </div>
        </div>

        {/* Agente */}
        <div className={styles.seccion}>
          <h3 className={styles.seccionTitulo}>👤 Agente Asignado</h3>
          <div className={styles.infoCard}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Nombre:</span>
              <span className={styles.valor}>
                {agente?.nombre} {agente?.apellido}
              </span>
            </div>
            {agente?.email && (
              <div className={styles.infoItem}>
                <span className={styles.label}>Email:</span>
                <span className={styles.valor}>{agente.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Cliente */}
        <div className={styles.seccion}>
          <h3 className={styles.seccionTitulo}>👥 Cliente</h3>
          <div className={styles.infoCard}>
            {clienteInfo ? (
              <>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Nombre:</span>
                  <span className={styles.valor}>
                    {clienteInfo.nombre} {clienteInfo.apellido}
                  </span>
                </div>
                {clienteInfo.documento && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Documento:</span>
                    <span className={styles.valor}>{clienteInfo.documento}</span>
                  </div>
                )}
                {clienteInfo.telefono && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Teléfono:</span>
                    <span className={styles.valor}>
                      <a href={`tel:${clienteInfo.telefono}`} className={styles.link}>
                        {clienteInfo.telefono}
                      </a>
                    </span>
                  </div>
                )}
                {clienteInfo.email && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Email:</span>
                    <span className={styles.valor}>
                      <a href={`mailto:${clienteInfo.email}`} className={styles.link}>
                        {clienteInfo.email}
                      </a>
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.infoItem}>
                <span className={styles.label}>Cliente no encontrado</span>
                <span className={styles.valor}>ID: {turno.clienteId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notas */}
        {turno.notas && (
          <div className={styles.seccion}>
            <h3 className={styles.seccionTitulo}>📝 Notas</h3>
            <div className={styles.notasCard}>
              {turno.notas}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className={styles.acciones}>
          {turno.estado !== 'cancelado' && turno.estado !== 'completado' && (
            <>
              {onEditar && (
                <button 
                  className={styles.btnAccion}
                  onClick={() => onEditar(turno)}
                >
                  ✏️ Editar
                </button>
              )}
              
              {onCambiarEstado && turno.estado === 'pendiente' && (
                <button 
                  className={`${styles.btnAccion} ${styles.btnConfirmar}`}
                  onClick={() => onCambiarEstado(turno, 'confirmado')}
                >
                  ✓ Confirmar
                </button>
              )}
              
              {onCambiarEstado && turno.estado === 'confirmado' && (
                <button 
                  className={`${styles.btnAccion} ${styles.btnIniciar}`}
                  onClick={() => onCambiarEstado(turno, 'en_curso')}
                >
                  ▶ Iniciar
                </button>
              )}
              
              {onCambiarEstado && turno.estado === 'en_curso' && (
                <button 
                  className={`${styles.btnAccion} ${styles.btnCompletar}`}
                  onClick={() => onCambiarEstado(turno, 'completado')}
                >
                  ✓ Completar
                </button>
              )}
              
              {onCancelar && (
                <button 
                  className={`${styles.btnAccion} ${styles.btnCancelar}`}
                  onClick={() => onCancelar(turno)}
                >
                  ✕ Cancelar Turno
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
