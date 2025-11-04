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
  
  const [config, setConfig] = useState({
    activo: true,
    anticipacion: 24,
    estados: ['pendiente'],
    mensaje: '',
    mensajeConfirmacion: '✅ ¡Perfecto! Todos tus viajes han sido confirmados.\n\n¡Nos vemos pronto! 🚗',
    mensajeFinal: '✅ ¡Perfecto! Tus cambios han sido guardados. Te esperamos mañana.'
  });

  // Reset al abrir
  useEffect(() => {
    if (isOpen && flujo) {
      setConfig({
        activo: flujo.activo ?? true,
        anticipacion: flujo.config?.anticipacion ?? 24,
        estados: flujo.config?.estados ?? ['pendiente'],
        mensaje: flujo.config?.mensaje ?? '',
        mensajeConfirmacion: flujo.config?.mensajeConfirmacion ?? '✅ ¡Perfecto! Todos tus viajes han sido confirmados.\n\n¡Nos vemos pronto! 🚗',
        mensajeFinal: flujo.config?.mensajeFinal ?? '✅ ¡Perfecto! Tus cambios han sido guardados. Te esperamos mañana.'
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
    if (!config.mensaje.trim()) {
      setError('El mensaje inicial es requerido');
      return false;
    }
    return true;
  };

  const validarPaso3 = () => {
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

              <div className={styles.field}>
                <label>
                  <Clock size={16} />
                  Tiempo de Anticipación *
                </label>
                <select
                  value={config.anticipacion}
                  onChange={(e) => setConfig({ ...config, anticipacion: parseInt(e.target.value) })}
                  required
                >
                  <option value="1">1 hora antes</option>
                  <option value="3">3 horas antes</option>
                  <option value="6">6 horas antes</option>
                  <option value="12">12 horas antes</option>
                  <option value="24">24 horas antes (1 día)</option>
                  <option value="48">48 horas antes (2 días)</option>
                </select>
                <small>Cuánto tiempo antes del turno se enviará el recordatorio</small>
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

          {/* PASO 2: Mensaje Inicial */}
          {paso === 2 && (
            <div className={styles.paso}>
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

          {/* PASO 3: Mensajes de Respuesta */}
          {paso === 3 && (
            <div className={styles.paso}>
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
