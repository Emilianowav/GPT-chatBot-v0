// 📋 Formulario para crear turnos
'use client';

import { useState, useEffect } from 'react';
import { useAgentes } from '@/hooks/useAgentes';
import { useDisponibilidad } from '@/hooks/useDisponibilidad';
import { useConfiguracion } from '@/hooks/useConfiguracion';
import SelectorCliente from '@/components/clientes/SelectorCliente';
import type { Cliente } from '@/lib/clientesApi';
import * as configuracionApi from '@/lib/configuracionApi';
import * as calendarApi from '@/lib/calendarApi';
import styles from './FormularioTurno.module.css';

interface FormularioTurnoProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function FormularioTurno({ onSubmit, onCancel }: FormularioTurnoProps) {
  const empresaId = typeof window !== 'undefined' ? localStorage.getItem('empresa_id') || '' : '';
  const { configuracion, loading: loadingConfig } = useConfiguracion(empresaId);
  const { agentes, loading: loadingAgentes } = useAgentes(true);
  const { slots, cargarSlots, loading: loadingSlots } = useDisponibilidad();

  const [formData, setFormData] = useState<any>({
    agenteId: '',
    clienteId: '',
    fecha: '',
    horaInicio: '',
    duracion: 30,
    notas: '',
    datos: {} // Campos dinámicos
  });

  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disponibilidadAgente, setDisponibilidadAgente] = useState<calendarApi.DisponibilidadAgente | null>(null);
  const [diasDisponibles, setDiasDisponibles] = useState<number[]>([]);

  // Cargar disponibilidad del agente cuando cambia
  useEffect(() => {
    if (formData.agenteId) {
      cargarDisponibilidadAgente();
    } else {
      setDisponibilidadAgente(null);
      setDiasDisponibles([]);
    }
  }, [formData.agenteId]);

  // Cargar slots cuando cambia agente o fecha
  useEffect(() => {
    if (formData.agenteId && formData.fecha) {
      cargarSlots(formData.agenteId, formData.fecha, formData.duracion);
    }
  }, [formData.agenteId, formData.fecha, formData.duracion, cargarSlots]);

  const cargarDisponibilidadAgente = async () => {
    try {
      const disp = await calendarApi.obtenerHorariosAgente(formData.agenteId);
      console.log('📅 Disponibilidad del agente:', disp);
      setDisponibilidadAgente(disp);
      setDiasDisponibles(disp.disponibilidad.map((d: any) => d.diaSemana));
    } catch (err) {
      console.error('Error al cargar disponibilidad del agente:', err);
    }
  };

  // Verificar si una fecha está disponible
  const esFechaDisponible = (fecha: Date): boolean => {
    if (!disponibilidadAgente || diasDisponibles.length === 0) return true;
    const diaSemana = fecha.getDay();
    return diasDisponibles.includes(diaSemana);
  };

  // Obtener horarios disponibles para la fecha seleccionada
  const getHorariosDisponibles = (): { inicio: string; fin: string } | null => {
    if (!formData.fecha || !disponibilidadAgente) return null;
    
    const fecha = new Date(formData.fecha + 'T00:00:00');
    const diaSemana = fecha.getDay();
    const disp = disponibilidadAgente.disponibilidad.find(d => d.diaSemana === diaSemana);
    
    return disp ? { inicio: disp.horaInicio, fin: disp.horaFin } : null;
  };

  // Inicializar campos dinámicos con valores por defecto
  useEffect(() => {
    if (configuracion?.camposPersonalizados) {
      const datosPorDefecto: any = {};
      configuracion.camposPersonalizados.forEach(campo => {
        if (campo.valorPorDefecto !== undefined) {
          datosPorDefecto[campo.clave] = campo.valorPorDefecto;
        }
      });
      setFormData((prev: any) => ({
        ...prev,
        datos: { ...prev.datos, ...datosPorDefecto }
      }));
    }
  }, [configuracion]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: name === 'duracion' ? parseInt(value) || 30 : value
    }));
  };

  const handleDatosDinamicosChange = (clave: string, valor: any) => {
    setFormData((prev: any) => ({
      ...prev,
      datos: {
        ...prev.datos,
        [clave]: valor
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos requeridos según configuración
    const camposRequeridos = configuracion?.camposPersonalizados?.filter(c => c.requerido) || [];
    for (const campo of camposRequeridos) {
      if (!formData.datos[campo.clave]) {
        setError(`El campo "${campo.etiqueta}" es requerido`);
        return;
      }
    }

    if (!formData.clienteId || !formData.fecha || !formData.horaInicio) {
      setError('Todos los campos obligatorios son requeridos');
      return;
    }

    // Validar agente si es requerido
    if (configuracion?.agenteRequerido && !formData.agenteId) {
      setError('Debes seleccionar un agente');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Validar formato de fecha y hora
      if (!formData.fecha || !formData.horaInicio) {
        setError('Fecha y hora son requeridos');
        setLoading(false);
        return;
      }

      // Validar formato de hora (HH:MM)
      const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!horaRegex.test(formData.horaInicio)) {
        setError('Formato de hora inválido. Use HH:MM (ej: 14:30)');
        setLoading(false);
        return;
      }

      // Combinar fecha y hora
      const fechaInicio = new Date(`${formData.fecha}T${formData.horaInicio}:00`);
      
      // Verificar que la fecha sea válida
      if (isNaN(fechaInicio.getTime())) {
        setError('Fecha u hora inválida');
        setLoading(false);
        return;
      }

      await onSubmit({
        agenteId: formData.agenteId || undefined,
        clienteId: formData.clienteId,
        fechaInicio: fechaInicio.toISOString(),
        duracion: formData.duracion,
        datos: formData.datos, // Campos dinámicos
        notas: formData.notas
      });
    } catch (err: any) {
      setError(err.message);
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
            min={campo.validacion?.min}
            max={campo.validacion?.max}
          />
        );

      case configuracionApi.TipoCampo.FECHA:
        return (
          <input
            type="date"
            value={valor}
            onChange={(e) => handleDatosDinamicosChange(campo.clave, e.target.value)}
            required={campo.requerido}
          />
        );

      case configuracionApi.TipoCampo.HORA:
        return (
          <input
            type="time"
            value={valor}
            onChange={(e) => handleDatosDinamicosChange(campo.clave, e.target.value)}
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

      case configuracionApi.TipoCampo.BOOLEAN:
        return (
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={valor || false}
              onChange={(e) => handleDatosDinamicosChange(campo.clave, e.target.checked)}
            />
            <span>{campo.etiqueta}</span>
          </label>
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

  if (loadingConfig) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando configuración...</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && (
        <div className={styles.error}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Agente (solo si está configurado) */}
      {configuracion?.usaAgentes && (
        <div className={styles.field}>
          <label>{configuracion.nomenclatura.agente} {configuracion.agenteRequerido && '*'}</label>
          <select
            name="agenteId"
            value={formData.agenteId}
            onChange={handleChange}
            required={configuracion.agenteRequerido}
            disabled={loadingAgentes}
          >
            <option value="">Seleccionar {configuracion.nomenclatura.agente.toLowerCase()}...</option>
            {agentes.map(agente => (
              <option key={agente._id} value={agente._id}>
                {agente.nombre} {agente.apellido} {agente.especialidad && `- ${agente.especialidad}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.field}>
        <label>Cliente *</label>
        <SelectorCliente
          onSelect={(cliente) => {
            setClienteSeleccionado(cliente);
            setFormData((prev: any) => ({ ...prev, clienteId: cliente?._id || '' }));
          }}
          clienteSeleccionado={clienteSeleccionado}
          placeholder="Buscar cliente por nombre, teléfono o email..."
          required
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label>Fecha *</label>
          <input
            type="date"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            required
          />
          {formData.agenteId && disponibilidadAgente && (
            <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              {diasDisponibles.length > 0 ? (
                `Días disponibles: ${diasDisponibles.map(d => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d]).join(', ')}`
              ) : (
                'Este agente no tiene días configurados'
              )}
            </small>
          )}
        </div>

        <div className={styles.field}>
          <label>Duración (minutos) *</label>
          <select
            name="duracion"
            value={formData.duracion}
            onChange={handleChange}
            required
          >
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1 hora</option>
            <option value="90">1.5 horas</option>
            <option value="120">2 horas</option>
          </select>
        </div>
      </div>

      {formData.agenteId && formData.fecha && (
        <div className={styles.field}>
          <label>Horario disponible *</label>
          {loadingSlots ? (
            <div className={styles.loading}>Cargando horarios...</div>
          ) : slots.length > 0 ? (
            <select
              name="horaInicio"
              value={formData.horaInicio}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar horario...</option>
              {slots.map((slot, index) => {
                const fecha = new Date(slot.fecha);
                const hora = fecha.toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false  // Formato de 24 horas
                });
                return (
                  <option key={index} value={hora}>
                    {hora}
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

      {/* Campos Dinámicos Personalizados */}
      {configuracion?.camposPersonalizados && configuracion.camposPersonalizados.length > 0 && (
        <>
          <div className={styles.divider}>
            <span>Información Específica</span>
          </div>
          {configuracion.camposPersonalizados
            .sort((a, b) => a.orden - b.orden)
            .map((campo) => (
              <div key={campo.clave} className={styles.field}>
                <label>
                  {campo.etiqueta} {campo.requerido && '*'}
                </label>
                {renderCampoDinamico(campo)}
                {campo.validacion?.mensaje && (
                  <small className={styles.fieldHelp}>{campo.validacion.mensaje}</small>
                )}
              </div>
            ))}
        </>
      )}

      <div className={styles.field}>
        <label>Notas</label>
        <textarea
          name="notas"
          value={formData.notas}
          onChange={handleChange}
          rows={3}
          placeholder="Información adicional..."
        />
      </div>

      <div className={styles.actions}>
        <button 
          type="button" 
          onClick={onCancel}
          className={styles.btnCancel}
          disabled={loading}
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          className={styles.btnSubmit}
          disabled={loading || !formData.horaInicio}
        >
          {loading ? 'Creando...' : 'Crear Turno'}
        </button>
      </div>
    </form>
  );
}
