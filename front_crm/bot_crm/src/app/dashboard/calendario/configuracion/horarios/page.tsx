'use client';

// 🕐 Página de Configuración de Horarios
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ModuleGuard from '@/components/ModuleGuard';
import styles from './horarios.module.css';

interface HorarioSemana {
  dia: string;
  activo: boolean;
  horaInicio: string;
  horaFin: string;
  pausaInicio?: string;
  pausaFin?: string;
}

export default function HorariosPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [horarios, setHorarios] = useState<HorarioSemana[]>([
    { dia: 'Lunes', activo: true, horaInicio: '09:00', horaFin: '18:00', pausaInicio: '13:00', pausaFin: '14:00' },
    { dia: 'Martes', activo: true, horaInicio: '09:00', horaFin: '18:00', pausaInicio: '13:00', pausaFin: '14:00' },
    { dia: 'Miércoles', activo: true, horaInicio: '09:00', horaFin: '18:00', pausaInicio: '13:00', pausaFin: '14:00' },
    { dia: 'Jueves', activo: true, horaInicio: '09:00', horaFin: '18:00', pausaInicio: '13:00', pausaFin: '14:00' },
    { dia: 'Viernes', activo: true, horaInicio: '09:00', horaFin: '18:00', pausaInicio: '13:00', pausaFin: '14:00' },
    { dia: 'Sábado', activo: false, horaInicio: '09:00', horaFin: '13:00' },
    { dia: 'Domingo', activo: false, horaInicio: '09:00', horaFin: '13:00' },
  ]);

  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  if (authLoading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  const handleToggleDia = (index: number) => {
    const nuevosHorarios = [...horarios];
    nuevosHorarios[index].activo = !nuevosHorarios[index].activo;
    setHorarios(nuevosHorarios);
  };

  const handleCambioHorario = (index: number, campo: keyof HorarioSemana, valor: string) => {
    const nuevosHorarios = [...horarios];
    (nuevosHorarios[index] as any)[campo] = valor;
    setHorarios(nuevosHorarios);
  };

  const handleGuardar = () => {
    // Aquí iría la lógica para guardar en el backend
    setMensaje({
      tipo: 'success',
      texto: '✅ Horarios guardados exitosamente'
    });
    
    setTimeout(() => {
      setMensaje(null);
    }, 3000);
  };

  const aplicarATodos = () => {
    const primerDia = horarios[0];
    const nuevosHorarios = horarios.map(h => ({
      ...h,
      horaInicio: primerDia.horaInicio,
      horaFin: primerDia.horaFin,
      pausaInicio: primerDia.pausaInicio,
      pausaFin: primerDia.pausaFin
    }));
    setHorarios(nuevosHorarios);
  };

  return (
    <ModuleGuard moduleId="calendar_booking">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>🕐 Configuración de Horarios</h1>
            <p>Define los horarios de atención para cada día de la semana</p>
          </div>
          <button className={styles.btnAplicar} onClick={aplicarATodos}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="17 1 21 5 17 9"/>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <polyline points="7 23 3 19 7 15"/>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
            Aplicar Lunes a Todos
          </button>
        </div>

        {mensaje && (
          <div className={`${styles.mensaje} ${styles[mensaje.tipo]}`}>
            {mensaje.texto}
          </div>
        )}

        <div className={styles.horariosGrid}>
          {horarios.map((horario, index) => (
            <div key={horario.dia} className={`${styles.horarioCard} ${!horario.activo ? styles.inactivo : ''}`}>
              <div className={styles.cardHeader}>
                <div className={styles.diaInfo}>
                  <h3>{horario.dia}</h3>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={horario.activo}
                      onChange={() => handleToggleDia(index)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>

              {horario.activo && (
                <div className={styles.cardBody}>
                  <div className={styles.horarioRow}>
                    <label>Horario de Atención</label>
                    <div className={styles.timeInputs}>
                      <input
                        type="time"
                        value={horario.horaInicio}
                        onChange={(e) => handleCambioHorario(index, 'horaInicio', e.target.value)}
                      />
                      <span>hasta</span>
                      <input
                        type="time"
                        value={horario.horaFin}
                        onChange={(e) => handleCambioHorario(index, 'horaFin', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.horarioRow}>
                    <label>Pausa (Opcional)</label>
                    <div className={styles.timeInputs}>
                      <input
                        type="time"
                        value={horario.pausaInicio || ''}
                        onChange={(e) => handleCambioHorario(index, 'pausaInicio', e.target.value)}
                        placeholder="Inicio"
                      />
                      <span>hasta</span>
                      <input
                        type="time"
                        value={horario.pausaFin || ''}
                        onChange={(e) => handleCambioHorario(index, 'pausaFin', e.target.value)}
                        placeholder="Fin"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!horario.activo && (
                <div className={styles.cerrado}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  <span>Cerrado</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.btnGuardar} onClick={handleGuardar}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Guardar Cambios
          </button>
        </div>
      </div>
    </ModuleGuard>
  );
}
