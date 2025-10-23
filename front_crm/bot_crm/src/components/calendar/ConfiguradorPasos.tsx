// 🔧 Configurador de Pasos del Bot
'use client';

import { useState } from 'react';
import { Plus, GripVertical, Settings, Trash2, Eye, EyeOff } from 'lucide-react';
import styles from './ConfiguradorPasos.module.css';

export interface PasoBot {
  id: string;
  orden: number;
  activo: boolean;
  tipo: 'menu' | 'input' | 'confirmacion' | 'finalizar';
  etiqueta: string;
  mensaje: string;
  campoACapturar?: string;
  guardarEn?: 'datos' | 'turno';
  claveGuardado?: string;
  validacion?: {
    tipo: 'fecha' | 'hora' | 'numero' | 'texto' | 'email' | 'telefono';
    requerido: boolean;
    min?: number;
    max?: number;
    formato?: string;
    mensajeError?: string;
  };
  opciones?: {
    numero: number;
    texto: string;
    siguientePaso?: string;
    finalizarFlujo?: boolean;
  }[];
  siguientePaso?: string;
  finalizarFlujo?: boolean;
  accion?: 'crear_turno' | 'consultar_turnos' | 'cancelar_turno' | 'ninguna';
}

interface ConfiguradorPasosProps {
  pasos: PasoBot[];
  onChange: (pasos: PasoBot[]) => void;
  flujo: 'crearTurno' | 'consultarTurnos' | 'cancelarTurno';
}

export default function ConfiguradorPasos({ pasos, onChange, flujo }: ConfiguradorPasosProps) {
  const [pasoEditando, setPasoEditando] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Agregar nuevo paso
  const agregarPaso = () => {
    const nuevoPaso: PasoBot = {
      id: `paso_${Date.now()}`,
      orden: pasos.length + 1,
      activo: true,
      tipo: 'input',
      etiqueta: 'Nuevo Paso',
      mensaje: '',
      campoACapturar: '',
      guardarEn: 'datos',
      claveGuardado: '',
      validacion: {
        tipo: 'texto',
        requerido: false
      },
      siguientePaso: '',
      finalizarFlujo: false,
      accion: 'ninguna'
    };

    onChange([...pasos, nuevoPaso]);
    setPasoEditando(nuevoPaso.id);
    setMostrarModal(true);
  };

  // Editar paso
  const editarPaso = (pasoId: string) => {
    setPasoEditando(pasoId);
    setMostrarModal(true);
  };

  // Eliminar paso
  const eliminarPaso = (pasoId: string) => {
    if (confirm('¿Estás seguro de eliminar este paso?')) {
      const nuevosPasos = pasos.filter(p => p.id !== pasoId);
      // Reordenar
      nuevosPasos.forEach((p, index) => {
        p.orden = index + 1;
      });
      onChange(nuevosPasos);
    }
  };

  // Toggle activo/inactivo
  const toggleActivo = (pasoId: string) => {
    const nuevosPasos = pasos.map(p =>
      p.id === pasoId ? { ...p, activo: !p.activo } : p
    );
    onChange(nuevosPasos);
  };

  // Mover paso arriba
  const moverArriba = (index: number) => {
    if (index === 0) return;
    const nuevosPasos = [...pasos];
    [nuevosPasos[index - 1], nuevosPasos[index]] = [nuevosPasos[index], nuevosPasos[index - 1]];
    nuevosPasos.forEach((p, i) => {
      p.orden = i + 1;
    });
    onChange(nuevosPasos);
  };

  // Mover paso abajo
  const moverAbajo = (index: number) => {
    if (index === pasos.length - 1) return;
    const nuevosPasos = [...pasos];
    [nuevosPasos[index], nuevosPasos[index + 1]] = [nuevosPasos[index + 1], nuevosPasos[index]];
    nuevosPasos.forEach((p, i) => {
      p.orden = i + 1;
    });
    onChange(nuevosPasos);
  };

  // Actualizar paso
  const actualizarPaso = (pasoActualizado: PasoBot) => {
    const nuevosPasos = pasos.map(p =>
      p.id === pasoActualizado.id ? pasoActualizado : p
    );
    onChange(nuevosPasos);
  };

  const pasoActual = pasos.find(p => p.id === pasoEditando);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>📋 Pasos del Flujo: {flujo === 'crearTurno' ? 'Crear Turno' : flujo === 'consultarTurnos' ? 'Consultar Turnos' : 'Cancelar Turno'}</h3>
        <p className={styles.descripcion}>
          Configura cada paso que el bot seguirá. El primer paso se ejecuta automáticamente.
        </p>
      </div>

      {/* Lista de pasos */}
      <div className={styles.pasos}>
        {pasos.length === 0 ? (
          <div className={styles.empty}>
            <p>No hay pasos configurados. Agrega el primer paso para comenzar.</p>
          </div>
        ) : (
          pasos.map((paso, index) => (
            <div
              key={paso.id}
              className={`${styles.paso} ${!paso.activo ? styles.inactivo : ''}`}
            >
              <div className={styles.pasoHeader}>
                <div className={styles.pasoOrden}>
                  <GripVertical size={20} />
                  <span className={styles.numero}>{paso.orden}</span>
                </div>

                <div className={styles.pasoInfo}>
                  <div className={styles.pasoTitulo}>
                    <span className={styles.etiqueta}>{paso.etiqueta}</span>
                    <span className={styles.tipo}>{getTipoLabel(paso.tipo)}</span>
                  </div>
                  <div className={styles.pasoMensaje}>
                    {paso.mensaje || <em>Sin mensaje configurado</em>}
                  </div>
                </div>

                <div className={styles.pasoAcciones}>
                  <button
                    onClick={() => toggleActivo(paso.id)}
                    className={styles.btnIcono}
                    title={paso.activo ? 'Desactivar' : 'Activar'}
                  >
                    {paso.activo ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>

                  <button
                    onClick={() => moverArriba(index)}
                    disabled={index === 0}
                    className={styles.btnIcono}
                    title="Mover arriba"
                  >
                    ↑
                  </button>

                  <button
                    onClick={() => moverAbajo(index)}
                    disabled={index === pasos.length - 1}
                    className={styles.btnIcono}
                    title="Mover abajo"
                  >
                    ↓
                  </button>

                  <button
                    onClick={() => editarPaso(paso.id)}
                    className={styles.btnIcono}
                    title="Configurar"
                  >
                    <Settings size={18} />
                  </button>

                  <button
                    onClick={() => eliminarPaso(paso.id)}
                    className={`${styles.btnIcono} ${styles.btnEliminar}`}
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Detalles del paso */}
              {paso.tipo === 'input' && (
                <div className={styles.pasoDetalles}>
                  <span>📝 Captura: <strong>{paso.campoACapturar || 'No definido'}</strong></span>
                  <span>💾 Guarda en: <strong>{paso.guardarEn || 'datos'}</strong></span>
                  {paso.validacion && (
                    <span>✓ Validación: <strong>{paso.validacion.tipo}</strong></span>
                  )}
                </div>
              )}

              {paso.tipo === 'menu' && paso.opciones && (
                <div className={styles.pasoDetalles}>
                  <span>📋 Opciones: <strong>{paso.opciones.length}</strong></span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Botón agregar paso */}
      <button onClick={agregarPaso} className={styles.btnAgregar}>
        <Plus size={20} />
        Agregar Paso
      </button>

      {/* Modal de edición */}
      {mostrarModal && pasoActual && (
        <ModalEditarPaso
          paso={pasoActual}
          onClose={() => setMostrarModal(false)}
          onSave={(pasoActualizado) => {
            actualizarPaso(pasoActualizado);
            setMostrarModal(false);
          }}
        />
      )}
    </div>
  );
}

// Helper para obtener label del tipo
function getTipoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    input: '📝 Captura',
    menu: '📋 Menú',
    confirmacion: '✅ Confirmación',
    finalizar: '🏁 Finalizar'
  };
  return labels[tipo] || tipo;
}

// Modal para editar paso
interface ModalEditarPasoProps {
  paso: PasoBot;
  onClose: () => void;
  onSave: (paso: PasoBot) => void;
}

function ModalEditarPaso({ paso, onClose, onSave }: ModalEditarPasoProps) {
  const [pasoEditado, setPasoEditado] = useState<PasoBot>({ ...paso });

  const handleChange = (campo: string, valor: any) => {
    setPasoEditado(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleValidacionChange = (campo: string, valor: any) => {
    setPasoEditado(prev => ({
      ...prev,
      validacion: {
        ...prev.validacion!,
        [campo]: valor
      }
    }));
  };

  const agregarOpcion = () => {
    const nuevaOpcion = {
      numero: (pasoEditado.opciones?.length || 0) + 1,
      texto: '',
      siguientePaso: '',
      finalizarFlujo: false
    };
    setPasoEditado(prev => ({
      ...prev,
      opciones: [...(prev.opciones || []), nuevaOpcion]
    }));
  };

  const eliminarOpcion = (index: number) => {
    setPasoEditado(prev => ({
      ...prev,
      opciones: prev.opciones?.filter((_, i) => i !== index)
    }));
  };

  const actualizarOpcion = (index: number, campo: string, valor: any) => {
    setPasoEditado(prev => ({
      ...prev,
      opciones: prev.opciones?.map((op, i) =>
        i === index ? { ...op, [campo]: valor } : op
      )
    }));
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>⚙️ Configurar Paso</h3>
          <button onClick={onClose} className={styles.btnCerrar}>×</button>
        </div>

        <div className={styles.modalBody}>
          {/* Información básica */}
          <div className={styles.seccion}>
            <h4>Información Básica</h4>

            <div className={styles.field}>
              <label>Etiqueta del Paso *</label>
              <input
                type="text"
                value={pasoEditado.etiqueta}
                onChange={(e) => handleChange('etiqueta', e.target.value)}
                placeholder="Ej: Solicitar Fecha"
              />
            </div>

            <div className={styles.field}>
              <label>Tipo de Paso *</label>
              <select
                value={pasoEditado.tipo}
                onChange={(e) => handleChange('tipo', e.target.value)}
              >
                <option value="input">📝 Captura de Datos (Input)</option>
                <option value="menu">📋 Menú de Opciones</option>
                <option value="confirmacion">✅ Confirmación</option>
                <option value="finalizar">🏁 Finalizar Flujo</option>
              </select>
            </div>

            <div className={styles.field}>
              <label>Mensaje que muestra el bot *</label>
              <textarea
                value={pasoEditado.mensaje}
                onChange={(e) => handleChange('mensaje', e.target.value)}
                placeholder="Ej: 📅 ¿Qué día necesitas el turno? (DD/MM/AAAA)"
                rows={3}
              />
              <small>Puedes usar emojis y saltos de línea</small>
            </div>
          </div>

          {/* Configuración según tipo */}
          {pasoEditado.tipo === 'input' && (
            <div className={styles.seccion}>
              <h4>Configuración de Captura</h4>

              <div className={styles.field}>
                <label>Campo a Capturar *</label>
                <input
                  type="text"
                  value={pasoEditado.campoACapturar || ''}
                  onChange={(e) => handleChange('campoACapturar', e.target.value)}
                  placeholder="Ej: fecha, hora, nombre, origen"
                />
                <small>Nombre del campo que se guardará</small>
              </div>

              <div className={styles.field}>
                <label>Guardar en</label>
                <select
                  value={pasoEditado.guardarEn || 'datos'}
                  onChange={(e) => handleChange('guardarEn', e.target.value)}
                >
                  <option value="datos">Datos del turno (datos.campo)</option>
                  <option value="turno">Campo directo del turno</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>Clave de Guardado</label>
                <input
                  type="text"
                  value={pasoEditado.claveGuardado || ''}
                  onChange={(e) => handleChange('claveGuardado', e.target.value)}
                  placeholder="Ej: datos.origen, fechaInicio"
                />
                <small>Ruta específica donde guardar (opcional)</small>
              </div>

              <h5>Validación</h5>

              <div className={styles.field}>
                <label>Tipo de Validación</label>
                <select
                  value={pasoEditado.validacion?.tipo || 'texto'}
                  onChange={(e) => handleValidacionChange('tipo', e.target.value)}
                >
                  <option value="texto">Texto</option>
                  <option value="numero">Número</option>
                  <option value="fecha">Fecha (DD/MM/AAAA)</option>
                  <option value="hora">Hora (HH:MM)</option>
                  <option value="email">Email</option>
                  <option value="telefono">Teléfono</option>
                </select>
              </div>

              <div className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={pasoEditado.validacion?.requerido || false}
                  onChange={(e) => handleValidacionChange('requerido', e.target.checked)}
                />
                <span>Campo requerido</span>
              </div>

              {pasoEditado.validacion?.tipo === 'numero' && (
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label>Valor Mínimo</label>
                    <input
                      type="number"
                      value={pasoEditado.validacion?.min || ''}
                      onChange={(e) => handleValidacionChange('min', parseInt(e.target.value))}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Valor Máximo</label>
                    <input
                      type="number"
                      value={pasoEditado.validacion?.max || ''}
                      onChange={(e) => handleValidacionChange('max', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              )}

              <div className={styles.field}>
                <label>Mensaje de Error</label>
                <input
                  type="text"
                  value={pasoEditado.validacion?.mensajeError || ''}
                  onChange={(e) => handleValidacionChange('mensajeError', e.target.value)}
                  placeholder="Ej: ❌ Fecha inválida. Usa DD/MM/AAAA"
                />
              </div>
            </div>
          )}

          {pasoEditado.tipo === 'menu' && (
            <div className={styles.seccion}>
              <h4>Opciones del Menú</h4>

              {pasoEditado.opciones?.map((opcion, index) => (
                <div key={index} className={styles.opcion}>
                  <div className={styles.opcionHeader}>
                    <span className={styles.numeroOpcion}>{opcion.numero}️⃣</span>
                    <button
                      onClick={() => eliminarOpcion(index)}
                      className={styles.btnEliminarOpcion}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className={styles.field}>
                    <label>Texto de la Opción</label>
                    <input
                      type="text"
                      value={opcion.texto}
                      onChange={(e) => actualizarOpcion(index, 'texto', e.target.value)}
                      placeholder="Ej: Agendar turno"
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Siguiente Paso (ID)</label>
                    <input
                      type="text"
                      value={opcion.siguientePaso || ''}
                      onChange={(e) => actualizarOpcion(index, 'siguientePaso', e.target.value)}
                      placeholder="ID del siguiente paso"
                    />
                  </div>

                  <div className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={opcion.finalizarFlujo || false}
                      onChange={(e) => actualizarOpcion(index, 'finalizarFlujo', e.target.checked)}
                    />
                    <span>Esta opción finaliza el flujo</span>
                  </div>
                </div>
              ))}

              <button onClick={agregarOpcion} className={styles.btnAgregarOpcion}>
                <Plus size={16} />
                Agregar Opción
              </button>
            </div>
          )}

          {/* Navegación */}
          <div className={styles.seccion}>
            <h4>Navegación</h4>

            {pasoEditado.tipo !== 'menu' && (
              <div className={styles.field}>
                <label>Siguiente Paso (ID)</label>
                <input
                  type="text"
                  value={pasoEditado.siguientePaso || ''}
                  onChange={(e) => handleChange('siguientePaso', e.target.value)}
                  placeholder="ID del siguiente paso"
                />
                <small>Dejar vacío si es el último paso</small>
              </div>
            )}

            <div className={styles.checkbox}>
              <input
                type="checkbox"
                checked={pasoEditado.finalizarFlujo || false}
                onChange={(e) => handleChange('finalizarFlujo', e.target.checked)}
              />
              <span>Este paso finaliza el flujo</span>
            </div>
          </div>

          {/* Acciones */}
          <div className={styles.seccion}>
            <h4>Acción Especial</h4>

            <div className={styles.field}>
              <label>Acción al Completar</label>
              <select
                value={pasoEditado.accion || 'ninguna'}
                onChange={(e) => handleChange('accion', e.target.value)}
              >
                <option value="ninguna">Ninguna</option>
                <option value="crear_turno">Crear Turno en BD</option>
                <option value="consultar_turnos">Consultar Turnos</option>
                <option value="cancelar_turno">Cancelar Turno</option>
              </select>
              <small>Acción que se ejecuta al completar este paso</small>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnCancelar}>
            Cancelar
          </button>
          <button onClick={() => onSave(pasoEditado)} className={styles.btnGuardar}>
            💾 Guardar Paso
          </button>
        </div>
      </div>
    </div>
  );
}
