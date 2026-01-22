// 🤖 Administrador de Flujos - Gestión completa de flujos del chatbot
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useConfiguracionBot } from '@/hooks/useConfiguracionBot';
import { useConfiguracion } from '@/hooks/useConfiguracion';
import ConfiguracionBot from '@/components/calendar/ConfiguracionBot';
import ModalConfiguracionFlujo from '@/components/flujos/ModalConfiguracionFlujo';
import ModalConfiguracionAgentes from '@/components/flujos/ModalConfiguracionAgentes';
import { Power, Settings, Send, Eye, EyeOff, Plus, Edit2, Trash2 } from 'lucide-react';
import styles from './flujos.module.css';

export default function AdministradorFlujosPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const empresaId = typeof window !== 'undefined' ? localStorage.getItem('empresa_id') || '' : '';
  
  const { configuracion, loading, toggleBot } = useConfiguracionBot(empresaId);
  const { configuracion: configModulo, loading: loadingModulo } = useConfiguracion(empresaId);
  
  const [vistaActiva, setVistaActiva] = useState<'lista' | 'configuracion'>('lista');
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [enviandoPrueba, setEnviandoPrueba] = useState<string | null>(null);
  const [modalPrueba, setModalPrueba] = useState<{ flujo: string; telefono: string } | null>(null);
  const [modalConfigOpcion, setModalConfigOpcion] = useState<any>(null);
  const [modalConfigFlujo, setModalConfigFlujo] = useState<any>(null);
  const [configEditada, setConfigEditada] = useState<any>(null);
  const [guardandoConfig, setGuardandoConfig] = useState(false);

  // Redirección
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || loading || loadingModulo) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando administrador de flujos...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Flujo principal del menú - Cargar dinámicamente desde configuración
  const menuPrincipal = {
    id: 'menu_principal',
    nombre: 'Menú Principal',
    descripcion: 'Primer mensaje que reciben los clientes al escribir al chatbot',
    tipo: 'menu',
    activo: configuracion?.activo || false,
    icono: '📋',
    mensajeBienvenida: configuracion?.mensajeBienvenida || '',
    opciones: [
      {
        id: 'crearTurno',
        numero: '1️⃣',
        nombre: configuracion?.flujos?.crearTurno?.nombre || 'Reservar Turno',
        descripcion: configuracion?.flujos?.crearTurno?.descripcion || 'Permite agendar nuevos turnos',
        activo: configuracion?.flujos?.crearTurno?.pasos?.some(p => p.activo) ?? true,
        icono: '📅',
        flujo: configuracion?.flujos?.crearTurno
      },
      {
        id: 'consultarTurnos',
        numero: '2️⃣',
        nombre: configuracion?.flujos?.consultarTurnos?.nombre || 'Consultar Turnos',
        descripcion: configuracion?.flujos?.consultarTurnos?.descripcion || 'Ver turnos agendados',
        activo: configuracion?.flujos?.consultarTurnos?.pasos?.some(p => p.activo) ?? true,
        icono: '🔍',
        flujo: configuracion?.flujos?.consultarTurnos
      },
      {
        id: 'cancelarTurno',
        numero: '3️⃣',
        nombre: configuracion?.flujos?.cancelarTurno?.nombre || 'Cancelar Turno',
        descripcion: configuracion?.flujos?.cancelarTurno?.descripcion || 'Cancelar turnos existentes',
        activo: configuracion?.flujos?.cancelarTurno?.pasos?.some(p => p.activo) ?? true,
        icono: '❌',
        flujo: configuracion?.flujos?.cancelarTurno
      }
    ]
  };

  // ✅ NUEVA ESTRUCTURA: plantillasMeta
  const confirmacionTurnos = configModulo?.plantillasMeta?.confirmacionTurnos;
  const notificacionDiariaAgentes = configModulo?.plantillasMeta?.notificacionDiariaAgentes;
  
  const flujosAutomaticos = [
    {
      id: 'confirmacion_turnos',
      nombre: 'Confirmación de Turnos',
      descripcion: 'Envía recordatorios automáticos antes del turno (Plantilla Meta)',
      tipo: 'automatico',
      activo: confirmacionTurnos?.activa ?? false,
      icono: '⏰',
      trigger: (() => {
        const programacion = confirmacionTurnos?.programacion;
        
        if (!programacion) {
          return 'Configuración pendiente';
        }
        
        const diasAntes = programacion.diasAntes;
        const horaEnvio = programacion.horaEnvio;
        
        if (diasAntes && horaEnvio) {
          return `${diasAntes} día${diasAntes > 1 ? 's' : ''} antes a las ${horaEnvio}`;
        }
        
        return 'Configuración pendiente';
      })(),
      config: {
        plantilla: confirmacionTurnos?.nombre || 'clientes_sanjose',
        idioma: confirmacionTurnos?.idioma || 'es',
        anticipacion: confirmacionTurnos?.programacion?.diasAntes || 1,
        horaEnvio: confirmacionTurnos?.programacion?.horaEnvio || '21:00',
        estados: confirmacionTurnos?.programacion?.filtroEstado || ['pendiente', 'no_confirmado'],
        metaApiUrl: confirmacionTurnos?.metaApiUrl || '',
        variables: confirmacionTurnos?.variables || {}
      }
    },
    {
      id: 'notificacion_diaria_agentes',
      nombre: 'Recordatorio Diario para Agentes',
      descripcion: 'Envía un resumen diario a los agentes con todas sus reservas del día (Plantilla Meta)',
      tipo: 'automatico',
      activo: notificacionDiariaAgentes?.activa ?? false,
      icono: '📅',
      trigger: (() => {
        const programacion = notificacionDiariaAgentes?.programacion;
        
        if (!programacion) {
          return 'Configuración pendiente';
        }
        
        const horaEnvio = programacion.horaEnvio || '06:00';
        const frecuencia = programacion.frecuencia || 'diaria';
        
        if (frecuencia === 'diaria') {
          return `Todos los días a las ${horaEnvio}`;
        }
        
        return `Frecuencia ${frecuencia} a las ${horaEnvio}`;
      })(),
      config: {
        plantilla: notificacionDiariaAgentes?.nombre || 'chofer_sanjose',
        idioma: notificacionDiariaAgentes?.idioma || 'es',
        horaEnvio: notificacionDiariaAgentes?.programacion?.horaEnvio || '06:00',
        frecuencia: notificacionDiariaAgentes?.programacion?.frecuencia || 'diaria',
        rangoHorario: notificacionDiariaAgentes?.programacion?.rangoHorario || 'hoy',
        estados: notificacionDiariaAgentes?.programacion?.filtroEstado || ['pendiente', 'confirmado'],
        incluirDetalles: notificacionDiariaAgentes?.programacion?.incluirDetalles || {
          origen: true,
          destino: true,
          nombreCliente: true,
          telefonoCliente: false,
          horaReserva: true,
          notasInternas: false
        },
        metaApiUrl: notificacionDiariaAgentes?.metaApiUrl || '',
        variables: notificacionDiariaAgentes?.variables || {},
        ultimoEnvio: notificacionDiariaAgentes?.ultimoEnvio || null
      }
    },
    {
      id: 'notificacion_viajes',
      nombre: 'Notificaciones de Viajes',
      descripcion: 'Notifica cambios de estado en los viajes',
      tipo: 'automatico',
      activo: configuracion?.notificarAdmin ?? false,
      icono: '🚗',
      trigger: 'Cambio de estado',
      config: {
        estados: ['confirmado', 'en_camino', 'completado'],
        mensaje: '📢 Tu viaje ha cambiado de estado\n\n🚗 Estado: {estado}\n📍 Destino: {destino}\n🕐 Hora: {hora}'
      }
    }
  ];

  const handleToggleBotGeneral = async () => {
    try {
      await toggleBot(!configuracion?.activo);
      setMensaje({
        tipo: 'success',
        texto: configuracion?.activo ? '🔴 Chatbot desactivado' : '🟢 Chatbot activado'
      });
      setTimeout(() => setMensaje(null), 3000);
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.message
      });
    }
  };

  const handleToggleFlujo = async (flujoId: string, nuevoEstado: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      // Obtener configuración actual
      const getResponse = await fetch(`${apiUrl}/api/modules/calendar/configuracion/${empresaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!getResponse.ok) throw new Error('Error al obtener configuración');
      
      const configActual = await getResponse.json();
      
      // Actualizar según el flujo
      let configActualizada = { ...configActual };
      
      // ✅ NUEVO SISTEMA: Actualizar en plantillasMeta
      if (flujoId === 'notificacion_diaria_agentes') {
        // Inicializar plantillasMeta si no existe
        if (!configActual.plantillasMeta) {
          configActual.plantillasMeta = {};
        }
        
        configActualizada.plantillasMeta = {
          ...configActual.plantillasMeta,
          notificacionDiariaAgentes: {
            ...configActual.plantillasMeta?.notificacionDiariaAgentes,
            activa: nuevoEstado,
            // Valores por defecto si no existen
            nombre: configActual.plantillasMeta?.notificacionDiariaAgentes?.nombre || 'chofer_sanjose',
            idioma: configActual.plantillasMeta?.notificacionDiariaAgentes?.idioma || 'es',
            programacion: configActual.plantillasMeta?.notificacionDiariaAgentes?.programacion || {
              metodoVerificacion: 'hora_fija',
              horaEnvio: '06:00',
              frecuencia: 'diaria',
              rangoHorario: 'hoy',
              filtroEstado: ['pendiente', 'confirmado'],
              incluirDetalles: {
                origen: true,
                destino: true,
                nombreCliente: true,
                telefonoCliente: false,
                horaReserva: true,
                notasInternas: false
              }
            }
          }
        };
      } else if (flujoId === 'confirmacion_turnos') {
        // Inicializar plantillasMeta si no existe
        if (!configActual.plantillasMeta) {
          configActual.plantillasMeta = {};
        }
        
        configActualizada.plantillasMeta = {
          ...configActual.plantillasMeta,
          confirmacionTurnos: {
            ...configActual.plantillasMeta?.confirmacionTurnos,
            activa: nuevoEstado,
            // Valores por defecto si no existen
            nombre: configActual.plantillasMeta?.confirmacionTurnos?.nombre || 'clientes_sanjose',
            idioma: configActual.plantillasMeta?.confirmacionTurnos?.idioma || 'es',
            programacion: configActual.plantillasMeta?.confirmacionTurnos?.programacion || {
              metodoVerificacion: 'hora_fija',
              horaEnvio: '22:00',
              diasAntes: 1,
              filtroEstado: ['no_confirmado', 'pendiente']
            }
          }
        };
      }
      
      // Guardar
      const response = await fetch(`${apiUrl}/api/modules/calendar/configuracion/${empresaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(configActualizada)
      });
      
      if (!response.ok) throw new Error('Error al guardar configuración');
      
      setMensaje({
        tipo: 'success',
        texto: nuevoEstado ? '✅ Flujo activado' : '⏸️ Flujo desactivado'
      });
      
      // Recargar después de un breve delay para mostrar el mensaje
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.message || 'Error al cambiar estado del flujo'
      });
      setTimeout(() => setMensaje(null), 3000);
    }
  };

  const handleEnviarPrueba = async (flujoId: string, telefono: string) => {
    setEnviandoPrueba(flujoId);
    
    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      console.log('🧪 [Prueba] Enviando notificación:', { flujoId, telefono });
      
      // ✅ NUEVO SISTEMA UNIFICADO: Determinar tipo según flujoId
      let tipo: 'agente' | 'cliente';
      
      if (flujoId === 'notificacion_diaria_agentes') {
        tipo = 'agente';
        console.log('   📅 Tipo: Notificación diaria de agente');
      } else if (flujoId === 'confirmacion_turnos') {
        tipo = 'cliente';
        console.log('   ✅ Tipo: Confirmación de turno');
      } else {
        // Para otros flujos, intentar determinar el tipo
        console.log('   ⚠️ Flujo no reconocido, usando tipo por defecto');
        tipo = 'cliente'; // Por defecto usar cliente
      }
      
      // ✅ USAR NUEVO ENDPOINT UNIFICADO para agentes y clientes
      console.log(`   🎯 Usando endpoint unificado: /notificaciones-meta/test`);
      const response = await fetch(`${apiUrl}/api/modules/calendar/notificaciones-meta/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tipo,
          empresaId,
          telefono
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al enviar mensaje de prueba');
      }

      const data = await response.json();
      
      setMensaje({
        tipo: 'success',
        texto: `✅ ${data.message || 'Mensaje de prueba enviado'}`
      });
      setModalPrueba(null);
    } catch (err: any) {
      // Detectar errores específicos y mostrar mensajes útiles
      let mensajeError = err.message || 'Error al enviar prueba';
      
      if (mensajeError.includes('No hay viajes programados')) {
        mensajeError = `⚠️ No hay turnos pendientes para este teléfono en los próximos 7 días.\n\n💡 Para probar:\n• Crea un turno pendiente para este cliente\n• O usa el teléfono de un cliente con turnos pendientes`;
      } else if (mensajeError.includes('Cliente no encontrado')) {
        mensajeError = `⚠️ Cliente no encontrado en la base de datos.\n\n💡 Verifica que el teléfono esté registrado como cliente.`;
      } else if (mensajeError.includes('Empresa no encontrada')) {
        mensajeError = `❌ Error de configuración: Empresa no encontrada.\n\n💡 Contacta al administrador del sistema.`;
      }
      
      setMensaje({
        tipo: 'error',
        texto: mensajeError
      });
    } finally {
      setEnviandoPrueba(null);
      setTimeout(() => setMensaje(null), 8000); // Más tiempo para leer mensajes largos
    }
  };

  const handleGuardarConfigFlujo = async (config: any) => {
    if (!config || !modalConfigFlujo) return;
    
    console.log('🔧 Guardando configuración:', config);
    
    setGuardandoConfig(true);
    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      // ✅ NUEVO: Si es el flujo de notificación diaria de agentes
      if (modalConfigFlujo.id === 'notificacion_diaria_agentes') {
        // Primero obtener la configuración actual
        const getResponse = await fetch(`${apiUrl}/api/modules/calendar/configuracion/${empresaId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!getResponse.ok) {
          throw new Error('Error al obtener configuración actual');
        }
        const response = await fetch(`${apiUrl}/api/modules/calendar/configuracion/${empresaId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(configActualizada)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al guardar configuración');
        }

        setMensaje({
          tipo: 'success',
          texto: '✅ Configuración de recordatorio diario guardada correctamente'
        });
        setModalConfigFlujo(null);
        setConfigEditada(null);
        
        // Recargar después de un breve delay
        setTimeout(() => {
          window.location.reload();
        }, 800);
        return;
      }
      
      // ✅ NUEVO: Para confirmación de turnos
      if (modalConfigFlujo.id === 'confirmacion_turnos') {
        // Primero obtener la configuración actual
        const getResponse = await fetch(`${apiUrl}/api/modules/calendar/configuracion/${empresaId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!getResponse.ok) {
          throw new Error('Error al obtener configuración actual');
        }
        
        const { configuracion: configActual } = await getResponse.json();
        
        // ✅ Actualizar en plantillasMeta (NUEVO SISTEMA UNIFICADO)
        const configActualizada = {
          ...configActual,
          plantillasMeta: {
            ...configActual.plantillasMeta,
            confirmacionTurnos: {
              ...configActual.plantillasMeta?.confirmacionTurnos,
              activa: config.activo,
              programacion: {
                ...configActual.plantillasMeta?.confirmacionTurnos?.programacion,
                metodoVerificacion: 'hora_fija',
                horaEnvio: config.horaEnvio || '22:00',
                diasAntes: config.anticipacion || 1,
                filtroEstado: config.estados || ['no_confirmado', 'pendiente']
              }
            }
          }
        };
        
        console.log('💾 [Clientes] Guardando en plantillasMeta:', configActualizada.plantillasMeta.confirmacionTurnos);
        
        // Guardar configuración actualizada
        const response = await fetch(`${apiUrl}/api/modules/calendar/configuracion/${empresaId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(configActualizada)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al guardar configuración');
        }

        setMensaje({
          tipo: 'success',
          texto: '✅ Configuración de confirmación guardada correctamente'
        });
        setModalConfigFlujo(null);
        setConfigEditada(null);
        
        // Recargar después de un breve delay
        setTimeout(() => {
          window.location.reload();
        }, 800);
        return;
      }
      
      // ⚠️ FALLBACK: Para otros flujos antiguos (mantener compatibilidad)
      const getResponse = await fetch(`${apiUrl}/api/modules/calendar/configuracion/${empresaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!getResponse.ok) {
        throw new Error('Error al obtener configuración actual');
      }
      
      const { configuracion: configActual } = await getResponse.json();
      
      // Actualizar la notificación específica
      const notificacionesActualizadas = configActual.notificaciones.map((notif: any) => {
        if (notif.tipo === 'confirmacion') {
          const notifActualizada = {
            ...notif,
            activa: config.activo,
            plantillaMensaje: config.mensaje,
            diasAntes: config.anticipacion || notif.diasAntes,
            horaEnvioDiaAntes: config.horaEnvio || notif.horaEnvioDiaAntes,
            momento: 'dia_antes_turno',
            requiereConfirmacion: config.solicitarConfirmacion ?? notif.requiereConfirmacion,
            mensajeConfirmacion: config.mensajeConfirmacion || notif.mensajeConfirmacion,
            filtros: {
              ...notif.filtros,
              estados: config.estados || notif.filtros?.estados || ['no_confirmado', 'pendiente']
            }
          };
          console.log('📝 Notificación actualizada (fallback):', notifActualizada);
          return notifActualizada;
        }
        return notif;
      });
      
      console.log('💾 Enviando al backend (fallback):', { notificaciones: notificacionesActualizadas });
      
      // Guardar configuración actualizada
      const response = await fetch(`${apiUrl}/api/modules/calendar/configuracion/${empresaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...configActual,
          notificaciones: notificacionesActualizadas
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar configuración');
      }

      setMensaje({
        tipo: 'success',
        texto: '✅ Configuración guardada correctamente'
      });
      setModalConfigFlujo(null);
      setConfigEditada(null);
      
      // Recargar después de un breve delay
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.message || 'Error al guardar configuración'
      });
    } finally {
      setGuardandoConfig(false);
      setTimeout(() => setMensaje(null), 5000);
    }
  };


  return (
    <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>Administrador de Flujos</h1>
            <p>Gestiona, configura y prueba los flujos del chatbot</p>
          </div>
          
          <div className={styles.headerActions}>
            {/* Toggle general del bot */}
            <div className={styles.botStatus}>
              <span className={styles.statusLabel}>
                Estado del Bot: 
                <strong className={configuracion?.activo ? styles.statusActive : styles.statusInactive}>
                  {configuracion?.activo ? ' 🟢 Activo' : ' 🔴 Inactivo'}
                </strong>
              </span>
              <button
                onClick={handleToggleBotGeneral}
                className={`${styles.btnToggle} ${configuracion?.activo ? styles.active : ''}`}
              >
                <Power size={18} />
                {configuracion?.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        </div>

        {mensaje && (
          <div className={`${styles.mensaje} ${styles[mensaje.tipo]}`}>
            {mensaje.texto}
          </div>
        )}

        {/* Tabs de navegación */}
        <div className={styles.tabs}>
          <button
            className={vistaActiva === 'lista' ? styles.tabActive : styles.tab}
            onClick={() => setVistaActiva('lista')}
          >
            <Eye size={18} />
            Ver Flujos
          </button>
          <button
            className={vistaActiva === 'configuracion' ? styles.tabActive : styles.tab}
            onClick={() => setVistaActiva('configuracion')}
          >
            <Settings size={18} />
            Configuración General
          </button>
        </div>

        {/* Vista: Lista de Flujos */}
        {vistaActiva === 'lista' && (
          <div className={styles.content}>
            
            {/* MENÚ PRINCIPAL */}
            <div className={styles.menuSection}>
              <div className={styles.menuCard}>
                <div className={styles.menuHeader}>
                  <div className={styles.menuIcono}>{menuPrincipal.icono}</div>
                  <div className={styles.menuInfo}>
                    <h2>{menuPrincipal.nombre}</h2>
                    <p>{menuPrincipal.descripcion}</p>
                  </div>
                  <div className={styles.menuToggle}>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={menuPrincipal.activo}
                        onChange={handleToggleBotGeneral}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>

                <div className={styles.menuOpciones}>
                  <h3>Opciones del Menú</h3>
                  <div className={styles.opcionesGrid}>
                    {menuPrincipal.opciones.map((opcion) => (
                      <div key={opcion.id} className={styles.opcionCard}>
                        <div className={styles.opcionNumero}>{opcion.numero}</div>
                        <div className={styles.opcionIcono}>{opcion.icono}</div>
                        <div className={styles.opcionInfo}>
                          <h4>{opcion.nombre}</h4>
                          <p>{opcion.descripcion}</p>
                        </div>
                        <div className={styles.opcionAcciones}>
                          <button
                            onClick={() => setModalConfigOpcion(opcion)}
                            className={styles.btnConfigOpcion}
                            title="Configurar opción"
                          >
                            <Settings size={16} />
                          </button>
                          <label className={styles.switchSmall}>
                            <input
                              type="checkbox"
                              checked={opcion.activo}
                              onChange={() => {/* TODO: toggle opción */}}
                            />
                            <span className={styles.sliderSmall}></span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.menuAcciones}>
                  <button
                    onClick={() => setVistaActiva('configuracion')}
                    className={styles.btnEditar}
                  >
                    <Settings size={18} />
                    Configurar Mensajes
                  </button>
                  <button
                    onClick={() => setModalPrueba({ flujo: 'menu_principal', telefono: '' })}
                    className={styles.btnPrueba}
                    disabled={!menuPrincipal.activo}
                  >
                    <Send size={18} />
                    Probar Menú
                  </button>
                </div>
              </div>
            </div>

            {/* FLUJOS AUTOMÁTICOS */}
            <div className={styles.flujosSection}>
              <h2 className={styles.sectionTitle}>⚡ Flujos Automáticos</h2>
              <div className={styles.flujosGrid}>
                {flujosAutomaticos.map((flujo) => (
                  <div key={flujo.id} className={`${styles.flujoCard} ${!flujo.activo ? styles.flujoInactivo : ''}`}>
                    <div className={styles.flujoHeader}>
                      <div className={styles.flujoIcono}>{flujo.icono}</div>
                      <div className={styles.flujoInfo}>
                        <h3>{flujo.nombre}</h3>
                        <p>{flujo.descripcion}</p>
                      </div>
                      <div className={styles.flujoToggle}>
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            checked={flujo.activo}
                            onChange={() => handleToggleFlujo(flujo.id, !flujo.activo)}
                          />
                          <span className={styles.slider}></span>
                        </label>
                      </div>
                    </div>

                    <div className={styles.flujoTrigger}>
                      <span className={styles.triggerLabel}>Se activa:</span>
                      <span className={styles.triggerValue}>{flujo.trigger}</span>
                    </div>

                    {/* ✅ Información de Plantilla Meta */}
                    {flujo.config.plantilla && (
                      <div className={styles.flujoMeta}>
                        <div className={styles.metaInfo}>
                          <span className={styles.metaLabel}>📋 Plantilla:</span>
                          <span className={styles.metaValue}>{flujo.config.plantilla}</span>
                        </div>
                        <div className={styles.metaInfo}>
                          <span className={styles.metaLabel}>🌐 Idioma:</span>
                          <span className={styles.metaValue}>{flujo.config.idioma}</span>
                        </div>
                        {flujo.config.ultimoEnvio && (
                          <div className={styles.metaInfo}>
                            <span className={styles.metaLabel}>⏰ Último envío:</span>
                            <span className={styles.metaValue}>
                              {new Date(flujo.config.ultimoEnvio).toLocaleString('es-AR')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className={styles.flujoAcciones}>
                      <button
                        onClick={() => {
                          setModalConfigFlujo(flujo);
                          setConfigEditada({
                            id: flujo.id,
                            activo: flujo.activo,
                            mensaje: flujo.config.mensaje,
                            anticipacion: flujo.config.anticipacion,
                            solicitarConfirmacion: flujo.config.solicitarConfirmacion,
                            estados: flujo.config.estados
                          });
                        }}
                        className={styles.btnEditar}
                      >
                        <Settings size={16} />
                        Configurar
                      </button>
                      <button
                        onClick={() => setModalPrueba({ flujo: flujo.id, telefono: '' })}
                        className={styles.btnPrueba}
                        disabled={!flujo.activo}
                      >
                        <Send size={16} />
                        Probar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Información adicional */}
            <div className={styles.infoBox}>
              <h3>💡 Guía Rápida</h3>
              <ul>
                <li><strong>Menú Principal:</strong> Es el primer mensaje que reciben tus clientes. Actívalo/desactívalo con el switch principal.</li>
                <li><strong>Opciones del Menú:</strong> Cada opción puede activarse/desactivarse individualmente. Los clientes solo verán las opciones activas.</li>
                <li><strong>Flujos Automáticos:</strong> Se ejecutan automáticamente según eventos (ej: 24h antes del turno).</li>
                <li><strong>Probar Menú:</strong> Envía el mensaje del menú a tu WhatsApp para verificar cómo se ve.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Vista: Configuración General */}
        {vistaActiva === 'configuracion' && (
          <div className={styles.content}>
            <ConfiguracionBot empresaId={empresaId} />
          </div>
        )}

        {/* Modal de Prueba */}
        {modalPrueba && (
          <div className={styles.modal} onClick={() => setModalPrueba(null)}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <h3>📱 Enviar Mensaje de Prueba</h3>
              <p>Ingresa el número de teléfono para probar el <strong>Menú Principal</strong></p>
              
              <div className={styles.field}>
                <label>Número de WhatsApp (con código de país)</label>
                <input
                  type="tel"
                  value={modalPrueba.telefono}
                  onChange={(e) => setModalPrueba({ ...modalPrueba, telefono: e.target.value })}
                  placeholder="+54 9 11 1234-5678"
                  autoFocus
                />
                <small>Ejemplo: +5491112345678</small>
              </div>

              <div className={styles.modalActions}>
                <button
                  onClick={() => setModalPrueba(null)}
                  className={styles.btnCancelar}
                  disabled={enviandoPrueba !== null}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleEnviarPrueba(modalPrueba.flujo, modalPrueba.telefono)}
                  className={styles.btnEnviar}
                  disabled={!modalPrueba.telefono || enviandoPrueba !== null}
                >
                  {enviandoPrueba ? 'Enviando...' : '📤 Enviar Prueba'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Configurar Opción del Menú */}
        {modalConfigOpcion && (
          <div className={styles.modal} onClick={() => setModalConfigOpcion(null)}>
            <div className={styles.modalContentLarge} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div className={styles.modalIcono}>{modalConfigOpcion.icono}</div>
                <div>
                  <h3>{modalConfigOpcion.nombre}</h3>
                  <p>{modalConfigOpcion.descripcion}</p>
                </div>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.field}>
                  <label>Estado de la Opción</label>
                  <div className={styles.toggleField}>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={modalConfigOpcion.activo}
                        onChange={() => {/* TODO: toggle */}}
                      />
                      <span className={styles.slider}></span>
                    </label>
                    <span>{modalConfigOpcion.activo ? '🟢 Activa' : '🔴 Inactiva'}</span>
                  </div>
                  <small>Cuando está inactiva, esta opción no aparecerá en el menú del chatbot</small>
                </div>

                {modalConfigOpcion.flujo && (
                  <>
                    <div className={styles.field}>
                      <label>Información del Flujo</label>
                      <div className={styles.infoCard}>
                        <p><strong>Nombre:</strong> {modalConfigOpcion.flujo.nombre}</p>
                        <p><strong>Descripción:</strong> {modalConfigOpcion.flujo.descripcion}</p>
                        <p><strong>Pasos configurados:</strong> {modalConfigOpcion.flujo.pasos?.length || 0}</p>
                        <p><strong>Pasos activos:</strong> {modalConfigOpcion.flujo.pasos?.filter((p: any) => p.activo).length || 0}</p>
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label>Pasos del Flujo</label>
                      <div className={styles.pasosList}>
                        {modalConfigOpcion.flujo.pasos?.map((paso: any, index: number) => (
                          <div key={paso.id} className={`${styles.pasoItem} ${!paso.activo ? styles.pasoInactivo : ''}`}>
                            <div className={styles.pasoNumero}>{index + 1}</div>
                            <div className={styles.pasoInfo}>
                              <strong>{paso.etiqueta}</strong>
                              <p>{paso.mensaje}</p>
                              {paso.campoACapturar && (
                                <span className={styles.pasoCampo}>Campo: {paso.campoACapturar}</span>
                              )}
                            </div>
                            <div className={styles.pasoEstado}>
                              {paso.activo ? '✅' : '⏸️'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className={styles.infoAlert}>
                  <strong>💡 Tip:</strong> Puedes personalizar cada paso del flujo en la sección "Configuración General"
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  onClick={() => setModalConfigOpcion(null)}
                  className={styles.btnCancelar}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    // TODO: Guardar configuración
                    setModalConfigOpcion(null);
                    setMensaje({ tipo: 'success', texto: '✅ Configuración guardada' });
                    setTimeout(() => setMensaje(null), 3000);
                  }}
                  className={styles.btnEnviar}
                >
                  💾 Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Configurar Flujo Automático */}
        {modalConfigFlujo?.id === 'notificacion_diaria_agentes' ? (
          <ModalConfiguracionAgentes
            isOpen={!!modalConfigFlujo}
            onClose={() => {
              setModalConfigFlujo(null);
              setConfigEditada(null);
            }}
            flujo={modalConfigFlujo}
            onGuardar={handleGuardarConfigFlujo}
          />
        ) : (
          <ModalConfiguracionFlujo
            isOpen={!!modalConfigFlujo}
            onClose={() => {
              setModalConfigFlujo(null);
              setConfigEditada(null);
            }}
            flujo={modalConfigFlujo}
            onGuardar={handleGuardarConfigFlujo}
          />
        )}
    </div>
  );
}
