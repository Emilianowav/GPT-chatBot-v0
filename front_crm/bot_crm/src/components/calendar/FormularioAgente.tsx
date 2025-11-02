// 👨‍⚕️ Formulario para crear/editar agentes
'use client';

import { useState } from 'react';
import styles from './FormularioAgente.module.css';

interface FormularioAgenteProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  agenteInicial?: any;
}

export default function FormularioAgente({ 
  onSubmit, 
  onCancel, 
  agenteInicial 
}: FormularioAgenteProps) {
  const diasSemana = [
    { id: 1, nombre: 'Lunes' },
    { id: 2, nombre: 'Martes' },
    { id: 3, nombre: 'Miércoles' },
    { id: 4, nombre: 'Jueves' },
    { id: 5, nombre: 'Viernes' },
    { id: 6, nombre: 'Sábado' },
    { id: 0, nombre: 'Domingo' }
  ];

  const [formData, setFormData] = useState({
    nombre: agenteInicial?.nombre || '',
    apellido: agenteInicial?.apellido || '',
    email: agenteInicial?.email || '',
    telefono: agenteInicial?.telefono || '',
    especialidad: agenteInicial?.especialidad || '',
    titulo: agenteInicial?.titulo || '',
    descripcion: agenteInicial?.descripcion || '',
    sector: agenteInicial?.sector || '',
    modoAtencion: agenteInicial?.modoAtencion || 'turnos_programados',
    duracionTurnoPorDefecto: agenteInicial?.duracionTurnoPorDefecto || 30,
    bufferEntreturnos: agenteInicial?.bufferEntreturnos || 5,
    capacidadSimultanea: agenteInicial?.capacidadSimultanea || 1,
    maximoTurnosPorDia: agenteInicial?.maximoTurnosPorDia || 0,
    disponibilidad: agenteInicial?.disponibilidad || diasSemana.slice(0, 5).map(dia => ({
      diaSemana: dia.id,
      horaInicio: '09:00',
      horaFin: '18:00',
      activo: true
    }))
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['duracionTurnoPorDefecto', 'bufferEntreturnos', 'capacidadSimultanea', 'maximoTurnosPorDia'];
    setFormData(prev => ({
      ...prev,
      [name]: numericFields.includes(name)
        ? parseInt(value) || 0 
        : value
    }));
  };

  const handleDisponibilidadChange = (diaSemana: number, campo: string, valor: any) => {
    setFormData(prev => {
      const disponibilidad = [...prev.disponibilidad];
      const index = disponibilidad.findIndex(d => d.diaSemana === diaSemana);
      
      if (index >= 0) {
        disponibilidad[index] = {
          ...disponibilidad[index],
          [campo]: valor
        };
      } else {
        disponibilidad.push({
          diaSemana,
          horaInicio: '09:00',
          horaFin: '18:00',
          activo: true,
          [campo]: valor
        });
      }
      
      return { ...prev, disponibilidad };
    });
  };

  const toggleDia = (diaSemana: number) => {
    setFormData(prev => {
      const disponibilidad = [...prev.disponibilidad];
      const index = disponibilidad.findIndex(d => d.diaSemana === diaSemana);
      
      if (index >= 0) {
        disponibilidad[index].activo = !disponibilidad[index].activo;
      } else {
        disponibilidad.push({
          diaSemana,
          horaInicio: '09:00',
          horaFin: '18:00',
          activo: true
        });
      }
      
      return { ...prev, disponibilidad };
    });
  };

  const getDiaDisponibilidad = (diaSemana: number) => {
    return formData.disponibilidad.find((d: any) => d.diaSemana === diaSemana) || {
      diaSemana,
      horaInicio: '09:00',
      horaFin: '18:00',
      activo: false
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.apellido || !formData.email) {
      setError('Nombre, apellido y email son requeridos');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2>{agenteInicial ? 'Editar Agente' : 'Nuevo Agente'}</h2>

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

      <div className={styles.row}>
        <div className={styles.field}>
          <label>Nombre *</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            placeholder="Juan"
          />
        </div>

        <div className={styles.field}>
          <label>Apellido *</label>
          <input
            type="text"
            name="apellido"
            value={formData.apellido}
            onChange={handleChange}
            required
            placeholder="Pérez"
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="juan.perez@ejemplo.com"
          />
        </div>

        <div className={styles.field}>
          <label>Teléfono</label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="+54 11 1234-5678"
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label>Título/Profesión</label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            placeholder="Dr., Lic., etc."
          />
        </div>

        <div className={styles.field}>
          <label>Especialidad</label>
          <input
            type="text"
            name="especialidad"
            value={formData.especialidad}
            onChange={handleChange}
            placeholder="Cardiología, Peluquería, etc."
          />
        </div>
      </div>

      <div className={styles.field}>
        <label>🏢 Sector</label>
        <input
          type="text"
          name="sector"
          value={formData.sector}
          onChange={handleChange}
          placeholder="Ventas, Soporte, Administración, etc."
        />
        <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
          Sector o departamento al que pertenece el agente (opcional)
        </small>
      </div>

      <div className={styles.field}>
        <label>Descripción</label>
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          rows={3}
          placeholder="Breve descripción del agente..."
        />
      </div>

      <div className={styles.field}>
        <label>Modo de Atención *</label>
        <select
          name="modoAtencion"
          value={formData.modoAtencion}
          onChange={handleChange}
          required
        >
          <option value="turnos_programados">Turnos Programados (con horarios específicos)</option>
          <option value="turnos_libres">Turnos Libres (sin horarios, por orden de llegada)</option>
          <option value="mixto">Mixto (ambos modos)</option>
        </select>
        <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
          {formData.modoAtencion === 'turnos_programados' && 'Los clientes reservan horarios específicos'}
          {formData.modoAtencion === 'turnos_libres' && 'Los clientes se anotan sin horario fijo'}
          {formData.modoAtencion === 'mixto' && 'Permite ambos tipos de turnos'}
        </small>
      </div>

      {(formData.modoAtencion === 'turnos_programados' || formData.modoAtencion === 'mixto') && (
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Duración turno (minutos)</label>
            <input
              type="number"
              name="duracionTurnoPorDefecto"
              value={formData.duracionTurnoPorDefecto}
              onChange={handleChange}
              min="5"
              max="240"
              step="5"
            />
          </div>

          <div className={styles.field}>
            <label>Buffer entre turnos (minutos)</label>
            <input
              type="number"
              name="bufferEntreturnos"
              value={formData.bufferEntreturnos}
              onChange={handleChange}
              min="0"
              max="60"
              step="5"
            />
          </div>
        </div>
      )}

      {(formData.modoAtencion === 'turnos_libres' || formData.modoAtencion === 'mixto') && (
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Capacidad simultánea</label>
            <input
              type="number"
              name="capacidadSimultanea"
              value={formData.capacidadSimultanea}
              onChange={handleChange}
              min="1"
              max="50"
            />
            <small style={{ color: '#666', fontSize: '0.85rem' }}>
              Cuántos pacientes puede atender al mismo tiempo
            </small>
          </div>

          <div className={styles.field}>
            <label>Máximo turnos por día (opcional)</label>
            <input
              type="number"
              name="maximoTurnosPorDia"
              value={formData.maximoTurnosPorDia}
              onChange={handleChange}
              min="0"
              max="200"
            />
            <small style={{ color: '#666', fontSize: '0.85rem' }}>
              0 = sin límite
            </small>
          </div>
        </div>
      )}

      {/* Disponibilidad por día */}
      <div className={styles.disponibilidadSection}>
        <h3>📅 Disponibilidad Semanal</h3>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Configura los días y horarios en que este agente está disponible
        </p>
        
        <div className={styles.diasGrid}>
          {diasSemana.map(dia => {
            const disp = getDiaDisponibilidad(dia.id);
            return (
              <div key={dia.id} className={`${styles.diaCard} ${disp.activo ? styles.diaActivo : ''}`}>
                <div className={styles.diaHeader}>
                  <label className={styles.diaCheckbox}>
                    <input
                      type="checkbox"
                      checked={disp.activo}
                      onChange={() => toggleDia(dia.id)}
                    />
                    <span className={styles.diaNombre}>{dia.nombre}</span>
                  </label>
                </div>
                
                {disp.activo && (
                  <div className={styles.diaHorarios}>
                    <div className={styles.horarioField}>
                      <label>Desde</label>
                      <input
                        type="time"
                        value={disp.horaInicio}
                        onChange={(e) => handleDisponibilidadChange(dia.id, 'horaInicio', e.target.value)}
                      />
                      <small style={{ color: '#666', fontSize: '0.75rem' }}>
                        {disp.horaInicio} (formato 24h)
                      </small>
                    </div>
                    <div className={styles.horarioField}>
                      <label>Hasta</label>
                      <input
                        type="time"
                        value={disp.horaFin}
                        onChange={(e) => handleDisponibilidadChange(dia.id, 'horaFin', e.target.value)}
                      />
                      <small style={{ color: '#666', fontSize: '0.75rem' }}>
                        {disp.horaFin} (formato 24h)
                      </small>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
          disabled={loading}
        >
          {loading ? 'Guardando...' : agenteInicial ? 'Actualizar' : 'Crear Agente'}
        </button>
      </div>
    </form>
  );
}
