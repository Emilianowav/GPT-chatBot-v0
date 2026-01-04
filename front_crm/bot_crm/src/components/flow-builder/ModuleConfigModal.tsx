'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import styles from './ModuleConfigModal.module.css';

interface ModuleConfigModalProps {
  module: {
    id: string;
    name: string;
    type: string;
    appName: string;
  };
  onSave: (config: any) => void;
  onClose: () => void;
}

export default function ModuleConfigModal({ module, onSave, onClose }: ModuleConfigModalProps) {
  const [config, setConfig] = useState<any>({
    message: '',
    variable: '',
    validation: { type: 'none' },
  });

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const updateField = (field: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{module.appName}</h2>
            <p className={styles.subtitle}>{module.name}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Configuración según tipo de módulo */}
          
          {/* WhatsApp - Enviar Mensaje */}
          {module.type === 'conversational_response' && (
            <>
              <div className={styles.section}>
                <label className={styles.label}>Mensaje</label>
                <textarea
                  className={styles.textarea}
                  value={config.message || ''}
                  onChange={(e) => updateField('message', e.target.value)}
                  placeholder="Escribe el mensaje que se enviará al usuario..."
                  rows={4}
                />
                <div className={styles.hint}>
                  Puedes usar variables como {'{'}nombre{'}'}, {'{'}email{'}'}
                </div>
              </div>
            </>
          )}

          {/* WhatsApp - Recopilar Respuesta */}
          {module.type === 'conversational_collect' && (
            <>
              <div className={styles.section}>
                <label className={styles.label}>Pregunta</label>
                <textarea
                  className={styles.textarea}
                  value={config.message || ''}
                  onChange={(e) => updateField('message', e.target.value)}
                  placeholder="¿Qué pregunta quieres hacer al usuario?"
                  rows={3}
                />
              </div>

              <div className={styles.section}>
                <label className={styles.label}>Variable</label>
                <input
                  type="text"
                  className={styles.input}
                  value={config.variable || ''}
                  onChange={(e) => updateField('variable', e.target.value)}
                  placeholder="Ej: nombre_usuario"
                />
                <div className={styles.hint}>
                  Nombre de la variable donde se guardará la respuesta
                </div>
              </div>

              <div className={styles.section}>
                <label className={styles.label}>Validación</label>
                <select
                  className={styles.select}
                  value={config.validation?.type || 'none'}
                  onChange={(e) => updateField('validation', { 
                    ...config.validation, 
                    type: e.target.value 
                  })}
                >
                  <option value="none">Sin validación</option>
                  <option value="text">Texto</option>
                  <option value="number">Número</option>
                  <option value="email">Email</option>
                  <option value="phone">Teléfono</option>
                </select>
              </div>
            </>
          )}

          {/* OpenAI - GPT Transform */}
          {module.type === 'gpt_transform' && (
            <>
              <div className={styles.section}>
                <label className={styles.label}>Prompt</label>
                <textarea
                  className={styles.textarea}
                  value={config.prompt || ''}
                  onChange={(e) => updateField('prompt', e.target.value)}
                  placeholder="Instrucciones para GPT..."
                  rows={4}
                />
              </div>

              <div className={styles.section}>
                <label className={styles.label}>Variable de salida</label>
                <input
                  type="text"
                  className={styles.input}
                  value={config.outputVariable || ''}
                  onChange={(e) => updateField('outputVariable', e.target.value)}
                  placeholder="Ej: respuesta_gpt"
                />
              </div>
            </>
          )}

          {/* API Call */}
          {module.type === 'api_call' && (
            <>
              <div className={styles.section}>
                <label className={styles.label}>URL del Endpoint</label>
                <input
                  type="text"
                  className={styles.input}
                  value={config.url || ''}
                  onChange={(e) => updateField('url', e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                />
              </div>

              <div className={styles.section}>
                <label className={styles.label}>Método</label>
                <select
                  className={styles.select}
                  value={config.method || 'GET'}
                  onChange={(e) => updateField('method', e.target.value)}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
            </>
          )}

          {/* Webhook */}
          {module.type === 'webhook' && (
            <div className={styles.section}>
              <label className={styles.label}>Webhook URL</label>
              <input
                type="text"
                className={styles.input}
                value={config.webhookUrl || ''}
                onChange={(e) => updateField('webhookUrl', e.target.value)}
                placeholder="https://your-domain.com/webhook"
                disabled
              />
              <div className={styles.hint}>
                Este webhook se generará automáticamente al guardar
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.btnSecondary} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.btnPrimary} onClick={handleSave}>
            <Save size={18} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
