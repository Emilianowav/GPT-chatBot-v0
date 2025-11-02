// 📋 Selector de Tipo de Notificación
'use client';

import { useState } from 'react';
import styles from './SelectorTipoNotificacion.module.css';

interface PlantillaNotificacion {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  tipo: 'personalizada' | 'agenda_agente' | 'recordatorio_cliente' | 'confirmacion_diaria';
  destinatario: 'agente' | 'cliente' | 'agentes_especificos';
  plantillaMensaje: string;
  momento: string;
}

interface SelectorTipoNotificacionProps {
  onSeleccionar: (plantilla: PlantillaNotificacion | null) => void;
  onCerrar: () => void;
}

const PLANTILLAS: PlantillaNotificacion[] = [
  {
    id: 'personalizada',
    nombre: 'Notificación Personalizada',
    descripcion: 'Crea una notificación desde cero con tus propias configuraciones',
    icono: '✏️',
    tipo: 'personalizada',
    destinatario: 'cliente',
    plantillaMensaje: '',
    momento: 'inmediata'
  },
  {
    id: 'agenda_agente',
    nombre: 'Agenda del Agente',
    descripcion: 'Envía a cada agente su lista de turnos/viajes del día siguiente',
    icono: '📅',
    tipo: 'agenda_agente',
    destinatario: 'agente',
    plantillaMensaje: `🚗 *Estos son tus {turno}s de mañana*

📍 *Origen:* {origen}
📍 *Destino:* {destino}
🕐 *Hora:* {hora}
😁 *Cliente:* {cliente}
👥 *Pasajeros:* {pasajeros}
📞 *Teléfono:* {telefono}`,
    momento: 'noche_anterior'
  },
  {
    id: 'recordatorio_cliente',
    nombre: 'Recordatorio al Cliente',
    descripcion: 'Recuerda a cada cliente su turno/viaje del día siguiente',
    icono: '⏰',
    tipo: 'recordatorio_cliente',
    destinatario: 'cliente',
    plantillaMensaje: `Hola {cliente}! 👋

Te recordamos tu {turno} para mañana:

📅 *Fecha:* {fecha}
🕐 *Hora:* {hora}
👤 *Agente:* {agente}
📍 *Origen:* {origen}
📍 *Destino:* {destino}

¡Te esperamos! 🚗`,
    momento: 'noche_anterior'
  },
  {
    id: 'confirmacion_diaria',
    nombre: 'Confirmación Diaria',
    descripcion: 'Solicita confirmación a los clientes la noche anterior (22:00)',
    icono: '✅',
    tipo: 'confirmacion_diaria',
    destinatario: 'cliente',
    plantillaMensaje: `🚗 *Recordatorio de viaje para mañana*

📍 *Origen:* {origen}
📍 *Destino:* {destino}
🕐 *Hora:* {hora}
👥 *Pasajeros:* {pasajeros}

¿Confirmas tu viaje? Responde *SÍ* o *NO*`,
    momento: 'noche_anterior'
  }
];

export default function SelectorTipoNotificacion({ onSeleccionar, onCerrar }: SelectorTipoNotificacionProps) {
  const [seleccionada, setSeleccionada] = useState<string | null>(null);

  const handleSeleccionar = (plantilla: PlantillaNotificacion) => {
    setSeleccionada(plantilla.id);
    // Pequeño delay para mostrar la selección
    setTimeout(() => {
      onSeleccionar(plantilla.tipo === 'personalizada' ? null : plantilla);
    }, 200);
  };

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.titulo}>Crear Nueva Notificación</h2>
            <p className={styles.subtitulo}>
              Elige una plantilla predefinida o crea una personalizada
            </p>
          </div>
          <button className={styles.btnCerrar} onClick={onCerrar}>
            ✕
          </button>
        </div>

        {/* Grid de Plantillas */}
        <div className={styles.grid}>
          {PLANTILLAS.map((plantilla) => (
            <div
              key={plantilla.id}
              className={`${styles.card} ${seleccionada === plantilla.id ? styles.seleccionada : ''}`}
              onClick={() => handleSeleccionar(plantilla)}
            >
              <div className={styles.icono}>{plantilla.icono}</div>
              <h3 className={styles.cardTitulo}>{plantilla.nombre}</h3>
              <p className={styles.cardDescripcion}>{plantilla.descripcion}</p>
              
              {plantilla.tipo !== 'personalizada' && (
                <div className={styles.detalles}>
                  <div className={styles.detalle}>
                    <span className={styles.detalleLabel}>Destinatario:</span>
                    <span className={styles.detalleValor}>
                      {plantilla.destinatario === 'agente' ? '👤 Agentes' : '👥 Clientes'}
                    </span>
                  </div>
                  <div className={styles.detalle}>
                    <span className={styles.detalleLabel}>Envío:</span>
                    <span className={styles.detalleValor}>
                      {plantilla.momento === 'noche_anterior' ? '🌙 Noche anterior' : 
                       plantilla.momento === 'hora_exacta' ? '⏰ Hora exacta' : 
                       '⚡ Inmediato'}
                    </span>
                  </div>
                </div>
              )}

              <div className={styles.cardFooter}>
                {plantilla.tipo === 'personalizada' ? (
                  <span className={styles.badge}>Personalizable</span>
                ) : (
                  <span className={styles.badge}>Plantilla Lista</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Vista Previa de Mensaje */}
        {seleccionada && seleccionada !== 'personalizada' && (
          <div className={styles.preview}>
            <h4 className={styles.previewTitulo}>📝 Vista Previa del Mensaje</h4>
            <div className={styles.previewMensaje}>
              {PLANTILLAS.find(p => p.id === seleccionada)?.plantillaMensaje}
            </div>
            <small className={styles.previewNota}>
              💡 Las variables como {'{cliente}'}, {'{hora}'}, {'{origen}'} se reemplazarán automáticamente
            </small>
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.btnCancelar} onClick={onCerrar}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
