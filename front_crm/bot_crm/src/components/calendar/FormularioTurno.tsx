// 📋 Formulario para crear turnos
'use client';

import { useState, useEffect } from 'react';
import { useAgentes } from '@/hooks/useAgentes';
import { useDisponibilidad } from '@/hooks/useDisponibilidad';
import styles from './FormularioTurno.module.css';

interface FormularioTurnoProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function FormularioTurno({ onSubmit, onCancel }: FormularioTurnoProps) {
  const { agentes, loading: loadingAgentes } = useAgentes(true);
  const { slots, cargarSlots, loading: loadingSlots } = useDisponibilidad();

  const [formData, setFormData] = useState({
    agenteId: '',
    clienteId: '',
    fecha: '',
    horaInicio: '',
    duracion: 30,
    servicio: '',
    notas: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar slots cuando cambia agente o fecha
  useEffect(() => {
    if (formData.agenteId && formData.fecha) {
      cargarSlots(formData.agenteId, formData.fecha, formData.duracion);
    }
  }, [formData.agenteId, formData.fecha, formData.duracion, cargarSlots]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duracion' ? parseInt(value) || 30 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agenteId || !formData.clienteId || !formData.fecha || !formData.horaInicio) {
      setError('Todos los campos son requeridos');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Combinar fecha y hora
      const fechaInicio = new Date(`${formData.fecha}T${formData.horaInicio}`);

      await onSubmit({
        agenteId: formData.agenteId,
        clienteId: formData.clienteId,
        fechaInicio: fechaInicio.toISOString(),
        duracion: formData.duracion,
        servicio: formData.servicio,
        notas: formData.notas
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2>Nuevo Turno</h2>

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

      <div className={styles.field}>
        <label>Agente *</label>
        <select
          name="agenteId"
          value={formData.agenteId}
          onChange={handleChange}
          required
          disabled={loadingAgentes}
        >
          <option value="">Seleccionar agente...</option>
          {agentes.map(agente => (
            <option key={agente._id} value={agente._id}>
              {agente.nombre} {agente.apellido} {agente.especialidad && `- ${agente.especialidad}`}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label>Cliente (Teléfono o ID) *</label>
        <input
          type="text"
          name="clienteId"
          value={formData.clienteId}
          onChange={handleChange}
          required
          placeholder="+54 11 1234-5678"
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
            min={new Date().toISOString().split('T')[0]}
          />
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
                const hora = new Date(slot.fecha).toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit'
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

      <div className={styles.field}>
        <label>Servicio</label>
        <input
          type="text"
          name="servicio"
          value={formData.servicio}
          onChange={handleChange}
          placeholder="Consulta, Corte de pelo, etc."
        />
      </div>

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
