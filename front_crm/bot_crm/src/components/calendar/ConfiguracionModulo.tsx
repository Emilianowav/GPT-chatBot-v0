// ⚙️ Configuración del Módulo de Calendario/Reservas
'use client';

import { useState, useEffect } from 'react';
import { useConfiguracion, usePlantillas } from '@/hooks/useConfiguracion';
import * as configuracionApi from '@/lib/configuracionApi';
import ConfiguracionChatbot from './ConfiguracionChatbot';
import styles from './ConfiguracionModulo.module.css';

interface ConfiguracionModuloProps {
  empresaId: string;
  onGuardar?: () => void;
}

export default function ConfiguracionModulo({ empresaId, onGuardar }: ConfiguracionModuloProps) {
  const { configuracion, loading, error, guardarConfiguracion } = useConfiguracion(empresaId);
  const { plantillas, loading: loadingPlantillas } = usePlantillas();
  
  const [formData, setFormData] = useState<Partial<configuracionApi.ConfiguracionModulo>>({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);
  const [seccionActiva, setSeccionActiva] = useState<'general' | 'campos' | 'notificaciones' | 'chatbot'>('general');

  useEffect(() => {
    if (configuracion) {
      setFormData(configuracion);
    }
  }, [configuracion]);

  const handleChange = (campo: string, valor: any) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleNomenclaturaChange = (campo: keyof configuracionApi.Nomenclatura, valor: string) => {
    setFormData(prev => ({
      ...prev,
      nomenclatura: {
        ...prev.nomenclatura!,
        [campo]: valor
      }
    }));
  };

  const aplicarPlantilla = (tipoNegocio: string) => {
    if (!plantillas || !plantillas[tipoNegocio]) return;
    
    const plantilla = plantillas[tipoNegocio];
    setFormData({
      ...formData,
      ...plantilla,
      empresaId
    });
    
    setMensaje({
      tipo: 'success',
      texto: `Plantilla "${tipoNegocio}" aplicada correctamente`
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setGuardando(true);
      setMensaje(null);
      
      await guardarConfiguracion(formData);
      
      setMensaje({
        tipo: 'success',
        texto: 'Configuración guardada exitosamente'
      });
      
      if (onGuardar) onGuardar();
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.message || 'Error al guardar configuración'
      });
    } finally {
      setGuardando(false);
    }
  };

  const agregarCampoPersonalizado = () => {
    const nuevoCampo: configuracionApi.CampoPersonalizado = {
      clave: `campo_${Date.now()}`,
      etiqueta: 'Nuevo Campo',
      tipo: configuracionApi.TipoCampo.TEXTO,
      requerido: false,
      orden: (formData.camposPersonalizados?.length || 0) + 1,
      mostrarEnLista: true,
      mostrarEnCalendario: false,
      usarEnNotificacion: true
    };

    setFormData(prev => ({
      ...prev,
      camposPersonalizados: [...(prev.camposPersonalizados || []), nuevoCampo]
    }));
  };

  const eliminarCampoPersonalizado = (index: number) => {
    setFormData(prev => ({
      ...prev,
      camposPersonalizados: prev.camposPersonalizados?.filter((_, i) => i !== index)
    }));
  };

  const actualizarCampoPersonalizado = (index: number, campo: Partial<configuracionApi.CampoPersonalizado>) => {
    setFormData(prev => ({
      ...prev,
      camposPersonalizados: prev.camposPersonalizados?.map((c, i) => 
        i === index ? { ...c, ...campo } : c
      )
    }));
  };

  const agregarNotificacion = () => {
    const nuevaNotificacion: configuracionApi.NotificacionAutomatica = {
      activa: true,
      tipo: 'recordatorio',
      momento: 'horas_antes',
      horasAntes: 24,
      plantillaMensaje: 'Recordatorio: Tienes un {turno} programado para {fecha} a las {hora}',
      requiereConfirmacion: false
    };

    setFormData(prev => ({
      ...prev,
      notificaciones: [...(prev.notificaciones || []), nuevaNotificacion]
    }));
  };

  const eliminarNotificacion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notificaciones: prev.notificaciones?.filter((_, i) => i !== index)
    }));
  };

  const actualizarNotificacion = (index: number, notif: Partial<configuracionApi.NotificacionAutomatica>) => {
    setFormData(prev => ({
      ...prev,
      notificaciones: prev.notificaciones?.map((n, i) => 
        i === index ? { ...n, ...notif } : n
      )
    }));
  };

  if (loading || loadingPlantillas) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>

      {mensaje && (
        <div className={`${styles.mensaje} ${styles[mensaje.tipo]}`}>
          {mensaje.tipo === 'success' ? '✅' : '❌'} {mensaje.texto}
        </div>
      )}

      {/* Plantillas predefinidas */}
      {plantillas && (
        <div className={styles.plantillas}>
          <h3>🎨 Plantillas Predefinidas</h3>
          <div className={styles.plantillasGrid}>
            {Object.entries(plantillas).map(([key, plantilla]) => (
              <button
                key={key}
                type="button"
                onClick={() => aplicarPlantilla(key)}
                className={styles.plantillaCard}
              >
                <div className={styles.plantillaIcon}>
                  {key === 'viajes' && '🚗'}
                  {key === 'consultorio' && '🏥'}
                  {key === 'restaurante' && '🍽️'}
                </div>
                <div className={styles.plantillaNombre}>
                  {plantilla.nomenclatura.turnos}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs de secciones */}
      <div className={styles.tabs}>
        <button
          className={seccionActiva === 'general' ? styles.tabActive : styles.tab}
          onClick={() => setSeccionActiva('general')}
        >
          General
        </button>
        <button
          className={seccionActiva === 'campos' ? styles.tabActive : styles.tab}
          onClick={() => setSeccionActiva('campos')}
        >
          Campos Personalizados
        </button>
        <button
          className={seccionActiva === 'notificaciones' ? styles.tabActive : styles.tab}
          onClick={() => setSeccionActiva('notificaciones')}
        >
          Notificaciones
        </button>
        <button
          className={seccionActiva === 'chatbot' ? styles.tabActive : styles.tab}
          onClick={() => setSeccionActiva('chatbot')}
        >
          Chatbot
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* SECCIÓN GENERAL */}
        {seccionActiva === 'general' && (
          <div className={styles.seccion}>
            <h2>📋 Configuración General</h2>

            <div className={styles.field}>
              <label>Tipo de Negocio</label>
              <select
                value={formData.tipoNegocio || ''}
                onChange={(e) => handleChange('tipoNegocio', e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {Object.values(configuracionApi.TipoNegocio).map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <h3>🏷️ Nomenclatura</h3>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Singular (Ej: "Turno", "Viaje")</label>
                <input
                  type="text"
                  value={formData.nomenclatura?.turno || ''}
                  onChange={(e) => handleNomenclaturaChange('turno', e.target.value)}
                  placeholder="Turno"
                />
              </div>
              <div className={styles.field}>
                <label>Plural (Ej: "Turnos", "Viajes")</label>
                <input
                  type="text"
                  value={formData.nomenclatura?.turnos || ''}
                  onChange={(e) => handleNomenclaturaChange('turnos', e.target.value)}
                  placeholder="Turnos"
                />
              </div>
              <div className={styles.field}>
                <label>Agente Singular (Ej: "Médico", "Chofer")</label>
                <input
                  type="text"
                  value={formData.nomenclatura?.agente || ''}
                  onChange={(e) => handleNomenclaturaChange('agente', e.target.value)}
                  placeholder="Profesional"
                />
              </div>
              <div className={styles.field}>
                <label>Agente Plural</label>
                <input
                  type="text"
                  value={formData.nomenclatura?.agentes || ''}
                  onChange={(e) => handleNomenclaturaChange('agentes', e.target.value)}
                  placeholder="Profesionales"
                />
              </div>
              <div className={styles.field}>
                <label>Cliente Singular (Ej: "Paciente", "Pasajero")</label>
                <input
                  type="text"
                  value={formData.nomenclatura?.cliente || ''}
                  onChange={(e) => handleNomenclaturaChange('cliente', e.target.value)}
                  placeholder="Cliente"
                />
              </div>
              <div className={styles.field}>
                <label>Cliente Plural</label>
                <input
                  type="text"
                  value={formData.nomenclatura?.clientes || ''}
                  onChange={(e) => handleNomenclaturaChange('clientes', e.target.value)}
                  placeholder="Clientes"
                />
              </div>
            </div>

            <h3>⚙️ Configuración de Agentes y Recursos</h3>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.usaAgentes || false}
                  onChange={(e) => handleChange('usaAgentes', e.target.checked)}
                />
                <span>Usa agentes/profesionales</span>
              </label>
              {formData.usaAgentes && (
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData.agenteRequerido || false}
                    onChange={(e) => handleChange('agenteRequerido', e.target.checked)}
                  />
                  <span>Agente requerido</span>
                </label>
              )}
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.usaRecursos || false}
                  onChange={(e) => handleChange('usaRecursos', e.target.checked)}
                />
                <span>Usa recursos (vehículos, salas, mesas, etc.)</span>
              </label>
            </div>

            <h3>🕐 Configuración de Horarios</h3>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.usaHorariosDisponibilidad || false}
                  onChange={(e) => handleChange('usaHorariosDisponibilidad', e.target.checked)}
                />
                <span>Usar horarios de disponibilidad (si está desactivado, permite cualquier horario)</span>
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.permiteDuracionVariable || false}
                  onChange={(e) => handleChange('permiteDuracionVariable', e.target.checked)}
                />
                <span>Permitir duración variable</span>
              </label>
            </div>

            <div className={styles.field}>
              <label>Duración por defecto (minutos)</label>
              <input
                type="number"
                value={formData.duracionPorDefecto || 30}
                onChange={(e) => handleChange('duracionPorDefecto', parseInt(e.target.value))}
                min="5"
                step="5"
              />
            </div>
          </div>
        )}

        {/* SECCIÓN CAMPOS PERSONALIZADOS */}
        {seccionActiva === 'campos' && (
          <div className={styles.seccion}>
            <div className={styles.seccionHeader}>
              <h2>🎯 Campos Personalizados</h2>
              <button
                type="button"
                onClick={agregarCampoPersonalizado}
                className={styles.btnAgregar}
              >
                + Agregar Campo
              </button>
            </div>

            <p className={styles.descripcion}>
              Define los campos específicos que necesitas para tu tipo de negocio.
              Por ejemplo: origen/destino para viajes, tipo de consulta para médicos, etc.
            </p>

            {formData.camposPersonalizados && formData.camposPersonalizados.length > 0 ? (
              <div className={styles.camposList}>
                {formData.camposPersonalizados.map((campo, index) => (
                  <div key={index} className={styles.campoCard}>
                    <div className={styles.campoHeader}>
                      <input
                        type="text"
                        value={campo.etiqueta}
                        onChange={(e) => actualizarCampoPersonalizado(index, { etiqueta: e.target.value })}
                        className={styles.campoTitulo}
                        placeholder="Nombre del campo"
                      />
                      <button
                        type="button"
                        onClick={() => eliminarCampoPersonalizado(index)}
                        className={styles.btnEliminar}
                      >
                        ×
                      </button>
                    </div>

                    <div className={styles.grid3}>
                      <div className={styles.field}>
                        <label>Clave (sin espacios)</label>
                        <input
                          type="text"
                          value={campo.clave}
                          onChange={(e) => actualizarCampoPersonalizado(index, { clave: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                          placeholder="origen"
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Tipo de campo</label>
                        <select
                          value={campo.tipo}
                          onChange={(e) => actualizarCampoPersonalizado(index, { tipo: e.target.value as configuracionApi.TipoCampo })}
                        >
                          {Object.values(configuracionApi.TipoCampo).map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Placeholder</label>
                        <input
                          type="text"
                          value={campo.placeholder || ''}
                          onChange={(e) => actualizarCampoPersonalizado(index, { placeholder: e.target.value })}
                          placeholder="Ej: Ingrese el origen..."
                        />
                      </div>
                    </div>

                    {(campo.tipo === 'select' || campo.tipo === 'multiselect') && (
                      <div className={styles.field}>
                        <label>Opciones (separadas por coma)</label>
                        <input
                          type="text"
                          value={campo.opciones?.join(', ') || ''}
                          onChange={(e) => actualizarCampoPersonalizado(index, { 
                            opciones: e.target.value.split(',').map(o => o.trim()).filter(o => o)
                          })}
                          placeholder="Opción 1, Opción 2, Opción 3"
                        />
                      </div>
                    )}

                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={campo.requerido}
                          onChange={(e) => actualizarCampoPersonalizado(index, { requerido: e.target.checked })}
                        />
                        <span>Campo requerido</span>
                      </label>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={campo.mostrarEnLista}
                          onChange={(e) => actualizarCampoPersonalizado(index, { mostrarEnLista: e.target.checked })}
                        />
                        <span>Mostrar en lista</span>
                      </label>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={campo.mostrarEnCalendario}
                          onChange={(e) => actualizarCampoPersonalizado(index, { mostrarEnCalendario: e.target.checked })}
                        />
                        <span>Mostrar en calendario</span>
                      </label>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={campo.usarEnNotificacion}
                          onChange={(e) => actualizarCampoPersonalizado(index, { usarEnNotificacion: e.target.checked })}
                        />
                        <span>Usar en notificaciones</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <p>No hay campos personalizados. Haz clic en "Agregar Campo" para crear uno.</p>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN NOTIFICACIONES - ALERTAS Y RECORDATORIOS */}
        {seccionActiva === 'notificaciones' && (
          <div className={styles.seccion}>
            <div className={styles.seccionHeader}>
              <h2>🔔 Alertas y Recordatorios</h2>
              <button
                type="button"
                onClick={agregarNotificacion}
                className={styles.btnAgregar}
              >
                + Agregar Notificación
              </button>
            </div>

            <div className={styles.infoBox}>
              <h4>📱 ¿Qué son las notificaciones?</h4>
              <p>
                Las notificaciones son mensajes automáticos que se envían a los clientes para:
              </p>
              <ul>
                <li><strong>Recordatorios:</strong> Avisar sobre turnos próximos</li>
                <li><strong>Confirmaciones:</strong> Solicitar confirmación de asistencia</li>
                <li><strong>Alertas:</strong> Notificar cambios o cancelaciones</li>
              </ul>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                💡 <strong>Variables disponibles:</strong> {'{cliente}'}, {'{fecha}'}, {'{hora}'}, {'{duracion}'}, {'{agente}'}, {'{turno}'}
                {formData.camposPersonalizados && formData.camposPersonalizados.length > 0 && (
                  <span>, {formData.camposPersonalizados.map(c => `{${c.clave}}`).join(', ')}</span>
                )}
              </p>
            </div>

            {formData.notificaciones && formData.notificaciones.length > 0 ? (
              <div className={styles.notificacionesList}>
                {formData.notificaciones.map((notif, index) => (
                  <div key={index} className={styles.notifCard}>
                    <div className={styles.notifHeader}>
                      <h4>Notificación #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => eliminarNotificacion(index)}
                        className={styles.btnEliminar}
                      >
                        ×
                      </button>
                    </div>

                    <div className={styles.grid2}>
                      <div className={styles.field}>
                        <label>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                          Tipo de Notificación
                        </label>
                        <select
                          value={notif.tipo}
                          onChange={(e) => actualizarNotificacion(index, { tipo: e.target.value as 'recordatorio' | 'confirmacion' })}
                        >
                          <option value="recordatorio">📅 Recordatorio - Solo informar</option>
                          <option value="confirmacion">✅ Confirmación - Requiere respuesta</option>
                        </select>
                        <small>
                          {notif.tipo === 'recordatorio' ? 'El cliente solo recibe la información' : 'El cliente debe confirmar o cancelar'}
                        </small>
                      </div>

                      <div className={styles.field}>
                        <label>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          ¿Cuándo enviar?
                        </label>
                        <select
                          value={notif.momento}
                          onChange={(e) => actualizarNotificacion(index, { momento: e.target.value as any })}
                        >
                          <option value="noche_anterior">🌙 Noche anterior (22:00)</option>
                          <option value="mismo_dia">☀️ Mismo día (mañana)</option>
                          <option value="horas_antes">⏰ X horas antes</option>
                        </select>
                      </div>

                      {notif.momento === 'noche_anterior' && (
                        <div className={styles.field}>
                          <label>Hora de envío</label>
                          <input
                            type="time"
                            value={notif.horaEnvio || '22:00'}
                            onChange={(e) => actualizarNotificacion(index, { horaEnvio: e.target.value })}
                          />
                        </div>
                      )}

                      {notif.momento === 'horas_antes' && (
                        <div className={styles.field}>
                          <label>Horas antes</label>
                          <input
                            type="number"
                            value={notif.horasAntes || 24}
                            onChange={(e) => actualizarNotificacion(index, { horasAntes: parseInt(e.target.value) })}
                            min="1"
                          />
                        </div>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10 9 9 9 8 9"/>
                        </svg>
                        Mensaje de la Notificación
                      </label>
                      <textarea
                        value={notif.plantillaMensaje}
                        onChange={(e) => actualizarNotificacion(index, { plantillaMensaje: e.target.value })}
                        rows={5}
                        placeholder={notif.tipo === 'recordatorio' 
                          ? "Hola {cliente}, te recordamos tu {turno} para mañana {fecha} a las {hora}." 
                          : "Hola {cliente}, confirma tu {turno} para {fecha} a las {hora}. Responde SÍ para confirmar o NO para cancelar."}
                        style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                      />
                      <div className={styles.variablesHelp}>
                        <strong>Variables disponibles:</strong>
                        <div className={styles.variablesTags}>
                          <span className={styles.varTag}>{'{cliente}'}</span>
                          <span className={styles.varTag}>{'{fecha}'}</span>
                          <span className={styles.varTag}>{'{hora}'}</span>
                          <span className={styles.varTag}>{'{duracion}'}</span>
                          <span className={styles.varTag}>{'{agente}'}</span>
                          <span className={styles.varTag}>{'{turno}'}</span>
                          {formData.camposPersonalizados?.map(campo => (
                            <span key={campo.clave} className={styles.varTag}>{`{${campo.clave}}`}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={notif.requiereConfirmacion}
                        onChange={(e) => actualizarNotificacion(index, { requiereConfirmacion: e.target.checked })}
                      />
                      <span>Requiere confirmación del cliente</span>
                    </label>

                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={notif.activa}
                        onChange={(e) => actualizarNotificacion(index, { activa: e.target.checked })}
                      />
                      <span>Notificación activa</span>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <p>No hay notificaciones configuradas.</p>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN CHATBOT */}
        {seccionActiva === 'chatbot' && (
          <ConfiguracionChatbot empresaId={empresaId} />
        )}

        {/* Botones de acción */}
        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.btnGuardar}
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : '💾 Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
}
