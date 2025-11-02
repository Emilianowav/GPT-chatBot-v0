// ⚙️ Configuración del Módulo de Calendario/Reservas
'use client';

import { useState, useEffect } from 'react';
import { useConfiguracion, usePlantillas } from '@/hooks/useConfiguracion';
import * as configuracionApi from '@/lib/configuracionApi';
import ConfiguracionChatbot from './ConfiguracionChatbot';
import ModalNotificacion, { type NotificacionData } from './ModalNotificacion';
import ListaNotificaciones from './ListaNotificaciones';
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
  
  // Estados para notificaciones (NUEVO SISTEMA)
  const [modalNotificacion, setModalNotificacion] = useState(false);
  const [notificacionEditar, setNotificacionEditar] = useState<{ data: NotificacionData; index: number } | null>(null);
  const [agentes, setAgentes] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);

  useEffect(() => {
    if (configuracion) {
      setFormData(configuracion);
    }
  }, [configuracion]);

  // Cargar agentes y clientes para selectores
  useEffect(() => {
    if (empresaId && seccionActiva === 'notificaciones') {
      cargarAgentesYClientes();
    }
  }, [empresaId, seccionActiva]);

  const cargarAgentesYClientes = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('auth_token');
      
      // Cargar agentes
      const resAgentes = await fetch(`${API_BASE_URL}/api/modules/calendar/notificaciones/agentes/${empresaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (resAgentes.ok) {
        const dataAgentes = await resAgentes.json();
        setAgentes(dataAgentes.agentes || []);
      }

      // Cargar clientes
      const resClientes = await fetch(`${API_BASE_URL}/api/modules/calendar/notificaciones/clientes/${empresaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (resClientes.ok) {
        const dataClientes = await resClientes.json();
        setClientes(dataClientes.clientes || []);
      }
    } catch (error) {
      console.error('Error cargando agentes/clientes:', error);
    }
  };

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

  // ========== FUNCIONES PARA NOTIFICACIONES (NUEVO SISTEMA) ==========
  
  const handleAgregarNotificacion = () => {
    setNotificacionEditar(null);
    setModalNotificacion(true);
  };

  const handleEditarNotificacion = (notif: NotificacionData, index: number) => {
    setNotificacionEditar({ data: notif, index });
    setModalNotificacion(true);
  };

  const handleGuardarNotificacion = (notifData: NotificacionData) => {
    if (notificacionEditar !== null) {
      // Editar existente
      setFormData(prev => ({
        ...prev,
        notificaciones: prev.notificaciones?.map((n, i) => 
          i === notificacionEditar.index ? notifData as any : n
        )
      }));
    } else {
      // Agregar nueva
      setFormData(prev => ({
        ...prev,
        notificaciones: [...(prev.notificaciones || []), notifData as any]
      }));
    }
    
    setModalNotificacion(false);
    setNotificacionEditar(null);
  };

  const handleEliminarNotificacion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notificaciones: prev.notificaciones?.filter((_, i) => i !== index)
    }));
  };

  const handleToggleActivaNotificacion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notificaciones: prev.notificaciones?.map((n, i) => 
        i === index ? { ...n, activa: !n.activa } : n
      )
    }));
  };

  const handleEnviarPruebaNotificacion = async (index: number) => {
    const notif = formData.notificaciones?.[index];
    if (!notif) return;

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/api/modules/calendar/configuracion/notificaciones/enviar-prueba`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          empresaId,
          notificacion: notif
        })
      });

      if (response.ok) {
        alert('✅ Notificación de prueba enviada correctamente');
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.message || 'No se pudo enviar la notificación'}`);
      }
    } catch (error) {
      console.error('Error al enviar prueba:', error);
      alert('❌ Error al enviar la notificación de prueba');
    }
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
                
                {/* Botón al final de la lista */}
                <button
                  type="button"
                  onClick={agregarCampoPersonalizado}
                  className={styles.btnAgregarCampo}
                >
                  <span className={styles.iconoMas}>+</span>
                  <span>Agregar otro campo</span>
                </button>
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
                onClick={handleAgregarNotificacion}
                className={styles.btnAgregar}
              >
                + Nueva Notificación
              </button>
            </div>

            <div className={styles.infoBox}>
              <h4>📱 ¿Qué son las notificaciones automáticas?</h4>
              <p>
                Envía mensajes de WhatsApp automáticos a tus clientes y agentes según el momento que configures.
              </p>
              <ul>
                <li><strong>Confirmaciones:</strong> Solicita confirmación de asistencia</li>
                <li><strong>Recordatorios:</strong> Avisa sobre turnos próximos</li>
                <li><strong>Agendas:</strong> Envía lista de turnos del día a los agentes</li>
              </ul>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                💡 <strong>Variables disponibles:</strong> {'{cliente}'}, {'{agente}'}, {'{fecha}'}, {'{hora}'}, {'{origen}'}, {'{destino}'}, {'{pasajeros}'}, {'{telefono}'}
              </p>
            </div>

            <ListaNotificaciones
              notificaciones={(formData.notificaciones || []) as NotificacionData[]}
              onEditar={handleEditarNotificacion}
              onEliminar={handleEliminarNotificacion}
              onToggleActiva={handleToggleActivaNotificacion}
              onEnviarPrueba={handleEnviarPruebaNotificacion}
            />
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

      {/* Modal de Notificación (NUEVO SISTEMA) */}
      <ModalNotificacion
        isOpen={modalNotificacion}
        onClose={() => {
          setModalNotificacion(false);
          setNotificacionEditar(null);
        }}
        onSubmit={handleGuardarNotificacion}
        notificacionInicial={notificacionEditar?.data || null}
        agentes={agentes}
        clientes={clientes}
      />
    </div>
  );
}
