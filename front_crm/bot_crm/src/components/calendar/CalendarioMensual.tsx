// 📅 Calendario Mensual con Hover y Filtros
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Turno } from '@/lib/calendarApi';
import { formatearHora } from '@/lib/fechaUtils';
import styles from './CalendarioMensual.module.css';
import DetalleTurno from './DetalleTurno';

interface CalendarioMensualProps {
  turnos: Turno[];
  agentes: any[];
  onSeleccionarTurno?: (turno: Turno) => void;
  onCambiarMes?: (primerDia: Date, ultimoDia: Date) => void;
  onClickDia?: (fecha: Date) => void;
  mesInicial?: Date;
}

export default function CalendarioMensual({ 
  turnos, 
  agentes, 
  onSeleccionarTurno,
  onCambiarMes,
  onClickDia,
  mesInicial
}: CalendarioMensualProps) {
  const [mesActual, setMesActual] = useState(mesInicial || new Date());
  const [agentesFiltro, setAgentesFiltro] = useState<string[]>([]);
  const [diaHover, setDiaHover] = useState<number | null>(null);
  const [agentesPopupFiltro, setAgentesPopupFiltro] = useState<string[]>([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null);
  const [esPrimerRender, setEsPrimerRender] = useState(true);

  // Notificar cuando cambia el mes (excepto en el primer render)
  useEffect(() => {
    if (esPrimerRender) {
      setEsPrimerRender(false);
      return;
    }
    
    if (onCambiarMes) {
      const year = mesActual.getFullYear();
      const month = mesActual.getMonth();
      const primerDia = new Date(year, month, 1, 0, 0, 0, 0);
      const ultimoDia = new Date(year, month + 1, 0, 23, 59, 59, 999);
      
      console.log('📅 CalendarioMensual: Notificando cambio de mes');
      onCambiarMes(primerDia, ultimoDia);
    }
  }, [mesActual]); // Solo depende de mesActual

  // Obtener días del mes
  const diasDelMes = useMemo(() => {
    const year = mesActual.getFullYear();
    const month = mesActual.getMonth();
    
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    
    const dias: Date[] = [];
    
    // Agregar días vacíos al inicio
    for (let i = 0; i < primerDia.getDay(); i++) {
      dias.push(new Date(0));
    }
    
    // Agregar días del mes
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(new Date(year, month, dia));
    }
    
    return dias;
  }, [mesActual]);

  // Filtrar turnos por agente
  const turnosFiltrados = useMemo(() => {
    if (agentesFiltro.length === 0) return turnos;
    return turnos.filter(turno => 
      agentesFiltro.includes((turno.agenteId as any)?._id || turno.agenteId)
    );
  }, [turnos, agentesFiltro]);

  // Agrupar turnos por día
  const turnosPorDia = useMemo(() => {
    const grupos: Record<string, Turno[]> = {};
    
    turnosFiltrados.forEach(turno => {
      const fecha = new Date(turno.fechaInicio);
      const key = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
      
      if (!grupos[key]) {
        grupos[key] = [];
      }
      grupos[key].push(turno);
    });
    
    return grupos;
  }, [turnosFiltrados]);

  // Obtener turnos de un día
  const getTurnosDelDia = (fecha: Date): Turno[] => {
    if (fecha.getTime() === 0) return [];
    const key = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
    return turnosPorDia[key] || [];
  };

  // Navegar meses
  const mesAnterior = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1));
  };

  const mesSiguiente = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1));
  };

  const toggleAgenteFiltro = (agenteId: string) => {
    setAgentesFiltro(prev => 
      prev.includes(agenteId)
        ? prev.filter(id => id !== agenteId)
        : [...prev, agenteId]
    );
  };

  const esHoy = (fecha: Date): boolean => {
    if (fecha.getTime() === 0) return false;
    const hoy = new Date();
    return fecha.getDate() === hoy.getDate() &&
           fecha.getMonth() === hoy.getMonth() &&
           fecha.getFullYear() === hoy.getFullYear();
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

  return (
    <div className={styles.container}>
      {/* Filtros de Agentes */}
      <div className={styles.filtros}>
        <h3>Filtrar por Agente</h3>
        <div className={styles.agentesChips}>
          {agentes.map(agente => (
            <button
              key={agente.id}
              className={`${styles.chip} ${agentesFiltro.includes(agente.id) ? styles.chipActive : ''}`}
              onClick={() => toggleAgenteFiltro(agente.id)}
            >
              {agente.nombre} {agente.apellido}
            </button>
          ))}
        </div>
      </div>

      {/* Header del Calendario */}
      <div className={styles.header}>
        <button onClick={mesAnterior} className={styles.navButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        
        <h2 className={styles.mesAnio}>
          {mesActual.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
        </h2>
        
        <button onClick={mesSiguiente} className={styles.navButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {/* Días de la semana */}
      <div className={styles.diasSemana}>
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dia => (
          <div key={dia} className={styles.diaSemana}>{dia}</div>
        ))}
      </div>

      {/* Grid del calendario */}
      <div className={styles.grid}>
        {diasDelMes.map((fecha, index) => {
          const turnosDelDia = getTurnosDelDia(fecha);
          const esVacio = fecha.getTime() === 0;
          const esDiaHoy = esHoy(fecha);
          
          return (
            <div
              key={index}
              className={`${styles.dia} ${esVacio ? styles.diaVacio : ''} ${esDiaHoy ? styles.diaHoy : ''} ${turnosDelDia.length > 0 ? styles.diaConTurnos : ''}`}
              onClick={() => {
                if (!esVacio && onClickDia) {
                  onClickDia(fecha);
                }
              }}
              onMouseEnter={() => {
                if (!esVacio && turnosDelDia.length > 0) {
                  setDiaHover(fecha.getDate());
                  setAgentesPopupFiltro([]);
                }
              }}
              onMouseLeave={() => setDiaHover(null)}
              style={{ cursor: !esVacio ? 'pointer' : 'default' }}
            >
              {!esVacio && (
                <>
                  <div className={styles.diaNumero}>{fecha.getDate()}</div>
                  
                  {turnosDelDia.length > 0 && (
                    <div className={styles.indicadorTurnos}>
                      {turnosDelDia.slice(0, 3).map((turno, i) => (
                        <div
                          key={i}
                          className={styles.puntito}
                          style={{ background: getEstadoColor(turno.estado) }}
                        />
                      ))}
                      {turnosDelDia.length > 3 && (
                        <span className={styles.masTurnos}>+{turnosDelDia.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Popup con turnos al hacer hover */}
                  {diaHover === fecha.getDate() && turnosDelDia.length > 0 && (
                    <div 
                      className={styles.popup}
                      onMouseEnter={() => setDiaHover(fecha.getDate())}
                      onMouseLeave={() => setDiaHover(null)}
                    >
                      <div className={styles.popupHeader}>
                        <div>
                          <strong>{fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</strong>
                          <span className={styles.cantidadTurnos}>
                            {turnosDelDia.filter(t => 
                              agentesPopupFiltro.length === 0 || 
                              agentesPopupFiltro.includes((t.agenteId as any)?._id || t.agenteId)
                            ).length} turnos
                          </span>
                        </div>
                        <button 
                          className={styles.btnCerrar}
                          onClick={() => {
                            setDiaHover(null);
                            setAgentesPopupFiltro([]);
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Filtro de agentes dentro del popup */}
                      {agentes.length > 1 && (
                        <div className={styles.popupFiltros}>
                          <div className={styles.popupFiltrosLabel}>Filtrar:</div>
                          <div className={styles.popupChips}>
                            {agentes.map(agente => {
                              const tieneTurnos = turnosDelDia.some(t => 
                                ((t.agenteId as any)?._id || t.agenteId) === agente.id
                              );
                              if (!tieneTurnos) return null;
                              
                              return (
                                <button
                                  key={agente.id}
                                  className={`${styles.popupChip} ${
                                    agentesPopupFiltro.includes(agente.id) ? styles.popupChipActive : ''
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAgentesPopupFiltro(prev =>
                                      prev.includes(agente.id)
                                        ? prev.filter(id => id !== agente.id)
                                        : [...prev, agente.id]
                                    );
                                  }}
                                >
                                  {agente.nombre}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      <div className={styles.popupTurnos}>
                        {turnosDelDia
                          .filter(turno => 
                            agentesPopupFiltro.length === 0 || 
                            agentesPopupFiltro.includes((turno.agenteId as any)?._id || turno.agenteId)
                          )
                          .map(turno => {
                            const agente = turno.agenteId as any;
                            const horaInicio = formatearHora(turno.fechaInicio);
                            const clienteInfo = (turno as any).clienteInfo;
                            
                            return (
                              <div
                                key={turno._id}
                                className={styles.turnoItem}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTurnoSeleccionado(turno);
                                }}
                              >
                                <div className={styles.turnoHora}>{horaInicio}</div>
                                <div className={styles.turnoInfo}>
                                  <div className={styles.turnoAgente}>
                                    👤 {agente?.nombre} {agente?.apellido}
                                  </div>
                                  <div className={styles.turnoCliente}>
                                    👥 {clienteInfo 
                                      ? `${clienteInfo.nombre} ${clienteInfo.apellido}`
                                      : `Cliente: ${turno.clienteId.substring(0, 8)}...`
                                    }
                                  </div>
                                  {clienteInfo?.documento && (
                                    <div className={styles.turnoDocumento}>
                                      🆔 {clienteInfo.documento}
                                    </div>
                                  )}
                                  {clienteInfo?.telefono && (
                                    <div className={styles.turnoTelefono}>
                                      📞 {clienteInfo.telefono}
                                    </div>
                                  )}
                                  {turno.duracion && (
                                    <div className={styles.turnoDuracion}>
                                      ⏱️ {turno.duracion} min
                                    </div>
                                  )}
                                  {turno.notas && (
                                    <div className={styles.turnoNotas}>
                                      📝 {turno.notas}
                                    </div>
                                  )}
                                </div>
                                <div
                                  className={styles.turnoEstado}
                                  style={{ background: getEstadoColor(turno.estado) }}
                                  title={turno.estado}
                                />
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de Detalle del Turno */}
      <DetalleTurno
        turno={turnoSeleccionado}
        onCerrar={() => setTurnoSeleccionado(null)}
      />
    </div>
  );
}
