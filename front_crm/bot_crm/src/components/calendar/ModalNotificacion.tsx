// 🔔 Modal Moderno para Crear/Editar Notificaciones
'use client';

import { useState, useEffect } from 'react';
import styles from './ModalNotificacion.module.css';

interface ModalNotificacionProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (notificacion: NotificacionData) => void;
  notificacionInicial?: NotificacionData | null;
  agentes?: any[];
  clientes?: any[];
}

export interface NotificacionData {
  tipo: 'confirmacion' | 'recordatorio' | 'cancelacion' | 'personalizada';
  destinatario: 'cliente' | 'agente' | 'clientes_especificos' | 'agentes_especificos';
  momento: 'horas_antes_turno' | 'dia_antes_turno' | 'noche_anterior' | 'mismo_dia' | 'hora_exacta';
  plantillaMensaje: string;
  activa: boolean;
  ejecucion: 'automatica' | 'manual';
  
  // Configuración de momento
  horasAntesTurno?: number;
  diasAntes?: number;
  horaEnvioDiaAntes?: string;
  horaEnvio?: string;
  
  // Confirmación
  requiereConfirmacion?: boolean;
  mensajeConfirmacion?: string;
  mensajeCancelacion?: string;
  
  // Destinatarios específicos
  clientesEspecificos?: string[];
  agentesEspecificos?: string[];
  
  // Filtros
  filtros?: {
    estados?: string[];
    agenteIds?: string[];
    tipoReserva?: string[];
    horaMinima?: string;
    horaMaxima?: string;
    limite?: number;
    soloSinNotificar?: boolean;
  };
  
  // Recurrencia
  esRecurrente?: boolean;
  recurrencia?: {
    tipo: 'diaria' | 'semanal' | 'mensual';
    diasSemana?: number[];
    horaEnvio?: string;
    intervalo?: number;
    fechaInicio?: string;
    fechaFin?: string;
  };
}

const PLANTILLAS_PREDEFINIDAS = [
  {
    id: 'confirmacion_interactiva',
    nombre: 'Confirmación Interactiva (Recomendada)',
    icono: '✅',
    descripcion: 'Sistema completo de confirmación con opciones de edición',
    tipo: 'confirmacion' as const,
    destinatario: 'cliente' as const,
    momento: 'noche_anterior' as const,
    horaEnvio: '22:00',
    plantillaMensaje: `🚗 *Recordatorio de {turnos} para mañana*

{lista_turnos}

━━━━━━━━━━━━━━━━━━

*¿Qué deseas hacer?*

1️⃣ Confirmar {todos_o_el}
2️⃣ Editar {un_turno}

Responde con el número de la opción.`,
    requiereConfirmacion: true,
    mensajeConfirmacion: '✅ ¡Perfecto! {mensaje_confirmacion}',
    mensajeCancelacion: '❌ {turno} cancelado. Si necesitas reprogramar, contáctanos.',
    configuracionAvanzada: {
      permitirEdicion: true,
      camposEditables: ['origen', 'destino', 'hora'], // Se agregarán campos personalizados dinámicamente
      permitirCancelacion: true,
      mensajeEdicion: `✏️ *Editando {turno} #{numero}*

{datos_actuales}

*¿Qué deseas modificar?*

{opciones_edicion}

Escribe el número de la opción.`,
      mensajeSeleccionTurno: `📋 *Tus {turnos} pendientes:*

{lista_numerada}

*Selecciona el número del {turno} que deseas editar:*`,
      mensajeConfirmacionIndividual: '✅ {turno} #{numero} confirmado exitosamente.',
      mensajeCancelacionIndividual: '❌ {turno} #{numero} cancelado.',
      mensajeCampoActualizado: '✅ {campo} actualizado a: *{valor}*'
    }
  },
  {
    id: 'recordatorio_2h',
    nombre: 'Recordatorio 2 Horas Antes',
    icono: '⏰',
    descripcion: 'Recuerda al cliente 2 horas antes',
    tipo: 'recordatorio' as const,
    destinatario: 'cliente' as const,
    momento: 'horas_antes_turno' as const,
    horasAntesTurno: 2,
    plantillaMensaje: `Hola {cliente}! 👋

Te recordamos tu viaje en 2 horas:

🕐 *Hora:* {hora}
📍 *Origen:* {origen}
📍 *Destino:* {destino}
👤 *Conductor:* {agente}

¡Nos vemos pronto! 🚗`
  },
  {
    id: 'agenda_agente',
    nombre: 'Agenda del Agente',
    icono: '📅',
    descripcion: 'Lista de viajes del día para el agente',
    tipo: 'recordatorio' as const,
    destinatario: 'agente' as const,
    momento: 'noche_anterior' as const,
    horaEnvio: '21:00',
    plantillaMensaje: `🚗 *Tus viajes de mañana*

📍 *Origen:* {origen}
📍 *Destino:* {destino}
🕐 *Hora:* {hora}
😁 *Cliente:* {cliente}
👥 *Pasajeros:* {pasajeros}
📞 *Teléfono:* {telefono}`
  },
  {
    id: 'personalizada',
    nombre: 'Notificación Personalizada',
    icono: '✏️',
    descripcion: 'Crea desde cero',
    tipo: 'personalizada' as const,
    destinatario: 'cliente' as const,
    momento: 'horas_antes_turno' as const,
    horasAntesTurno: 1,
    plantillaMensaje: ''
  }
];

export default function ModalNotificacion({
  isOpen,
  onClose,
  onSubmit,
  notificacionInicial,
  agentes = [],
  clientes = []
}: ModalNotificacionProps) {
  const [paso, setPaso] = useState(1);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<string | null>(null);
  const [formData, setFormData] = useState<NotificacionData>({
    tipo: 'confirmacion',
    destinatario: 'cliente',
    momento: 'noche_anterior',
    plantillaMensaje: '',
    activa: true,
    ejecucion: 'automatica',
    horaEnvio: '22:00',
    requiereConfirmacion: false,
    filtros: {
      estados: ['pendiente', 'confirmado'],
      soloSinNotificar: true
    }
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (notificacionInicial) {
        setFormData(notificacionInicial);
        setPaso(2); // Si es edición, ir directo a configuración
      } else {
        // Reset para nueva notificación
        setPaso(1);
        setPlantillaSeleccionada(null);
        setFormData({
          tipo: 'confirmacion',
          destinatario: 'cliente',
          momento: 'noche_anterior',
          plantillaMensaje: '',
          activa: true,
          ejecucion: 'automatica',
          horaEnvio: '22:00',
          requiereConfirmacion: false,
          filtros: {
            estados: ['pendiente', 'confirmado'],
            soloSinNotificar: true
          }
        });
      }
      setError(null);
    }
  }, [isOpen, notificacionInicial]);

  const seleccionarPlantilla = (plantillaId: string) => {
    const plantilla = PLANTILLAS_PREDEFINIDAS.find(p => p.id === plantillaId);
    if (!plantilla) return;

    setPlantillaSeleccionada(plantillaId);
    
    setFormData({
      tipo: plantilla.tipo,
      destinatario: plantilla.destinatario,
      momento: plantilla.momento,
      plantillaMensaje: plantilla.plantillaMensaje,
      activa: true,
      ejecucion: 'automatica',
      horasAntesTurno: plantilla.horasAntesTurno,
      horaEnvio: plantilla.horaEnvio,
      requiereConfirmacion: plantilla.requiereConfirmacion,
      mensajeConfirmacion: plantilla.mensajeConfirmacion,
      mensajeCancelacion: plantilla.mensajeCancelacion,
      filtros: {
        estados: ['pendiente', 'confirmado'],
        soloSinNotificar: true
      }
    });

    setTimeout(() => setPaso(2), 300);
  };

  const handleSubmit = () => {
    // Validaciones
    if (!formData.plantillaMensaje.trim()) {
      setError('El mensaje de la plantilla es obligatorio');
      return;
    }

    if (formData.momento === 'horas_antes_turno' && !formData.horasAntesTurno) {
      setError('Debes especificar cuántas horas antes');
      return;
    }

    if (formData.momento === 'dia_antes_turno' && (!formData.diasAntes || !formData.horaEnvioDiaAntes)) {
      setError('Debes especificar días antes y hora de envío');
      return;
    }

    if ((formData.momento === 'noche_anterior' || formData.momento === 'mismo_dia' || formData.momento === 'hora_exacta') && !formData.horaEnvio) {
      setError('Debes especificar la hora de envío');
      return;
    }

    onSubmit(formData);
    onClose();
  };

  const siguientePaso = () => {
    setError(null);
    if (paso < 3) setPaso(paso + 1);
  };

  const anteriorPaso = () => {
    setError(null);
    if (paso > 1) setPaso(paso - 1);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.titulo}>
              {notificacionInicial ? '✏️ Editar Notificación' : '🔔 Nueva Notificación'}
            </h2>
            <p className={styles.subtitulo}>
              {paso === 1 && 'Elige una plantilla predefinida'}
              {paso === 2 && 'Configura el mensaje y momento de envío'}
              {paso === 3 && 'Configura filtros y opciones avanzadas'}
            </p>
          </div>
          <button className={styles.btnCerrar} onClick={onClose}>✕</button>
        </div>

        {/* Indicador de Pasos */}
        {!notificacionInicial && (
          <div className={styles.pasos}>
            <div className={`${styles.paso} ${paso >= 1 ? styles.pasoActivo : ''}`}>
              <div className={styles.pasoNumero}>1</div>
              <span>Plantilla</span>
            </div>
            <div className={styles.pasoLinea}></div>
            <div className={`${styles.paso} ${paso >= 2 ? styles.pasoActivo : ''}`}>
              <div className={styles.pasoNumero}>2</div>
              <span>Configuración</span>
            </div>
            <div className={styles.pasoLinea}></div>
            <div className={`${styles.paso} ${paso >= 3 ? styles.pasoActivo : ''}`}>
              <div className={styles.pasoNumero}>3</div>
              <span>Filtros</span>
            </div>
          </div>
        )}

        {/* Contenido */}
        <div className={styles.contenido}>
          {error && (
            <div className={styles.error}>
              ⚠️ {error}
            </div>
          )}

          {/* PASO 1: Selección de Plantilla */}
          {paso === 1 && (
            <div className={styles.gridPlantillas}>
              {PLANTILLAS_PREDEFINIDAS.map((plantilla) => (
                <div
                  key={plantilla.id}
                  className={`${styles.cardPlantilla} ${plantillaSeleccionada === plantilla.id ? styles.seleccionada : ''}`}
                  onClick={() => seleccionarPlantilla(plantilla.id)}
                >
                  <div className={styles.iconoPlantilla}>{plantilla.icono}</div>
                  <h3 className={styles.nombrePlantilla}>{plantilla.nombre}</h3>
                  <p className={styles.descripcionPlantilla}>{plantilla.descripcion}</p>
                  
                  {plantilla.id !== 'personalizada' && (
                    <div className={styles.detallesPlantilla}>
                      <span className={styles.badge}>
                        {plantilla.destinatario === 'agente' ? '👤 Agentes' : '👥 Clientes'}
                      </span>
                      <span className={styles.badge}>
                        {plantilla.momento === 'noche_anterior' ? '🌙 Noche anterior' :
                         plantilla.momento === 'horas_antes_turno' ? `⏰ ${plantilla.horasAntesTurno}h antes` :
                         '📅 Personalizado'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* PASO 2: Configuración del Mensaje */}
          {paso === 2 && (
            <div className={styles.formulario}>
              {/* Tipo y Destinatario */}
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>🏷️ Tipo de Notificación *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  >
                    <option value="confirmacion">Confirmación</option>
                    <option value="recordatorio">Recordatorio</option>
                    <option value="cancelacion">Cancelación</option>
                    <option value="personalizada">Personalizada</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label>👥 Destinatario *</label>
                  <select
                    value={formData.destinatario}
                    onChange={(e) => setFormData({ ...formData, destinatario: e.target.value as any })}
                  >
                    <option value="cliente">Todos los Clientes</option>
                    <option value="agente">Todos los Agentes</option>
                    <option value="clientes_especificos">Clientes Específicos</option>
                    <option value="agentes_especificos">Agentes Específicos</option>
                  </select>
                </div>
              </div>

              {/* Momento de Envío */}
              <div className={styles.field}>
                <label>⏰ Momento de Envío *</label>
                <select
                  value={formData.momento}
                  onChange={(e) => setFormData({ ...formData, momento: e.target.value as any })}
                >
                  <option value="horas_antes_turno">X horas antes del turno</option>
                  <option value="dia_antes_turno">X días antes a hora específica</option>
                  <option value="noche_anterior">Noche anterior (22:00)</option>
                  <option value="mismo_dia">Mismo día a hora específica</option>
                  <option value="hora_exacta">Hora exacta</option>
                </select>
              </div>

              {/* Configuración según momento */}
              {formData.momento === 'horas_antes_turno' && (
                <div className={styles.field}>
                  <label>⏱️ Horas Antes del Turno *</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.horasAntesTurno || ''}
                    onChange={(e) => setFormData({ ...formData, horasAntesTurno: parseFloat(e.target.value) })}
                    placeholder="Ej: 2"
                  />
                  <small className={styles.hint}>
                    Puedes usar decimales: 0.5 = 30 minutos, 1.5 = 1 hora 30 minutos
                  </small>
                </div>
              )}

              {formData.momento === 'dia_antes_turno' && (
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label>📅 Días Antes *</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.diasAntes || ''}
                      onChange={(e) => setFormData({ ...formData, diasAntes: parseInt(e.target.value) })}
                      placeholder="Ej: 1"
                    />
                  </div>
                  <div className={styles.field}>
                    <label>🕐 Hora de Envío *</label>
                    <input
                      type="text"
                      value={formData.horaEnvioDiaAntes || ''}
                      onChange={(e) => {
                        let valor = e.target.value.replace(/[^0-9:]/g, '');
                        if (valor.length === 2 && !valor.includes(':')) valor = valor + ':';
                        if (valor.length <= 5) setFormData({ ...formData, horaEnvioDiaAntes: valor });
                      }}
                      placeholder="HH:MM (ej: 22:00)"
                      maxLength={5}
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
              )}

              {(formData.momento === 'noche_anterior' || formData.momento === 'mismo_dia' || formData.momento === 'hora_exacta') && (
                <div className={styles.field}>
                  <label>🕐 Hora de Envío *</label>
                  <input
                    type="text"
                    value={formData.horaEnvio || ''}
                    onChange={(e) => {
                      let valor = e.target.value.replace(/[^0-9:]/g, '');
                      if (valor.length === 2 && !valor.includes(':')) valor = valor + ':';
                      if (valor.length <= 5) setFormData({ ...formData, horaEnvio: valor });
                    }}
                    placeholder="HH:MM (ej: 22:00)"
                    maxLength={5}
                    style={{ fontFamily: 'monospace' }}
                  />
                  <small className={styles.hint}>
                    Formato 24 horas. Ej: 08:00, 14:30, 22:00
                  </small>
                </div>
              )}

              {/* Plantilla del Mensaje */}
              <div className={styles.field}>
                <label>📝 Mensaje de la Plantilla *</label>
                <textarea
                  value={formData.plantillaMensaje}
                  onChange={(e) => setFormData({ ...formData, plantillaMensaje: e.target.value })}
                  placeholder="Escribe el mensaje..."
                  rows={8}
                />
                <small className={styles.hint}>
                  💡 Variables disponibles: {'{cliente}'}, {'{agente}'}, {'{fecha}'}, {'{hora}'}, {'{origen}'}, {'{destino}'}, {'{pasajeros}'}, {'{telefono}'}
                </small>
              </div>

              {/* Requiere Confirmación */}
              <div className={styles.fieldCheckbox}>
                <input
                  type="checkbox"
                  id="requiereConfirmacion"
                  checked={formData.requiereConfirmacion || false}
                  onChange={(e) => setFormData({ ...formData, requiereConfirmacion: e.target.checked })}
                />
                <label htmlFor="requiereConfirmacion">
                  ✅ Requiere confirmación del cliente (SÍ/NO)
                </label>
              </div>

              {formData.requiereConfirmacion && (
                <>
                  <div className={styles.field}>
                    <label>✅ Mensaje de Confirmación</label>
                    <textarea
                      value={formData.mensajeConfirmacion || ''}
                      onChange={(e) => setFormData({ ...formData, mensajeConfirmacion: e.target.value })}
                      placeholder="Mensaje cuando el cliente confirma..."
                      rows={3}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>❌ Mensaje de Cancelación</label>
                    <textarea
                      value={formData.mensajeCancelacion || ''}
                      onChange={(e) => setFormData({ ...formData, mensajeCancelacion: e.target.value })}
                      placeholder="Mensaje cuando el cliente cancela..."
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* PASO 3: Filtros y Opciones Avanzadas */}
          {paso === 3 && (
            <div className={styles.formulario}>
              <h3 className={styles.subtituloSeccion}>🎯 Filtros de Turnos</h3>
              
              {/* Estados */}
              <div className={styles.field}>
                <label>📊 Estados de Turnos</label>
                <div className={styles.checkboxGroup}>
                  {['pendiente', 'confirmado', 'no_confirmado', 'completado', 'cancelado'].map(estado => (
                    <label key={estado} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.filtros?.estados?.includes(estado) || false}
                        onChange={(e) => {
                          const estados = formData.filtros?.estados || [];
                          setFormData({
                            ...formData,
                            filtros: {
                              ...formData.filtros,
                              estados: e.target.checked
                                ? [...estados, estado]
                                : estados.filter(e => e !== estado)
                            }
                          });
                        }}
                      />
                      {estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' ')}
                    </label>
                  ))}
                </div>
              </div>

              {/* Rango de Horas */}
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>🕐 Hora Mínima</label>
                  <input
                    type="text"
                    value={formData.filtros?.horaMinima || ''}
                    onChange={(e) => {
                      let valor = e.target.value.replace(/[^0-9:]/g, '');
                      if (valor.length === 2 && !valor.includes(':')) valor = valor + ':';
                      if (valor.length <= 5) {
                        setFormData({
                          ...formData,
                          filtros: { ...formData.filtros, horaMinima: valor }
                        });
                      }
                    }}
                    placeholder="HH:MM (ej: 08:00)"
                    maxLength={5}
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
                <div className={styles.field}>
                  <label>🕐 Hora Máxima</label>
                  <input
                    type="text"
                    value={formData.filtros?.horaMaxima || ''}
                    onChange={(e) => {
                      let valor = e.target.value.replace(/[^0-9:]/g, '');
                      if (valor.length === 2 && !valor.includes(':')) valor = valor + ':';
                      if (valor.length <= 5) {
                        setFormData({
                          ...formData,
                          filtros: { ...formData.filtros, horaMaxima: valor }
                        });
                      }
                    }}
                    placeholder="HH:MM (ej: 18:00)"
                    maxLength={5}
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              {/* Opciones */}
              <div className={styles.fieldCheckbox}>
                <input
                  type="checkbox"
                  id="soloSinNotificar"
                  checked={formData.filtros?.soloSinNotificar || false}
                  onChange={(e) => setFormData({
                    ...formData,
                    filtros: { ...formData.filtros, soloSinNotificar: e.target.checked }
                  })}
                />
                <label htmlFor="soloSinNotificar">
                  📬 Solo enviar a turnos que no han recibido notificación previa
                </label>
              </div>

              {/* Límite */}
              <div className={styles.field}>
                <label>🔢 Límite de Envíos por Ejecución</label>
                <input
                  type="number"
                  min="1"
                  value={formData.filtros?.limite || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    filtros: { ...formData.filtros, limite: parseInt(e.target.value) || undefined }
                  })}
                  placeholder="Sin límite"
                />
                <small className={styles.hint}>
                  Deja vacío para sin límite. Útil para evitar envíos masivos accidentales.
                </small>
              </div>

              <h3 className={styles.subtituloSeccion}>⚙️ Configuración General</h3>

              {/* Ejecución */}
              <div className={styles.field}>
                <label>🔄 Tipo de Ejecución</label>
                <select
                  value={formData.ejecucion}
                  onChange={(e) => setFormData({ ...formData, ejecucion: e.target.value as any })}
                >
                  <option value="automatica">Automática (se envía según configuración)</option>
                  <option value="manual">Manual (solo con botón "Enviar Prueba")</option>
                </select>
              </div>

              {/* Activa */}
              <div className={styles.fieldCheckbox}>
                <input
                  type="checkbox"
                  id="activa"
                  checked={formData.activa}
                  onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                />
                <label htmlFor="activa">
                  ✅ Notificación activa
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer con Botones */}
        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            {paso > 1 && !notificacionInicial && (
              <button className={styles.btnSecundario} onClick={anteriorPaso}>
                ← Anterior
              </button>
            )}
          </div>
          <div className={styles.footerRight}>
            <button className={styles.btnCancelar} onClick={onClose}>
              Cancelar
            </button>
            {paso < 3 && !notificacionInicial ? (
              <button className={styles.btnPrimario} onClick={siguientePaso}>
                Siguiente →
              </button>
            ) : (
              <button className={styles.btnPrimario} onClick={handleSubmit}>
                {notificacionInicial ? '💾 Guardar Cambios' : '✅ Crear Notificación'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
