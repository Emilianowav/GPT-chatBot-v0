// 👨‍⚕️ Lista de agentes - Formato Tabla
'use client';

import { useState, useMemo } from 'react';
import type { Agente } from '@/lib/calendarApi';
import Pagination from '@/components/ui/Pagination';
import styles from './ListaAgentes.module.css';

interface ListaAgentesProps {
  agentes: Agente[];
  onEditar?: (agente: Agente) => void;
  onConfigurarDisponibilidad?: (agente: Agente) => void;
  onDesactivar?: (agente: Agente) => void;
  onEliminar?: (agente: Agente) => void;
  itemsPerPage?: number;
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function ListaAgentes({ 
  agentes, 
  onEditar, 
  onConfigurarDisponibilidad,
  onDesactivar,
  onEliminar,
  itemsPerPage = 10
}: ListaAgentesProps) {
  const [agenteDetalle, setAgenteDetalle] = useState<Agente | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Paginación
  const totalPages = Math.ceil(agentes.length / itemsPerPage);
  const agentesPaginados = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return agentes.slice(start, start + itemsPerPage);
  }, [agentes, currentPage, itemsPerPage]);

  if (agentes.length === 0) {
    return (
      <div className={styles.empty}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <h3>No hay agentes registrados</h3>
        <p>Comienza agregando tu primer agente</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Agente</th>
              <th>Contacto</th>
              <th>Especialidad</th>
              <th>Modo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {agentesPaginados.map(agente => (
              <tr key={agente._id} onClick={() => setAgenteDetalle(agente)} className={styles.clickableRow}>
                <td>
                  <div className={styles.agenteCell}>
                    <div className={styles.avatar}>
                      {agente.nombre.charAt(0)}{agente.apellido.charAt(0)}
                    </div>
                    <div className={styles.agenteInfo}>
                      <span className={styles.nombre}>{agente.nombre} {agente.apellido}</span>
                      {agente.titulo && <span className={styles.titulo}>{agente.titulo}</span>}
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.contactoCell}>
                    <span>{agente.email}</span>
                    {agente.telefono && <span className={styles.telefono}>{agente.telefono}</span>}
                  </div>
                </td>
                <td>{agente.especialidad || '-'}</td>
                <td>
                  <span className={styles.modoBadge}>
                    {agente.modoAtencion === 'turnos_programados' && 'Programados'}
                    {agente.modoAtencion === 'turnos_libres' && 'Libres'}
                    {agente.modoAtencion === 'mixto' && 'Mixto'}
                    {!agente.modoAtencion && 'Programados'}
                  </span>
                </td>
                <td>
                  <span className={agente.activo ? styles.badgeActivo : styles.badgeInactivo}>
                    {agente.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className={styles.actions}>
                    {onEditar && (
                      <button
                        onClick={() => onEditar(agente)}
                        className={styles.btnEditar}
                        title="Editar"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    )}
                    {onDesactivar && (
                      <button
                        onClick={() => onDesactivar(agente)}
                        className={agente.activo ? styles.btnDesactivar : styles.btnActivar}
                        title={agente.activo ? 'Desactivar' : 'Activar'}
                      >
                        {agente.activo ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                        )}
                      </button>
                    )}
                    {onEliminar && (
                      <button
                        onClick={() => onEliminar(agente)}
                        className={styles.btnEliminar}
                        title="Eliminar"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
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
          totalItems={agentes.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Modal de Detalles */}
      {agenteDetalle && (
        <div className={styles.modal} onClick={() => setAgenteDetalle(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalAvatar}>
                {agenteDetalle.nombre.charAt(0)}{agenteDetalle.apellido.charAt(0)}
              </div>
              <div>
                <h2>{agenteDetalle.nombre} {agenteDetalle.apellido}</h2>
                {agenteDetalle.titulo && <p className={styles.modalTitulo}>{agenteDetalle.titulo}</p>}
                <span className={agenteDetalle.activo ? styles.badgeActivo : styles.badgeInactivo}>
                  {agenteDetalle.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <button className={styles.modalClose} onClick={() => setAgenteDetalle(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalSection}>
                <h4>Información de Contacto</h4>
                <div className={styles.modalInfo}>
                  <div className={styles.modalInfoItem}>
                    <span className={styles.label}>Email:</span>
                    <span>{agenteDetalle.email}</span>
                  </div>
                  {agenteDetalle.telefono && (
                    <div className={styles.modalInfoItem}>
                      <span className={styles.label}>Teléfono:</span>
                      <span>{agenteDetalle.telefono}</span>
                    </div>
                  )}
                  {agenteDetalle.especialidad && (
                    <div className={styles.modalInfoItem}>
                      <span className={styles.label}>Especialidad:</span>
                      <span>{agenteDetalle.especialidad}</span>
                    </div>
                  )}
                  {agenteDetalle.sector && (
                    <div className={styles.modalInfoItem}>
                      <span className={styles.label}>Sector:</span>
                      <span>{agenteDetalle.sector}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalSection}>
                <h4>Configuración de Turnos</h4>
                <div className={styles.modalInfo}>
                  <div className={styles.modalInfoItem}>
                    <span className={styles.label}>Modo:</span>
                    <span>
                      {agenteDetalle.modoAtencion === 'turnos_programados' && 'Turnos Programados'}
                      {agenteDetalle.modoAtencion === 'turnos_libres' && 'Turnos Libres'}
                      {agenteDetalle.modoAtencion === 'mixto' && 'Modo Mixto'}
                      {!agenteDetalle.modoAtencion && 'Turnos Programados'}
                    </span>
                  </div>
                  <div className={styles.modalInfoItem}>
                    <span className={styles.label}>Duración turno:</span>
                    <span>{agenteDetalle.duracionTurnoPorDefecto} minutos</span>
                  </div>
                  <div className={styles.modalInfoItem}>
                    <span className={styles.label}>Buffer entre turnos:</span>
                    <span>{agenteDetalle.bufferEntreturnos} minutos</span>
                  </div>
                  {agenteDetalle.capacidadSimultanea && (
                    <div className={styles.modalInfoItem}>
                      <span className={styles.label}>Capacidad simultánea:</span>
                      <span>{agenteDetalle.capacidadSimultanea}</span>
                    </div>
                  )}
                </div>
              </div>

              {agenteDetalle.disponibilidad && agenteDetalle.disponibilidad.length > 0 && (
                <div className={styles.modalSection}>
                  <h4>Disponibilidad Semanal</h4>
                  <div className={styles.diasGrid}>
                    {DIAS_SEMANA.map((dia, index) => {
                      const disp = agenteDetalle.disponibilidad.find(d => d.diaSemana === index && d.activo);
                      return (
                        <div 
                          key={index} 
                          className={`${styles.dia} ${disp ? styles.diaActivo : ''}`}
                        >
                          <span className={styles.diaNombre}>{dia}</span>
                          {disp && (
                            <span className={styles.diaHorario}>
                              {disp.horaInicio.substring(0, 5)} - {disp.horaFin.substring(0, 5)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              {onEditar && (
                <button onClick={() => { onEditar(agenteDetalle); setAgenteDetalle(null); }} className={styles.btnModalEditar}>
                  Editar Agente
                </button>
              )}
              <button onClick={() => setAgenteDetalle(null)} className={styles.btnModalCerrar}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
