// 🤖 Administrador de Flujos - Gestión completa de flujos del chatbot
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useConfiguracionBot } from '@/hooks/useConfiguracionBot';
import ConfiguracionBot from '@/components/calendar/ConfiguracionBot';
import { Power, Settings, Send, Eye, EyeOff, Plus, Edit2, Trash2 } from 'lucide-react';
import styles from './flujos.module.css';

export default function AdministradorFlujosPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const empresaId = typeof window !== 'undefined' ? localStorage.getItem('empresa_id') || '' : '';
  
  const { configuracion, loading, toggleBot } = useConfiguracionBot(empresaId);
  
  const [vistaActiva, setVistaActiva] = useState<'lista' | 'configuracion'>('lista');
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [enviandoPrueba, setEnviandoPrueba] = useState<string | null>(null);
  const [modalPrueba, setModalPrueba] = useState<{ flujo: string; telefono: string } | null>(null);
  const [modalConfigOpcion, setModalConfigOpcion] = useState<any>(null);
  const [modalConfigFlujo, setModalConfigFlujo] = useState<any>(null);

  // Redirección
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando administrador de flujos...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Flujo principal del menú - Cargar dinámicamente desde configuración
  const menuPrincipal = {
    id: 'menu_principal',
    nombre: 'Menú Principal',
    descripcion: 'Primer mensaje que reciben los clientes al escribir al chatbot',
    tipo: 'menu',
    activo: configuracion?.activo || false,
    icono: '📋',
    mensajeBienvenida: configuracion?.mensajeBienvenida || '',
    opciones: [
      {
        id: 'crearTurno',
        numero: '1️⃣',
        nombre: configuracion?.flujos?.crearTurno?.nombre || 'Reservar Turno',
        descripcion: configuracion?.flujos?.crearTurno?.descripcion || 'Permite agendar nuevos turnos',
        activo: configuracion?.flujos?.crearTurno?.pasos?.some(p => p.activo) ?? true,
        icono: '📅',
        flujo: configuracion?.flujos?.crearTurno
      },
      {
        id: 'consultarTurnos',
        numero: '2️⃣',
        nombre: configuracion?.flujos?.consultarTurnos?.nombre || 'Consultar Turnos',
        descripcion: configuracion?.flujos?.consultarTurnos?.descripcion || 'Ver turnos agendados',
        activo: configuracion?.flujos?.consultarTurnos?.pasos?.some(p => p.activo) ?? true,
        icono: '🔍',
        flujo: configuracion?.flujos?.consultarTurnos
      },
      {
        id: 'cancelarTurno',
        numero: '3️⃣',
        nombre: configuracion?.flujos?.cancelarTurno?.nombre || 'Cancelar Turno',
        descripcion: configuracion?.flujos?.cancelarTurno?.descripcion || 'Cancelar turnos existentes',
        activo: configuracion?.flujos?.cancelarTurno?.pasos?.some(p => p.activo) ?? true,
        icono: '❌',
        flujo: configuracion?.flujos?.cancelarTurno
      }
    ]
  };

  // Flujos automáticos - Cargar desde configuración
  const flujosAutomaticos = [
    {
      id: 'confirmacion_turnos',
      nombre: 'Confirmación de Turnos',
      descripcion: 'Envía recordatorios automáticos antes del turno',
      tipo: 'automatico',
      activo: configuracion?.horariosAtencion?.activo ?? false,
      icono: '⏰',
      trigger: '24h antes',
      config: {
        anticipacion: 24,
        mensaje: '¡Hola! 👋 Te recordamos que tenés un turno agendado para mañana.\n\n📅 Fecha: {fecha}\n🕐 Hora: {hora}\n📍 Destino: {destino}\n\n¿Confirmás tu asistencia? Respondé SÍ o NO',
        solicitarConfirmacion: true
      }
    },
    {
      id: 'notificacion_viajes',
      nombre: 'Notificaciones de Viajes',
      descripcion: 'Notifica cambios de estado en los viajes',
      tipo: 'automatico',
      activo: configuracion?.notificarAdmin ?? false,
      icono: '🚗',
      trigger: 'Cambio de estado',
      config: {
        estados: ['confirmado', 'en_camino', 'completado'],
        mensaje: '📢 Tu viaje ha cambiado de estado\n\n🚗 Estado: {estado}\n📍 Destino: {destino}\n🕐 Hora: {hora}'
      }
    }
  ];

  const handleToggleBotGeneral = async () => {
    try {
      await toggleBot(!configuracion?.activo);
      setMensaje({
        tipo: 'success',
        texto: configuracion?.activo ? '🔴 Chatbot desactivado' : '🟢 Chatbot activado'
      });
      setTimeout(() => setMensaje(null), 3000);
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.message
      });
    }
  };

  const handleEnviarPrueba = async (flujoId: string, telefono: string) => {
    setEnviandoPrueba(flujoId);
    
    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${apiUrl}/api/bot/test-flujo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          empresaId,
          flujoId,
          telefono
        })
      });

      if (!response.ok) {
        throw new Error('Error al enviar mensaje de prueba');
      }

      setMensaje({
        tipo: 'success',
        texto: `✅ Mensaje de prueba enviado a ${telefono}`
      });
      setModalPrueba(null);
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.message || 'Error al enviar prueba'
      });
    } finally {
      setEnviandoPrueba(null);
      setTimeout(() => setMensaje(null), 5000);
    }
  };

  return (
    <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>🤖 Administrador de Flujos</h1>
            <p>Gestiona, configura y prueba los flujos del chatbot</p>
          </div>
          
          <div className={styles.headerActions}>
            {/* Toggle general del bot */}
            <div className={styles.botStatus}>
              <span className={styles.statusLabel}>
                Estado del Bot: 
                <strong className={configuracion?.activo ? styles.statusActive : styles.statusInactive}>
                  {configuracion?.activo ? ' 🟢 Activo' : ' 🔴 Inactivo'}
                </strong>
              </span>
              <button
                onClick={handleToggleBotGeneral}
                className={`${styles.btnToggle} ${configuracion?.activo ? styles.active : ''}`}
              >
                <Power size={18} />
                {configuracion?.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        </div>

        {mensaje && (
          <div className={`${styles.mensaje} ${styles[mensaje.tipo]}`}>
            {mensaje.texto}
          </div>
        )}

        {/* Tabs de navegación */}
        <div className={styles.tabs}>
          <button
            className={vistaActiva === 'lista' ? styles.tabActive : styles.tab}
            onClick={() => setVistaActiva('lista')}
          >
            <Eye size={18} />
            Ver Flujos
          </button>
          <button
            className={vistaActiva === 'configuracion' ? styles.tabActive : styles.tab}
            onClick={() => setVistaActiva('configuracion')}
          >
            <Settings size={18} />
            Configuración General
          </button>
        </div>

        {/* Vista: Lista de Flujos */}
        {vistaActiva === 'lista' && (
          <div className={styles.content}>
            
            {/* MENÚ PRINCIPAL */}
            <div className={styles.menuSection}>
              <div className={styles.menuCard}>
                <div className={styles.menuHeader}>
                  <div className={styles.menuIcono}>{menuPrincipal.icono}</div>
                  <div className={styles.menuInfo}>
                    <h2>{menuPrincipal.nombre}</h2>
                    <p>{menuPrincipal.descripcion}</p>
                  </div>
                  <div className={styles.menuToggle}>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={menuPrincipal.activo}
                        onChange={handleToggleBotGeneral}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>

                <div className={styles.menuOpciones}>
                  <h3>Opciones del Menú</h3>
                  <div className={styles.opcionesGrid}>
                    {menuPrincipal.opciones.map((opcion) => (
                      <div key={opcion.id} className={styles.opcionCard}>
                        <div className={styles.opcionNumero}>{opcion.numero}</div>
                        <div className={styles.opcionIcono}>{opcion.icono}</div>
                        <div className={styles.opcionInfo}>
                          <h4>{opcion.nombre}</h4>
                          <p>{opcion.descripcion}</p>
                        </div>
                        <div className={styles.opcionAcciones}>
                          <button
                            onClick={() => setModalConfigOpcion(opcion)}
                            className={styles.btnConfigOpcion}
                            title="Configurar opción"
                          >
                            <Settings size={16} />
                          </button>
                          <label className={styles.switchSmall}>
                            <input
                              type="checkbox"
                              checked={opcion.activo}
                              onChange={() => {/* TODO: toggle opción */}}
                            />
                            <span className={styles.sliderSmall}></span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.menuAcciones}>
                  <button
                    onClick={() => setVistaActiva('configuracion')}
                    className={styles.btnEditar}
                  >
                    <Settings size={18} />
                    Configurar Mensajes
                  </button>
                  <button
                    onClick={() => setModalPrueba({ flujo: 'menu_principal', telefono: '' })}
                    className={styles.btnPrueba}
                    disabled={!menuPrincipal.activo}
                  >
                    <Send size={18} />
                    Probar Menú
                  </button>
                </div>
              </div>
            </div>

            {/* FLUJOS AUTOMÁTICOS */}
            <div className={styles.flujosSection}>
              <h2 className={styles.sectionTitle}>⚡ Flujos Automáticos</h2>
              <div className={styles.flujosGrid}>
                {flujosAutomaticos.map((flujo) => (
                  <div key={flujo.id} className={`${styles.flujoCard} ${!flujo.activo ? styles.flujoInactivo : ''}`}>
                    <div className={styles.flujoHeader}>
                      <div className={styles.flujoIcono}>{flujo.icono}</div>
                      <div className={styles.flujoInfo}>
                        <h3>{flujo.nombre}</h3>
                        <p>{flujo.descripcion}</p>
                      </div>
                      <div className={styles.flujoToggle}>
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            checked={flujo.activo}
                            onChange={() => {/* TODO: toggle flujo */}}
                          />
                          <span className={styles.slider}></span>
                        </label>
                      </div>
                    </div>

                    <div className={styles.flujoTrigger}>
                      <span className={styles.triggerLabel}>Se activa:</span>
                      <span className={styles.triggerValue}>{flujo.trigger}</span>
                    </div>

                    <div className={styles.flujoAcciones}>
                      <button
                        onClick={() => setModalConfigFlujo(flujo)}
                        className={styles.btnEditar}
                      >
                        <Settings size={16} />
                        Configurar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Información adicional */}
            <div className={styles.infoBox}>
              <h3>💡 Guía Rápida</h3>
              <ul>
                <li><strong>Menú Principal:</strong> Es el primer mensaje que reciben tus clientes. Actívalo/desactívalo con el switch principal.</li>
                <li><strong>Opciones del Menú:</strong> Cada opción puede activarse/desactivarse individualmente. Los clientes solo verán las opciones activas.</li>
                <li><strong>Flujos Automáticos:</strong> Se ejecutan automáticamente según eventos (ej: 24h antes del turno).</li>
                <li><strong>Probar Menú:</strong> Envía el mensaje del menú a tu WhatsApp para verificar cómo se ve.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Vista: Configuración General */}
        {vistaActiva === 'configuracion' && (
          <div className={styles.content}>
            <ConfiguracionBot empresaId={empresaId} />
          </div>
        )}

        {/* Modal de Prueba */}
        {modalPrueba && (
          <div className={styles.modal} onClick={() => setModalPrueba(null)}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <h3>📱 Enviar Mensaje de Prueba</h3>
              <p>Ingresa el número de teléfono para probar el <strong>Menú Principal</strong></p>
              
              <div className={styles.field}>
                <label>Número de WhatsApp (con código de país)</label>
                <input
                  type="tel"
                  value={modalPrueba.telefono}
                  onChange={(e) => setModalPrueba({ ...modalPrueba, telefono: e.target.value })}
                  placeholder="+54 9 11 1234-5678"
                  autoFocus
                />
                <small>Ejemplo: +5491112345678</small>
              </div>

              <div className={styles.modalActions}>
                <button
                  onClick={() => setModalPrueba(null)}
                  className={styles.btnCancelar}
                  disabled={enviandoPrueba !== null}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleEnviarPrueba(modalPrueba.flujo, modalPrueba.telefono)}
                  className={styles.btnEnviar}
                  disabled={!modalPrueba.telefono || enviandoPrueba !== null}
                >
                  {enviandoPrueba ? 'Enviando...' : '📤 Enviar Prueba'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Configurar Opción del Menú */}
        {modalConfigOpcion && (
          <div className={styles.modal} onClick={() => setModalConfigOpcion(null)}>
            <div className={styles.modalContentLarge} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div className={styles.modalIcono}>{modalConfigOpcion.icono}</div>
                <div>
                  <h3>{modalConfigOpcion.nombre}</h3>
                  <p>{modalConfigOpcion.descripcion}</p>
                </div>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.field}>
                  <label>Estado de la Opción</label>
                  <div className={styles.toggleField}>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={modalConfigOpcion.activo}
                        onChange={() => {/* TODO: toggle */}}
                      />
                      <span className={styles.slider}></span>
                    </label>
                    <span>{modalConfigOpcion.activo ? '🟢 Activa' : '🔴 Inactiva'}</span>
                  </div>
                  <small>Cuando está inactiva, esta opción no aparecerá en el menú del chatbot</small>
                </div>

                {modalConfigOpcion.flujo && (
                  <>
                    <div className={styles.field}>
                      <label>Información del Flujo</label>
                      <div className={styles.infoCard}>
                        <p><strong>Nombre:</strong> {modalConfigOpcion.flujo.nombre}</p>
                        <p><strong>Descripción:</strong> {modalConfigOpcion.flujo.descripcion}</p>
                        <p><strong>Pasos configurados:</strong> {modalConfigOpcion.flujo.pasos?.length || 0}</p>
                        <p><strong>Pasos activos:</strong> {modalConfigOpcion.flujo.pasos?.filter((p: any) => p.activo).length || 0}</p>
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label>Pasos del Flujo</label>
                      <div className={styles.pasosList}>
                        {modalConfigOpcion.flujo.pasos?.map((paso: any, index: number) => (
                          <div key={paso.id} className={`${styles.pasoItem} ${!paso.activo ? styles.pasoInactivo : ''}`}>
                            <div className={styles.pasoNumero}>{index + 1}</div>
                            <div className={styles.pasoInfo}>
                              <strong>{paso.etiqueta}</strong>
                              <p>{paso.mensaje}</p>
                              {paso.campoACapturar && (
                                <span className={styles.pasoCampo}>Campo: {paso.campoACapturar}</span>
                              )}
                            </div>
                            <div className={styles.pasoEstado}>
                              {paso.activo ? '✅' : '⏸️'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className={styles.infoAlert}>
                  <strong>💡 Tip:</strong> Puedes personalizar cada paso del flujo en la sección "Configuración General"
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  onClick={() => setModalConfigOpcion(null)}
                  className={styles.btnCancelar}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    // TODO: Guardar configuración
                    setModalConfigOpcion(null);
                    setMensaje({ tipo: 'success', texto: '✅ Configuración guardada' });
                    setTimeout(() => setMensaje(null), 3000);
                  }}
                  className={styles.btnEnviar}
                >
                  💾 Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Configurar Flujo Automático */}
        {modalConfigFlujo && (
          <div className={styles.modal} onClick={() => setModalConfigFlujo(null)}>
            <div className={styles.modalContentLarge} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div className={styles.modalIcono}>{modalConfigFlujo.icono}</div>
                <div>
                  <h3>{modalConfigFlujo.nombre}</h3>
                  <p>{modalConfigFlujo.descripcion}</p>
                </div>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.field}>
                  <label>Estado del Flujo</label>
                  <div className={styles.toggleField}>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={modalConfigFlujo.activo}
                        onChange={() => {/* TODO: toggle */}}
                      />
                      <span className={styles.slider}></span>
                    </label>
                    <span>{modalConfigFlujo.activo ? '🟢 Activo' : '🔴 Inactivo'}</span>
                  </div>
                  <small>Cuando está inactivo, este flujo no se ejecutará automáticamente</small>
                </div>

                {modalConfigFlujo.id === 'confirmacion_turnos' && (
                  <>
                    <div className={styles.field}>
                      <label>Tiempo de Anticipación</label>
                      <select className={styles.select}>
                        <option value="1">1 hora antes</option>
                        <option value="3">3 horas antes</option>
                        <option value="6">6 horas antes</option>
                        <option value="12">12 horas antes</option>
                        <option value="24" selected>24 horas antes</option>
                        <option value="48">48 horas antes</option>
                      </select>
                      <small>Cuánto tiempo antes del turno se enviará el recordatorio</small>
                    </div>

                    <div className={styles.field}>
                      <label>Mensaje de Recordatorio</label>
                      <textarea
                        className={styles.textarea}
                        rows={5}
                        defaultValue="¡Hola! 👋 Te recordamos que tenés un turno agendado para mañana.\n\n📅 Fecha: {fecha}\n🕐 Hora: {hora}\n📍 Destino: {destino}\n\n¿Confirmás tu asistencia? Respondé SÍ o NO"
                      />
                      <small>Variables disponibles: {'{fecha}'}, {'{hora}'}, {'{origen}'}, {'{destino}'}</small>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" defaultChecked />
                        <span>Solicitar confirmación del cliente</span>
                      </label>
                      <small>Si está activo, el bot esperará una respuesta del cliente</small>
                    </div>
                  </>
                )}

                {modalConfigFlujo.id === 'notificacion_viajes' && (
                  <>
                    <div className={styles.field}>
                      <label>Estados que Activan la Notificación</label>
                      <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" defaultChecked />
                          <span>Confirmado</span>
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" defaultChecked />
                          <span>En camino</span>
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" defaultChecked />
                          <span>Completado</span>
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" />
                          <span>Cancelado</span>
                        </label>
                      </div>
                      <small>Selecciona en qué cambios de estado se enviará notificación</small>
                    </div>

                    <div className={styles.field}>
                      <label>Plantilla de Mensaje</label>
                      <textarea
                        className={styles.textarea}
                        rows={4}
                        defaultValue="📢 Tu viaje ha cambiado de estado\n\n🚗 Estado: {estado}\n📍 Destino: {destino}\n🕐 Hora: {hora}"
                      />
                      <small>Variables: {'{estado}'}, {'{fecha}'}, {'{hora}'}, {'{origen}'}, {'{destino}'}</small>
                    </div>
                  </>
                )}

                <div className={styles.infoAlert}>
                  <strong>⚡ Flujo Automático:</strong> Este flujo se ejecuta automáticamente según los eventos configurados. No requiere interacción del usuario.
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  onClick={() => setModalConfigFlujo(null)}
                  className={styles.btnCancelar}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    // TODO: Guardar configuración
                    setModalConfigFlujo(null);
                    setMensaje({ tipo: 'success', texto: '✅ Configuración guardada' });
                    setTimeout(() => setMensaje(null), 3000);
                  }}
                  className={styles.btnEnviar}
                >
                  💾 Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
