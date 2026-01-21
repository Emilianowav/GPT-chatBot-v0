import { memo, useState, useEffect } from 'react';
import { X, TestTube } from 'lucide-react';
import styles from './WebhookConfigModal.module.css';

interface WebhookConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WebhookConfig) => void;
  initialConfig?: WebhookConfig;
  nodeId: string;
}

interface WebhookConfig {
  module?: string;
  webhookName: string;
  telefono: string;
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  appId: string;
  appSecret: string;
  capturePhoneNumber?: boolean;
  phoneNumberVariableName?: string;
  message?: string;
  destinationVariable?: string;
}

function WebhookConfigModal({
  isOpen,
  onClose,
  onSave,
  initialConfig,
  nodeId,
}: WebhookConfigModalProps) {
  const [config, setConfig] = useState<WebhookConfig>({
    module: 'watch-events',
    webhookName: 'WhatsApp Business Webhook',
    telefono: '',
    phoneNumberId: '',
    accessToken: '',
    businessAccountId: '',
    appId: '',
    appSecret: '',
    capturePhoneNumber: true,
    phoneNumberVariableName: 'telefono_usuario',
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Actualizar config cuando initialConfig cambie o el modal se abra
  useEffect(() => {
    if (isOpen && initialConfig) {
      setConfig({
        module: initialConfig.module || 'watch-events',
        webhookName: initialConfig.webhookName || 'WhatsApp Business Webhook',
        telefono: initialConfig.telefono || '',
        phoneNumberId: initialConfig.phoneNumberId || '',
        accessToken: initialConfig.accessToken || '',
        businessAccountId: initialConfig.businessAccountId || '',
        appId: initialConfig.appId || '',
        appSecret: initialConfig.appSecret || '',
        capturePhoneNumber: initialConfig.capturePhoneNumber ?? true,
        phoneNumberVariableName: initialConfig.phoneNumberVariableName || 'telefono_usuario',
      });
    } else if (isOpen && !initialConfig) {
      // Resetear a valores por defecto si no hay initialConfig
      setConfig({
        module: 'watch-events',
        webhookName: 'WhatsApp Business Webhook',
        telefono: '',
        phoneNumberId: '',
        accessToken: '',
        businessAccountId: '',
        appId: '',
        appSecret: '',
        capturePhoneNumber: true,
        phoneNumberVariableName: 'telefono_usuario',
      });
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const handleTestWebhook = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/whatsapp/test-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId: config.phoneNumberId,
          accessToken: config.accessToken,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTestResult({ success: true, message: '✅ Webhook configurado correctamente' });
      } else {
        setTestResult({ success: false, message: `❌ Error: ${data.error || 'No se pudo conectar'}` });
      }
    } catch (error: any) {
      setTestResult({ success: false, message: `❌ Error: ${error.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSave(config);
  };

  const updateConfig = (field: keyof WebhookConfig, value: string) => {
    setConfig({ ...config, [field]: value });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            ⚙️ Configuración de WhatsApp Webhook
          </h3>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              🔧 Módulo <span className={styles.required}>*</span>
            </label>
            <select
              className={styles.input}
              value={config.module || 'watch-events'}
              onChange={(e) => updateConfig('module', e.target.value)}
            >
              <option value="watch-events">Watch Events (Recibir mensajes)</option>
              <option value="send-message">Send Message (Enviar mensajes)</option>
            </select>
            <span className={styles.hint}>
              {config.module === 'watch-events' 
                ? '📥 Este nodo escucha mensajes entrantes de WhatsApp (debe ser el primer nodo del flujo)'
                : '📤 Este nodo envía mensajes de WhatsApp a usuarios'}
            </span>
          </div>

          {/* Campos comunes para ambos módulos */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              📝 Nombre del Webhook <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              className={styles.input}
              value={config.webhookName}
              onChange={(e) => updateConfig('webhookName', e.target.value)}
              placeholder="WhatsApp Business Webhook"
              maxLength={128}
            />
            <span className={styles.hint}>Nombre identificatorio del webhook (1-128 caracteres)</span>
          </div>

          {/* Campos específicos para watch-events */}
          {config.module === 'watch-events' && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  📱 Teléfono de WhatsApp
                </label>
                <input
                  type="tel"
                  className={styles.input}
                  value={config.telefono}
                  onChange={(e) => updateConfig('telefono', e.target.value)}
                  placeholder="+5493794123456"
                />
                <span className={styles.hint}>Número de teléfono de WhatsApp Business (formato: +54 seguido del código de área y número)</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  📱 Phone Number ID <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={config.phoneNumberId}
                  onChange={(e) => updateConfig('phoneNumberId', e.target.value)}
                  placeholder="888481464341184"
                />
                <span className={styles.hint}>ID del número de teléfono de WhatsApp Business</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  🔑 META_WHATSAPP_TOKEN <span className={styles.required}>*</span>
                </label>
                <input
                  type="password"
                  className={styles.input}
                  value={config.accessToken}
                  onChange={(e) => updateConfig('accessToken', e.target.value)}
                  placeholder="EAAxxxxxxxxxx..."
                />
                <span className={styles.hint}>Token de acceso permanente de la app de Meta</span>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>🏢 WABA ID</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={config.businessAccountId}
                    onChange={(e) => updateConfig('businessAccountId', e.target.value)}
                    placeholder="123456789012345"
                  />
                  <span className={styles.hint}>WhatsApp Business Account ID</span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>📲 App ID</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={config.appId}
                    onChange={(e) => updateConfig('appId', e.target.value)}
                    placeholder="123456789012345"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>🔐 App Secret</label>
                <input
                  type="password"
                  className={styles.input}
                  value={config.appSecret}
                  onChange={(e) => updateConfig('appSecret', e.target.value)}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
                <span className={styles.hint}>Secret de la aplicación de Meta</span>
              </div>

              {/* Sección de captura de teléfono */}
              <div className={styles.formGroup} style={{ marginTop: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={config.capturePhoneNumber ?? true}
                    onChange={(e) => setConfig({ ...config, capturePhoneNumber: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>📱 Capturar número de teléfono del usuario</span>
                </label>
                <span className={styles.hint} style={{ marginTop: '8px', display: 'block' }}>
                  Formato internacional (ej: +5493794123456)
                </span>
                
                {config.capturePhoneNumber && (
                  <div style={{ marginTop: '12px' }}>
                    <label className={styles.label}>Guardar en variable</label>
                    <select
                      className={styles.input}
                      value={config.phoneNumberVariableName || 'telefono_usuario'}
                      onChange={(e) => setConfig({ ...config, phoneNumberVariableName: e.target.value })}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="telefono_usuario">telefono_usuario</option>
                      <option value="telefono_cliente">telefono_cliente</option>
                      <option value="telefono">telefono</option>
                      <option value="phone">phone</option>
                      <option value="numero_contacto">numero_contacto</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Botón de prueba */}
              <div className={styles.testSection}>
                <button
                  className={styles.btnTest}
                  onClick={handleTestWebhook}
                  disabled={!config.phoneNumberId || !config.accessToken || isTesting}
                >
                  <TestTube size={16} />
                  {isTesting ? 'Probando...' : 'Probar Webhook'}
                </button>
                {testResult && (
                  <div className={`${styles.testResult} ${testResult.success ? styles.success : styles.error}`}>
                    {testResult.message}
                  </div>
                )}
              </div>

              <div className={styles.helpTooltip}>
                <div className={styles.tooltipTrigger}>
                  ℹ️ ¿Dónde encontrar estas credenciales?
                </div>
                <div className={styles.tooltipContent}>
                  <strong>Pasos para obtener las credenciales:</strong>
                  <ol>
                    <li>Ve a <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer">Meta for Developers</a></li>
                    <li>Selecciona tu app de WhatsApp Business</li>
                    <li>En el panel lateral, ve a WhatsApp → API Setup</li>
                    <li>Copia el Phone Number ID y el Access Token</li>
                  </ol>
                </div>
              </div>
            </>
          )}

          {/* Campos específicos para send-message */}
          {config.module === 'send-message' && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  💬 Mensaje a Enviar <span className={styles.required}>*</span>
                </label>
                <textarea
                  className={styles.input}
                  value={config.message || ''}
                  onChange={(e) => updateConfig('message', e.target.value)}
                  placeholder="Escribe el mensaje que se enviará al usuario...\n\nPuedes usar variables: {{nombre_variable}}"
                  rows={6}
                  style={{ resize: 'vertical', minHeight: '120px' }}
                />
                <span className={styles.hint}>Puedes usar variables del flujo con la sintaxis: {'{{'} nombre_variable {'}}'}</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  📱 Número de Destino (Variable)
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={config.destinationVariable || 'telefono_usuario'}
                  onChange={(e) => updateConfig('destinationVariable', e.target.value)}
                  placeholder="telefono_usuario"
                />
                <span className={styles.hint}>Variable que contiene el número de teléfono del destinatario</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose}>
            Cancelar
          </button>
          <button 
            className={styles.btnSave} 
            onClick={handleSave}
            disabled={
              !config.webhookName || 
              (config.module === 'watch-events' && (!config.phoneNumberId || !config.accessToken)) ||
              (config.module === 'send-message' && !config.message)
            }
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(WebhookConfigModal);
export type { WebhookConfig };
