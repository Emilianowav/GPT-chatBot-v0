'use client';

// ⚙️ Configuración General del Módulo de Calendario
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ModuleGuard from '@/components/ModuleGuard';
import { useConfiguracion, usePlantillas } from '@/hooks/useConfiguracion';
import * as configuracionApi from '@/lib/configuracionApi';
import styles from '../configuracion.module.css';

export default function ConfiguracionGeneralPage() {
  const { isAuthenticated, loading: authLoading, empresa } = useAuth();
  const router = useRouter();
  const empresaId = empresa?.empresaId || '';
  
  const { configuracion, loading, error, guardarConfiguracion } = useConfiguracion(empresaId);
  const { plantillas, loading: loadingPlantillas } = usePlantillas();
  
  const [formData, setFormData] = useState<Partial<configuracionApi.ConfiguracionModulo>>({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);

  useEffect(() => {
    if (configuracion) {
      setFormData(configuracion);
    }
  }, [configuracion]);

  if (authLoading || loading || loadingPlantillas) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

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
    
    setTimeout(() => setMensaje(null), 3000);
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
      
      setTimeout(() => setMensaje(null), 3000);
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.message || 'Error al guardar configuración'
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModuleGuard moduleId="calendar_booking">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>⚙️ Configuración General</h1>
          <p>Personaliza el comportamiento del sistema de turnos</p>
        </div>

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

        <form onSubmit={handleSubmit} className={styles.form}>
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
                <label>Nombre para "Turnos"</label>
                <input
                  type="text"
                  value={formData.nomenclatura?.turnos || ''}
                  onChange={(e) => handleNomenclaturaChange('turnos', e.target.value)}
                  placeholder="Ej: Viajes, Citas, Reservas"
                />
              </div>
              <div className={styles.field}>
                <label>Nombre para "Agentes"</label>
                <input
                  type="text"
                  value={formData.nomenclatura?.agentes || ''}
                  onChange={(e) => handleNomenclaturaChange('agentes', e.target.value)}
                  placeholder="Ej: Choferes, Médicos, Meseros"
                />
              </div>
              <div className={styles.field}>
                <label>Nombre para "Clientes"</label>
                <input
                  type="text"
                  value={formData.nomenclatura?.clientes || ''}
                  onChange={(e) => handleNomenclaturaChange('clientes', e.target.value)}
                  placeholder="Ej: Pasajeros, Pacientes, Comensales"
                />
              </div>
            </div>

            <h3>⏱️ Configuración de Turnos</h3>
            <div className={styles.grid2}>
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
              <div className={styles.field}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData.permiteDuracionVariable || false}
                    onChange={(e) => handleChange('permiteDuracionVariable', e.target.checked)}
                  />
                  Permitir duración variable
                </label>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.requiereConfirmacion || false}
                  onChange={(e) => handleChange('requiereConfirmacion', e.target.checked)}
                />
                Requiere confirmación del cliente
              </label>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.btnPrimary} disabled={guardando}>
              {guardando ? 'Guardando...' : '💾 Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>
    </ModuleGuard>
  );
}
