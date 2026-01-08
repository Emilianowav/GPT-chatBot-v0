import React, { useState } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import styles from './GPTConfigPanel.module.css';

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

interface GPTFormateadorConfigProps {
  config: ConfiguracionExtraccion;
  onChange: (config: ConfiguracionExtraccion) => void;
}

const GPTFormateadorConfig: React.FC<GPTFormateadorConfigProps> = ({ config, onChange }) => {
  const agregarCampo = () => {
    const nuevoCampo: CampoEsperado = {
      nombre: '',
      descripcion: '',
      tipoDato: 'string',
      requerido: false,
      valorPorDefecto: null
    };
    onChange({
      ...config,
      camposEsperados: [...(config.camposEsperados || []), nuevoCampo]
    });
  };

  const actualizarCampo = (index: number, campo: keyof CampoEsperado, valor: any) => {
    const campos = [...(config.camposEsperados || [])];
    (campos[index] as any)[campo] = valor;
    onChange({ ...config, camposEsperados: campos });
  };

  const eliminarCampo = (index: number) => {
    const campos = [...(config.camposEsperados || [])];
    campos.splice(index, 1);
    onChange({ ...config, camposEsperados: campos });
  };

  return (
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
          rows={6}
          placeholder="Ejemplo:&#10;Analiza la conversación y extrae la información sobre el libro que el usuario está buscando.&#10;Identifica el título del libro, la editorial (si la mencionó), y la edición (si la mencionó).&#10;Si el usuario dijo 'cualquiera', deja ese campo como null."
          value={config.instruccionesExtraccion || ''}
          onChange={(e) => onChange({ ...config, instruccionesExtraccion: e.target.value })}
        />
        <small>Describe qué información debe extraer del historial de conversación</small>
      </div>

      {/* Fuente de Datos */}
      <div className={styles.formGroup}>
        <label>Fuente de Datos</label>
        <select
          value={config.fuenteDatos || 'historial_completo'}
          onChange={(e) => onChange({ ...config, fuenteDatos: e.target.value as any })}
        >
          <option value="historial_completo">Historial Completo</option>
          <option value="ultimo_mensaje">Último Mensaje</option>
          <option value="ultimos_n_mensajes">Últimos N Mensajes</option>
        </select>
      </div>

      {config.fuenteDatos === 'ultimos_n_mensajes' && (
        <div className={styles.formGroup}>
          <label>Cantidad de Mensajes</label>
          <input
            type="number"
            min="1"
            max="20"
            value={config.cantidadMensajes || 5}
            onChange={(e) => onChange({ ...config, cantidadMensajes: Number(e.target.value) })}
          />
          <small>Número de mensajes recientes a analizar</small>
        </div>
      )}

      {/* Formato de Salida */}
      <div className={styles.formGroup}>
        <label>Tipo de Formato de Salida</label>
        <select
          value={config.formatoSalida?.tipo || 'json'}
          onChange={(e) => onChange({ 
            ...config, 
            formatoSalida: { ...config.formatoSalida, tipo: e.target.value as any }
          })}
        >
          <option value="json">JSON</option>
          <option value="texto">Texto</option>
          <option value="lista">Lista</option>
        </select>
      </div>

      {config.formatoSalida?.tipo === 'json' && (
        <>
          <div className={styles.formGroup}>
            <label>Estructura JSON Esperada</label>
            <textarea
              rows={3}
              placeholder='Ejemplo: { "titulo_libro": string, "editorial": string | null, "edicion": string | null }'
              value={config.formatoSalida?.estructura || ''}
              onChange={(e) => onChange({ 
                ...config, 
                formatoSalida: { ...config.formatoSalida, estructura: e.target.value }
              })}
            />
            <small>Define la estructura del JSON que esperas recibir</small>
          </div>

          <div className={styles.formGroup}>
            <label>Ejemplo de Salida</label>
            <textarea
              rows={3}
              placeholder='Ejemplo: { "titulo_libro": "Harry Potter 3", "editorial": null, "edicion": null }'
              value={config.formatoSalida?.ejemplo || ''}
              onChange={(e) => onChange({ 
                ...config, 
                formatoSalida: { ...config.formatoSalida, ejemplo: e.target.value }
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

      {config.camposEsperados && config.camposEsperados.length > 0 ? (
        config.camposEsperados.map((campo, index) => (
          <div key={index} className={styles.itemCard}>
            <div className={styles.itemHeader}>
              <h4>Campo {index + 1}</h4>
              <button
                className={styles.deleteButton}
                onClick={() => eliminarCampo(index)}
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
                  onChange={(e) => actualizarCampo(index, 'nombre', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Tipo de Dato</label>
                <select
                  value={campo.tipoDato}
                  onChange={(e) => actualizarCampo(index, 'tipoDato', e.target.value)}
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
                onChange={(e) => actualizarCampo(index, 'descripcion', e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={campo.requerido}
                    onChange={(e) => actualizarCampo(index, 'requerido', e.target.checked)}
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
                  onChange={(e) => actualizarCampo(index, 'valorPorDefecto', e.target.value || null)}
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

      <button className={styles.addButton} onClick={agregarCampo}>
        <Plus size={16} />
        Agregar Campo
      </button>
    </div>
  );
};

export default GPTFormateadorConfig;
