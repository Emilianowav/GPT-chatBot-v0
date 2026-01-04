'use client';

import { useState } from 'react';
import { X, Save, ExternalLink } from 'lucide-react';
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
    webhookUrl: '',
  });
  const [webhookCreated, setWebhookCreated] = useState(false);

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
            <>
              <div className={styles.webhookSection}>
                <div className={styles.webhookHeader}>
                  <span className={styles.webhookLabel}>Webhook</span>
                  <span className={styles.webhookRequired}>*</span>
                </div>
                
                {!webhookCreated ? (
                  <>
                    <button 
                      className={styles.createWebhookBtn}
                      onClick={() => {
                        const newWebhookUrl = `${window.location.origin}/api/webhook/whatsapp/${module.id}`;
                        updateField('webhookUrl', newWebhookUrl);
                        setWebhookCreated(true);
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" style={{ marginRight: '8px' }}>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      Create a webhook
                    </button>
                    <p className={styles.webhookInfo}>
                      For more information on how to create a webhook in WhatsApp Business Cloud, see the <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks" target="_blank" rel="noopener noreferrer" className={styles.link}>online Help</a>.
                    </p>
                  </>
                ) : (
                  <>
                    <div className={styles.webhookCreated}>
                      <div className={styles.webhookUrlBox}>
                        <code className={styles.webhookUrl}>{config.webhookUrl}</code>
                        <button 
                          className={styles.copyBtn}
                          onClick={() => {
                            navigator.clipboard.writeText(config.webhookUrl);
                          }}
                          title="Copiar URL"
                        >
                          📋
                        </button>
                      </div>
                      <div className={styles.webhookInstructions}>
                        <h4>Configuración en Meta:</h4>
                        <ol>
                          <li>Ve a <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className={styles.link}>Meta for Developers</a></li>
                          <li>Selecciona tu app de WhatsApp Business</li>
                          <li>Ve a WhatsApp → Configuration</li>
                          <li>En "Webhook", haz click en "Edit"</li>
                          <li>Pega esta URL: <code>{config.webhookUrl}</code></li>
                          <li>Verify Token: <code>Momento@2001-ic</code></li>
                          <li>Suscríbete a: <strong>messages</strong></li>
                        </ol>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
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
