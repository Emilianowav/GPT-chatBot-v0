// 🤖 Componente de Configuración del Bot de Turnos
'use client';

import { useState, useEffect } from 'react';
import { useConfiguracionBot } from '@/hooks/useConfiguracionBot';
import ConfiguradorPasos, { PasoBot } from './ConfiguradorPasos';
import styles from './ConfiguracionBot.module.css';

interface ConfiguracionBotProps {
  empresaId: string;
}

export default function ConfiguracionBot({ empresaId }: ConfiguracionBotProps) {
  const { configuracion, loading, error, actualizarConfiguracion, toggleBot } = useConfiguracionBot(empresaId);
  
  const [formData, setFormData] = useState({
    activo: false,
    mensajeBienvenida: '',
    mensajeDespedida: '',
    mensajeError: '',
    timeoutMinutos: 10,
    horariosAtencion: {
      activo: false,
      inicio: '09:00',
      fin: '18:00',
      diasSemana: [1, 2, 3, 4, 5],
      mensajeFueraHorario: ''
    },
    requiereConfirmacion: true,
    permiteCancelacion: true,
    notificarAdmin: true
  });
  
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [tabActiva, setTabActiva] = useState<'general' | 'pasos'>('general');
  const [flujoActivo, setFlujoActivo] = useState<'crearTurno' | 'consultarTurnos' | 'cancelarTurno'>('crearTurno');
  
  const [pasos, setPasos] = useState<{
    crearTurno: PasoBot[];
    consultarTurnos: PasoBot[];
    cancelarTurno: PasoBot[];
  }>({
    crearTurno: [],
    consultarTurnos: [],
    cancelarTurno: []
  });

  useEffect(() => {
    if (configuracion) {
      setFormData({
        activo: configuracion.activo,
        mensajeBienvenida: configuracion.mensajeBienvenida,
        mensajeDespedida: configuracion.mensajeDespedida,
        mensajeError: configuracion.mensajeError,
        timeoutMinutos: configuracion.timeoutMinutos,
        horariosAtencion: configuracion.horariosAtencion || {
          activo: false, // Desactivado por defecto (24/7)
          inicio: '00:00',
          fin: '23:59',
          diasSemana: [0, 1, 2, 3, 4, 5, 6], // Todos los días
          mensajeFueraHorario: '⏰ Nuestro horario de atención es de {inicio} a {fin}.'
        },
        requiereConfirmacion: configuracion.requiereConfirmacion,
        permiteCancelacion: configuracion.permiteCancelacion,
        notificarAdmin: configuracion.notificarAdmin
      });
      
      // Cargar pasos si existen
      if (configuracion.flujos) {
        setPasos({
          crearTurno: configuracion.flujos.crearTurno?.pasos || [],
          consultarTurnos: configuracion.flujos.consultarTurnos?.pasos || [],
          cancelarTurno: configuracion.flujos.cancelarTurno?.pasos || []
        });
      }
    }
  }, [configuracion]);

  const handleToggleActivo = async () => {
    try {
      await toggleBot(!formData.activo);
      setMensaje({
        tipo: 'success',
        texto: formData.activo ? 'Bot desactivado' : 'Bot activado'
      });
      setTimeout(() => setMensaje(null), 3000);
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.message
      });
    }
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      await actualizarConfiguracion(formData);
      setMensaje({
        tipo: 'success',
        texto: '✅ Configuración guardada exitosamente'
      });
      setTimeout(() => setMensaje(null), 3000);
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.message
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleDiaToggle = (dia: number) => {
    const dias = formData.horariosAtencion.diasSemana;
    const nuevoDias = dias.includes(dia)
      ? dias.filter(d => d !== dia)
      : [...dias, dia].sort();
    
    setFormData({
      ...formData,
      horariosAtencion: {
        ...formData.horariosAtencion,
        diasSemana: nuevoDias
      }
    });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando configuración del bot...</p>
      </div>
    );
  }

  const diasSemana = [
    { num: 0, nombre: 'Dom' },
    { num: 1, nombre: 'Lun' },
    { num: 2, nombre: 'Mar' },
    { num: 3, nombre: 'Mié' },
    { num: 4, nombre: 'Jue' },
    { num: 5, nombre: 'Vie' },
    { num: 6, nombre: 'Sáb' }
  ];

  return (
    <div className={styles.container}>
      {/* Header con toggle principal */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h3>🤖 Chatbot de Turnos</h3>
          <p>Sistema de menús automático para agendar turnos por WhatsApp</p>
        </div>
        <label className={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={formData.activo}
            onChange={handleToggleActivo}
          />
          <span className={styles.slider}></span>
        </label>
      </div>

      {mensaje && (
        <div className={`${styles.mensaje} ${styles[mensaje.tipo]}`}>
          {mensaje.texto}
        </div>
      )}

      {error && (
        <div className={styles.error}>
          ❌ {error}
        </div>
      )}

      {/* Contenido principal */}
      <div className={styles.content}>
        
        {/* Sección: Mensajes */}
        <div className={styles.section}>
          <h4>💬 Mensajes del Bot</h4>
          
          <div className={styles.field}>
            <label>Mensaje de Bienvenida</label>
            <textarea
              value={formData.mensajeBienvenida}
              onChange={(e) => setFormData({ ...formData, mensajeBienvenida: e.target.value })}
              rows={4}
              placeholder="¡Hola! 👋 Soy tu asistente virtual..."
            />
            <small>Este mensaje se mostrará al inicio de la conversación</small>
          </div>

          <div className={styles.field}>
            <label>Mensaje de Despedida</label>
            <textarea
              value={formData.mensajeDespedida}
              onChange={(e) => setFormData({ ...formData, mensajeDespedida: e.target.value })}
              rows={2}
              placeholder="¡Hasta pronto! 👋"
            />
          </div>

          <div className={styles.field}>
            <label>Mensaje de Error</label>
            <textarea
              value={formData.mensajeError}
              onChange={(e) => setFormData({ ...formData, mensajeError: e.target.value })}
              rows={2}
              placeholder="❌ No entendí tu respuesta..."
            />
          </div>
        </div>

        {/* Sección: Horarios de Atención */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h4>⏰ Horarios de Atención</h4>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.horariosAtencion.activo}
                onChange={(e) => setFormData({
                  ...formData,
                  horariosAtencion: {
                    ...formData.horariosAtencion,
                    activo: e.target.checked
                  }
                })}
              />
              <span>Activar restricción de horarios</span>
            </label>
          </div>

          {formData.horariosAtencion.activo && (
            <>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Hora de Inicio</label>
                  <input
                    type="time"
                    value={formData.horariosAtencion.inicio}
                    onChange={(e) => setFormData({
                      ...formData,
                      horariosAtencion: {
                        ...formData.horariosAtencion,
                        inicio: e.target.value
                      }
                    })}
                  />
                </div>

                <div className={styles.field}>
                  <label>Hora de Fin</label>
                  <input
                    type="time"
                    value={formData.horariosAtencion.fin}
                    onChange={(e) => setFormData({
                      ...formData,
                      horariosAtencion: {
                        ...formData.horariosAtencion,
                        fin: e.target.value
                      }
                    })}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label>Días de Atención</label>
                <div className={styles.diasSemana}>
                  {diasSemana.map(dia => (
                    <button
                      key={dia.num}
                      type="button"
                      className={`${styles.diaBtn} ${formData.horariosAtencion.diasSemana.includes(dia.num) ? styles.activo : ''}`}
                      onClick={() => handleDiaToggle(dia.num)}
                    >
                      {dia.nombre}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label>Mensaje Fuera de Horario</label>
                <textarea
                  value={formData.horariosAtencion.mensajeFueraHorario}
                  onChange={(e) => setFormData({
                    ...formData,
                    horariosAtencion: {
                      ...formData.horariosAtencion,
                      mensajeFueraHorario: e.target.value
                    }
                  })}
                  rows={2}
                  placeholder="⏰ Nuestro horario de atención es..."
                />
                <small>Variables: {'{inicio}'}, {'{fin}'}</small>
              </div>
            </>
          )}
        </div>

        {/* Sección: Opciones Avanzadas */}
        <div className={styles.section}>
          <h4>⚙️ Opciones Avanzadas</h4>

          <div className={styles.field}>
            <label>Timeout de Conversación (minutos)</label>
            <input
              type="number"
              value={formData.timeoutMinutos}
              onChange={(e) => setFormData({ ...formData, timeoutMinutos: parseInt(e.target.value) || 10 })}
              min="1"
              max="60"
            />
            <small>Tiempo de inactividad antes de reiniciar la conversación</small>
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.requiereConfirmacion}
                onChange={(e) => setFormData({ ...formData, requiereConfirmacion: e.target.checked })}
              />
              <span>Requerir confirmación antes de crear turno</span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.permiteCancelacion}
                onChange={(e) => setFormData({ ...formData, permiteCancelacion: e.target.checked })}
              />
              <span>Permitir cancelación de turnos por bot</span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.notificarAdmin}
                onChange={(e) => setFormData({ ...formData, notificarAdmin: e.target.checked })}
              />
              <span>Notificar al administrador cuando se crea un turno</span>
            </label>
          </div>
        </div>

        {/* Información */}
        <div className={styles.infoBox}>
          <h4>ℹ️ Cómo funciona el bot</h4>
          <ul>
            <li>El bot usa un <strong>sistema de menús numéricos</strong> (1, 2, 3...)</li>
            <li>Los clientes eligen opciones escribiendo números</li>
            <li>El bot guía paso a paso para agendar turnos</li>
            <li>Se adapta automáticamente a los campos personalizados configurados</li>
            <li>Funciona 24/7 (respetando horarios si están configurados)</li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando}
            className={styles.btnGuardar}
          >
            {guardando ? 'Guardando...' : '💾 Guardar Configuración'}
          </button>
        </div>
      </div>
    </div>
  );
}
