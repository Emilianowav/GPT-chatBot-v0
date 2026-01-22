'use client';

import { useState, useEffect } from 'react';
import { X, User, Calendar as CalendarIcon, Clock, FileText, AlertCircle, Check, Users } from 'lucide-react';
import { useAgentes } from '@/hooks/useAgentes';
import { useConfiguracion } from '@/hooks/useConfiguracion';
import SelectorCliente from '@/components/clientes/SelectorCliente';
import type { Cliente } from '@/lib/clientesApi';
import * as configuracionApi from '@/lib/configuracionApi';
import * as calendarApi from '@/lib/calendarApi';
import { formatearHora } from '@/lib/fechaUtils';
import styles from './ModalTurno.module.css';

interface TurnoData {
  agenteId?: string;
  clienteId: string;
  fecha: string;
  horaInicio?: string; // Solo para turnos programados
  duracion?: number; // Calculado automáticamente para turnos libres
  datos: Record<string, any>;
  notas?: string;
}

interface ModalTurnoProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function ModalTurno({ isOpen, onClose, onSubmit }: ModalTurnoProps) {
  const empresaId = typeof window !== 'undefined' ? localStorage.getItem('empresa_id') || '' : '';
  const { configuracion, loading: loadingConfig } = useConfiguracion(empresaId);
  const { agentes, loading: loadingAgentes } = useAgentes(true);

  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [agenteSeleccionado, setAgenteSeleccionado] = useState<calendarApi.Agente | null>(null);
  const [agentesAsignadosIds, setAgentesAsignadosIds] = useState<string[]>([]);
  const [slotsDisponibles, setSlotsDisponibles] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const [formData, setFormData] = useState<TurnoData>({
    clienteId: '',
    fecha: '',
    datos: {},
    notas: ''
  });

  // Reset al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setFormData({
        clienteId: '',
        fecha: '',
        datos: {},
        notas: ''
      });
      setClienteSeleccionado(null);
      setAgenteSeleccionado(null);
      setSlotsDisponibles([]);
      setPaso(1);
      setError(null);
    }
  }, [isOpen]);

  // Cerrar con ESC y bloquear scroll
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

  // Cargar slots cuando cambia agente o fecha
  useEffect(() => {
    if (formData.agenteId && formData.fecha && agenteSeleccionado) {
      cargarSlotsDisponibles();
    }
  }, [formData.agenteId, formData.fecha, agenteSeleccionado]);

  const cargarSlotsDisponibles = async () => {
    if (!formData.agenteId || !formData.fecha || !agenteSeleccionado) return;

    // Para turnos libres, no necesitamos slots específicos
    if (agenteSeleccionado.modoAtencion === 'turnos_libres') {
      // Verificar si el día está disponible
      const fecha = new Date(formData.fecha + 'T00:00:00');
      const diaSemana = fecha.getDay();
      const diaDisponible = agenteSeleccionado.disponibilidad.find(
        d => d.diaSemana === diaSemana && d.activo
      );
      
      if (diaDisponible) {
        // Calcular duración automática basada en la jornada
        const duracionCalculada = calcularDuracionTurnoLibre(
          diaDisponible.horaInicio,
          diaDisponible.horaFin,
          agenteSeleccionado.duracionTurnoPorDefecto,
          agenteSeleccionado.bufferEntreturnos
        );
        
        setFormData(prev => ({
          ...prev,
          duracion: duracionCalculada
        }));
      }
      return;
    }

    // Para turnos programados, cargar slots
    try {
      setLoadingSlots(true);
      const duracion = agenteSeleccionado.duracionTurnoPorDefecto || 30;
      const response = await calendarApi.obtenerSlotsDisponibles(
        formData.agenteId,
        formData.fecha,
        duracion
      );
      setSlotsDisponibles(response.slots || []);
    } catch (err) {
      console.error('Error al cargar slots:', err);
      setSlotsDisponibles([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Calcular duración automática para turnos libres
  const calcularDuracionTurnoLibre = (
    horaInicio: string,
    horaFin: string,
    duracionBase: number,
    buffer: number
  ): number => {
    const [hIni, mIni] = horaInicio.split(':').map(Number);
    const [hFin, mFin] = horaFin.split(':').map(Number);
    
    const minutosInicio = hIni * 60 + mIni;
    const minutosFin = hFin * 60 + mFin;
    const minutosJornada = minutosFin - minutosInicio;
    
    // Calcular cuántos turnos caben en la jornada
    const minutosporTurno = duracionBase + buffer;
    const cantidadTurnos = Math.floor(minutosJornada / minutosporTurno);
    
    // La duración del turno es el tiempo total dividido por la cantidad de turnos
    return Math.floor(minutosJornada / cantidadTurnos);
  };

  const handleAgenteChange = (agenteId: string) => {
    const agente = agentes.find(a => a._id === agenteId);
    setAgenteSeleccionado(agente || null);
    setFormData(prev => ({ ...prev, agenteId }));
    setSlotsDisponibles([]);
  };

  const handleDatosDinamicosChange = (clave: string, valor: any) => {
    setFormData(prev => ({
      ...prev,
      datos: {
        ...prev.datos,
        [clave]: valor
      }
    }));
  };

  const validarPaso1 = () => {
    if (!formData.clienteId) {
      setError('Debes seleccionar un cliente');
      return false;
    }
    if (configuracion?.agenteRequerido && !formData.agenteId) {
      setError('Debes seleccionar un agente');
      return false;
    }
    return true;
  };

  const validarPaso2 = () => {
    if (!formData.fecha) {
      setError('Debes seleccionar una fecha');
      return false;
    }

    // Validar que se seleccionó un horario (para ambos tipos)
    if (!formData.horaInicio) {
      setError('Debes seleccionar un horario');
      return false;
    }

    // Para turnos libres, validar que el día esté disponible y el horario esté dentro de la jornada
    if (agenteSeleccionado?.modoAtencion === 'turnos_libres') {
      const fecha = new Date(formData.fecha + 'T00:00:00');
      const diaSemana = fecha.getDay();
      const diaDisponible = agenteSeleccionado.disponibilidad.find(
        d => d.diaSemana === diaSemana && d.activo
      );
      
      if (!diaDisponible) {
        setError('El agente no está disponible este día');
        return false;
      }

      // Validar que el horario esté dentro de la jornada
      const [horaSelec, minSelec] = formData.horaInicio.split(':').map(Number);
      const [horaIni, minIni] = diaDisponible.horaInicio.split(':').map(Number);
      const [horaFin, minFin] = diaDisponible.horaFin.split(':').map(Number);
      
      const minutosSelec = horaSelec * 60 + minSelec;
      const minutosIni = horaIni * 60 + minIni;
      const minutosFin = horaFin * 60 + minFin;
      
      console.log('🔍 Validación de horario:', {
        horaSeleccionada: formData.horaInicio,
        minutosSelec,
        rangoInicio: diaDisponible.horaInicio,
        minutosIni,
        rangoFin: diaDisponible.horaFin,
        minutosFin,
        esValido: minutosSelec >= minutosIni && minutosSelec < minutosFin
      });
      
      if (minutosSelec < minutosIni || minutosSelec >= minutosFin) {
        setError(`El horario ${formData.horaInicio} está fuera del rango disponible: ${diaDisponible.horaInicio} - ${diaDisponible.horaFin}`);
        return false;
      }
    }

    return true;
  };

  const validarPaso3 = () => {
    // Validar campos personalizados requeridos
    const camposRequeridos = configuracion?.camposPersonalizados?.filter(c => c.requerido) || [];
    for (const campo of camposRequeridos) {
      if (!formData.datos[campo.clave]) {
        setError(`El campo "${campo.etiqueta}" es requerido`);
        return false;
      }
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

      // Combinar fecha y hora seleccionada (para ambos tipos)
      const fechaInicio = new Date(`${formData.fecha}T${formData.horaInicio}:00`);
      
      // Verificar que la fecha sea válida
      if (isNaN(fechaInicio.getTime())) {
        throw new Error('Fecha u hora inválida');
      }

      await onSubmit({
        agenteId: formData.agenteId,
        clienteId: formData.clienteId,
        fechaInicio: fechaInicio.toISOString(),
        duracion: formData.duracion || agenteSeleccionado?.duracionTurnoPorDefecto || 30,
        datos: formData.datos,
        notas: formData.notas
      });
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear el turno');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar campo dinámico
  const renderCampoDinamico = (campo: configuracionApi.CampoPersonalizado) => {
    const valor = formData.datos[campo.clave] || '';

    switch (campo.tipo) {
      case configuracionApi.TipoCampo.TEXTO:
        return (
          <input
            type="text"
            value={valor}
            onChange={(e) => handleDatosDinamicosChange(campo.clave, e.target.value)}
            placeholder={campo.placeholder}
            required={campo.requerido}
          />
        );

      case configuracionApi.TipoCampo.NUMERO:
        return (
          <input
            type="number"
            value={valor}
            onChange={(e) => handleDatosDinamicosChange(campo.clave, parseInt(e.target.value) || 0)}
            placeholder={campo.placeholder}
            required={campo.requerido}
          />
        );

      case configuracionApi.TipoCampo.SELECT:
        return (
          <select
            value={valor}
            onChange={(e) => handleDatosDinamicosChange(campo.clave, e.target.value)}
            required={campo.requerido}
          >
            <option value="">Seleccionar...</option>
            {campo.opciones?.map(opcion => (
              <option key={opcion} value={opcion}>{opcion}</option>
            ))}
          </select>
        );

      case configuracionApi.TipoCampo.TEXTAREA:
        return (
          <textarea
            value={valor}
            onChange={(e) => handleDatosDinamicosChange(campo.clave, e.target.value)}
            placeholder={campo.placeholder}
            required={campo.requerido}
            rows={3}
          />
        );

      default:
        return (
          <input
            type="text"
            value={valor}
            onChange={(e) => handleDatosDinamicosChange(campo.clave, e.target.value)}
            placeholder={campo.placeholder}
            required={campo.requerido}
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2>Nuevo Turno</h2>
            <p className={styles.subtitle}>
              {paso === 1 && 'Selecciona el cliente y agente'}
              {paso === 2 && 'Elige la fecha y horario'}
              {paso === 3 && 'Completa la información adicional'}
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
            <span>Cliente</span>
          </div>
          <div className={styles.progressLine} />
          <div className={`${styles.progressStep} ${paso >= 2 ? styles.active : ''}`}>
            <div className={styles.progressCircle}>
              {paso > 2 ? <Check size={16} /> : '2'}
            </div>
            <span>Fecha</span>
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
          {/* PASO 1: Cliente y Agente */}
          {paso === 1 && (
            <div className={styles.paso}>
              <div className={styles.field}>
                <label>
                  <User size={16} />
                  Cliente *
                </label>
                <SelectorCliente
                  onSelect={(cliente) => {
                    setClienteSeleccionado(cliente);
                    setFormData(prev => ({ ...prev, clienteId: cliente?._id || '' }));
                    
                    // Guardar IDs de agentes asignados para destacarlos
                    if (cliente?.agentesAsignados && cliente.agentesAsignados.length > 0) {
                      setAgentesAsignadosIds(cliente.agentesAsignados);
                      console.log('✅ Cliente tiene agentes asignados:', cliente.agentesAsignados);
                      
                      // Si solo tiene un agente asignado, seleccionarlo automáticamente
                      if (cliente.agentesAsignados.length === 1) {
                        const agenteId = cliente.agentesAsignados[0];
                        const agente = agentes.find(a => a._id === agenteId);
                        if (agente) {
                          setAgenteSeleccionado(agente);
                          setFormData(prev => ({ ...prev, agenteId }));
                          console.log('🎯 Agente seleccionado automáticamente:', agente.nombre);
                        }
                      }
                    } else {
                      setAgentesAsignadosIds([]);
                    }
                  }}
                  clienteSeleccionado={clienteSeleccionado}
                  placeholder="Buscar cliente por nombre, teléfono o email..."
                  required
                />
              </div>

              {configuracion?.usaAgentes && (
                <div className={styles.field}>
                  <label>
                    <Users size={16} />
                    {configuracion.nomenclatura?.agente || 'Agente'} {configuracion.agenteRequerido && '*'}
                  </label>
                  <select
                    value={formData.agenteId || ''}
                    onChange={(e) => handleAgenteChange(e.target.value)}
                    required={configuracion.agenteRequerido}
                    disabled={loadingAgentes}
                    className={agentesAsignadosIds.length > 0 ? styles.selectConAsignados : ''}
                  >
                    <option value="">Seleccionar {configuracion.nomenclatura?.agente?.toLowerCase() || 'agente'}...</option>
                    {agentes.map(agente => {
                      const esAsignado = agentesAsignadosIds.includes(agente._id);
                      return (
                        <option 
                          key={agente._id} 
                          value={agente._id}
                          style={esAsignado ? { 
                            fontWeight: 'bold',
                            backgroundColor: '#e8f5e9'
                          } : {}}
                        >
                          {esAsignado ? '⭐ ' : ''}{agente.nombre} {agente.apellido}
                          {agente.especialidad && ` - ${agente.especialidad}`}
                          {esAsignado ? ' (Asignado)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {agentesAsignadosIds.length > 0 && (
                    <small className={styles.hintSuccess}>
                      ⭐ Este cliente tiene {agentesAsignadosIds.length} {agentesAsignadosIds.length === 1 ? 'agente asignado' : 'agentes asignados'}
                    </small>
                  )}
                  {agenteSeleccionado && (
                    <small className={styles.hint}>
                      {agenteSeleccionado.modoAtencion === 'turnos_programados' && '⏰ Turnos con horarios específicos'}
                      {agenteSeleccionado.modoAtencion === 'turnos_libres' && '📋 Turnos libres (sin horario fijo)'}
                      {agenteSeleccionado.modoAtencion === 'mixto' && '🔄 Modo mixto'}
                    </small>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PASO 2: Fecha y Horario */}
          {paso === 2 && (
            <div className={styles.paso}>
              <div className={styles.field}>
                <label>
                  <CalendarIcon size={16} />
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  required
                />
                {agenteSeleccionado && agenteSeleccionado.disponibilidad.length > 0 && (
                  <small className={styles.hint}>
                    Días disponibles: {agenteSeleccionado.disponibilidad
                      .filter(d => d.activo)
                      .map(d => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.diaSemana])
                      .join(', ')}
                  </small>
                )}
              </div>

              {/* Horario para turnos programados */}
              {agenteSeleccionado?.modoAtencion === 'turnos_programados' && formData.fecha && (
                <div className={styles.field}>
                  <label>
                    <Clock size={16} />
                    Horario disponible *
                  </label>
                  {loadingSlots ? (
                    <div className={styles.loading}>Cargando horarios...</div>
                  ) : slotsDisponibles.length > 0 ? (
                    <select
                      value={formData.horaInicio || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, horaInicio: e.target.value }))}
                      required
                    >
                      <option value="">Seleccionar horario...</option>
                      {slotsDisponibles.map((slot, index) => {
                        const hora = formatearHora(slot.fecha);
                        return (
                          <option key={index} value={hora}>
                            {hora} ({slot.duracion} min)
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className={styles.noSlots}>
                      No hay horarios disponibles para esta fecha
                    </div>
                  )}
                </div>
              )}

              {/* Horario para turnos libres - Selección libre minuto a minuto */}
              {agenteSeleccionado?.modoAtencion === 'turnos_libres' && formData.fecha && (
                <>
                  <div className={styles.field}>
                    <label>
                      <Clock size={16} />
                      Horario del turno *
                    </label>
                    <input
                      type="text"
                      value={formData.horaInicio || ''}
                      onChange={(e) => {
                        let valor = e.target.value.replace(/[^0-9:]/g, '');
                        // Auto-formatear mientras escribe
                        if (valor.length === 2 && !valor.includes(':')) {
                          valor = valor + ':';
                        }
                        if (valor.length <= 5) {
                          console.log('⏰ Horario ingresado:', valor);
                          setFormData(prev => ({ ...prev, horaInicio: valor }));
                        }
                      }}
                      onBlur={(e) => {
                        // Validar formato al salir del campo
                        const valor = e.target.value;
                        const regex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
                        if (valor && !regex.test(valor)) {
                          setError('Formato de hora inválido. Use HH:MM (ejemplo: 09:30, 14:00)');
                        }
                      }}
                      placeholder="HH:MM (ej: 11:30)"
                      pattern="[0-2][0-9]:[0-5][0-9]"
                      maxLength={5}
                      required
                      style={{ fontFamily: 'monospace', fontSize: '1rem' }}
                    />
                    {(() => {
                      const fecha = new Date(formData.fecha + 'T00:00:00');
                      const diaSemana = fecha.getDay();
                      const diaDisponible = agenteSeleccionado.disponibilidad.find(
                        d => d.diaSemana === diaSemana && d.activo
                      );
                      return diaDisponible ? (
                        <small className={styles.hint}>
                          📅 Horario disponible: {diaDisponible.horaInicio} - {diaDisponible.horaFin}
                        </small>
                      ) : (
                        <small className={styles.hint}>
                          Ingresa el horario en formato 24h (HH:MM)
                        </small>
                      );
                    })()}
                  </div>
                  
                  {formData.duracion && (
                    <div className={styles.infoBox}>
                      <Clock size={20} />
                      <div>
                        <strong>Turno Libre</strong>
                        <p>Duración calculada automáticamente: <strong>{formData.duracion} minutos</strong></p>
                        <small>Basado en la jornada de trabajo y capacidad del agente</small>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* PASO 3: Información Adicional */}
          {paso === 3 && (
            <div className={styles.paso}>
              {configuracion?.camposPersonalizados && configuracion.camposPersonalizados.length > 0 && (
                <>
                  <h3 className={styles.sectionTitle}>
                    <FileText size={18} />
                    Información Específica
                  </h3>
                  {configuracion.camposPersonalizados
                    .sort((a, b) => a.orden - b.orden)
                    .map((campo) => (
                      <div key={campo.clave} className={styles.field}>
                        <label>
                          {campo.etiqueta} {campo.requerido && '*'}
                        </label>
                        {renderCampoDinamico(campo)}
                      </div>
                    ))}
                </>
              )}

              <div className={styles.field}>
                <label>Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                  rows={3}
                  placeholder="Información adicional..."
                />
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
              {loading ? 'Creando...' : 'Crear Turno'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
