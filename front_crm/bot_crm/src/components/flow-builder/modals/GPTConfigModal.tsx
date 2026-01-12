import React, { useState, memo } from 'react';
import { X } from 'lucide-react';
import styles from './GPTConfigModal.module.css';

interface GPTConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: GPTConfig) => void;
  moduleType: 'conversacional' | 'formateador' | 'procesador' | 'transform';
  moduleName: string;
}

export interface GPTConfig {
  tipo: 'conversacional' | 'formateador' | 'procesador' | 'transform';
  modelo: string;
  temperatura: number;
  maxTokens: number;
  systemPrompt: string;
  // NUEVO SISTEMA: Personalidad + Tópicos + Variables
  personalidad?: string;
  topicos?: Array<{
    titulo: string;
    contenido: string;
  }>;
  variablesRecopilar?: Array<{
    nombre: string;
    descripcion: string;
    obligatoria: boolean;
  }>;
  // Legacy
  variablesEntrada?: string[];
  variablesSalida?: string[];
  outputFormat?: 'text' | 'json';
  jsonSchema?: string;
  extractionConfig?: {
    systemPrompt?: string;
    variables?: Array<{
      nombre: string;
      tipo: string;
      descripcion: string;
      obligatoria: boolean;
    }>;
  };
}

const GPTConfigModal: React.FC<GPTConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  moduleType,
  moduleName,
}) => {
  const [config, setConfig] = useState<GPTConfig>({
    tipo: moduleType,
    modelo: 'gpt-4',
    temperatura: 0.7,
    maxTokens: 500,
    systemPrompt: getDefaultPrompt(moduleType),
    variablesEntrada: [],
    variablesSalida: [],
    outputFormat: moduleType === 'transform' ? 'json' : 'text',
    jsonSchema: moduleType === 'transform' ? '{\n  "campo1": "valor1",\n  "campo2": "valor2"\n}' : '',
  });

  function getDefaultPrompt(tipo: string): string {
    switch (tipo) {
      case 'conversacional':
        return 'Eres un asistente virtual amable y profesional. Tu objetivo es ayudar al cliente respondiendo sus preguntas y recopilando información necesaria.';
      case 'formateador':
        return 'Tu tarea es transformar la información recopilada en un formato estructurado específico. Sigue exactamente el formato solicitado.';
      case 'procesador':
        return 'Analiza la información proporcionada, extrae los datos clave y toma decisiones basadas en las reglas establecidas.';
      case 'transform':
        return 'Extrae información del texto y devuélvela en formato JSON estructurado según el schema proporcionado.';
      default:
        return '';
    }
  }

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const handleVariablesEntradaChange = (value: string) => {
    const variables = value.split(',').map(v => v.trim()).filter(v => v);
    setConfig({ ...config, variablesEntrada: variables });
  };

  const handleVariablesSalidaChange = (value: string) => {
    const variables = value.split(',').map(v => v.trim()).filter(v => v);
    setConfig({ ...config, variablesSalida: variables });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2>Configurar {moduleName}</h2>
            <p className={styles.subtitle}>Tipo: {moduleType}</p>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Modelo */}
          <div className={styles.formGroup}>
            <label>Modelo</label>
            <select
              value={config.modelo}
              onChange={(e) => setConfig({ ...config, modelo: e.target.value })}
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>


          {/* System Prompt */}
          <div className={styles.formGroup}>
            <label>System Prompt</label>
            <textarea
              rows={6}
              value={config.systemPrompt}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              placeholder="Instrucciones para el modelo..."
            />
          </div>

          {/* Variables de Entrada */}
          <div className={styles.formGroup}>
            <label>Variables de Entrada</label>
            <input
              type="text"
              value={config.variablesEntrada?.join(', ') || ''}
              onChange={(e) => handleVariablesEntradaChange(e.target.value)}
              placeholder="mensaje_usuario, nombre_cliente, producto"
            />
            <small>Variables disponibles del nodo anterior (separadas por coma)</small>
          </div>

          {/* Variables de Salida */}
          <div className={styles.formGroup}>
            <label>Variables de Salida</label>
            <input
              type="text"
              value={config.variablesSalida?.join(', ') || ''}
              onChange={(e) => handleVariablesSalidaChange(e.target.value)}
              placeholder="respuesta_gpt, datos_extraidos, decision"
            />
            <small>Variables que este nodo generará para nodos siguientes</small>
          </div>

          {/* Configuración específica para Transform */}
          {moduleType === 'transform' && (
            <>
              <div className={styles.formGroup}>
                <label>Formato de Salida</label>
                <select
                  value={config.outputFormat}
                  onChange={(e) => setConfig({ ...config, outputFormat: e.target.value as 'text' | 'json' })}
                >
                  <option value="json">JSON</option>
                  <option value="text">Texto</option>
                </select>
              </div>

              {config.outputFormat === 'json' && (
                <div className={styles.formGroup}>
                  <label>JSON Schema</label>
                  <textarea
                    rows={8}
                    value={config.jsonSchema}
                    onChange={(e) => setConfig({ ...config, jsonSchema: e.target.value })}
                    placeholder='{\n  "nombre": "",\n  "email": "",\n  "producto": ""\n}'
                    className={styles.codeInput}
                  />
                  <small>Estructura JSON esperada en la salida</small>
                </div>
              )}
            </>
          )}

          {/* Info específica por tipo */}
          <div className={styles.infoBox}>
            <strong>ℹ️ {getInfoTitle(moduleType)}</strong>
            <p>{getInfoText(moduleType)}</p>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.saveButton} onClick={handleSave}>
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};

function getInfoTitle(tipo: string): string {
  switch (tipo) {
    case 'conversacional':
      return 'GPT Conversacional';
    case 'formateador':
      return 'GPT Formateador';
    case 'procesador':
      return 'GPT Procesador';
    case 'transform':
      return 'Transform to Structured Data';
    default:
      return '';
  }
}

function getInfoText(tipo: string): string {
  switch (tipo) {
    case 'conversacional':
      return 'Este nodo conversa con el usuario, responde preguntas y recopila información. Ideal para atención al cliente y recopilación de datos.';
    case 'formateador':
      return 'Este nodo transforma datos recopilados en un formato específico. Útil para preparar datos antes de enviarlos a WooCommerce, APIs o bases de datos.';
    case 'procesador':
      return 'Este nodo analiza información, extrae datos clave y toma decisiones. Útil para clasificar, validar o procesar información antes de continuar el flujo.';
    case 'transform':
      return 'Este nodo extrae información estructurada del texto. Devuelve un JSON con los datos extraídos según el schema definido.';
    default:
      return '';
  }
}

export default memo(GPTConfigModal);
