'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Users, MessageSquare, AlertCircle, Check, Calendar } from 'lucide-react';
import styles from './ModalConfiguracionFlujo.module.css';

interface ModalConfiguracionAgentesProps {
  isOpen: boolean;
  onClose: () => void;
  flujo: any;
  onGuardar: (config: any) => Promise<void>;
}

export default function ModalConfiguracionAgentes({
  isOpen,
  onClose,
  flujo,
  onGuardar
}: ModalConfiguracionAgentesProps) {
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [config, setConfig] = useState({
    activo: true,
    anticipacion: 0,
    horaEnvio: '06:00',
    enviarATodos: false,
    mensaje: 'Buenos días {agente}! 🌅\nEstos son tus {turnos} de hoy:',
    frecuencia: {
      tipo: 'diaria' as 'diaria' | 'semanal' | 'mensual',
      diasSemana: [1, 2, 3, 4, 5] // Lun-Vie
    },
    incluirDetalles: {
      origen: true,
      destino: true,
      nombreCliente: true,
      telefonoCliente: false,
      horaReserva: true,
      notasInternas: false
    }
  });

  // Reset al abrir
  useEffect(() => {
    if (isOpen && flujo) {
      setConfig({
        activo: flujo.activo ?? true,
        anticipacion: flujo.config?.anticipacion ?? 0,
        horaEnvio: flujo.config?.horaEnvio ?? '06:00',
        enviarATodos: flujo.config?.enviarATodos ?? false,
        mensaje: flujo.config?.mensaje ?? 'Buenos días {agente}! 🌅\nEstos son tus {turnos} de hoy:',
        frecuencia: flujo.config?.frecuencia ?? { tipo: 'diaria', diasSemana: [1, 2, 3, 4, 5] },
        incluirDetalles: flujo.config?.incluirDetalles ?? {
          origen: true,
          destino: true,
          nombreCliente: true,
          telefonoCliente: false,
          horaReserva: true,
          notasInternas: false
        }
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
    if (!config.horaEnvio) {
      setError('La hora de envío es requerida');
      return false;
    }
    return true;
  };

  const validarPaso2 = () => {
    // La plantilla de Meta se configura en Meta Business Manager, no aquí
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
    if (!validarPaso1() || !validarPaso2()) return;
    
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

  const toggleDiaSemana = (dia: number) => {
    setConfig(prev => ({
      ...prev,
      frecuencia: {
        ...prev.frecuencia,
        diasSemana: prev.frecuencia.diasSemana.includes(dia)
          ? prev.frecuencia.diasSemana.filter(d => d !== dia)
          : [...prev.frecuencia.diasSemana, dia].sort()
      }
    }));
  };

  const toggleDetalle = (detalle: keyof typeof config.incluirDetalles) => {
    setConfig(prev => ({
      ...prev,
      incluirDetalles: {
        ...prev.incluirDetalles,
        [detalle]: !prev.incluirDetalles[detalle]
      }
    }));
  };

  if (!isOpen || !flujo) return null;

  const diasSemana = [
    { id: 1, nombre: 'Lun' },
    { id: 2, nombre: 'Mar' },
    { id: 3, nombre: 'Mié' },
    { id: 4, nombre: 'Jue' },
    { id: 5, nombre: 'Vie' },
    { id: 6, nombre: 'Sáb' },
    { id: 0, nombre: 'Dom' }
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2>📅 Configurar Recordatorio Diario para Agentes</h2>
            <p className={styles.subtitle}>
              {paso === 1 && 'Configuración de horario y frecuencia'}
              {paso === 2 && 'Mensaje y variables'}
              {paso === 3 && 'Detalles a incluir'}
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
            <span>Horario</span>
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
            <span>Detalles</span>
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
          {/* PASO 1: Configuración de Horario */}
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
                <small>Cuando está inactivo, no se enviarán recordatorios diarios</small>
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.field} style={{ flex: 1 }}>
                  <label>
                    <Clock size={16} />
                    Anticipación de Envío *
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
                    <option value="0">Mismo día</option>
                    <option value="1">1 día antes</option>
                    <option value="2">2 días antes</option>
                    <option value="3">3 días antes</option>
                    <option value="7">1 semana antes</option>
                  </select>
                  <small>Cuándo enviar el recordatorio (mismo día o días antes)</small>
                </div>

                <div className={styles.field} style={{ flex: 1 }}>
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
                  <small>Hora en que se enviará el recordatorio (ej: 06:00 al inicio del día)</small>
                </div>
              </div>

              <div className={styles.field}>
                <label>
                  <Calendar size={16} />
                  Frecuencia de Envío
                </label>
                <select
                  value={config.frecuencia.tipo}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    frecuencia: { 
                      ...config.frecuencia, 
                      tipo: e.target.value as 'diaria' | 'semanal' | 'mensual'
                    } 
                  })}
                  style={{ 
                    backgroundColor: 'var(--momento-black, #1A1A1A)',
                    color: 'var(--momento-white, #FFFFFF)',
                    border: '2px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <option value="diaria">Diaria</option>
                  <option value="semanal">Semanal</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>Días de la Semana</label>
                <div className={styles.checkboxGroup}>
                  {diasSemana.map(dia => (
                    <label key={dia.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={config.frecuencia.diasSemana.includes(dia.id)}
                        onChange={() => toggleDiaSemana(dia.id)}
                      />
                      <span>{dia.nombre}</span>
                    </label>
                  ))}
                </div>
                <small>Selecciona los días en que se enviará el recordatorio</small>
              </div>

              <div className={styles.field}>
                <label className={styles.toggleLabel}>
                  <span>
                    <Users size={16} />
                    Destinatarios
                  </span>
                  <div className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={config.enviarATodos}
                      onChange={(e) => setConfig({ ...config, enviarATodos: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </div>
                  <span className={styles.toggleStatus}>
                    {config.enviarATodos ? 'Todos los agentes' : 'Solo con reservas'}
                  </span>
                </label>
                <small>
                  {config.enviarATodos 
                    ? 'Se enviará a todos los agentes activos, tengan o no reservas' 
                    : 'Solo se enviará a agentes que tengan reservas ese día'}
                </small>
              </div>
            </div>
          )}

          {/* PASO 2: Mensaje */}
          {paso === 2 && (
            <div className={styles.paso}>
              <div className={styles.infoCard}>
                <MessageSquare size={20} />
                <div>
                  <strong>Mensaje de Recordatorio</strong>
                  <p>Este mensaje se enviará a los agentes al inicio de su jornada</p>
                </div>
              </div>

              <div className={styles.infoBox} style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                padding: '1.5rem',
                marginTop: '0'
              }}>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--momento-white, #FFFFFF)', lineHeight: '1.6' }}>
                  📱 <strong>Plantilla de Meta WhatsApp</strong><br/><br/>
                  Las notificaciones de agentes utilizan plantillas de WhatsApp Business configuradas en Meta Business Manager.<br/><br/>
                  El contenido y formato del mensaje se gestiona directamente en Meta, no desde este panel.<br/><br/>
                  💡 <em>Contacta al administrador del sistema para modificar el contenido de la plantilla.</em>
                </p>
              </div>
            </div>
          )}

          {/* PASO 3: Detalles */}
          {paso === 3 && (
            <div className={styles.paso}>
              <h3 className={styles.sectionTitle}>
                <MessageSquare size={18} />
                Información a Incluir en Cada Reserva
              </h3>

              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={config.incluirDetalles.origen}
                    onChange={() => toggleDetalle('origen')}
                  />
                  <span>📍 Origen</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={config.incluirDetalles.destino}
                    onChange={() => toggleDetalle('destino')}
                  />
                  <span>🎯 Destino</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={config.incluirDetalles.nombreCliente}
                    onChange={() => toggleDetalle('nombreCliente')}
                  />
                  <span>👤 Nombre del Cliente</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={config.incluirDetalles.telefonoCliente}
                    onChange={() => toggleDetalle('telefonoCliente')}
                  />
                  <span>📞 Teléfono del Cliente</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={config.incluirDetalles.horaReserva}
                    onChange={() => toggleDetalle('horaReserva')}
                  />
                  <span>🕐 Hora de la Reserva</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={config.incluirDetalles.notasInternas}
                    onChange={() => toggleDetalle('notasInternas')}
                  />
                  <span>📝 Notas Internas</span>
                </label>
              </div>

              <div className={styles.infoCard} style={{ marginTop: '1.5rem' }}>
                <AlertCircle size={20} />
                <div>
                  <strong>Recomendación</strong>
                  <p>Incluye al menos: Hora, Nombre del cliente, Origen y Destino para que el agente tenga la información esencial.</p>
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
