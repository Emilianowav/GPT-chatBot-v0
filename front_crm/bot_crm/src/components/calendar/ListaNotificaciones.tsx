// 📋 Lista Moderna de Notificaciones
'use client';

import { useState } from 'react';
import styles from './ListaNotificaciones.module.css';
import type { NotificacionData } from './ModalNotificacion';

interface ListaNotificacionesProps {
  notificaciones: NotificacionData[];
  onEditar: (notificacion: NotificacionData, index: number) => void;
  onEliminar: (index: number) => void;
  onToggleActiva: (index: number) => void;
  onEnviarPrueba: (index: number) => void;
}

export default function ListaNotificaciones({
  notificaciones,
  onEditar,
  onEliminar,
  onToggleActiva,
  onEnviarPrueba
}: ListaNotificacionesProps) {
  const [expandida, setExpandida] = useState<number | null>(null);

  const getMomentoTexto = (notif: NotificacionData) => {
    switch (notif.momento) {
      case 'horas_antes_turno':
        return `${notif.horasAntesTurno}h antes del turno`;
      case 'dia_antes_turno':
        return `${notif.diasAntes} día(s) antes a las ${notif.horaEnvioDiaAntes}`;
      case 'noche_anterior':
        return `Noche anterior (${notif.horaEnvio || '22:00'})`;
      case 'mismo_dia':
        return `Mismo día a las ${notif.horaEnvio}`;
      case 'hora_exacta':
        return `Hora exacta: ${notif.horaEnvio}`;
      default:
        return 'No configurado';
    }
  };

  const getDestinatarioTexto = (notif: NotificacionData) => {
    switch (notif.destinatario) {
      case 'cliente':
        return '👥 Todos los Clientes';
      case 'agente':
        return '👤 Todos los Agentes';
      case 'clientes_especificos':
        return `👥 ${notif.clientesEspecificos?.length || 0} Cliente(s)`;
      case 'agentes_especificos':
        return `👤 ${notif.agentesEspecificos?.length || 0} Agente(s)`;
      default:
        return 'No configurado';
    }
  };

  const getTipoIcono = (tipo: string) => {
    switch (tipo) {
      case 'confirmacion':
        return '✅';
      case 'recordatorio':
        return '⏰';
      case 'cancelacion':
        return '❌';
      default:
        return '📝';
    }
  };

  if (notificaciones.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcono}>🔔</div>
        <h3 className={styles.emptyTitulo}>No hay notificaciones configuradas</h3>
        <p className={styles.emptyTexto}>
          Crea tu primera notificación para comenzar a enviar mensajes automáticos
        </p>
      </div>
    );
  }

  return (
    <div className={styles.lista}>
      {notificaciones.map((notif, index) => (
        <div
          key={index}
          className={`${styles.card} ${!notif.activa ? styles.inactiva : ''} ${expandida === index ? styles.expandida : ''}`}
        >
          {/* Header */}
          <div className={styles.header} onClick={() => setExpandida(expandida === index ? null : index)}>
            <div className={styles.headerLeft}>
              <div className={styles.icono}>{getTipoIcono(notif.tipo)}</div>
              <div className={styles.info}>
                <h3 className={styles.titulo}>
                  {notif.tipo.charAt(0).toUpperCase() + notif.tipo.slice(1)}
                  {!notif.activa && <span className={styles.badgeInactiva}>Inactiva</span>}
                  {notif.ejecucion === 'manual' && <span className={styles.badgeManual}>Manual</span>}
                </h3>
                <p className={styles.subtitulo}>
                  {getDestinatarioTexto(notif)} • {getMomentoTexto(notif)}
                </p>
              </div>
            </div>
            <div className={styles.headerRight}>
              <button
                className={styles.btnExpandir}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandida(expandida === index ? null : index);
                }}
              >
                {expandida === index ? '▲' : '▼'}
              </button>
            </div>
          </div>

          {/* Contenido Expandido */}
          {expandida === index && (
            <div className={styles.contenido}>
              {/* Mensaje */}
              <div className={styles.seccion}>
                <h4 className={styles.seccionTitulo}>📝 Mensaje</h4>
                <div className={styles.mensaje}>
                  {notif.plantillaMensaje}
                </div>
              </div>

              {/* Confirmación */}
              {notif.requiereConfirmacion && (
                <div className={styles.seccion}>
                  <h4 className={styles.seccionTitulo}>✅ Requiere Confirmación</h4>
                  <div className={styles.confirmacion}>
                    <div className={styles.confirmacionItem}>
                      <strong>✅ Confirmación:</strong>
                      <span>{notif.mensajeConfirmacion || 'No configurado'}</span>
                    </div>
                    <div className={styles.confirmacionItem}>
                      <strong>❌ Cancelación:</strong>
                      <span>{notif.mensajeCancelacion || 'No configurado'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Filtros */}
              {notif.filtros && (
                <div className={styles.seccion}>
                  <h4 className={styles.seccionTitulo}>🎯 Filtros</h4>
                  <div className={styles.filtros}>
                    {notif.filtros.estados && notif.filtros.estados.length > 0 && (
                      <div className={styles.filtro}>
                        <strong>Estados:</strong>
                        <span>{notif.filtros.estados.join(', ')}</span>
                      </div>
                    )}
                    {notif.filtros.horaMinima && (
                      <div className={styles.filtro}>
                        <strong>Hora mínima:</strong>
                        <span>{notif.filtros.horaMinima}</span>
                      </div>
                    )}
                    {notif.filtros.horaMaxima && (
                      <div className={styles.filtro}>
                        <strong>Hora máxima:</strong>
                        <span>{notif.filtros.horaMaxima}</span>
                      </div>
                    )}
                    {notif.filtros.soloSinNotificar && (
                      <div className={styles.filtro}>
                        <span>📬 Solo turnos sin notificar</span>
                      </div>
                    )}
                    {notif.filtros.limite && (
                      <div className={styles.filtro}>
                        <strong>Límite:</strong>
                        <span>{notif.filtros.limite} envíos</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className={styles.acciones}>
                <button
                  className={styles.btnAccion}
                  onClick={() => onToggleActiva(index)}
                >
                  {notif.activa ? '⏸️ Desactivar' : '▶️ Activar'}
                </button>
                <button
                  className={styles.btnAccion}
                  onClick={() => onEnviarPrueba(index)}
                >
                  📤 Enviar Prueba
                </button>
                <button
                  className={styles.btnAccion}
                  onClick={() => onEditar(notif, index)}
                >
                  ✏️ Editar
                </button>
                <button
                  className={`${styles.btnAccion} ${styles.btnEliminar}`}
                  onClick={() => {
                    if (confirm('¿Estás seguro de eliminar esta notificación?')) {
                      onEliminar(index);
                    }
                  }}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
