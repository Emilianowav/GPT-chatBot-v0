'use client';

import { useState, useEffect } from 'react';
import { X, Settings, MessageSquare, Clock, CheckCircle, AlertCircle, Check } from 'lucide-react';
import styles from './ModalConfiguracionFlujo.module.css';

interface ModalConfiguracionFlujoProps {
  isOpen: boolean;
  onClose: () => void;
  flujo: any;
  onGuardar: (config: any) => Promise<void>;
}

export default function ModalConfiguracionFlujo({
  isOpen,
  onClose,
  flujo,
  onGuardar
}: ModalConfiguracionFlujoProps) {
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ Detectar si usa plantillas de Meta
  const usaPlantillaMeta = flujo?.config?.plantilla || flujo?.id === 'confirmacion_turnos' || flujo?.id === 'notificacion_diaria_agentes';
  
  const [config, setConfig] = useState({
    activo: true,
    anticipacion: 24,
    horaEnvio: '22:00',
    estados: ['pendiente'],
    mensaje: '',
    mensajeConfirmacion: '✅ ¡Perfecto! Todos tus viajes han sido confirmados.\n\n¡Nos vemos pronto! 🚗',
    mensajeFinal: '✅ ¡Perfecto! Tus cambios han sido guardados. Te esperamos mañana.',
    diasSemana: [1, 2, 3, 4, 5] // Lunes a Viernes por defecto
  });

  // Reset al abrir
  useEffect(() => {
    if (isOpen && flujo) {
      setConfig({
        activo: flujo.activo ?? true,
        anticipacion: flujo.config?.anticipacion ?? 24,
        horaEnvio: flujo.config?.horaEnvio ?? '22:00',
        estados: flujo.config?.estados ?? ['pendiente'],
        mensaje: flujo.config?.mensaje ?? '',
        mensajeConfirmacion: flujo.config?.mensajeConfirmacion ?? '✅ ¡Perfecto! Todos tus viajes han sido confirmados.\n\n¡Nos vemos pronto! 🚗',
        mensajeFinal: flujo.config?.mensajeFinal ?? '✅ ¡Perfecto! Tus cambios han sido guardados. Te esperamos mañana.',
        diasSemana: flujo.config?.diasSemana ?? [1, 2, 3, 4, 5]
      });
      setPaso(1);
      setError(null);
    }
  }, [isOpen, flujo]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const validarPaso1 = () => {
    if (config.anticipacion < 1) {
      setError('La anticipación debe ser al menos 1 hora');
      return false;
    }
    if (config.estados.length === 0) {
      setError('Debes seleccionar al menos un estado');
      return false;
    }
    return true;
  };

  const validarPaso2 = () => {
    // ✅ Si usa plantilla de Meta, no validar mensaje
    if (usaPlantillaMeta) {
      return true;
    }
    
    if (!config.mensaje.trim()) {
      setError('El mensaje inicial es requerido');
      return false;
    }
    return true;
  };

  const validarPaso3 = () => {
    // ✅ Si usa plantilla de Meta, no validar mensajes
    if (usaPlantillaMeta) {
      return true;
    }
    
    if (!config.mensajeConfirmacion.trim()) {
      setError('El mensaje de confirmación es requerido');
      return false;
    }
    if (!config.mensajeFinal.trim()) {
      setError('El mensaje final es requerido');
      return false;
    }
    return true;
  };

  const siguientePaso = () => {
    setError(null);
    
    if (paso === 1 && !validarPaso1()) return;
    if (paso === 2 && !validarPaso2()) return;
    
    if (paso < 3) {
      setPaso(paso + 1);
    }
  };

  const pasoAnterior = () => {
    setError(null);
    if (paso > 1) {
      setPaso(paso - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validarPaso1() || !validarPaso2() || !validarPaso3()) return;
    
    try {
      setLoading(true);
      setError(null);
      await onGuardar(config);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = (estado: string) => {
    setConfig(prev => ({
      ...prev,
      estados: prev.estados.includes(estado)
        ? prev.estados.filter(e => e !== estado)
        : [...prev.estados, estado]
    }));
  };

  const toggleDiaSemana = (dia: number) => {
    setConfig(prev => ({
      ...prev,
      diasSemana: prev.diasSemana.includes(dia)
        ? prev.diasSemana.filter(d => d !== dia)
        : [...prev.diasSemana, dia].sort()
    }));
  };

  if (!isOpen || !flujo) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2>⚙️ Configurar Flujo</h2>
            <p className={styles.subtitle}>
              {paso === 1 && 'Configuración de envío y estados'}
              {paso === 2 && 'Mensaje inicial y opciones'}
              {paso === 3 && 'Mensajes de respuesta'}
            </p>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        {/* Progress */}
        <div className={styles.progress}>
          <div className={`${styles.progressStep} ${paso >= 1 ? styles.active : ''}`}>
            <div className={styles.progressCircle}>
              {paso > 1 ? <Check size={16} /> : '1'}
            </div>
            <span>Envío</span>
          </div>
          <div className={styles.progressLine} />
          <div className={`${styles.progressStep} ${paso >= 2 ? styles.active : ''}`}>
            <div className={styles.progressCircle}>
              {paso > 2 ? <Check size={16} /> : '2'}
            </div>
            <span>Mensaje</span>
          </div>
          <div className={styles.progressLine} />
          <div className={`${styles.progressStep} ${paso >= 3 ? styles.active : ''}`}>
            <div className={styles.progressCircle}>3</div>
            <span>Respuestas</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={styles.error}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>
          {/* PASO 1: Configuración de Envío */}
          {paso === 1 && (
            <div className={styles.paso}>
              <div className={styles.field}>
                <label className={styles.toggleLabel}>
                  <span>Estado del Flujo</span>
                  <div className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={config.activo}
                      onChange={(e) => setConfig({ ...config, activo: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </div>
                  <span className={styles.toggleStatus}>
                    {config.activo ? '🟢 Activo' : '🔴 Inactivo'}
                  </span>
                </label>
                <small>Cuando está inactivo, este flujo no se ejecutará automáticamente</small>
              </div>

              <div className={styles.fieldGroup}>
                {flujo.id !== 'notificacion_diaria_agentes' && (
                  <div className={styles.field} style={{ flex: 1 }}>
                    <label>
                      <Clock size={16} />
                      Días de Anticipación *
                    </label>
                    <select
                      value={config.anticipacion}
                      onChange={(e) => setConfig({ ...config, anticipacion: parseInt(e.target.value) })}
                      required
                      style={{ 
                        backgroundColor: 'var(--momento-black, #1A1A1A)',
                        color: 'var(--momento-white, #FFFFFF)',
                        border: '2px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <option value="1">1 día antes</option>
                      <option value="2">2 días antes</option>
                      <option value="3">3 días antes</option>
                      <option value="7">1 semana antes</option>
                    </select>
                    <small>Cuántos días antes del turno</small>
                  </div>
                )}

                <div className={styles.field} style={{ flex: flujo.id === 'notificacion_diaria_agentes' ? 'auto' : 1 }}>
                  <label>
                    <Clock size={16} />
                    Hora de Envío *
                  </label>
                  <input
                    type="time"
                    value={config.horaEnvio}
                    onChange={(e) => setConfig({ ...config, horaEnvio: e.target.value })}
                    required
                    style={{ 
                      backgroundColor: 'var(--momento-black, #1A1A1A)',
                      color: 'var(--momento-white, #FFFFFF)',
                      border: '2px solid rgba(255, 255, 255, 0.1)'
                    }}
                  />
                  <small>Hora específica del día (ej: {flujo.id === 'notificacion_diaria_agentes' ? '07:00' : '22:00'})</small>
                </div>
              </div>

              {flujo.id === 'notificacion_diaria_agentes' && (
                <div className={styles.field}>
                  <label>
                    <CheckCircle size={16} />
                    Días de la Semana *
                  </label>
                  <div className={styles.checkboxGroup} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
                    {[
                      { num: 1, nombre: 'Lunes' },
                      { num: 2, nombre: 'Martes' },
                      { num: 3, nombre: 'Miércoles' },
                      { num: 4, nombre: 'Jueves' },
                      { num: 5, nombre: 'Viernes' },
                      { num: 6, nombre: 'Sábado' },
                      { num: 0, nombre: 'Domingo' }
                    ].map(dia => (
                      <label key={dia.num} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={config.diasSemana.includes(dia.num)}
                          onChange={() => toggleDiaSemana(dia.num)}
                        />
                        <span>{dia.nombre}</span>
                      </label>
                    ))}
                  </div>
                  <small>Selecciona los días en los que se enviarán las notificaciones</small>
                </div>
              )}

              <div className={styles.infoBox} style={{
                backgroundColor: 'rgba(255, 107, 74, 0.1)',
                border: '1px solid rgba(255, 107, 74, 0.3)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--momento-white, #FFFFFF)' }}>
                  📅 <strong>Ejemplo:</strong> {flujo.id === 'notificacion_diaria_agentes' 
                    ? 'Si seleccionas "07:00" y días laborales (Lun-Vie), las notificaciones se enviarán de lunes a viernes a las 7:00 AM con las reservas del día.'
                    : 'Si seleccionas "1 día antes" a las "22:00", las notificaciones se enviarán todos los días a las 22:00 para los turnos del día siguiente.'}
                </p>
              </div>

              <div className={styles.field}>
                <label>
                  <CheckCircle size={16} />
                  Estados de Turnos a Notificar *
                </label>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={config.estados.includes('pendiente')}
                      onChange={() => toggleEstado('pendiente')}
                    />
                    <span>⏳ Pendiente</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={config.estados.includes('no_confirmado')}
                      onChange={() => toggleEstado('no_confirmado')}
                    />
                    <span>❓ No confirmado</span>
                  </label>
                </div>
                <small>Solo se enviarán notificaciones a turnos en estos estados</small>
              </div>
            </div>
          )}

          {/* PASO 2: Mensaje Inicial o Plantilla Meta */}
          {paso === 2 && (
            <div className={styles.paso}>
              {usaPlantillaMeta ? (
                // ✅ Configuración de Plantilla de Meta
                <div>
                  <div className={styles.infoCard} style={{
                    backgroundColor: 'rgba(37, 211, 102, 0.1)',
                    border: '2px solid rgba(37, 211, 102, 0.3)'
                  }}>
                    <CheckCircle size={24} style={{ color: '#25D366' }} />
                    <div>
                      <strong>✅ Plantilla de Meta WhatsApp</strong>
                      <p>Este flujo utiliza una plantilla aprobada de Meta. No requiere configuración de mensajes.</p>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label>Plantilla Configurada</label>
                    <input
                      type="text"
                      value={flujo?.config?.plantilla || 'No especificada'}
                      disabled
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        cursor: 'not-allowed',
                        opacity: 0.7
                      }}
                    />
                    <small>Nombre de la plantilla en Meta Business Manager</small>
                  </div>

                  <div className={styles.field}>
                    <label>Idioma</label>
                    <input
                      type="text"
                      value={flujo?.config?.idioma || 'es'}
                      disabled
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        cursor: 'not-allowed',
                        opacity: 0.7
                      }}
                    />
                    <small>Código de idioma de la plantilla</small>
                  </div>

                  <div className={styles.infoBox} style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                    padding: '1rem'
                  }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                      ℹ️ <strong>Nota:</strong> Las plantillas de Meta se configuran en el backend y deben estar aprobadas en Meta Business Manager.
                      Los mensajes se envían automáticamente según la configuración del paso 1.
                    </p>
                  </div>
                </div>
              ) : (
                // Configuración de mensaje personalizado (sistema antiguo)
                <div>
                  <div className={styles.infoCard}>
                    <MessageSquare size={20} />
                    <div>
                      <strong>Mensaje Inicial</strong>
                      <p>Este es el primer mensaje que recibirá el cliente con la información de sus viajes</p>
                    </div>
                  </div>

              <div className={styles.field}>
                <label>Mensaje de Recordatorio *</label>
                <textarea
                  value={config.mensaje}
                  onChange={(e) => setConfig({ ...config, mensaje: e.target.value })}
                  rows={8}
                  placeholder="Recordatorio de viajes para mañana..."
                  required
                />
                <small>Variables disponibles: {'{origen}'}, {'{destino}'}, {'{hora}'}, {'{pasajeros}'}</small>
              </div>

                  <div className={styles.previewCard}>
                    <strong>Vista Previa:</strong>
                    <div className={styles.previewMessage}>
                      {config.mensaje || 'Escribe un mensaje para ver la vista previa...'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: Mensajes de Respuesta o Resumen */}
          {paso === 3 && (
            <div className={styles.paso}>
              {usaPlantillaMeta ? (
                // ✅ Resumen de configuración para plantillas Meta
                <div>
                  <h3 className={styles.sectionTitle}>
                    <CheckCircle size={18} style={{ color: '#25D366' }} />
                    Resumen de Configuración
                  </h3>

                  <div className={styles.infoCard} style={{
                    backgroundColor: 'rgba(37, 211, 102, 0.1)',
                    border: '2px solid rgba(37, 211, 102, 0.3)'
                  }}>
                    <CheckCircle size={24} style={{ color: '#25D366' }} />
                    <div>
                      <strong>✅ Configuración Lista</strong>
                      <p>Este flujo está configurado para usar plantillas de Meta WhatsApp.</p>
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--momento-white)' }}>Configuración Actual:</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      <li style={{ padding: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', marginBottom: '0.5rem' }}>
                        <strong>Estado:</strong> {config.activo ? '🟢 Activo' : '🔴 Inactivo'}
                      </li>
                      <li style={{ padding: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', marginBottom: '0.5rem' }}>
                        <strong>Anticipación:</strong> {config.anticipacion} día(s) antes
                      </li>
                      <li style={{ padding: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', marginBottom: '0.5rem' }}>
                        <strong>Hora de envío:</strong> {config.horaEnvio}
                      </li>
                      <li style={{ padding: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', marginBottom: '0.5rem' }}>
                        <strong>Plantilla:</strong> {flujo?.config?.plantilla || 'No especificada'}
                      </li>
                      <li style={{ padding: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px' }}>
                        <strong>Estados notificados:</strong> {config.estados.join(', ')}
                      </li>
                    </ul>
                  </div>

                  <div className={styles.infoBox} style={{
                    backgroundColor: 'rgba(255, 107, 74, 0.1)',
                    border: '1px solid rgba(255, 107, 74, 0.3)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginTop: '1.5rem'
                  }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                      📱 <strong>Importante:</strong> Las notificaciones se enviarán automáticamente según esta configuración.
                      Los mensajes son gestionados por las plantillas de Meta aprobadas.
                    </p>
                  </div>
                </div>
              ) : (
                // Configuración de mensajes personalizados (sistema antiguo)
                <div>
                  <h3 className={styles.sectionTitle}>
                    <MessageSquare size={18} />
                    Mensajes de Respuesta
                  </h3>

              <div className={styles.field}>
                <label>Mensaje al Confirmar Todos los Viajes *</label>
                <textarea
                  value={config.mensajeConfirmacion}
                  onChange={(e) => setConfig({ ...config, mensajeConfirmacion: e.target.value })}
                  rows={3}
                  placeholder="✅ ¡Perfecto! Todos tus viajes han sido confirmados..."
                  required
                />
                <small>Se envía cuando el cliente elige "1️⃣ Confirmar todos los viajes"</small>
              </div>

              <div className={styles.field}>
                <label>Mensaje de Finalización *</label>
                <textarea
                  value={config.mensajeFinal}
                  onChange={(e) => setConfig({ ...config, mensajeFinal: e.target.value })}
                  rows={3}
                  placeholder="✅ ¡Perfecto! Tus cambios han sido guardados..."
                  required
                />
                <small>Se envía al finalizar cualquier edición de viaje</small>
              </div>

              <div className={styles.infoCard}>
                <Settings size={20} />
                <div>
                  <strong>Flujo de Edición</strong>
                  <p>El flujo de edición incluye automáticamente:</p>
                  <ul>
                    <li>Selección de viaje a editar</li>
                    <li>Opciones: Origen, Destino, Horario, Cancelar</li>
                    <li>Confirmación de cambios</li>
                  </ul>
                </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            onClick={paso === 1 ? onClose : pasoAnterior}
            className={styles.btnSecondary}
            disabled={loading}
          >
            {paso === 1 ? 'Cancelar' : 'Anterior'}
          </button>
          
          {paso < 3 ? (
            <button
              type="button"
              onClick={siguientePaso}
              className={styles.btnPrimary}
              disabled={loading}
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? 'Guardando...' : '💾 Guardar Configuración'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
