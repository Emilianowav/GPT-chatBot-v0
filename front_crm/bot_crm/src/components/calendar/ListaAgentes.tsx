// 👨‍⚕️ Lista de agentes
'use client';

import type { Agente } from '@/lib/calendarApi';
import styles from './ListaAgentes.module.css';

interface ListaAgentesProps {
  agentes: Agente[];
  onEditar?: (agente: Agente) => void;
  onConfigurarDisponibilidad?: (agente: Agente) => void;
  onDesactivar?: (agente: Agente) => void;
  onEliminar?: (agente: Agente) => void;
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function ListaAgentes({ 
  agentes, 
  onEditar, 
  onConfigurarDisponibilidad,
  onDesactivar,
  onEliminar
}: ListaAgentesProps) {
  if (agentes.length === 0) {
    return (
      <div className={styles.empty}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <p>No hay agentes registrados</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {agentes.map(agente => (
        <div key={agente._id} className={styles.agenteCard}>
          <div className={styles.agenteHeader}>
            <div className={styles.agenteAvatar}>
              {agente.nombre.charAt(0)}{agente.apellido.charAt(0)}
            </div>
            <div className={styles.agenteInfo}>
              <h3>{agente.nombre} {agente.apellido}</h3>
              {agente.titulo && <span className={styles.titulo}>{agente.titulo}</span>}
              {agente.especialidad && (
                <span className={styles.especialidad}>{agente.especialidad}</span>
              )}
            </div>
            <div className={styles.agenteEstado}>
              <span className={agente.activo ? styles.activo : styles.inactivo}>
                {agente.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          <div className={styles.agenteBody}>
            {/* Información de Contacto */}
            <div className={styles.contacto}>
              {agente.telefono && (
                <div className={styles.contactoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span>{agente.telefono}</span>
                </div>
              )}
              <div className={styles.contactoItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span>{agente.email}</span>
              </div>
            </div>

            <div className={styles.detalles}>
              <div className={styles.detalle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>
                  {agente.modoAtencion === 'turnos_programados' && 'Turnos Programados'}
                  {agente.modoAtencion === 'turnos_libres' && 'Turnos Libres'}
                  {agente.modoAtencion === 'mixto' && 'Modo Mixto'}
                  {!agente.modoAtencion && 'Turnos Programados'}
                </span>
              </div>
              {(agente.modoAtencion === 'turnos_programados' || agente.modoAtencion === 'mixto' || !agente.modoAtencion) && (
                <>
                  <div className={styles.detalle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>Turno: {agente.duracionTurnoPorDefecto} min</span>
                  </div>
                  <div className={styles.detalle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                      <polyline points="17 6 23 6 23 12"/>
                    </svg>
                    <span>Buffer: {agente.bufferEntreturnos} min</span>
                  </div>
                </>
              )}
              {(agente.modoAtencion === 'turnos_libres' || agente.modoAtencion === 'mixto') && (
                <>
                  <div className={styles.detalle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span>Capacidad: {agente.capacidadSimultanea || 1}</span>
                  </div>
                  {agente.maximoTurnosPorDia && agente.maximoTurnosPorDia > 0 && (
                    <div className={styles.detalle}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23"/>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                      <span>Máx/día: {agente.maximoTurnosPorDia}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Disponibilidad Semanal */}
            {agente.disponibilidad && agente.disponibilidad.length > 0 ? (
              <div className={styles.disponibilidad}>
                <div className={styles.disponibilidadHeader}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <strong>Disponibilidad:</strong>
                </div>
                <div className={styles.diasGrid}>
                  {DIAS_SEMANA.map((dia, index) => {
                    const disp = agente.disponibilidad.find(d => d.diaSemana === index && d.activo);
                    return (
                      <div 
                        key={index} 
                        className={`${styles.dia} ${disp ? styles.diaActivo : ''}`}
                        title={disp ? `${disp.horaInicio} - ${disp.horaFin}` : 'No disponible'}
                      >
                        <span className={styles.diaNombre}>{dia}</span>
                        {disp && (
                          <span className={styles.diaHorario}>
                            {disp.horaInicio.substring(0, 5)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const diasActivos = agente.disponibilidad.filter(d => d.activo);
                  if (diasActivos.length > 0) {
                    const primerDia = diasActivos[0];
                    return (
                      <div className={styles.horarioResumen}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>
                          Horario típico: {primerDia.horaInicio} - {primerDia.horaFin}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ) : (
              <div className={styles.sinDisponibilidad}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Sin horarios configurados</span>
              </div>
            )}
          </div>

          <div className={styles.agenteAcciones}>
            {onEditar && (
              <button
                onClick={() => onEditar(agente)}
                className={styles.btnEditar}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Editar
              </button>
            )}
            {onConfigurarDisponibilidad && (
              <button
                onClick={() => onConfigurarDisponibilidad(agente)}
                className={styles.btnDisponibilidad}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Horarios
              </button>
            )}
            {onDesactivar && (
              <button
                onClick={() => onDesactivar(agente)}
                className={agente.activo ? styles.btnDesactivarAgente : styles.btnActivar}
              >
                {agente.activo ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    Desactivar
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Activar
                  </>
                )}
              </button>
            )}
            {onEliminar && (
              <button
                onClick={() => onEliminar(agente)}
                className={styles.btnEliminar}
                title="Eliminar permanentemente"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                Eliminar
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
