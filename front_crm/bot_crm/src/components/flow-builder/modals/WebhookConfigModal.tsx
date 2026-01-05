import { memo, useState } from 'react';
import { X } from 'lucide-react';
import styles from './WebhookConfigModal.module.css';

interface WebhookConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WebhookConfig) => void;
  appName: string;
  moduleName: string;
}

interface WebhookConfig {
  webhookName: string;
  webhookUrl?: string;
  connectionName?: string;
}

function WebhookConfigModal({
  isOpen,
  onClose,
  onSave,
  appName,
  moduleName,
}: WebhookConfigModalProps) {
  const [step, setStep] = useState<'webhook' | 'connection'>('webhook');
  const [webhookName, setWebhookName] = useState(`My ${appName} Events webhook`);
  const [connectionName, setConnectionName] = useState(`My ${appName} connection`);
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);

  if (!isOpen) return null;

  const handleCreateWebhook = () => {
    setIsCreatingWebhook(true);
    
    // Simular creación de webhook
    setTimeout(() => {
      setIsCreatingWebhook(false);
      setStep('connection');
    }, 1000);
  };

  const handleCreateConnection = () => {
    setIsCreatingConnection(true);
    
    // Simular creación de conexión
    setTimeout(() => {
      setIsCreatingConnection(false);
      
      // Guardar configuración completa
      onSave({
        webhookName,
        webhookUrl: `https://api.momentoia.co/webhook/${appName.toLowerCase().replace(/\s+/g, '-')}`,
        connectionName,
      });
    }, 1500);
  };

  const handleSave = () => {
    if (step === 'webhook') {
      handleCreateWebhook();
    } else {
      handleCreateConnection();
    }
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
            {step === 'webhook' ? 'Create a webhook' : 'Create a connection'}
          </h3>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalBody}>
          {step === 'webhook' ? (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Webhook name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={webhookName}
                  onChange={(e) => setWebhookName(e.target.value)}
                  placeholder={`My ${appName} Events webhook`}
                  maxLength={128}
                />
                <span className={styles.hint}>
                  Must be between 1 and 128 characters long.
                </span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Connection</label>
                <button
                  className={styles.createButton}
                  onClick={() => setStep('connection')}
                  disabled={!webhookName}
                >
                  <span className={styles.whatsappIcon}>📱</span>
                  Create a connection
                </button>
                <p className={styles.helpText}>
                  For more information on how to create a connection to {appName}, see the{' '}
                  <a href="#" className={styles.link}>online Help</a>.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Connection name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                  placeholder={`My ${appName} connection`}
                />
              </div>

              <div className={styles.infoBox}>
                <div className={styles.infoIcon}>⚠️</div>
                <div>
                  <strong>Turn off your 2FA</strong>
                  <p>Please turn off the 2FA if you have it enabled for your existing WhatsApp Business number.</p>
                </div>
              </div>

              <div className={styles.infoBox}>
                <div className={styles.infoIcon}>ℹ️</div>
                <div>
                  <strong>Encountered a 'Resource not found' Error?</strong>
                  <p>If you receive this error message after completing the onboarding process, please retry.</p>
                  <p className={styles.smallText}>
                    Any new Facebook Business Accounts or WhatsApp Business Accounts you created during your first attempt have been successfully created. When you retry, simply select these existing accounts from the list. It is not necessary to create them again.
                  </p>
                </div>
              </div>

              {isCreatingConnection && (
                <div className={styles.loadingBox}>
                  <div className={styles.spinner}></div>
                  <span>Creating a connection...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose}>
            {step === 'connection' ? 'Close' : 'Cancel'}
          </button>
          <button 
            className={styles.btnSave} 
            onClick={handleSave}
            disabled={
              (step === 'webhook' && !webhookName) ||
              (step === 'connection' && !connectionName) ||
              isCreatingWebhook ||
              isCreatingConnection
            }
          >
            {isCreatingWebhook || isCreatingConnection ? (
              <>
                <div className={styles.spinnerSmall}></div>
                {step === 'webhook' ? 'Creating...' : 'Connecting...'}
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(WebhookConfigModal);
