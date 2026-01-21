'use client';

import { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Phone, Briefcase, Clock, Users, Calendar, AlertCircle, Check, ChevronDown } from 'lucide-react';
import styles from './ModalAgente.module.css';

const COUNTRY_METADATA = [
  { code: 'AR', countryCode: '54', mobilePrefix: '9', country: 'Argentina', flag: '🇦🇷' },
  { code: 'BR', countryCode: '55', mobilePrefix: '', country: 'Brasil', flag: '🇧🇷' },
  { code: 'CL', countryCode: '56', mobilePrefix: '', country: 'Chile', flag: '🇨🇱' },
  { code: 'CO', countryCode: '57', mobilePrefix: '', country: 'Colombia', flag: '🇨🇴' },
  { code: 'MX', countryCode: '52', mobilePrefix: '', country: 'México', flag: '🇲🇽' },
  { code: 'PE', countryCode: '51', mobilePrefix: '', country: 'Perú', flag: '🇵🇪' },
  { code: 'UY', countryCode: '598', mobilePrefix: '', country: 'Uruguay', flag: '🇺🇾' },
  { code: 'US', countryCode: '1', mobilePrefix: '', country: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'ES', countryCode: '34', mobilePrefix: '', country: 'España', flag: '🇪🇸' },
];

interface Disponibilidad {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

interface AgenteData {
  _id?: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  especialidad?: string;
  titulo?: string;
  descripcion?: string;
  sector?: string;
  modoAtencion: 'turnos_programados' | 'turnos_libres' | 'mixto';
  duracionTurnoPorDefecto: number;
  bufferEntreturnos: number;
  capacidadSimultanea: number;
  maximoTurnosPorDia: number;
  disponibilidad: Disponibilidad[];
  activo: boolean;
}

interface ModalAgenteProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AgenteData) => Promise<void>;
  agenteInicial?: AgenteData | null;
}

const DIAS_SEMANA = [
  { id: 1, nombre: 'Lunes', abrev: 'L' },
  { id: 2, nombre: 'Martes', abrev: 'M' },
  { id: 3, nombre: 'Miércoles', abrev: 'X' },
  { id: 4, nombre: 'Jueves', abrev: 'J' },
  { id: 5, nombre: 'Viernes', abrev: 'V' },
  { id: 6, nombre: 'Sábado', abrev: 'S' },
  { id: 0, nombre: 'Domingo', abrev: 'D' }
];

const HORARIOS_PREDEFINIDOS = [
  { label: 'Mañana (9:00 - 13:00)', inicio: '09:00', fin: '13:00' },
  { label: 'Tarde (14:00 - 18:00)', inicio: '14:00', fin: '18:00' },
  { label: 'Jornada completa (9:00 - 18:00)', inicio: '09:00', fin: '18:00' },
  { label: 'Extendido (8:00 - 20:00)', inicio: '08:00', fin: '20:00' }
];

export default function ModalAgente({ isOpen, onClose, onSubmit, agenteInicial }: ModalAgenteProps) {
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('AR');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<AgenteData>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    especialidad: '',
    titulo: '',
    descripcion: '',
    sector: '',
    modoAtencion: 'turnos_programados',
    duracionTurnoPorDefecto: 30,
    bufferEntreturnos: 5,
    capacidadSimultanea: 1,
    maximoTurnosPorDia: 0,
    disponibilidad: [],
    activo: true
  });

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Inicializar con datos del agente si existe
  useEffect(() => {
    if (agenteInicial) {
      // Limpiar y validar disponibilidad
      const disponibilidadLimpia = (agenteInicial.disponibilidad || [])
        .filter((d: any) => d && typeof d.diaSemana === 'number') // Filtrar objetos vacíos o inválidos
        .map((d: any) => ({
          diaSemana: d.diaSemana,
          horaInicio: d.horaInicio || '09:00',
          horaFin: d.horaFin || '18:00',
          activo: d.activo !== false // Por defecto true
        }));
      
      console.log('📅 Disponibilidad cargada:', disponibilidadLimpia);
      
      // Extraer código de país del teléfono si existe
      const tel = agenteInicial.telefono || '';
      let phoneNumber = tel;
      let countryCode = 'AR';
      
      if (tel.startsWith('+')) {
        const telSinMas = tel.substring(1);
        const matchedCountry = COUNTRY_METADATA.find(c => telSinMas.startsWith(c.countryCode));
        if (matchedCountry) {
          countryCode = matchedCountry.code;
          phoneNumber = telSinMas.substring(matchedCountry.countryCode.length);
          if (matchedCountry.mobilePrefix && phoneNumber.startsWith(matchedCountry.mobilePrefix)) {
            phoneNumber = phoneNumber.substring(matchedCountry.mobilePrefix.length);
          }
        }
      }
      
      setSelectedCountry(countryCode);
      setFormData({
        ...agenteInicial,
        telefono: phoneNumber,
        disponibilidad: disponibilidadLimpia
      });
    } else {
      // Reset al abrir modal nuevo
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        especialidad: '',
        titulo: '',
        descripcion: '',
        sector: '',
        modoAtencion: 'turnos_programados',
        duracionTurnoPorDefecto: 30,
        bufferEntreturnos: 5,
        capacidadSimultanea: 1,
        maximoTurnosPorDia: 0,
        disponibilidad: DIAS_SEMANA.slice(0, 5).map(dia => ({
          diaSemana: dia.id,
          horaInicio: '09:00',
          horaFin: '18:00',
          activo: true
        })),
        activo: true
      });
    }
    setPaso(1);
    setError(null);
  }, [agenteInicial, isOpen]);

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

  const handleChange = (campo: keyof AgenteData, valor: any) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
    setError(null);
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

  const actualizarHorarioDia = (diaSemana: number, campo: 'horaInicio' | 'horaFin', valor: string) => {
    setFormData(prev => {
      const disponibilidad = [...prev.disponibilidad];
      const index = disponibilidad.findIndex(d => d.diaSemana === diaSemana);
      
      if (index >= 0) {
        disponibilidad[index][campo] = valor;
      }
      
      return { ...prev, disponibilidad };
    });
  };

  const aplicarHorarioATodos = (horario: { inicio: string; fin: string }) => {
    setFormData(prev => ({
      ...prev,
      disponibilidad: prev.disponibilidad.map(d => ({
        ...d,
        horaInicio: horario.inicio,
        horaFin: horario.fin
      }))
    }));
  };

  const validarPaso1 = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (!formData.apellido.trim()) {
      setError('El apellido es requerido');
      return false;
    }
    if (!formData.email.trim()) {
      setError('El email es requerido');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('El email no es válido');
      return false;
    }
    return true;
  };

  const validarPaso2 = () => {
    const diasActivos = formData.disponibilidad.filter(d => d.activo);
    if (diasActivos.length === 0) {
      setError('Debe seleccionar al menos un día de disponibilidad');
      return false;
    }
    
    const regexHora = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    
    // Validar que las horas sean correctas
    for (const dia of diasActivos) {
      // Validar formato
      if (!regexHora.test(dia.horaInicio)) {
        setError(`Formato de hora inválido en "Desde". Use formato 24h (HH:MM), ejemplo: 09:00`);
        return false;
      }
      if (!regexHora.test(dia.horaFin)) {
        setError(`Formato de hora inválido en "Hasta". Use formato 24h (HH:MM), ejemplo: 18:00`);
        return false;
      }
      
      const [hIni, mIni] = dia.horaInicio.split(':').map(Number);
      const [hFin, mFin] = dia.horaFin.split(':').map(Number);
      const inicioMin = hIni * 60 + mIni;
      const finMin = hFin * 60 + mFin;
      
      if (finMin <= inicioMin) {
        setError('La hora de fin debe ser posterior a la hora de inicio');
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
    if (!validarPaso1() || !validarPaso2()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Limpiar disponibilidad antes de enviar
      const disponibilidadLimpia = formData.disponibilidad
        .filter(d => d && typeof d.diaSemana === 'number' && d.activo) // Solo días activos y válidos
        .map(d => ({
          diaSemana: d.diaSemana,
          horaInicio: d.horaInicio,
          horaFin: d.horaFin,
          activo: true
        }));
      
      console.log('💾 Guardando disponibilidad:', disponibilidadLimpia);
      
      // Formatear teléfono con código de país
      const country = COUNTRY_METADATA.find(c => c.code === selectedCountry);
      const telefonoFormateado = formData.telefono 
        ? `+${country?.countryCode}${country?.mobilePrefix}${formData.telefono.replace(/\D/g, '')}`
        : '';
      
      console.log('📱 Teléfono formateado:', telefonoFormateado);
      
      await onSubmit({
        ...formData,
        telefono: telefonoFormateado,
        disponibilidad: disponibilidadLimpia
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el agente');
    } finally {
      setLoading(false);
    }
  };

  const getDiaDisponibilidad = (diaSemana: number) => {
    return formData.disponibilidad.find(d => d.diaSemana === diaSemana) || {
      diaSemana,
      horaInicio: '09:00',
      horaFin: '18:00',
      activo: false
    };
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2>{agenteInicial ? 'Editar Agente' : 'Nuevo Agente'}</h2>
            <p className={styles.subtitle}>
              {paso === 1 && 'Información básica del agente'}
              {paso === 2 && 'Configuración de horarios y disponibilidad'}
              {paso === 3 && 'Configuración de atención'}
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
            <span>Datos</span>
          </div>
          <div className={styles.progressLine} />
          <div className={`${styles.progressStep} ${paso >= 2 ? styles.active : ''}`}>
            <div className={styles.progressCircle}>
              {paso > 2 ? <Check size={16} /> : '2'}
            </div>
            <span>Horarios</span>
          </div>
          <div className={styles.progressLine} />
          <div className={`${styles.progressStep} ${paso >= 3 ? styles.active : ''}`}>
            <div className={styles.progressCircle}>3</div>
            <span>Atención</span>
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
          {/* PASO 1: Información Básica */}
          {paso === 1 && (
            <div className={styles.paso}>
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label>
                    <User size={16} />
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleChange('nombre', e.target.value)}
                    placeholder="Juan"
                    autoFocus
                  />
                </div>

                <div className={styles.field}>
                  <label>
                    <User size={16} />
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => handleChange('apellido', e.target.value)}
                    placeholder="Pérez"
                  />
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label>
                    <Mail size={16} />
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="juan.perez@ejemplo.com"
                  />
                </div>

                <div className={styles.field}>
                  <label>
                    <Phone size={16} />
                    Teléfono WhatsApp
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', width: '140px' }} ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        <span>
                          {COUNTRY_METADATA.find(c => c.code === selectedCountry)?.flag}{' '}
                          +{COUNTRY_METADATA.find(c => c.code === selectedCountry)?.countryCode}
                        </span>
                        <ChevronDown size={16} />
                      </button>
                      
                      {showCountryDropdown && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '4px',
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 1000
                        }}>
                          {COUNTRY_METADATA.map(country => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(country.code);
                                setShowCountryDropdown(false);
                              }}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: 'none',
                                background: selectedCountry === country.code ? '#f0f9ff' : 'white',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              <span>{country.flag}</span>
                              <span>+{country.countryCode}</span>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>{country.country}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => {
                        const valor = e.target.value.replace(/\D/g, '');
                        handleChange('telefono', valor);
                      }}
                      placeholder="3794123456"
                      style={{ flex: 1 }}
                    />
                  </div>
                  <small className={styles.hint}>
                    Formato: +{COUNTRY_METADATA.find(c => c.code === selectedCountry)?.countryCode}
                    {COUNTRY_METADATA.find(c => c.code === selectedCountry)?.mobilePrefix}
                    {formData.telefono || 'XXXXXXXXXX'}
                  </small>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label>
                    <Briefcase size={16} />
                    Título/Profesión
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => handleChange('titulo', e.target.value)}
                    placeholder="Dr., Lic., Ing., etc."
                  />
                </div>

                <div className={styles.field}>
                  <label>
                    <Briefcase size={16} />
                    Especialidad
                  </label>
                  <input
                    type="text"
                    value={formData.especialidad}
                    onChange={(e) => handleChange('especialidad', e.target.value)}
                    placeholder="Cardiología, Ventas, etc."
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label>
                  <Briefcase size={16} />
                  Sector/Departamento
                </label>
                <input
                  type="text"
                  value={formData.sector}
                  onChange={(e) => handleChange('sector', e.target.value)}
                  placeholder="Ventas, Soporte, Administración, etc."
                />
              </div>

              <div className={styles.field}>
                <label>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => handleChange('descripcion', e.target.value)}
                  rows={3}
                  placeholder="Breve descripción del agente..."
                />
              </div>
            </div>
          )}

          {/* PASO 2: Horarios y Disponibilidad */}
          {paso === 2 && (
            <div className={styles.paso}>
              <div className={styles.horariosHeader}>
                <h3>
                  <Calendar size={20} />
                  Disponibilidad Semanal
                </h3>
                <p>Selecciona los días y horarios en que este agente estará disponible</p>
              </div>

              {/* Horarios predefinidos */}
              <div className={styles.horariosRapidos}>
                <label>Aplicar horario a todos:</label>
                <div className={styles.horariosRapidosGrid}>
                  {HORARIOS_PREDEFINIDOS.map((horario, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => aplicarHorarioATodos({ inicio: horario.inicio, fin: horario.fin })}
                      className={styles.btnHorarioRapido}
                    >
                      {horario.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Días de la semana */}
              <div className={styles.diasGrid}>
                {DIAS_SEMANA.map(dia => {
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
                          <div className={styles.horarioInput}>
                            <label>Desde</label>
                            <input
                              type="text"
                              value={disp.horaInicio}
                              onChange={(e) => {
                                let valor = e.target.value.replace(/[^0-9:]/g, '');
                                if (valor.length === 2 && !valor.includes(':')) {
                                  valor = valor + ':';
                                }
                                if (valor.length <= 5) {
                                  actualizarHorarioDia(dia.id, 'horaInicio', valor);
                                }
                              }}
                              placeholder="HH:MM"
                              maxLength={5}
                              style={{ fontFamily: 'monospace' }}
                            />
                          </div>
                          <div className={styles.horarioInput}>
                            <label>Hasta</label>
                            <input
                              type="text"
                              value={disp.horaFin}
                              onChange={(e) => {
                                let valor = e.target.value.replace(/[^0-9:]/g, '');
                                if (valor.length === 2 && !valor.includes(':')) {
                                  valor = valor + ':';
                                }
                                if (valor.length <= 5) {
                                  actualizarHorarioDia(dia.id, 'horaFin', valor);
                                }
                              }}
                              placeholder="HH:MM"
                              maxLength={5}
                              style={{ fontFamily: 'monospace' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 3: Configuración de Atención */}
          {paso === 3 && (
            <div className={styles.paso}>
              <div className={styles.field}>
                <label>
                  <Clock size={16} />
                  Modo de Atención *
                </label>
                <select
                  value={formData.modoAtencion}
                  onChange={(e) => handleChange('modoAtencion', e.target.value)}
                >
                  <option value="turnos_programados">Turnos Programados (con horarios específicos)</option>
                  <option value="turnos_libres">Turnos Libres (sin horarios, por orden de llegada)</option>
                  <option value="mixto">Mixto (ambos modos)</option>
                </select>
                <small className={styles.hint}>
                  {formData.modoAtencion === 'turnos_programados' && '⏰ Los clientes reservan horarios específicos'}
                  {formData.modoAtencion === 'turnos_libres' && '📋 Los clientes se anotan sin horario fijo'}
                  {formData.modoAtencion === 'mixto' && '🔄 Permite ambos tipos de turnos'}
                </small>
              </div>

              {/* Configuración para turnos programados */}
              {(formData.modoAtencion === 'turnos_programados' || formData.modoAtencion === 'mixto') && (
                <div className={styles.configSection}>
                  <h4>⏰ Configuración de Turnos Programados</h4>
                  <div className={styles.grid2}>
                    <div className={styles.field}>
                      <label>Duración por defecto (minutos)</label>
                      <input
                        type="number"
                        value={formData.duracionTurnoPorDefecto}
                        onChange={(e) => handleChange('duracionTurnoPorDefecto', parseInt(e.target.value) || 30)}
                        min="5"
                        max="240"
                        step="5"
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Buffer entre turnos (minutos)</label>
                      <input
                        type="number"
                        value={formData.bufferEntreturnos}
                        onChange={(e) => handleChange('bufferEntreturnos', parseInt(e.target.value) || 0)}
                        min="0"
                        max="60"
                        step="5"
                      />
                      <small className={styles.hint}>Tiempo de descanso entre turnos</small>
                    </div>
                  </div>
                </div>
              )}

              {/* Configuración para turnos libres */}
              {(formData.modoAtencion === 'turnos_libres' || formData.modoAtencion === 'mixto') && (
                <div className={styles.configSection}>
                  <h4>📋 Configuración de Turnos Libres</h4>
                  <div className={styles.grid2}>
                    <div className={styles.field}>
                      <label>
                        <Users size={16} />
                        Capacidad simultánea
                      </label>
                      <input
                        type="number"
                        value={formData.capacidadSimultanea}
                        onChange={(e) => handleChange('capacidadSimultanea', parseInt(e.target.value) || 1)}
                        min="1"
                        max="50"
                      />
                      <small className={styles.hint}>Cuántos clientes puede atender al mismo tiempo</small>
                    </div>

                    <div className={styles.field}>
                      <label>Máximo turnos por día</label>
                      <input
                        type="number"
                        value={formData.maximoTurnosPorDia}
                        onChange={(e) => handleChange('maximoTurnosPorDia', parseInt(e.target.value) || 0)}
                        min="0"
                        max="200"
                      />
                      <small className={styles.hint}>0 = sin límite</small>
                    </div>
                  </div>
                </div>
              )}

              {/* Estado del agente */}
              <div className={styles.field}>
                <label className={styles.switchLabel}>
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => handleChange('activo', e.target.checked)}
                  />
                  <span>Agente activo</span>
                </label>
                <small className={styles.hint}>
                  {formData.activo ? '✅ El agente estará visible y disponible para reservas' : '⚠️ El agente no aparecerá en las opciones de reserva'}
                </small>
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
              {loading ? 'Guardando...' : agenteInicial ? 'Actualizar Agente' : 'Crear Agente'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
