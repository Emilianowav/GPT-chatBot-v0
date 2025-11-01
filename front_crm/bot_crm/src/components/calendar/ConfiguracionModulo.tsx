// ⚙️ Configuración del Módulo de Calendario/Reservas
'use client';

import { useState, useEffect } from 'react';
import { useConfiguracion, usePlantillas } from '@/hooks/useConfiguracion';
import * as configuracionApi from '@/lib/configuracionApi';
import ConfiguracionChatbot from './ConfiguracionChatbot';
import SelectorTurnos from './SelectorTurnos';
import SelectorTipoNotificacion from './SelectorTipoNotificacion';
import type { Turno } from '@/lib/calendarApi';
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
  
  // Estados para notificaciones
  const [agentes, setAgentes] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [enviandoPrueba, setEnviandoPrueba] = useState(false);
  const [mostrarSelectorTurnos, setMostrarSelectorTurnos] = useState(false);
  const [mostrarSelectorTipo, setMostrarSelectorTipo] = useState(false);
  const [notificacionActual, setNotificacionActual] = useState<configuracionApi.NotificacionAutomatica | null>(null);
  const [mostrarInfoBox, setMostrarInfoBox] = useState(true);
  const [notificacionesPlegadas, setNotificacionesPlegadas] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (configuracion) {
      setFormData(configuracion);
      // Inicializar todas las notificaciones como plegadas
      if (configuracion.notificaciones && configuracion.notificaciones.length > 0) {
        const indices = new Set(configuracion.notificaciones.map((_, i) => i));
        setNotificacionesPlegadas(indices);
      }
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

  const agregarNotificacion = () => {
    setMostrarSelectorTipo(true);
  };

  const crearNotificacionDesdePlantilla = (plantilla: any) => {
    setMostrarSelectorTipo(false);
    
    let nuevaNotificacion: configuracionApi.NotificacionAutomatica;
    
    if (plantilla === null) {
      // Notificación personalizada
      nuevaNotificacion = {
        activa: true,
        tipo: 'recordatorio',
        destinatario: 'cliente',
        momento: 'horas_antes',
        horasAntes: 24,
        plantillaMensaje: 'Recordatorio: Tienes un {turno} programado para {fecha} a las {hora}',
        requiereConfirmacion: false
      };
    } else {
      // Notificación desde plantilla
      nuevaNotificacion = {
        activa: true,
        tipo: plantilla.tipo === 'agenda_agente' ? 'recordatorio' : plantilla.tipo,
        destinatario: plantilla.destinatario,
        momento: plantilla.momento,
        horasAntes: plantilla.momento === 'horas_antes' ? 24 : undefined,
        horaEnvio: plantilla.momento === 'noche_anterior' ? '22:00' : 
                   plantilla.momento === 'hora_exacta' ? '09:00' : undefined,
        plantillaMensaje: plantilla.plantillaMensaje,
        requiereConfirmacion: plantilla.tipo === 'confirmacion_diaria',
        // Marcar si es plantilla de agenda de agente
        esAgendaAgente: plantilla.tipo === 'agenda_agente'
      };
    }

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

  const toggleNotificacionPlegada = (index: number) => {
    setNotificacionesPlegadas(prev => {
      const nuevas = new Set(prev);
      if (nuevas.has(index)) {
        nuevas.delete(index);
      } else {
        nuevas.add(index);
      }
      return nuevas;
    });
  };

  const actualizarNotificacion = (index: number, notif: Partial<configuracionApi.NotificacionAutomatica>) => {
    setFormData(prev => ({
      ...prev,
      notificaciones: prev.notificaciones?.map((n, i) => 
        i === index ? { ...n, ...notif } : n
      )
    }));
  };

  const abrirSelectorTurnos = (notif: configuracionApi.NotificacionAutomatica) => {
    setNotificacionActual(notif);
    setMostrarSelectorTurnos(true);
  };

  const enviarNotificacionConTurnos = async (turnos: Turno[]) => {
    if (!notificacionActual) return;
    
    try {
      setEnviandoPrueba(true);
      setMostrarSelectorTurnos(false);
      
      // Determinar teléfono de destino según tipo de destinatario
      let telefono = '';
      let destinatarioNombre = '';
      
      if (notificacionActual.destinatario === 'agentes_especificos') {
        // Buscar el primer agente seleccionado
        if (notificacionActual.agentesEspecificos && notificacionActual.agentesEspecificos.length > 0) {
          const agenteSeleccionado = agentes.find(a => a.id === notificacionActual.agentesEspecificos![0]);
          if (agenteSeleccionado) {
            telefono = agenteSeleccionado.telefono;
            destinatarioNombre = `${agenteSeleccionado.nombre} ${agenteSeleccionado.apellido}`;
          }
        }
      } else if (notificacionActual.destinatario === 'agente') {
        // Primer agente disponible
        if (agentes.length > 0) {
          telefono = agentes[0].telefono;
          destinatarioNombre = `${agentes[0].nombre} ${agentes[0].apellido}`;
        }
      } else if (notificacionActual.destinatario === 'clientes_especificos') {
        // Buscar el primer cliente seleccionado
        if (notificacionActual.clientesEspecificos && notificacionActual.clientesEspecificos.length > 0) {
          const clienteSeleccionado = clientes.find(c => c.id === notificacionActual.clientesEspecificos![0]);
          if (clienteSeleccionado) {
            telefono = clienteSeleccionado.telefono;
            destinatarioNombre = `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`;
          }
        }
      } else {
        // Primer cliente disponible
        if (clientes.length > 0) {
          telefono = clientes[0].telefono;
          destinatarioNombre = `${clientes[0].nombre} ${clientes[0].apellido}`;
        }
      }
      
      if (!telefono) {
        setMensaje({
          tipo: 'error',
          texto: 'No hay destinatarios seleccionados o disponibles para enviar prueba'
        });
        return;
      }

      // Generar mensaje con datos reales de los turnos seleccionados
      let mensajeFinal = `🚗 *Estos son los ${formData.nomenclatura?.turno || 'viajes'} de mañana*\n\n`;
      
      // Agregar cada turno seleccionado
      turnos.forEach((turno, index) => {
        const agente = turno.agenteId as any;
        const clienteInfo = (turno as any).clienteInfo;
        const fechaInicio = new Date(turno.fechaInicio);
        const hora = fechaInicio.toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        // Obtener campos personalizados del turno
        const camposPersonalizados = (turno as any).camposPersonalizados || {};
        
        let mensajeTurno = notificacionActual.plantillaMensaje;
        
        // Variables básicas
        const variables: Record<string, string> = {
          cliente: clienteInfo ? `${clienteInfo.nombre} ${clienteInfo.apellido}` : turno.clienteId,
          agente: agente ? `${agente.nombre} ${agente.apellido}` : '',
          fecha: fechaInicio.toLocaleDateString('es-AR'),
          hora: hora,
          duracion: `${turno.duracion} minutos`,
          turno: formData.nomenclatura?.turno || 'turno',
          telefono: clienteInfo?.telefono || '',
          documento: clienteInfo?.documento || '',
          ...camposPersonalizados // Agregar campos personalizados (origen, destino, pasajeros, etc.)
        };
        
        // Reemplazar variables
        Object.entries(variables).forEach(([clave, valor]) => {
          const regex = new RegExp(`\\{${clave}\\}`, 'g');
          mensajeTurno = mensajeTurno.replace(regex, valor || '');
        });
        
        mensajeFinal += mensajeTurno + '\n\n';
      });

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/modules/calendar/notificaciones/prueba`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          empresaId,
          destinatario: notificacionActual.destinatario,
          telefono,
          mensaje: mensajeFinal
        })
      });

      if (!response.ok) {
        throw new Error('Error al enviar notificación de prueba');
      }

      setMensaje({
        tipo: 'success',
        texto: `✅ Notificación de prueba enviada a ${destinatarioNombre} (${telefono})`
      });

    } catch (error: any) {
      setMensaje({
        tipo: 'error',
        texto: error.message || 'Error al enviar notificación de prueba'
      });
    } finally {
      setEnviandoPrueba(false);
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
                onClick={agregarNotificacion}
                className={styles.btnAgregar}
              >
                + Agregar Notificación
              </button>
            </div>

            {mostrarInfoBox && (
              <div className={styles.infoBox}>
                <button 
                  className={styles.btnCerrarInfo}
                  onClick={() => setMostrarInfoBox(false)}
                  title="Cerrar"
                >
                  ✕
                </button>
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
            )}

            {formData.notificaciones && formData.notificaciones.length > 0 ? (
              <div className={styles.notificacionesList}>
                {formData.notificaciones.map((notif, index) => (
                  <div key={index} className={`${styles.notifCard} ${!notif.activa ? styles.notifInactiva : ''}`}>
                    <div className={styles.notifHeader}>
                      <div className={styles.notifHeaderLeft}>
                        <button
                          type="button"
                          onClick={() => toggleNotificacionPlegada(index)}
                          className={styles.btnToggle}
                          title={notificacionesPlegadas.has(index) ? 'Desplegar' : 'Plegar'}
                        >
                          {notificacionesPlegadas.has(index) ? '▶' : '▼'}
                        </button>
                        
                        <div className={styles.notifHeaderInfo}>
                          <div className={styles.notifHeaderTitle}>
                            <h4>Notificación #{index + 1}</h4>
                            {notif.esAgendaAgente && (
                              <span className={styles.badgeAgenda}>
                                📅 Agenda
                              </span>
                            )}
                            {notif.enviarTodosTurnosDia && (
                              <span className={styles.badgeAuto}>
                                🔄 Auto
                              </span>
                            )}
                          </div>
                          
                          {/* Info visible cuando está plegado */}
                          {notificacionesPlegadas.has(index) && (
                            <div className={styles.notifHeaderPreview}>
                              <span className={styles.previewItem}>
                                {notif.destinatario === 'cliente' ? '📱 Clientes' : 
                                 notif.destinatario === 'agente' ? '👤 Agentes' :
                                 notif.destinatario === 'clientes_especificos' ? '📋 Clientes específicos' :
                                 '👥 Agentes específicos'}
                              </span>
                              <span className={styles.previewSeparator}>•</span>
                              <span className={styles.previewItem}>
                                {notif.tipo === 'recordatorio' ? '🔔 Recordatorio' : '✅ Confirmación'}
                              </span>
                              {notif.horaEnvio && (
                                <>
                                  <span className={styles.previewSeparator}>•</span>
                                  <span className={styles.previewItem}>
                                    ⏰ {notif.horaEnvio}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className={styles.notifHeaderActions}>
                        {/* Toggle Activo/Inactivo */}
                        <label className={styles.switchToggle} title={notif.activa ? 'Desactivar notificación' : 'Activar notificación'}>
                          <input
                            type="checkbox"
                            checked={notif.activa}
                            onChange={(e) => actualizarNotificacion(index, { activa: e.target.checked })}
                          />
                          <span className={styles.switchSlider}></span>
                        </label>
                        
                        <button
                          type="button"
                          onClick={() => eliminarNotificacion(index)}
                          className={styles.btnEliminar}
                          title="Eliminar notificación"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {!notificacionesPlegadas.has(index) && (
                    <>
                    <div className={styles.grid2}>
                      <div className={styles.field}>
                        <label>👥 Destinatario</label>
                        <select
                          value={notif.destinatario}
                          onChange={(e) => actualizarNotificacion(index, { destinatario: e.target.value as any })}
                        >
                          <option value="cliente">📱 Todos los clientes</option>
                          <option value="agente">👤 Todos los agentes</option>
                          <option value="clientes_especificos">📋 Clientes específicos</option>
                          <option value="agentes_especificos">👥 Agentes específicos</option>
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Tipo de Notificación</label>
                        <select
                          value={notif.tipo}
                          onChange={(e) => actualizarNotificacion(index, { tipo: e.target.value as 'recordatorio' | 'confirmacion' })}
                        >
                          <option value="recordatorio">📅 Recordatorio</option>
                          <option value="confirmacion">✅ Confirmación</option>
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>⏰ ¿Cuándo enviar?</label>
                        <select
                          value={notif.momento}
                          onChange={(e) => actualizarNotificacion(index, { momento: e.target.value as any })}
                        >
                          <option value="inmediata">⚡ Inmediatamente</option>
                          <option value="hora_exacta">🕐 Hora exacta del día</option>
                          <option value="horas_antes">⏰ X horas antes</option>
                          <option value="noche_anterior">🌙 Noche anterior</option>
                          <option value="mismo_dia">☀️ Mismo día (mañana)</option>
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

                      {notif.momento === 'hora_exacta' && (
                        <div className={styles.field}>
                          <label>Hora de envío</label>
                          <input
                            type="time"
                            value={notif.horaEnvio || '09:00'}
                            onChange={(e) => actualizarNotificacion(index, { horaEnvio: e.target.value })}
                          />
                          <small className={styles.fieldTip}>El mensaje se enviará a esta hora el día del turno</small>
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

                    {/* Selector de clientes específicos */}
                    {notif.destinatario === 'clientes_especificos' && (
                      <div className={styles.field}>
                        <label>Seleccionar Clientes</label>
                        <div className={styles.multiSelect}>
                          {clientes.length > 0 ? (
                            clientes.map(cliente => (
                              <label key={cliente.id} className={styles.checkboxItem}>
                                <input
                                  type="checkbox"
                                  checked={notif.clientesEspecificos?.includes(cliente.id) || false}
                                  onChange={(e) => {
                                    const selected = notif.clientesEspecificos || [];
                                    if (e.target.checked) {
                                      actualizarNotificacion(index, { 
                                        clientesEspecificos: [...selected, cliente.id] 
                                      });
                                    } else {
                                      actualizarNotificacion(index, { 
                                        clientesEspecificos: selected.filter(id => id !== cliente.id) 
                                      });
                                    }
                                  }}
                                />
                                <span>{cliente.nombre} {cliente.apellido} - {cliente.telefono}</span>
                              </label>
                            ))
                          ) : (
                            <small className={styles.fieldTip}>No hay clientes disponibles</small>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Selector de agentes específicos */}
                    {notif.destinatario === 'agentes_especificos' && (
                      <div className={styles.field}>
                        <label>Seleccionar Agentes</label>
                        <div className={styles.multiSelect}>
                          {agentes.length > 0 ? (
                            agentes.map(agente => (
                              <label key={agente.id} className={styles.checkboxItem}>
                                <input
                                  type="checkbox"
                                  checked={notif.agentesEspecificos?.includes(agente.id) || false}
                                  onChange={(e) => {
                                    const selected = notif.agentesEspecificos || [];
                                    if (e.target.checked) {
                                      actualizarNotificacion(index, { 
                                        agentesEspecificos: [...selected, agente.id] 
                                      });
                                    } else {
                                      actualizarNotificacion(index, { 
                                        agentesEspecificos: selected.filter(id => id !== agente.id) 
                                      });
                                    }
                                  }}
                                />
                                <span>{agente.nombre} {agente.apellido} - {agente.telefono}</span>
                              </label>
                            ))
                          ) : (
                            <small className={styles.fieldTip}>No hay agentes disponibles</small>
                          )}
                        </div>
                      </div>
                    )}

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
                          <span className={styles.varTag}>{'{telefono}'}</span>
                          <span className={styles.varTag}>{'{fecha}'}</span>
                          <span className={styles.varTag}>{'{hora}'}</span>
                          <span className={styles.varTag}>{'{duracion}'}</span>
                          <span className={styles.varTag}>{'{agente}'}</span>
                          <span className={styles.varTag}>{'{turno}'}</span>
                          {formData.camposPersonalizados?.map(campo => (
                            <span key={campo.clave} className={styles.varTag} title={campo.etiqueta}>
                              {`{${campo.clave}}`}
                            </span>
                          ))}
                        </div>
                        <small style={{ display: 'block', marginTop: '0.5rem', color: '#666' }}>
                          💡 Los campos personalizados (como origen, destino, pasajeros, etc.) se agregan automáticamente como variables
                        </small>
                      </div>
                    </div>

                    {/* Opciones para notificaciones de agente */}
                    {(notif.esAgendaAgente || notif.destinatario === 'agente' || notif.destinatario === 'agentes_especificos') && (
                      <div className={styles.field}>
                        <label className={styles.checkbox}>
                          <input
                            type="checkbox"
                            checked={notif.enviarTodosTurnosDia || false}
                            onChange={(e) => actualizarNotificacion(index, { 
                              enviarTodosTurnosDia: e.target.checked 
                            })}
                          />
                          <span>
                            📅 Enviar todos los turnos del día
                          </span>
                        </label>
                        <small className={styles.fieldTip}>
                          Cuando se active la notificación, se enviarán automáticamente todos los turnos del día al agente
                        </small>
                      </div>
                    )}

                    {/* Recurrencia */}
                    <div className={styles.recurrenciaSection}>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={notif.esRecurrente || false}
                          onChange={(e) => actualizarNotificacion(index, { 
                            esRecurrente: e.target.checked,
                            recurrencia: e.target.checked ? {
                              tipo: 'semanal',
                              intervalo: 1,
                              horaEnvio: '09:00',
                              diasSemana: [1] // Lunes por defecto
                            } : undefined
                          })}
                        />
                        <span>🔄 Notificación recurrente (se repite automáticamente)</span>
                      </label>

                      {notif.esRecurrente && (
                        <div className={styles.recurrenciaConfig}>
                          <div className={styles.grid3}>
                            <div className={styles.field}>
                              <label>Tipo de recurrencia</label>
                              <select
                                value={notif.recurrencia?.tipo || 'semanal'}
                                onChange={(e) => actualizarNotificacion(index, {
                                  recurrencia: {
                                    ...notif.recurrencia!,
                                    tipo: e.target.value as 'semanal' | 'mensual'
                                  }
                                })}
                              >
                                <option value="semanal">📆 Semanal</option>
                                <option value="mensual">🗓️ Mensual</option>
                              </select>
                            </div>

                            <div className={styles.field}>
                              <label>Cada cuántos {notif.recurrencia?.tipo === 'semanal' ? 'semanas' : 'meses'}</label>
                              <input
                                type="number"
                                min="1"
                                value={notif.recurrencia?.intervalo || 1}
                                onChange={(e) => actualizarNotificacion(index, {
                                  recurrencia: {
                                    ...notif.recurrencia!,
                                    intervalo: parseInt(e.target.value)
                                  }
                                })}
                              />
                            </div>

                            <div className={styles.field}>
                              <label>Hora de envío</label>
                              <input
                                type="time"
                                value={notif.recurrencia?.horaEnvio || '09:00'}
                                onChange={(e) => actualizarNotificacion(index, {
                                  recurrencia: {
                                    ...notif.recurrencia!,
                                    horaEnvio: e.target.value
                                  }
                                })}
                              />
                            </div>
                          </div>

                          {notif.recurrencia?.tipo === 'semanal' && (
                            <div className={styles.field}>
                              <label>Días de la semana</label>
                              <div className={styles.diasSemana}>
                                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia, i) => (
                                  <label key={i} className={styles.diaSemana}>
                                    <input
                                      type="checkbox"
                                      checked={notif.recurrencia?.diasSemana?.includes(i) || false}
                                      onChange={(e) => {
                                        const diasActuales = notif.recurrencia?.diasSemana || [];
                                        const nuevosDias = e.target.checked
                                          ? [...diasActuales, i]
                                          : diasActuales.filter(d => d !== i);
                                        actualizarNotificacion(index, {
                                          recurrencia: {
                                            ...notif.recurrencia!,
                                            diasSemana: nuevosDias
                                          }
                                        });
                                      }}
                                    />
                                    <span>{dia}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {notif.recurrencia?.tipo === 'mensual' && (
                            <div className={styles.field}>
                              <label>Día del mes</label>
                              <select
                                value={notif.recurrencia?.diaMes || 1}
                                onChange={(e) => actualizarNotificacion(index, {
                                  recurrencia: {
                                    ...notif.recurrencia!,
                                    diaMes: parseInt(e.target.value)
                                  }
                                })}
                              >
                                {[...Array(31)].map((_, i) => (
                                  <option key={i + 1} value={i + 1}>
                                    Día {i + 1}
                                  </option>
                                ))}
                                <option value={-1}>Último día del mes</option>
                              </select>
                              <small className={styles.fieldTip}>
                                {notif.recurrencia?.diaMes === -1 
                                  ? 'Se enviará el último día de cada mes (28, 29, 30 o 31 según el mes)'
                                  : `Se enviará el día ${notif.recurrencia?.diaMes || 1} de cada mes`
                                }
                              </small>
                            </div>
                          )}

                          <div className={styles.grid2}>
                            <div className={styles.field}>
                              <label>Fecha de inicio (opcional)</label>
                              <input
                                type="date"
                                value={notif.recurrencia?.fechaInicio ? new Date(notif.recurrencia.fechaInicio).toISOString().split('T')[0] : ''}
                                onChange={(e) => actualizarNotificacion(index, {
                                  recurrencia: {
                                    ...notif.recurrencia!,
                                    fechaInicio: e.target.value ? new Date(e.target.value) : undefined
                                  }
                                })}
                              />
                              <small className={styles.fieldTip}>Dejar vacío para iniciar inmediatamente</small>
                            </div>

                            <div className={styles.field}>
                              <label>Fecha de fin (opcional)</label>
                              <input
                                type="date"
                                value={notif.recurrencia?.fechaFin ? new Date(notif.recurrencia.fechaFin).toISOString().split('T')[0] : ''}
                                onChange={(e) => actualizarNotificacion(index, {
                                  recurrencia: {
                                    ...notif.recurrencia!,
                                    fechaFin: e.target.value ? new Date(e.target.value) : undefined
                                  }
                                })}
                              />
                              <small className={styles.fieldTip}>Dejar vacío para que no expire</small>
                            </div>
                          </div>

                          <div className={styles.recurrenciaResumen}>
                            <strong>📋 Resumen:</strong> Esta notificación se enviará{' '}
                            {notif.recurrencia?.tipo === 'semanal' && (
                              <>
                                cada {notif.recurrencia.intervalo} semana(s)
                                {notif.recurrencia.diasSemana && notif.recurrencia.diasSemana.length > 0 && (
                                  <> los {notif.recurrencia.diasSemana.map(d => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d]).join(', ')}</>
                                )}
                              </>
                            )}
                            {notif.recurrencia?.tipo === 'mensual' && (
                              <>
                                cada {notif.recurrencia.intervalo} mes(es) el{' '}
                                {notif.recurrencia.diaMes === -1 ? 'último día del mes' : `día ${notif.recurrencia.diaMes}`}
                              </>
                            )}
                            {' '}a las {notif.recurrencia?.horaEnvio}
                            {notif.recurrencia?.fechaInicio && ` desde el ${new Date(notif.recurrencia.fechaInicio).toLocaleDateString('es-AR')}`}
                            {notif.recurrencia?.fechaFin && ` hasta el ${new Date(notif.recurrencia.fechaFin).toLocaleDateString('es-AR')}`}
                          </div>
                        </div>
                      )}
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
                    </>
                    )}
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

      {/* Selector de Tipo de Notificación */}
      {mostrarSelectorTipo && (
        <SelectorTipoNotificacion
          onSeleccionar={crearNotificacionDesdePlantilla}
          onCerrar={() => setMostrarSelectorTipo(false)}
        />
      )}

      {/* Selector de Turnos */}
      {mostrarSelectorTurnos && notificacionActual && (
        <SelectorTurnos
          empresaId={empresaId}
          agenteId={
            notificacionActual.destinatario === 'agentes_especificos' && notificacionActual.agentesEspecificos?.[0]
              ? notificacionActual.agentesEspecificos[0]
              : undefined
          }
          fecha={new Date(new Date().setDate(new Date().getDate() + 1))} // Mañana por defecto
          onSeleccionar={enviarNotificacionConTurnos}
          onCerrar={() => {
            setMostrarSelectorTurnos(false);
            setNotificacionActual(null);
          }}
        />
      )}
    </div>
  );
}
