// 🔄 Página de Gestión de Flujos del Chatbot
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ModuleGuard from '@/components/ModuleGuard';
import styles from './flujos.module.css';

interface Flujo {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'menu' | 'notificacion' | 'confirmacion';
  activo: boolean;
  prioridad: 'urgente' | 'normal' | 'baja';
  icono: string;
}

export default function FlujosActivosPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [flujos, setFlujos] = useState<Flujo[]>([
    {
      id: 'menu_principal',
      nombre: 'Menú Principal',
      descripcion: 'Flujo principal con opciones de Reserva, Consulta y Cancelación de turnos',
      tipo: 'menu',
      activo: true,
      prioridad: 'normal',
      icono: '📋'
    },
    {
      id: 'confirmacion_turnos',
      nombre: 'Confirmación de Turnos',
      descripcion: 'Envía recordatorios y solicita confirmación de turnos agendados',
      tipo: 'confirmacion',
      activo: true,
      prioridad: 'urgente',
      icono: '✅'
    },
    {
      id: 'notificacion_viajes',
      nombre: 'Notificaciones de Viajes',
      descripcion: 'Notifica a los clientes sobre el estado de sus viajes programados',
      tipo: 'notificacion',
      activo: true,
      prioridad: 'urgente',
      icono: '🚗'
    }
  ]);

  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  if (authLoading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  const handleToggleFlujo = (flujoId: string) => {
    setFlujos(flujos.map(f => 
      f.id === flujoId ? { ...f, activo: !f.activo } : f
    ));
    
    const flujo = flujos.find(f => f.id === flujoId);
    setMensaje({
      tipo: 'success',
      texto: `${flujo?.activo ? '🔴 Desactivado' : '🟢 Activado'}: ${flujo?.nombre}`
    });
    
    setTimeout(() => setMensaje(null), 3000);
  };

  const handleGuardar = () => {
    // Aquí iría la lógica para guardar en el backend
    setMensaje({
      tipo: 'success',
      texto: '✅ Configuración de flujos guardada exitosamente'
    });
    
    setTimeout(() => setMensaje(null), 3000);
  };

  const getPrioridadColor = (prioridad: string) => {
    const colores: Record<string, string> = {
      urgente: '#ef4444',
      normal: '#3b82f6',
      baja: '#94a3b8'
    };
    return colores[prioridad] || '#94a3b8';
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      menu: 'Menú',
      notificacion: 'Notificación',
      confirmacion: 'Confirmación'
    };
    return labels[tipo] || tipo;
  };

  return (
    <ModuleGuard moduleId="calendar_booking">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>🔄 Gestión de Flujos del Chatbot</h1>
            <p>Activa o desactiva los flujos conversacionales del asistente virtual</p>
          </div>
        </div>

        {mensaje && (
          <div className={`${styles.mensaje} ${styles[mensaje.tipo]}`}>
            {mensaje.texto}
          </div>
        )}

        <div className={styles.flujosGrid}>
          {flujos.map((flujo) => (
            <div 
              key={flujo.id} 
              className={`${styles.flujoCard} ${!flujo.activo ? styles.inactivo : ''}`}
            >
              <div className={styles.cardHeader}>
                <div className={styles.flujoInfo}>
                  <span className={styles.icono}>{flujo.icono}</span>
                  <div>
                    <h3>{flujo.nombre}</h3>
                    <div className={styles.badges}>
                      <span 
                        className={styles.badgePrioridad}
                        style={{ background: getPrioridadColor(flujo.prioridad) }}
                      >
                        {flujo.prioridad}
                      </span>
                      <span className={styles.badgeTipo}>
                        {getTipoLabel(flujo.tipo)}
                      </span>
                    </div>
                  </div>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={flujo.activo}
                    onChange={() => handleToggleFlujo(flujo.id)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.cardBody}>
                <p className={styles.descripcion}>{flujo.descripcion}</p>
                
                <div className={styles.estadoInfo}>
                  {flujo.activo ? (
                    <div className={styles.estadoActivo}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Flujo activo y funcionando</span>
                    </div>
                  ) : (
                    <div className={styles.estadoInactivo}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      <span>Flujo desactivado</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button 
                  className={styles.btnConfig}
                  onClick={() => router.push(`/dashboard/calendario/flujos-activos/configurar/${flujo.id}`)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                  Configurar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.btnGuardar} onClick={handleGuardar}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Guardar Cambios
          </button>
        </div>
      </div>
    </ModuleGuard>
  );
}
