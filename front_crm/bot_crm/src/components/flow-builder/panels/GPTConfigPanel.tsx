import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import styles from './GPTConfigPanel.module.css';

// Tipos para la configuración del GPT con 3 bloques
interface Topico {
  id: string;
  titulo: string;
  contenido: string;
  keywords?: string[];
}

interface VariableRecopilar {
  nombre: string;
  descripcion: string;
  obligatorio: boolean;
  tipo: 'texto' | 'numero' | 'fecha' | 'email' | 'telefono';
  validacion?: {
    min?: number;
    max?: number;
    regex?: string;
    opciones?: string[];
  };
  ejemplos?: string[];
}

interface VariableConContexto {
  nombre: string;
  seleccionada: boolean;
  contextoGenerado?: string;
  contextoEditado?: string;
  generandoContexto?: boolean;
}

interface AccionCompletado {
  tipo: 'mensaje' | 'guardar_variables_globales' | 'marcar_completado' | 'ejecutar_api';
  contenido?: string;
  variables?: string[];
  token?: string;
  apiEndpoint?: string;
}

// Configuración para GPT Formateador
interface CampoEsperado {
  nombre: string;
  descripcion: string;
  tipoDato: 'string' | 'number' | 'boolean' | 'array' | 'object';
  requerido: boolean;
  valorPorDefecto?: any;
}

interface ConfiguracionExtraccion {
  instruccionesExtraccion: string;
  fuenteDatos: 'historial_completo' | 'ultimo_mensaje' | 'ultimos_n_mensajes';
  cantidadMensajes?: number;
  formatoSalida: {
    tipo: 'json' | 'texto' | 'lista';
    estructura?: string;
    ejemplo?: string;
  };
  camposEsperados: CampoEsperado[];
}

export interface GPTConversacionalConfig {
  tipo: 'conversacional' | 'transform' | 'formateador' | 'procesador';
  module: string;
  modelo: string;
  temperatura: number;
  maxTokens: number;
  
  // BLOQUE 1: PERSONALIDAD (solo conversacional)
  personalidad?: string;
  
  // BLOQUE 2: INFORMACIÓN ESTÁTICA (Tópicos) (solo conversacional)
  topicos?: Topico[];
  
  // BLOQUE 3: RECOPILACIÓN DE DATOS (solo conversacional)
  variablesRecopilar?: VariableRecopilar[];
  
  // BLOQUE 4: ACCIONES POST-RECOPILACIÓN (solo conversacional)
  accionesCompletado?: AccionCompletado[];
  
  // CONFIGURACIÓN PARA FORMATEADOR/TRANSFORM
  configuracionExtraccion?: ConfiguracionExtraccion;
  
  // Legacy
  variablesEntrada?: string[];
  variablesSalida?: string[];
  globalVariablesOutput?: string[];
  outputFormat?: 'text' | 'json';
  jsonSchema?: any;
  systemPrompt?: string;
}

interface GPTConfigPanelProps {
  config: GPTConversacionalConfig;
  onChange: (config: GPTConversacionalConfig) => void;
  globalVariables?: Record<string, any>;
}

const GPTConfigPanel: React.FC<GPTConfigPanelProps> = ({ config, onChange, globalVariables = {} }) => {
  const [activeTab, setActiveTab] = useState<'basico' | 'personalidad' | 'topicos' | 'variables' | 'acciones' | 'extraccion'>('basico');
  const [variablesConContexto, setVariablesConContexto] = useState<Record<string, VariableConContexto>>({});
  const [editandoVariable, setEditandoVariable] = useState<string | null>(null);
  
  const esFormateador = config.tipo === 'formateador' || config.tipo === 'transform';
  const esConversacional = config.tipo === 'conversacional';
  const esProcesador = config.tipo === 'procesador';
  
  // Los tabs de personalidad, tópicos, variables y acciones están disponibles para:
  // - conversacional: bot que conversa con usuarios
  // - procesador: bot que procesa información y toma decisiones
  const tieneTabsCompletos = esConversacional || esProcesador;

  // Inicializar variables con contexto desde config
  useEffect(() => {
    const inicializarVariables = () => {
      const variablesIniciales: Record<string, VariableConContexto> = {};
      const personalidadActual = config.personalidad || '';
      
      for (const varName of Object.keys(globalVariables)) {
        const yaSeleccionada = config.variablesEntrada?.includes(varName);
        
        // Extraer contexto existente de la personalidad si ya está guardado
        let contextoExistente: string | undefined = undefined;
        const marcador = `\n\n### Variable: ${varName}\n`;
        const inicio = personalidadActual.indexOf(marcador);
        
        if (inicio !== -1) {
          const inicioContexto = inicio + marcador.length;
          const fin = personalidadActual.indexOf('\n\n### Variable:', inicioContexto);
          
          if (fin !== -1) {
            contextoExistente = personalidadActual.substring(inicioContexto, fin).trim();
          } else {
            contextoExistente = personalidadActual.substring(inicioContexto).trim();
          }
        }
        
        variablesIniciales[varName] = {
          nombre: varName,
          seleccionada: yaSeleccionada || false,
          contextoGenerado: contextoExistente,
          contextoEditado: undefined,
          generandoContexto: false
        };
      }
      
      setVariablesConContexto(variablesIniciales);
    };

    inicializarVariables();
  }, [globalVariables, config.personalidad]);

  // Función para generar contexto automático usando IA
  const generarContextoIA = async (nombreVariable: string): Promise<string> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/openai/generar-contexto-variable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreVariable,
          tipoNodo: config.tipo,
          personalidadActual: config.personalidad || ''
        })
      });

      if (!response.ok) throw new Error('Error al generar contexto');
      
      const data = await response.json();
      return data.contexto;
    } catch (error) {
      console.error('Error generando contexto:', error);
      // Fallback: generar contexto básico localmente
      return generarContextoLocal(nombreVariable);
    }
  };

  // Fallback: generar contexto básico sin IA
  const generarContextoLocal = (nombreVariable: string): string => {
    const nombre = nombreVariable.toLowerCase();
    
    if (nombre.includes('saldo') || nombre.includes('balance')) {
      return `Tienes acceso al ${nombreVariable} del cliente ({{${nombreVariable}}}). Úsalo para informar sobre su balance disponible.`;
    }
    if (nombre.includes('nombre') || nombre.includes('cliente')) {
      return `Conoces el ${nombreVariable} del cliente ({{${nombreVariable}}}). Úsalo para personalizar la conversación.`;
    }
    if (nombre.includes('telefono') || nombre.includes('phone')) {
      return `Tienes el ${nombreVariable} del cliente ({{${nombreVariable}}}). Puedes usarlo para verificación o contacto.`;
    }
    if (nombre.includes('email') || nombre.includes('correo')) {
      return `Conoces el ${nombreVariable} del cliente ({{${nombreVariable}}}). Úsalo para comunicaciones o verificación.`;
    }
    if (nombre.includes('estado') || nombre.includes('status')) {
      return `Tienes información sobre ${nombreVariable} ({{${nombreVariable}}}). Úsalo para informar al cliente sobre su situación actual.`;
    }
    if (nombre.includes('cuenta') || nombre.includes('account')) {
      return `Tienes acceso a ${nombreVariable} ({{${nombreVariable}}}). Úsalo para proporcionar información específica de la cuenta.`;
    }
    
    return `Tienes acceso a la variable ${nombreVariable} ({{${nombreVariable}}}). Úsala para proporcionar información relevante al cliente.`;
  };

  // Toggle variable con generación automática de contexto
  const toggleVariableConContexto = async (nombreVariable: string) => {
    const variable = variablesConContexto[nombreVariable];
    const nuevaSeleccion = !variable.seleccionada;

    // Verificar si ya tiene contexto (generado o editado)
    const tieneContexto = !!(variable.contextoGenerado || variable.contextoEditado);

    // Actualizar estado local
    setVariablesConContexto(prev => ({
      ...prev,
      [nombreVariable]: {
        ...prev[nombreVariable],
        seleccionada: nuevaSeleccion,
        generandoContexto: nuevaSeleccion && !tieneContexto
      }
    }));

    // Si se selecciona y NO tiene contexto, generarlo (solo una vez)
    if (nuevaSeleccion && !tieneContexto) {
      const contexto = await generarContextoIA(nombreVariable);
      
      setVariablesConContexto(prev => ({
        ...prev,
        [nombreVariable]: {
          ...prev[nombreVariable],
          contextoGenerado: contexto,
          generandoContexto: false
        }
      }));

      // Actualizar personalidad con el contexto generado
      actualizarPersonalidadConVariable(nombreVariable, contexto, true);
    } else if (nuevaSeleccion && tieneContexto) {
      // Ya tiene contexto, solo agregarlo a personalidad (no regenerar)
      const contexto = variable.contextoEditado || variable.contextoGenerado || '';
      actualizarPersonalidadConVariable(nombreVariable, contexto, true);
    } else {
      // Deseleccionar: remover de personalidad (pero mantener el contexto guardado)
      actualizarPersonalidadConVariable(nombreVariable, '', false);
    }

    // Actualizar variablesEntrada en config
    const current = config.variablesEntrada || [];
    const newVariables = nuevaSeleccion
      ? [...current, nombreVariable]
      : current.filter(v => v !== nombreVariable);
    onChange({ ...config, variablesEntrada: newVariables });
  };

  // Actualizar personalidad agregando o removiendo contexto de variable
  const actualizarPersonalidadConVariable = (nombreVariable: string, contexto: string, agregar: boolean) => {
    let personalidadActual = config.personalidad || '';
    const marcador = `\n\n### Variable: ${nombreVariable}\n`;
    
    if (agregar && contexto) {
      // Agregar contexto si no existe
      if (!personalidadActual.includes(marcador)) {
        personalidadActual += `${marcador}${contexto}`;
      }
    } else {
      // Remover contexto
      const inicio = personalidadActual.indexOf(marcador);
      if (inicio !== -1) {
        const fin = personalidadActual.indexOf('\n\n### Variable:', inicio + 1);
        if (fin !== -1) {
          personalidadActual = personalidadActual.substring(0, inicio) + personalidadActual.substring(fin);
        } else {
          personalidadActual = personalidadActual.substring(0, inicio);
        }
      }
    }
    
    onChange({ ...config, personalidad: personalidadActual.trim() });
  };

  // Guardar contexto editado manualmente
  const guardarContextoEditado = (nombreVariable: string, nuevoContexto: string) => {
    setVariablesConContexto(prev => ({
      ...prev,
      [nombreVariable]: {
        ...prev[nombreVariable],
        contextoEditado: nuevoContexto
      }
    }));

    // Actualizar personalidad con el nuevo contexto
    actualizarPersonalidadConVariable(nombreVariable, nuevoContexto, true);
    setEditandoVariable(null);
  };

  // BLOQUE 2: TÓPICOS
  const agregarTopico = () => {
    const nuevoTopico: Topico = {
      id: `topico-${Date.now()}`,
      titulo: '',
      contenido: '',
      keywords: []
    };
    onChange({
      ...config,
      topicos: [...(config.topicos || []), nuevoTopico]
    });
  };

  const actualizarTopico = (index: number, campo: keyof Topico, valor: any) => {
    const topicos = [...(config.topicos || [])];
    if (campo === 'keywords' && typeof valor === 'string') {
      topicos[index][campo] = valor.split(',').map(k => k.trim()).filter(k => k);
    } else {
      (topicos[index] as any)[campo] = valor;
    }
    onChange({ ...config, topicos });
  };

  const eliminarTopico = (index: number) => {
    const topicos = [...(config.topicos || [])];
    topicos.splice(index, 1);
    onChange({ ...config, topicos });
  };

  // BLOQUE 3: VARIABLES
  const agregarVariable = () => {
    const nuevaVariable: VariableRecopilar = {
      nombre: '',
      descripcion: '',
      obligatorio: true,
      tipo: 'texto',
      validacion: {},
      ejemplos: []
    };
    onChange({
      ...config,
      variablesRecopilar: [...(config.variablesRecopilar || []), nuevaVariable]
    });
  };

  const actualizarVariable = (index: number, campo: keyof VariableRecopilar, valor: any) => {
    const variables = [...(config.variablesRecopilar || [])];
    if (campo === 'ejemplos' && typeof valor === 'string') {
      variables[index][campo] = valor.split(',').map(e => e.trim()).filter(e => e);
    } else {
      (variables[index] as any)[campo] = valor;
    }
    onChange({ ...config, variablesRecopilar: variables });
  };

  const actualizarValidacion = (index: number, campo: string, valor: any) => {
    const variables = [...(config.variablesRecopilar || [])];
    variables[index].validacion = {
      ...variables[index].validacion,
      [campo]: valor ? Number(valor) : undefined
    };
    onChange({ ...config, variablesRecopilar: variables });
  };

  const eliminarVariable = (index: number) => {
    const variables = [...(config.variablesRecopilar || [])];
    variables.splice(index, 1);
    onChange({ ...config, variablesRecopilar: variables });
  };

  // BLOQUE 4: ACCIONES
  const agregarAccion = () => {
    const nuevaAccion: AccionCompletado = {
      tipo: 'mensaje',
      contenido: ''
    };
    onChange({
      ...config,
      accionesCompletado: [...(config.accionesCompletado || []), nuevaAccion]
    });
  };

  const actualizarAccion = (index: number, campo: keyof AccionCompletado, valor: any) => {
    const acciones = [...(config.accionesCompletado || [])];
    if (campo === 'variables' && typeof valor === 'string') {
      acciones[index][campo] = valor.split(',').map(v => v.trim()).filter(v => v);
    } else {
      (acciones[index] as any)[campo] = valor;
    }
    onChange({ ...config, accionesCompletado: acciones });
  };

  const eliminarAccion = (index: number) => {
    const acciones = [...(config.accionesCompletado || [])];
    acciones.splice(index, 1);
    onChange({ ...config, accionesCompletado: acciones });
  };

  // FUNCIONES PARA CONFIGURACIÓN DE EXTRACCIÓN
  const agregarCampoEsperado = () => {
    const nuevoCampo: CampoEsperado = {
      nombre: '',
      descripcion: '',
      tipoDato: 'string',
      requerido: false,
      valorPorDefecto: null
    };
    onChange({
      ...config,
      configuracionExtraccion: {
        ...config.configuracionExtraccion!,
        camposEsperados: [...(config.configuracionExtraccion?.camposEsperados || []), nuevoCampo]
      }
    });
  };

  const actualizarCampoEsperado = (index: number, campo: keyof CampoEsperado, valor: any) => {
    const campos = [...(config.configuracionExtraccion?.camposEsperados || [])];
    (campos[index] as any)[campo] = valor;
    onChange({
      ...config,
      configuracionExtraccion: {
        ...config.configuracionExtraccion!,
        camposEsperados: campos
      }
    });
  };

  const eliminarCampoEsperado = (index: number) => {
    const campos = [...(config.configuracionExtraccion?.camposEsperados || [])];
    campos.splice(index, 1);
    onChange({
      ...config,
      configuracionExtraccion: {
        ...config.configuracionExtraccion!,
        camposEsperados: campos
      }
    });
  };

  // Inicializar configuración de extracción si es formateador y no existe
  useEffect(() => {
    if (esFormateador && !config.configuracionExtraccion) {
      onChange({
        ...config,
        configuracionExtraccion: {
          instruccionesExtraccion: '',
          fuenteDatos: 'historial_completo',
          formatoSalida: {
            tipo: 'json',
            estructura: '',
            ejemplo: ''
          },
          camposEsperados: []
        }
      });
    }
  }, [esFormateador]);

  return (
    <div className={styles.gptConfigPanel}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={activeTab === 'basico' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('basico')}
        >
          Básico
        </button>
        
        {/* Tabs para GPT Conversacional y Procesador */}
        {tieneTabsCompletos && (
          <>
            <button
              className={activeTab === 'personalidad' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('personalidad')}
            >
              Personalidad
            </button>
            <button
              className={activeTab === 'topicos' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('topicos')}
            >
              Tópicos ({config.topicos?.length || 0})
            </button>
            <button
              className={activeTab === 'variables' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('variables')}
            >
              Variables ({config.variablesEntrada?.length || 0})
            </button>
            <button
              className={activeTab === 'acciones' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('acciones')}
            >
              Acciones ({config.accionesCompletado?.length || 0})
            </button>
          </>
        )}
        
        {/* Tab para GPT Formateador */}
        {esFormateador && (
          <button
            className={activeTab === 'extraccion' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('extraccion')}
          >
            Extracción
          </button>
        )}
      </div>

      {/* Contenido según tab activo */}
      <div className={styles.tabContent}>
        {/* TAB: BÁSICO */}
        {activeTab === 'basico' && (
          <div className={styles.section}>
            <h3>Configuración Básica</h3>
            
            <div className={styles.formGroup}>
              <label>Tipo de GPT</label>
              <select
                value={config.tipo}
                onChange={(e) => onChange({ ...config, tipo: e.target.value as any })}
              >
                <option value="conversacional">Conversacional</option>
                <option value="transform">Transform</option>
                <option value="formateador">Formateador</option>
                <option value="procesador">Procesador</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Modelo</label>
              <select
                value={config.modelo}
                onChange={(e) => onChange({ ...config, modelo: e.target.value })}
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Temperatura ({config.temperatura})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperatura}
                onChange={(e) => onChange({ ...config, temperatura: Number(e.target.value) })}
              />
              <small>0 = Preciso, 1 = Creativo</small>
            </div>

            <div className={styles.formGroup}>
              <label>Max Tokens</label>
              <input
                type="number"
                value={config.maxTokens}
                onChange={(e) => onChange({ ...config, maxTokens: Number(e.target.value) })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Formato de Salida</label>
              <select
                value={config.outputFormat || 'text'}
                onChange={(e) => onChange({ ...config, outputFormat: e.target.value as any })}
              >
                <option value="text">Texto</option>
                <option value="json">JSON</option>
              </select>
            </div>

            <div className={styles.infoBox} style={{ marginTop: '16px' }}>
              <Info size={16} />
              <span>La API Key de OpenAI se configura automáticamente desde el sistema</span>
            </div>
          </div>
        )}

        {/* TAB: PERSONALIDAD */}
        {activeTab === 'personalidad' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Personalidad del Bot</h3>
              <div className={styles.infoBox}>
                <Info size={16} />
                <span>Define el tono, estilo y comportamiento del asistente</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Descripción de Personalidad</label>
              <textarea
                rows={10}
                placeholder="Ejemplo:&#10;Eres el asistente virtual de Librería Veo Veo 📚&#10;Tono amigable, profesional, usa emojis&#10;Siempre saluda con entusiasmo"
                value={config.personalidad || ''}
                onChange={(e) => onChange({ ...config, personalidad: e.target.value })}
              />
              <small>Define cómo debe comportarse y comunicarse el bot</small>
            </div>
          </div>
        )}

        {/* TAB: TÓPICOS */}
        {activeTab === 'topicos' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Información Estática (Tópicos)</h3>
              <div className={styles.infoBox}>
                <Info size={16} />
                <span>El bot accederá a estos tópicos de forma "innata" cuando el usuario pregunte</span>
              </div>
            </div>

            {config.topicos && config.topicos.length > 0 ? (
              config.topicos.map((topico, index) => (
                <div key={topico.id} className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <h4>Tópico {index + 1}</h4>
                    <button
                      className={styles.deleteButton}
                      onClick={() => eliminarTopico(index)}
                      title="Eliminar tópico"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Título del Tópico</label>
                    <input
                      type="text"
                      placeholder="Ej: Horarios del Local"
                      value={topico.titulo}
                      onChange={(e) => actualizarTopico(index, 'titulo', e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Contenido</label>
                    <textarea
                      rows={5}
                      placeholder="Ej: Lunes a Viernes 8:30-12 y 17-21. Sábados 9-13 y 17-21"
                      value={topico.contenido}
                      onChange={(e) => actualizarTopico(index, 'contenido', e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Palabras Clave (opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: horario, abierto, cerrado, cuando (separadas por coma)"
                      value={topico.keywords?.join(', ') || ''}
                      onChange={(e) => actualizarTopico(index, 'keywords', e.target.value)}
                    />
                    <small>Ayuda al GPT a identificar cuándo usar este tópico</small>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No hay tópicos configurados</p>
                <small>Los tópicos son información estática que el bot usará para responder preguntas</small>
              </div>
            )}

            <button className={styles.addButton} onClick={agregarTopico}>
              <Plus size={16} />
              Agregar Tópico
            </button>
          </div>
        )}

        {/* TAB: VARIABLES - UNIFICADO */}
        {activeTab === 'variables' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>🌐 Variables del Flujo</h3>
              <div className={styles.infoBox}>
                <Info size={16} />
                <span>Selecciona variables y el contexto se genera automáticamente con IA</span>
              </div>
            </div>

            {Object.keys(globalVariables).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.keys(globalVariables).map((varName) => {
                  const variable = variablesConContexto[varName];
                  if (!variable) return null;

                  const contextoActual = variable.contextoEditado || variable.contextoGenerado || '';
                  const estaEditando = editandoVariable === varName;

                  return (
                    <div
                      key={varName}
                      style={{
                        padding: '16px',
                        background: variable.seleccionada ? '#f0fdf4' : 'white',
                        border: `2px solid ${variable.seleccionada ? '#10b981' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: contextoActual && variable.seleccionada ? '12px' : '0' }}>
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={variable.seleccionada}
                          onChange={() => toggleVariableConContexto(varName)}
                          style={{
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            accentColor: '#10b981'
                          }}
                        />

                        {/* Nombre de variable */}
                        <code style={{
                          flex: 1,
                          background: variable.seleccionada ? '#d1fae5' : '#f3f4f6',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: variable.seleccionada ? '#065f46' : '#6b7280'
                        }}>
                          {varName}
                        </code>

                        {/* Estado de generación */}
                        {variable.generandoContexto && (
                          <span style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                            🤖 Generando contexto...
                          </span>
                        )}

                        {/* Botón de editar (solo si está seleccionada y tiene contexto) */}
                        {variable.seleccionada && contextoActual && !variable.generandoContexto && (
                          <button
                            onClick={() => setEditandoVariable(estaEditando ? null : varName)}
                            style={{
                              padding: '6px 12px',
                              background: estaEditando ? '#3b82f6' : 'white',
                              color: estaEditando ? 'white' : '#6b7280',
                              border: '2px solid #d1d5db',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s'
                            }}
                            title="Editar contexto"
                          >
                            ⚙️ {estaEditando ? 'Cancelar' : 'Editar'}
                          </button>
                        )}
                      </div>

                      {/* Mostrar/Editar contexto generado */}
                      {variable.seleccionada && contextoActual && !variable.generandoContexto && (
                        <div style={{
                          marginTop: '12px',
                          padding: '12px',
                          background: 'white',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db'
                        }}>
                          {estaEditando ? (
                            <>
                              <textarea
                                value={contextoActual}
                                onChange={(e) => {
                                  setVariablesConContexto(prev => ({
                                    ...prev,
                                    [varName]: {
                                      ...prev[varName],
                                      contextoEditado: e.target.value
                                    }
                                  }));
                                }}
                                style={{
                                  width: '100%',
                                  minHeight: '80px',
                                  padding: '8px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  fontFamily: 'inherit',
                                  resize: 'vertical'
                                }}
                                placeholder="Describe cómo usar esta variable en el contexto del GPT..."
                              />
                              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => setEditandoVariable(null)}
                                  style={{
                                    padding: '6px 12px',
                                    background: 'white',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => guardarContextoEditado(varName, contextoActual)}
                                  style={{
                                    padding: '6px 12px',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                  }}
                                >
                                  Guardar
                                </button>
                              </div>
                            </>
                          ) : (
                            <p style={{
                              margin: 0,
                              fontSize: '13px',
                              color: '#374151',
                              lineHeight: '1.5'
                            }}>
                              {contextoActual}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                padding: '16px',
                background: '#fef3c7',
                border: '2px solid #fbbf24',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#92400e'
              }}>
                ⚠️ No hay variables globales disponibles. Agrega variables desde el botón de Variables en la barra superior.
              </div>
            )}
            
            <div className={styles.sectionHeader} style={{ marginTop: '32px' }}>
              <h3>Variables a Recopilar del Usuario</h3>
              <div className={styles.infoBox}>
                <Info size={16} />
                <span>Define qué datos debe recopilar el bot del usuario</span>
              </div>
            </div>

            {config.variablesRecopilar && config.variablesRecopilar.length > 0 ? (
              config.variablesRecopilar.map((variable, index) => (
                <div key={index} className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <h4>Variable {index + 1}</h4>
                    <button
                      className={styles.deleteButton}
                      onClick={() => eliminarVariable(index)}
                      title="Eliminar variable"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Nombre de Variable</label>
                      <input
                        type="text"
                        placeholder="Ej: titulo"
                        value={variable.nombre}
                        onChange={(e) => actualizarVariable(index, 'nombre', e.target.value)}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Tipo</label>
                      <select
                        value={variable.tipo}
                        onChange={(e) => actualizarVariable(index, 'tipo', e.target.value)}
                      >
                        <option value="texto">Texto</option>
                        <option value="numero">Número</option>
                        <option value="fecha">Fecha</option>
                        <option value="email">Email</option>
                        <option value="telefono">Teléfono</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Descripción</label>
                    <input
                      type="text"
                      placeholder="Ej: Título del libro que busca el cliente"
                      value={variable.descripcion}
                      onChange={(e) => actualizarVariable(index, 'descripcion', e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={variable.obligatorio}
                        onChange={(e) => actualizarVariable(index, 'obligatorio', e.target.checked)}
                      />
                      <span>Obligatorio</span>
                    </label>
                  </div>

                  {variable.tipo === 'numero' && (
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Mínimo</label>
                        <input
                          type="number"
                          placeholder="1"
                          value={variable.validacion?.min || ''}
                          onChange={(e) => actualizarValidacion(index, 'min', e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Máximo</label>
                        <input
                          type="number"
                          placeholder="10"
                          value={variable.validacion?.max || ''}
                          onChange={(e) => actualizarValidacion(index, 'max', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className={styles.formGroup}>
                    <label>Ejemplos (opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: Harry Potter, Matemática 3 (separados por coma)"
                      value={variable.ejemplos?.join(', ') || ''}
                      onChange={(e) => actualizarVariable(index, 'ejemplos', e.target.value)}
                    />
                    <small>Ejemplos que se mostrarán al usuario</small>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No hay variables configuradas</p>
                <small>Las variables son datos que el bot recopilará del usuario</small>
              </div>
            )}

            <button className={styles.addButton} onClick={agregarVariable}>
              <Plus size={16} />
              Agregar Variable
            </button>
          </div>
        )}

        {/* TAB: ACCIONES */}
        {activeTab === 'acciones' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Acciones al Completar</h3>
              <div className={styles.infoBox}>
                <Info size={16} />
                <span>Qué hacer cuando se recopilen todos los datos obligatorios</span>
              </div>
            </div>

            {config.accionesCompletado && config.accionesCompletado.length > 0 ? (
              config.accionesCompletado.map((accion, index) => (
                <div key={index} className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <h4>Acción {index + 1}</h4>
                    <button
                      className={styles.deleteButton}
                      onClick={() => eliminarAccion(index)}
                      title="Eliminar acción"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Tipo de Acción</label>
                    <select
                      value={accion.tipo}
                      onChange={(e) => actualizarAccion(index, 'tipo', e.target.value)}
                    >
                      <option value="mensaje">Enviar Mensaje</option>
                      <option value="marcar_completado">Marcar Completado</option>
                      <option value="guardar_variables_globales">Guardar Variables Globales</option>
                    </select>
                  </div>

                  {accion.tipo === 'mensaje' && (
                    <div className={styles.formGroup}>
                      <label>Mensaje</label>
                      <textarea
                        rows={3}
                        placeholder="Ej: Perfecto, voy a buscar: {{titulo}} - {{editorial}}"
                        value={accion.contenido || ''}
                        onChange={(e) => actualizarAccion(index, 'contenido', e.target.value)}
                      />
                      <small>Usa {`{{variable}}`} para interpolar valores</small>
                    </div>
                  )}

                  {accion.tipo === 'marcar_completado' && (
                    <div className={styles.formGroup}>
                      <label>Token de Completado</label>
                      <input
                        type="text"
                        placeholder="Ej: [INFO_COMPLETA]"
                        value={accion.token || ''}
                        onChange={(e) => actualizarAccion(index, 'token', e.target.value)}
                      />
                      <small>Token que el Router detectará para continuar el flujo</small>
                    </div>
                  )}

                  {accion.tipo === 'guardar_variables_globales' && (
                    <div className={styles.formGroup}>
                      <label>Variables a Guardar</label>
                      <input
                        type="text"
                        placeholder="Ej: titulo, editorial, edicion (separadas por coma)"
                        value={accion.variables?.join(', ') || ''}
                        onChange={(e) => actualizarAccion(index, 'variables', e.target.value)}
                      />
                      <small>Variables que se guardarán en el contexto global</small>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No hay acciones configuradas</p>
                <small>Las acciones se ejecutan cuando se completa la recopilación</small>
              </div>
            )}

            <button className={styles.addButton} onClick={agregarAccion}>
              <Plus size={16} />
              Agregar Acción
            </button>
          </div>
        )}

        {/* TAB: EXTRACCIÓN (para Formateador) */}
        {activeTab === 'extraccion' && esFormateador && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Configuración de Extracción y Formateo</h3>
              <div className={styles.infoBox}>
                <Info size={16} />
                <span>Este nodo NO habla con el usuario. Analiza el historial y extrae datos estructurados.</span>
              </div>
            </div>

            {/* Instrucciones de Extracción */}
            <div className={styles.formGroup}>
              <label>Instrucciones de Extracción</label>
              <textarea
                rows={8}
                placeholder="Ejemplo:\nAnaliza la conversación y extrae la información sobre el libro que el usuario está buscando.\nIdentifica el título del libro, la editorial (si la mencionó), y la edición (si la mencionó).\nSi el usuario dijo 'cualquiera', deja ese campo como null."
                value={config.configuracionExtraccion?.instruccionesExtraccion || ''}
                onChange={(e) => onChange({
                  ...config,
                  configuracionExtraccion: {
                    ...config.configuracionExtraccion!,
                    instruccionesExtraccion: e.target.value
                  }
                })}
              />
              <small>Describe qué información debe extraer del historial de conversación</small>
            </div>

            {/* Fuente de Datos */}
            <div className={styles.formGroup}>
              <label>Fuente de Datos</label>
              <select
                value={config.configuracionExtraccion?.fuenteDatos || 'historial_completo'}
                onChange={(e) => onChange({
                  ...config,
                  configuracionExtraccion: {
                    ...config.configuracionExtraccion!,
                    fuenteDatos: e.target.value as any
                  }
                })}
              >
                <option value="historial_completo">Historial Completo</option>
                <option value="ultimo_mensaje">Último Mensaje</option>
                <option value="ultimos_n_mensajes">Últimos N Mensajes</option>
              </select>
            </div>

            {config.configuracionExtraccion?.fuenteDatos === 'ultimos_n_mensajes' && (
              <div className={styles.formGroup}>
                <label>Cantidad de Mensajes</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={config.configuracionExtraccion?.cantidadMensajes || 5}
                  onChange={(e) => onChange({
                    ...config,
                    configuracionExtraccion: {
                      ...config.configuracionExtraccion!,
                      cantidadMensajes: Number(e.target.value)
                    }
                  })}
                />
                <small>Número de mensajes recientes a analizar</small>
              </div>
            )}

            {/* Formato de Salida */}
            <div className={styles.formGroup}>
              <label>Tipo de Formato de Salida</label>
              <select
                value={config.configuracionExtraccion?.formatoSalida?.tipo || 'json'}
                onChange={(e) => onChange({
                  ...config,
                  configuracionExtraccion: {
                    ...config.configuracionExtraccion!,
                    formatoSalida: {
                      ...config.configuracionExtraccion!.formatoSalida,
                      tipo: e.target.value as any
                    }
                  }
                })}
              >
                <option value="json">JSON</option>
                <option value="texto">Texto</option>
                <option value="lista">Lista</option>
              </select>
            </div>

            {config.configuracionExtraccion?.formatoSalida?.tipo === 'json' && (
              <>
                <div className={styles.formGroup}>
                  <label>Estructura JSON Esperada</label>
                  <textarea
                    rows={3}
                    placeholder='Ejemplo: { "titulo_libro": string, "editorial": string | null, "edicion": string | null }'
                    value={config.configuracionExtraccion?.formatoSalida?.estructura || ''}
                    onChange={(e) => onChange({
                      ...config,
                      configuracionExtraccion: {
                        ...config.configuracionExtraccion!,
                        formatoSalida: {
                          ...config.configuracionExtraccion!.formatoSalida,
                          estructura: e.target.value
                        }
                      }
                    })}
                  />
                  <small>Define la estructura del JSON que esperas recibir</small>
                </div>

                <div className={styles.formGroup}>
                  <label>Ejemplo de Salida</label>
                  <textarea
                    rows={3}
                    placeholder='Ejemplo: { "titulo_libro": "Harry Potter 3", "editorial": null, "edicion": null }'
                    value={config.configuracionExtraccion?.formatoSalida?.ejemplo || ''}
                    onChange={(e) => onChange({
                      ...config,
                      configuracionExtraccion: {
                        ...config.configuracionExtraccion!,
                        formatoSalida: {
                          ...config.configuracionExtraccion!.formatoSalida,
                          ejemplo: e.target.value
                        }
                      }
                    })}
                  />
                  <small>Proporciona un ejemplo concreto de la salida esperada</small>
                </div>
              </>
            )}

            {/* Campos Esperados */}
            <div className={styles.sectionHeader} style={{ marginTop: '2rem' }}>
              <h4>Campos a Extraer</h4>
              <div className={styles.infoBox}>
                <Info size={16} />
                <span>Define qué campos específicos debe extraer del historial</span>
              </div>
            </div>

            {config.configuracionExtraccion?.camposEsperados && config.configuracionExtraccion.camposEsperados.length > 0 ? (
              config.configuracionExtraccion.camposEsperados.map((campo, index) => (
                <div key={index} className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <h4>Campo {index + 1}</h4>
                    <button
                      className={styles.deleteButton}
                      onClick={() => eliminarCampoEsperado(index)}
                      title="Eliminar campo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Nombre del Campo</label>
                      <input
                        type="text"
                        placeholder="Ej: titulo_libro"
                        value={campo.nombre}
                        onChange={(e) => actualizarCampoEsperado(index, 'nombre', e.target.value)}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Tipo de Dato</label>
                      <select
                        value={campo.tipoDato}
                        onChange={(e) => actualizarCampoEsperado(index, 'tipoDato', e.target.value)}
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="array">Array</option>
                        <option value="object">Object</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Descripción</label>
                    <input
                      type="text"
                      placeholder="Ej: Título del libro que el usuario mencionó"
                      value={campo.descripcion}
                      onChange={(e) => actualizarCampoEsperado(index, 'descripcion', e.target.value)}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={campo.requerido}
                          onChange={(e) => actualizarCampoEsperado(index, 'requerido', e.target.checked)}
                        />
                        <span>Campo Requerido</span>
                      </label>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Valor por Defecto</label>
                      <input
                        type="text"
                        placeholder="null"
                        value={campo.valorPorDefecto || ''}
                        onChange={(e) => actualizarCampoEsperado(index, 'valorPorDefecto', e.target.value || null)}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No hay campos configurados</p>
                <small>Define qué campos debe extraer el formateador del historial</small>
              </div>
            )}

            <button className={styles.addButton} onClick={agregarCampoEsperado}>
              <Plus size={16} />
              Agregar Campo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GPTConfigPanel;
