import React, { useState } from 'react';
import { X } from 'lucide-react';
import styles from './ModuleConfigModal.module.css';
import WebhookSetupModal from './WebhookSetupModal';

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

const ModuleConfigModal: React.FC<ModuleConfigModalProps> = ({ module, onSave, onClose }) => {
  const [showWebhookSetup, setShowWebhookSetup] = useState(false);
  const [config, setConfig] = useState<any>({
    webhookUrl: '',
    connectionName: '',
    phoneNumberId: '',
    // GPT config
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 500,
    systemPrompt: '',
    functions: [],
    // WooCommerce config
    endpoint: '',
    method: 'GET',
    authentication: 'basic',
    consumerKey: '',
    consumerSecret: '',
    // Generic config
    message: '',
  });

  const handleSave = () => {
    onSave(config);
  };

  const renderWhatsAppConfig = () => (
    <div className={styles.section}>
      <div className={styles.fieldLabel}>
        Webhook <span className={styles.required}>*</span>
      </div>

      {!config.webhookUrl ? (
        <>
          <button 
            className={styles.createBtn}
            onClick={() => setShowWebhookSetup(true)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Create a webhook
          </button>
          <p className={styles.helpText}>
            For more information on how to create a webhook in WhatsApp Business Cloud, see the{' '}
            <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks" target="_blank" rel="noopener noreferrer" className={styles.link}>
              online Help
            </a>.
          </p>
        </>
      ) : (
        <div className={styles.configuredBox}>
          <div className={styles.urlBox}>
            <code className={styles.url}>{config.webhookUrl}</code>
          </div>
          <div className={styles.details}>
            <p className={styles.detailItem}>✓ Webhook Configured</p>
            <p className={styles.detailItem}>Connection: {config.connectionName || 'WhatsApp Business Cloud'}</p>
            <p className={styles.detailItem}>Phone Number ID: {config.phoneNumberId || 'Not configured'}</p>
            <button 
              className={styles.reconfigBtn}
              onClick={() => setShowWebhookSetup(true)}
            >
              Reconfigure
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderGPTConfig = () => (
    <div className={styles.section}>
      <div className={styles.fieldLabel}>
        Model <span className={styles.required}>*</span>
      </div>
      <select 
        className={styles.select}
        value={config.model}
        onChange={(e) => setConfig({ ...config, model: e.target.value })}
      >
        <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
        <option value="gpt-4">GPT-4</option>
        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
      </select>

      <div className={styles.fieldLabel} style={{ marginTop: '16px' }}>
        System Prompt <span className={styles.required}>*</span>
      </div>
      <textarea
        className={styles.textarea}
        value={config.systemPrompt}
        onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
        placeholder="Eres un asistente virtual..."
        rows={6}
      />

      <div className={styles.fieldLabel} style={{ marginTop: '16px' }}>
        Temperature
      </div>
      <input
        type="number"
        className={styles.input}
        value={config.temperature}
        onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
        min="0"
        max="2"
        step="0.1"
      />

      <div className={styles.fieldLabel} style={{ marginTop: '16px' }}>
        Max Tokens
      </div>
      <input
        type="number"
        className={styles.input}
        value={config.maxTokens}
        onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
        min="1"
        max="4000"
      />

      <p className={styles.helpText} style={{ marginTop: '12px' }}>
        Configure el modelo GPT, el prompt del sistema y los parámetros de generación.
      </p>
    </div>
  );

  const renderWooCommerceConfig = () => (
    <div className={styles.section}>
      <div className={styles.fieldLabel}>
        Endpoint <span className={styles.required}>*</span>
      </div>
      <select 
        className={styles.select}
        value={config.endpoint}
        onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
      >
        <option value="">Seleccionar endpoint...</option>
        <option value="/products">GET /products - Buscar productos</option>
        <option value="/products/{id}">GET /products/{'{id}'} - Obtener producto</option>
        <option value="/orders">POST /orders - Crear pedido</option>
        <option value="/customers">GET /customers - Listar clientes</option>
      </select>

      <div className={styles.fieldLabel} style={{ marginTop: '16px' }}>
        Method
      </div>
      <select 
        className={styles.select}
        value={config.method}
        onChange={(e) => setConfig({ ...config, method: e.target.value })}
      >
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="DELETE">DELETE</option>
      </select>

      <div className={styles.fieldLabel} style={{ marginTop: '16px' }}>
        Authentication
      </div>
      <select 
        className={styles.select}
        value={config.authentication}
        onChange={(e) => setConfig({ ...config, authentication: e.target.value })}
      >
        <option value="basic">Basic Auth</option>
        <option value="oauth">OAuth</option>
      </select>

      {config.authentication === 'basic' && (
        <>
          <div className={styles.fieldLabel} style={{ marginTop: '16px' }}>
            Consumer Key
          </div>
          <input
            type="text"
            className={styles.input}
            value={config.consumerKey}
            onChange={(e) => setConfig({ ...config, consumerKey: e.target.value })}
            placeholder="ck_..."
          />

          <div className={styles.fieldLabel} style={{ marginTop: '16px' }}>
            Consumer Secret
          </div>
          <input
            type="password"
            className={styles.input}
            value={config.consumerSecret}
            onChange={(e) => setConfig({ ...config, consumerSecret: e.target.value })}
            placeholder="cs_..."
          />
        </>
      )}

      <p className={styles.helpText} style={{ marginTop: '12px' }}>
        Configure la conexión a WooCommerce REST API.
      </p>
    </div>
  );

  const renderGenericConfig = () => (
    <div className={styles.section}>
      <div className={styles.fieldLabel}>
        Message
      </div>
      <textarea
        className={styles.textarea}
        value={config.message}
        onChange={(e) => setConfig({ ...config, message: e.target.value })}
        placeholder="Mensaje o configuración..."
        rows={4}
      />
      <p className={styles.helpText} style={{ marginTop: '12px' }}>
        Configure este módulo según sus necesidades.
      </p>
    </div>
  );

  const renderConfigByApp = () => {
    switch (module.appName) {
      case 'WhatsApp':
      case 'WhatsApp Business Cloud':
        return renderWhatsAppConfig();
      
      case 'GPT':
      case 'OpenAI':
      case 'OpenAI (ChatGPT, Sora, DALL-E, Whisper)':
        return renderGPTConfig();
      
      case 'WooCommerce':
        return renderWooCommerceConfig();
      
      default:
        return renderGenericConfig();
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>{module.appName}</h2>
              <p className={styles.subtitle}>{module.name}</p>
            </div>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className={styles.content}>
            {renderConfigByApp()}
          </div>

          <div className={styles.footer}>
            <button className={styles.btnCancel} onClick={onClose}>
              Cancel
            </button>
            <button className={styles.btnSave} onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>

      {showWebhookSetup && (
        <WebhookSetupModal
          onSave={(webhookConfig) => {
            setConfig({ ...config, ...webhookConfig });
            setShowWebhookSetup(false);
          }}
          onClose={() => setShowWebhookSetup(false)}
        />
      )}
    </>
  );
};

export default ModuleConfigModal;
