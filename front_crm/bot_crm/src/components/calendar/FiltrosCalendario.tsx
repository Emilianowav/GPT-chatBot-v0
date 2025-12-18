// 🔍 Componente de Filtros Reutilizable para Calendario
'use client';

import { useState, useEffect } from 'react';
import styles from './FiltrosCalendario.module.css';

interface Agente {
  _id: string;
  nombre: string;
  apellido: string;
}

interface OpcionEstado {
  value: string;
  label: string;
}

interface FiltrosCalendarioProps {
  agentes?: Agente[];
  onFiltrar: (filtros: FiltrosState) => void;
  mostrarEstado?: boolean;
  mostrarFechas?: boolean;
  mostrarAgente?: boolean;
  mostrarBusqueda?: boolean;
  fechaDefecto?: 'hoy' | 'semana' | 'mes' | 'ninguna';
  titulo?: string;
  opcionesEstado?: OpcionEstado[];
}

export interface FiltrosState {
  estado: string;
  agenteId: string;
  fechaDesde: string;
  fechaHasta: string;
  busqueda: string;
}

const OPCIONES_ESTADO_TURNOS: OpcionEstado[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'en_curso', label: 'En Curso' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' }
];

export default function FiltrosCalendario({
  agentes = [],
  onFiltrar,
  mostrarEstado = true,
  mostrarFechas = true,
  mostrarAgente = true,
  mostrarBusqueda = true,
  fechaDefecto = 'hoy',
  titulo = 'Filtros',
  opcionesEstado = OPCIONES_ESTADO_TURNOS
}: FiltrosCalendarioProps) {
  // Helper para formatear fecha local a YYYY-MM-DD
  const formatearFechaLocal = (fecha: Date) => {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calcular fechas por defecto (usando hora local)
  const ahora = new Date();
  const hoy = formatearFechaLocal(ahora);
  
  const inicioSemana = new Date(ahora);
  inicioSemana.setDate(ahora.getDate() - ahora.getDay());
  const finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);
  
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);

  const getFechasDefecto = () => {
    switch (fechaDefecto) {
      case 'hoy':
        return { desde: hoy, hasta: hoy };
      case 'semana':
        return { desde: formatearFechaLocal(inicioSemana), hasta: formatearFechaLocal(finSemana) };
      case 'mes':
        return { desde: formatearFechaLocal(inicioMes), hasta: formatearFechaLocal(finMes) };
      default:
        return { desde: '', hasta: '' };
    }
  };

  const fechasDefault = getFechasDefecto();

  const [filtros, setFiltros] = useState<FiltrosState>({
    estado: 'todos',
    agenteId: '',
    fechaDesde: fechasDefault.desde,
    fechaHasta: fechasDefault.hasta,
    busqueda: ''
  });

  const [expandido, setExpandido] = useState(false);
  const [inicializado, setInicializado] = useState(false);

  // Disparar filtros al montar si hay fechas por defecto
  useEffect(() => {
    if (!inicializado && (fechasDefault.desde || fechasDefault.hasta)) {
      onFiltrar(filtros);
      setInicializado(true);
    }
  }, [inicializado]);

  const handleChange = (campo: keyof FiltrosState, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const handleFiltrar = () => {
    onFiltrar(filtros);
  };

  const handleLimpiar = () => {
    const filtrosLimpios: FiltrosState = {
      estado: 'todos',
      agenteId: '',
      fechaDesde: '',
      fechaHasta: '',
      busqueda: ''
    };
    setFiltros(filtrosLimpios);
    onFiltrar(filtrosLimpios);
  };

  const handleFiltroRapido = (tipo: 'hoy' | 'semana' | 'mes') => {
    let desde = '';
    let hasta = '';
    
    switch (tipo) {
      case 'hoy':
        desde = hasta = hoy;
        break;
      case 'semana':
        desde = formatearFechaLocal(inicioSemana);
        hasta = formatearFechaLocal(finSemana);
        break;
      case 'mes':
        desde = formatearFechaLocal(inicioMes);
        hasta = formatearFechaLocal(finMes);
        break;
    }
    
    const nuevosFiltros = { ...filtros, fechaDesde: desde, fechaHasta: hasta };
    setFiltros(nuevosFiltros);
    onFiltrar(nuevosFiltros);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setExpandido(!expandido)}>
        <div className={styles.headerLeft}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <span>{titulo}</span>
        </div>
        <button className={styles.toggleBtn}>
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            style={{ transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      {expandido && (
        <div className={styles.body}>
          {/* Filtros rápidos de fecha */}
          {mostrarFechas && (
            <div className={styles.filtrosRapidos}>
              <button 
                className={`${styles.chipRapido} ${filtros.fechaDesde === hoy && filtros.fechaHasta === hoy ? styles.chipActivo : ''}`}
                onClick={() => handleFiltroRapido('hoy')}
              >
                Hoy
              </button>
              <button 
                className={`${styles.chipRapido} ${filtros.fechaDesde === inicioSemana.toISOString().split('T')[0] ? styles.chipActivo : ''}`}
                onClick={() => handleFiltroRapido('semana')}
              >
                Esta semana
              </button>
              <button 
                className={`${styles.chipRapido} ${filtros.fechaDesde === inicioMes.toISOString().split('T')[0] ? styles.chipActivo : ''}`}
                onClick={() => handleFiltroRapido('mes')}
              >
                Este mes
              </button>
            </div>
          )}

          <div className={styles.filtrosGrid}>
            {/* Estado */}
            {mostrarEstado && (
              <div className={styles.campo}>
                <label>Estado</label>
                <select
                  value={filtros.estado}
                  onChange={(e) => handleChange('estado', e.target.value)}
                >
                  {opcionesEstado.map(opcion => (
                    <option key={opcion.value} value={opcion.value}>
                      {opcion.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Agente */}
            {mostrarAgente && agentes.length > 0 && (
              <div className={styles.campo}>
                <label>Agente</label>
                <select
                  value={filtros.agenteId}
                  onChange={(e) => handleChange('agenteId', e.target.value)}
                >
                  <option value="">Todos</option>
                  {agentes.map(agente => (
                    <option key={agente._id} value={agente._id}>
                      {agente.nombre} {agente.apellido}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Fecha Desde */}
            {mostrarFechas && (
              <div className={styles.campo}>
                <label>Desde</label>
                <input
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(e) => handleChange('fechaDesde', e.target.value)}
                />
              </div>
            )}

            {/* Fecha Hasta */}
            {mostrarFechas && (
              <div className={styles.campo}>
                <label>Hasta</label>
                <input
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(e) => handleChange('fechaHasta', e.target.value)}
                />
              </div>
            )}

            {/* Búsqueda */}
            {mostrarBusqueda && (
              <div className={styles.campo}>
                <label>Buscar</label>
                <input
                  type="text"
                  placeholder="Cliente, agente..."
                  value={filtros.busqueda}
                  onChange={(e) => handleChange('busqueda', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className={styles.acciones}>
            <button className={styles.btnLimpiar} onClick={handleLimpiar}>
              Limpiar
            </button>
            <button className={styles.btnFiltrar} onClick={handleFiltrar}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
