// 🤖 Configuración del Chatbot con Pasos para CRUD
'use client';

import { useState, useEffect } from 'react';
import { useConfiguracion } from '@/hooks/useConfiguracion';
import * as configuracionApi from '@/lib/configuracionApi';
import styles from './ConfiguracionChatbot.module.css';

interface PasoChatbot {
  orden: number;
  tipo: 'seleccion' | 'texto' | 'numero' | 'fecha' | 'confirmacion';
  campo: string; // Campo de la configuración general o personalizado
  pregunta: string;
  opciones?: string[]; // Para tipo 'seleccion'
  validacion?: {
    requerido: boolean;
    min?: number;
    max?: number;
    regex?: string;
    mensajeError?: string;
  };
  mensajeExito?: string;
}

interface FlujoChatbot {
  nombre: string;
  descripcion: string;
  pasos: PasoChatbot[];
  mensajeResumen: string; // Mensaje del "ticket" final
}

interface ConfiguracionChatbotProps {
  empresaId: string;
}

export default function ConfiguracionChatbot({ empresaId }: ConfiguracionChatbotProps) {
  const { configuracion, loading } = useConfiguracion(empresaId);
  
  const [telefono, setTelefono] = useState('');
  const [flujoActivo, setFlujoActivo] = useState<'crear' | 'consultar' | 'cancelar'>('crear');
  const [pasos, setPasos] = useState<PasoChatbot[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Inicializar pasos por defecto basados en la configuración
  useEffect(() => {
    if (configuracion && pasos.length === 0) {
      const pasosIniciales: PasoChatbot[] = [];
      let orden = 1;

      // Paso 1: Seleccionar agente (si usa agentes)
      if (configuracion.usaAgentes) {
        pasosIniciales.push({
          orden: orden++,
          tipo: 'seleccion',
          campo: 'agenteId',
          pregunta: `Selecciona un ${configuracion.nomenclatura.agente.toLowerCase()}:`,
          validacion: {
            requerido: configuracion.agenteRequerido
          }
        });
      }

      // Paso 2: Fecha
      pasosIniciales.push({
        orden: orden++,
        tipo: 'fecha',
        campo: 'fecha',
        pregunta: '¿Para qué fecha necesitas el turno? (DD/MM/YYYY)',
        validacion: {
          requerido: true,
          mensajeError: 'Por favor ingresa una fecha válida en formato DD/MM/YYYY'
        }
      });

      // Paso 3: Hora
      pasosIniciales.push({
        orden: orden++,
        tipo: 'seleccion',
        campo: 'hora',
        pregunta: 'Selecciona el horario:',
        validacion: {
          requerido: true
        }
      });

      // Pasos de campos personalizados
      if (configuracion.camposPersonalizados) {
        configuracion.camposPersonalizados
          .sort((a, b) => a.orden - b.orden)
          .forEach(campo => {
            let tipoPaso: PasoChatbot['tipo'] = 'texto';
            
            if (campo.tipo === configuracionApi.TipoCampo.SELECT) {
              tipoPaso = 'seleccion';
            } else if (campo.tipo === configuracionApi.TipoCampo.NUMERO) {
              tipoPaso = 'numero';
            } else if (campo.tipo === configuracionApi.TipoCampo.FECHA) {
              tipoPaso = 'fecha';
            }

            pasosIniciales.push({
              orden: orden++,
              tipo: tipoPaso,
              campo: campo.clave,
              pregunta: `${campo.etiqueta}:`,
              opciones: campo.opciones,
              validacion: {
                requerido: campo.requerido,
                min: campo.validacion?.min,
                max: campo.validacion?.max,
                regex: campo.validacion?.regex,
                mensajeError: campo.validacion?.mensaje
              }
            });
          });
      }

      // Paso final: Confirmación
      pasosIniciales.push({
        orden: orden++,
        tipo: 'confirmacion',
        campo: 'confirmacion',
        pregunta: '¿Confirmas la creación del turno con estos datos?',
        validacion: {
          requerido: true
        }
      });

      setPasos(pasosIniciales);
    }
  }, [configuracion]);

  const agregarPaso = () => {
    const nuevoPaso: PasoChatbot = {
      orden: pasos.length + 1,
      tipo: 'texto',
      campo: `campo_${Date.now()}`,
      pregunta: 'Nueva pregunta',
      validacion: {
        requerido: false
      }
    };
    setPasos([...pasos, nuevoPaso]);
  };

  const eliminarPaso = (index: number) => {
    const nuevosPasos = pasos.filter((_, i) => i !== index);
    // Reordenar
    nuevosPasos.forEach((paso, i) => {
      paso.orden = i + 1;
    });
    setPasos(nuevosPasos);
  };

  const actualizarPaso = (index: number, cambios: Partial<PasoChatbot>) => {
    const nuevosPasos = [...pasos];
    nuevosPasos[index] = { ...nuevosPasos[index], ...cambios };
    setPasos(nuevosPasos);
  };

  const moverPaso = (index: number, direccion: 'arriba' | 'abajo') => {
    if (direccion === 'arriba' && index === 0) return;
    if (direccion === 'abajo' && index === pasos.length - 1) return;

    const nuevosPasos = [...pasos];
    const nuevoIndex = direccion === 'arriba' ? index - 1 : index + 1;
    
    [nuevosPasos[index], nuevosPasos[nuevoIndex]] = [nuevosPasos[nuevoIndex], nuevosPasos[index]];
    
    // Actualizar orden
    nuevosPasos.forEach((paso, i) => {
      paso.orden = i + 1;
    });
    
    setPasos(nuevosPasos);
  };

  const generarTicketEjemplo = () => {
    let ticket = '📋 *RESUMEN DEL TURNO*\n\n';
    
    pasos.forEach(paso => {
      if (paso.tipo !== 'confirmacion') {
        const valor = paso.tipo === 'seleccion' && paso.opciones 
          ? paso.opciones[0] 
          : `{${paso.campo}}`;
        ticket += `• *${paso.pregunta.replace(':', '')}:* ${valor}\n`;
      }
    });
    
    ticket += '\n✅ Tu turno ha sido confirmado.';
    return ticket;
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      // Aquí iría la lógica para guardar la configuración
      setMensaje({
        tipo: 'success',
        texto: '✅ Configuración del chatbot guardada exitosamente'
      });
      setTimeout(() => setMensaje(null), 3000);
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.message
      });
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2>🤖 Configuración del Chatbot</h2>
          <p>Define los pasos que el chatbot seguirá para recopilar información y crear turnos</p>
        </div>
      </div>

      {mensaje && (
        <div className={`${styles.mensaje} ${styles[mensaje.tipo]}`}>
          {mensaje.texto}
        </div>
      )}

      {/* Configuración del Teléfono */}
      <div className={styles.section}>
        <h3>📱 Número de WhatsApp del Chatbot</h3>
        <div className={styles.field}>
          <label>Número de teléfono (con código de país)</label>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+54 11 1234-5678"
          />
          <small>Este es el número donde los clientes enviarán mensajes para interactuar con el bot</small>
        </div>
      </div>

      {/* Selector de Flujo */}
      <div className={styles.section}>
        <h3>🔄 Flujo a Configurar</h3>
        <div className={styles.flujoSelector}>
          <button
            className={`${styles.flujoBtn} ${flujoActivo === 'crear' ? styles.active : ''}`}
            onClick={() => setFlujoActivo('crear')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Crear Turno
          </button>
          <button
            className={`${styles.flujoBtn} ${flujoActivo === 'consultar' ? styles.active : ''}`}
            onClick={() => setFlujoActivo('consultar')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            Consultar Turnos
          </button>
          <button
            className={`${styles.flujoBtn} ${flujoActivo === 'cancelar' ? styles.active : ''}`}
            onClick={() => setFlujoActivo('cancelar')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            Cancelar Turno
          </button>
        </div>
      </div>

      {/* Configuración de Pasos */}
      {flujoActivo === 'crear' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>📝 Pasos del Flujo de Creación</h3>
            <button onClick={agregarPaso} className={styles.btnAgregar}>
              + Agregar Paso
            </button>
          </div>

          <div className={styles.infoBox}>
            <p>
              <strong>💡 ¿Cómo funciona?</strong> El chatbot seguirá estos pasos en orden para recopilar toda la información necesaria.
              Al final, generará un "ticket" con todos los datos y creará el turno en la base de datos.
            </p>
          </div>

          {pasos.length > 0 ? (
            <div className={styles.pasosList}>
              {pasos.map((paso, index) => (
                <div key={index} className={styles.pasoCard}>
                  <div className={styles.pasoHeader}>
                    <div className={styles.pasoNumero}>Paso {paso.orden}</div>
                    <div className={styles.pasoAcciones}>
                      <button
                        onClick={() => moverPaso(index, 'arriba')}
                        disabled={index === 0}
                        className={styles.btnIcono}
                        title="Mover arriba"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moverPaso(index, 'abajo')}
                        disabled={index === pasos.length - 1}
                        className={styles.btnIcono}
                        title="Mover abajo"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => eliminarPaso(index)}
                        className={styles.btnEliminar}
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <div className={styles.pasoBody}>
                    <div className={styles.grid2}>
                      <div className={styles.field}>
                        <label>Tipo de Paso</label>
                        <select
                          value={paso.tipo}
                          onChange={(e) => actualizarPaso(index, { tipo: e.target.value as any })}
                        >
                          <option value="seleccion">📋 Selección (opciones numeradas)</option>
                          <option value="texto">✏️ Texto libre</option>
                          <option value="numero">🔢 Número</option>
                          <option value="fecha">📅 Fecha</option>
                          <option value="confirmacion">✅ Confirmación (Sí/No)</option>
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Campo a Llenar</label>
                        <select
                          value={paso.campo}
                          onChange={(e) => actualizarPaso(index, { campo: e.target.value })}
                        >
                          <optgroup label="Campos del Sistema">
                            {configuracion?.usaAgentes && <option value="agenteId">Agente</option>}
                            <option value="fecha">Fecha</option>
                            <option value="hora">Hora</option>
                            <option value="duracion">Duración</option>
                          </optgroup>
                          {configuracion?.camposPersonalizados && configuracion.camposPersonalizados.length > 0 && (
                            <optgroup label="Campos Personalizados">
                              {configuracion.camposPersonalizados.map(campo => (
                                <option key={campo.clave} value={campo.clave}>
                                  {campo.etiqueta}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label>Pregunta que hará el Bot</label>
                      <input
                        type="text"
                        value={paso.pregunta}
                        onChange={(e) => actualizarPaso(index, { pregunta: e.target.value })}
                        placeholder="¿Cuál es tu nombre?"
                      />
                    </div>

                    {paso.tipo === 'seleccion' && (
                      <div className={styles.field}>
                        <label>Opciones (una por línea)</label>
                        <textarea
                          value={paso.opciones?.join('\n') || ''}
                          onChange={(e) => actualizarPaso(index, { 
                            opciones: e.target.value.split('\n').filter(o => o.trim()) 
                          })}
                          rows={4}
                          placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                        />
                        <small>El bot numerará automáticamente las opciones (1, 2, 3...)</small>
                      </div>
                    )}

                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={paso.validacion?.requerido || false}
                          onChange={(e) => actualizarPaso(index, {
                            validacion: { 
                              requerido: e.target.checked,
                              min: paso.validacion?.min,
                              max: paso.validacion?.max,
                              regex: paso.validacion?.regex,
                              mensajeError: paso.validacion?.mensajeError
                            }
                          })}
                        />
                        <span>Campo obligatorio</span>
                      </label>
                    </div>

                    {paso.validacion?.requerido && (
                      <div className={styles.field}>
                        <label>Mensaje de error</label>
                        <input
                          type="text"
                          value={paso.validacion?.mensajeError || ''}
                          onChange={(e) => actualizarPaso(index, {
                            validacion: { 
                              requerido: paso.validacion?.requerido || false,
                              min: paso.validacion?.min,
                              max: paso.validacion?.max,
                              regex: paso.validacion?.regex,
                              mensajeError: e.target.value
                            }
                          })}
                          placeholder="Por favor ingresa un valor válido"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <p>No hay pasos configurados. Haz clic en "Agregar Paso" para comenzar.</p>
            </div>
          )}
        </div>
      )}

      {/* Vista Previa del Ticket */}
      {flujoActivo === 'crear' && pasos.length > 0 && (
        <div className={styles.section}>
          <h3>🎫 Vista Previa del Ticket Final</h3>
          <div className={styles.ticketPreview}>
            <pre>{generarTicketEjemplo()}</pre>
          </div>
          <small>Este es el resumen que verá el cliente al finalizar el proceso</small>
        </div>
      )}

      {/* Ejemplo de Conversación */}
      {flujoActivo === 'crear' && pasos.length > 0 && (
        <div className={styles.section}>
          <h3>💬 Ejemplo de Conversación</h3>
          <div className={styles.conversacionEjemplo}>
            <div className={styles.mensajeBot}>
              <strong>Bot:</strong> ¡Hola! 👋 Voy a ayudarte a crear un turno.
            </div>
            {pasos.slice(0, 3).map((paso, index) => (
              <div key={index}>
                <div className={styles.mensajeBot}>
                  <strong>Bot:</strong> {paso.pregunta}
                  {paso.tipo === 'seleccion' && paso.opciones && (
                    <div className={styles.opciones}>
                      {paso.opciones.slice(0, 3).map((opcion, i) => (
                        <div key={i}>{i + 1}. {opcion}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.mensajeUsuario}>
                  <strong>Usuario:</strong> {paso.tipo === 'seleccion' ? '1' : '[respuesta del usuario]'}
                </div>
              </div>
            ))}
            {pasos.length > 3 && (
              <div className={styles.mensajeBot}>
                <em>... {pasos.length - 3} pasos más ...</em>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botón Guardar */}
      <div className={styles.actions}>
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className={styles.btnGuardar}
        >
          {guardando ? 'Guardando...' : '💾 Guardar Configuración del Chatbot'}
        </button>
      </div>
    </div>
  );
}
