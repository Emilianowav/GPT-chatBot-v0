// 📋 Selector de Turnos para Notificaciones
'use client';

import { useState, useEffect } from 'react';
import type { Turno } from '@/lib/calendarApi';
import styles from './SelectorTurnos.module.css';

interface SelectorTurnosProps {
  empresaId: string;
  agenteId?: string;
  fecha?: Date;
  onSeleccionar: (turnos: Turno[]) => void;
  onCerrar: () => void;
}

export default function SelectorTurnos({ 
  empresaId, 
  agenteId, 
  fecha = new Date(),
  onSeleccionar, 
  onCerrar 
}: SelectorTurnosProps) {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [turnosSeleccionados, setTurnosSeleccionados] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(fecha);

  useEffect(() => {
    cargarTurnos();
  }, [fechaSeleccionada, agenteId]);

  const cargarTurnos = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('auth_token');

      // Construir query params
      const params = new URLSearchParams({
        empresaId,
        fecha: fechaSeleccionada.toISOString().split('T')[0]
      });

      if (agenteId) {
        params.append('agenteId', agenteId);
      }

      const response = await fetch(`${API_BASE_URL}/api/modules/calendar/turnos?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar turnos');

      const data = await response.json();
      setTurnos(data.turnos || []);
    } catch (error) {
      console.error('Error cargando turnos:', error);
      setTurnos([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleTurno = (turnoId: string) => {
    const nuevosSeleccionados = new Set(turnosSeleccionados);
    if (nuevosSeleccionados.has(turnoId)) {
      nuevosSeleccionados.delete(turnoId);
    } else {
      nuevosSeleccionados.add(turnoId);
    }
    setTurnosSeleccionados(nuevosSeleccionados);
  };

  const seleccionarTodos = () => {
    if (turnosSeleccionados.size === turnos.length) {
      setTurnosSeleccionados(new Set());
    } else {
      setTurnosSeleccionados(new Set(turnos.map(t => t._id)));
    }
  };

  const confirmarSeleccion = () => {
    const turnosAEnviar = turnos.filter(t => turnosSeleccionados.has(t._id));
    onSeleccionar(turnosAEnviar);
  };

  const formatearHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const cambiarFecha = (dias: number) => {
    const nuevaFecha = new Date(fechaSeleccionada);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    setFechaSeleccionada(nuevaFecha);
    setTurnosSeleccionados(new Set()); // Limpiar selección al cambiar fecha
  };

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.titulo}>Seleccionar Turnos para Notificación</h2>
            <p className={styles.subtitulo}>
              Selecciona los turnos que deseas incluir en el mensaje
            </p>
          </div>
          <button className={styles.btnCerrar} onClick={onCerrar}>
            ✕
          </button>
        </div>

        {/* Selector de Fecha */}
        <div className={styles.selectorFecha}>
          <button 
            className={styles.btnFecha}
            onClick={() => cambiarFecha(-1)}
          >
            ← Día Anterior
          </button>
          <div className={styles.fechaActual}>
            {fechaSeleccionada.toLocaleDateString('es-AR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <button 
            className={styles.btnFecha}
            onClick={() => cambiarFecha(1)}
          >
            Día Siguiente →
          </button>
        </div>

        {/* Contador y Seleccionar Todos */}
        <div className={styles.toolbar}>
          <div className={styles.contador}>
            {turnosSeleccionados.size} de {turnos.length} turnos seleccionados
          </div>
          {turnos.length > 0 && (
            <button 
              className={styles.btnSeleccionarTodos}
              onClick={seleccionarTodos}
            >
              {turnosSeleccionados.size === turnos.length ? '☑ Deseleccionar Todos' : '☐ Seleccionar Todos'}
            </button>
          )}
        </div>

        {/* Lista de Turnos */}
        <div className={styles.listaTurnos}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Cargando turnos...</p>
            </div>
          ) : turnos.length === 0 ? (
            <div className={styles.vacio}>
              <p>📅 No hay turnos para esta fecha</p>
              <button 
                className={styles.btnCambiarFecha}
                onClick={() => cambiarFecha(1)}
              >
                Ver día siguiente
              </button>
            </div>
          ) : (
            turnos.map(turno => {
              const agente = turno.agenteId as any;
              const clienteInfo = (turno as any).clienteInfo;
              const seleccionado = turnosSeleccionados.has(turno._id);

              return (
                <div
                  key={turno._id}
                  className={`${styles.turnoCard} ${seleccionado ? styles.seleccionado : ''}`}
                  onClick={() => toggleTurno(turno._id)}
                >
                  <div className={styles.checkbox}>
                    {seleccionado ? '☑' : '☐'}
                  </div>
                  
                  <div className={styles.turnoInfo}>
                    <div className={styles.turnoHora}>
                      {formatearHora(turno.fechaInicio)}
                    </div>
                    
                    <div className={styles.turnoDetalles}>
                      <div className={styles.detalle}>
                        <span className={styles.icono}>👤</span>
                        <span className={styles.label}>Agente:</span>
                        <span className={styles.valor}>
                          {agente?.nombre} {agente?.apellido}
                        </span>
                      </div>
                      
                      <div className={styles.detalle}>
                        <span className={styles.icono}>👥</span>
                        <span className={styles.label}>Cliente:</span>
                        <span className={styles.valor}>
                          {clienteInfo 
                            ? `${clienteInfo.nombre} ${clienteInfo.apellido}`
                            : turno.clienteId
                          }
                        </span>
                      </div>

                      {clienteInfo?.telefono && (
                        <div className={styles.detalle}>
                          <span className={styles.icono}>📞</span>
                          <span className={styles.valor}>{clienteInfo.telefono}</span>
                        </div>
                      )}

                      {turno.notas && (
                        <div className={styles.detalle}>
                          <span className={styles.icono}>📝</span>
                          <span className={styles.valor}>{turno.notas}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div 
                    className={styles.estadoBadge}
                    style={{ 
                      background: getEstadoColor(turno.estado) 
                    }}
                  >
                    {turno.estado}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer con Acciones */}
        <div className={styles.footer}>
          <button 
            className={styles.btnCancelar}
            onClick={onCerrar}
          >
            Cancelar
          </button>
          <button 
            className={styles.btnConfirmar}
            onClick={confirmarSeleccion}
            disabled={turnosSeleccionados.size === 0}
          >
            Enviar Notificación ({turnosSeleccionados.size} {turnosSeleccionados.size === 1 ? 'turno' : 'turnos'})
          </button>
        </div>
      </div>
    </div>
  );
}

function getEstadoColor(estado: string) {
  const colores: any = {
    'pendiente': '#ff9800',
    'confirmado': '#2196f3',
    'en_curso': '#9c27b0',
    'completado': '#4caf50',
    'cancelado': '#f44336'
  };
  return colores[estado] || '#999';
}
