import React, { useState } from 'react';
import { X } from 'lucide-react';
import styles from './WebhookSetupModal_NEW.module.css';

interface WebhookSetupModalProps {
  appName: string;
  onComplete: (config: any) => void;
  onClose: () => void;
}

const WebhookSetupModal: React.FC<WebhookSetupModalProps> = ({ appName, onComplete, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [webhookName, setWebhookName] = useState('My WhatsApp Business Cloud Events webhook');
  const [connectionName, setConnectionName] = useState('My WhatsApp Business Cloud connection');
  const [phoneNumberId, setPhoneNumberId] = useState('768730689655171');
  const [accessToken, setAccessToken] = useState('EAAPeiTV9uuMBPhhsskPVthAZB6g60bydoyB33kaIg0G2b8L43wwsnmSqmgaCcw7Az9FZCZBq2ogW3J46jmw92tz6oSjjQZARFcwwOBGcTBVnyOAqRtjl4wuS57gIhzPx5wZCK3NuZBj0AvMo0MdZAuIfrZCHIit367LgfFTXE9SQCM4woZAkSVhTW2Jc3pJNhOVJmgZDZD');

  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setStep(3);
      }, 1500);
    }
  };

  const handleDone = () => {
    onComplete({
      webhookUrl: 'https://icenter.ar/wp-json/momento/v1/wa',
      connectionName,
      phoneNumberId,
      accessToken,
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Create a webhook</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.content}>
          {step === 1 && (
            <>
              <div className={styles.step}>
                <span className={styles.stepNum}>1</span>
                <span className={styles.stepLabel}>Webhook name <span className={styles.required}>*</span></span>
              </div>
              <input
                type="text"
                className={styles.input}
                value={webhookName}
                onChange={(e) => setWebhookName(e.target.value)}
                placeholder="My WhatsApp Business Cloud Events webhook"
              />
              <p className={styles.hint}>
                ⚠️ Must be between 1 and 128 characters long.
              </p>

              <div className={styles.step}>
                <span className={styles.stepNum}>2</span>
                <span className={styles.stepLabel}>Connection <span className={styles.required}>*</span></span>
              </div>
              <button className={styles.createConnectionBtn} onClick={handleContinue}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Create a connection
              </button>
              <p className={styles.helpText}>
                For more information on how to create a connection to WhatsApp Business Cloud, see the{' '}
                <a href="https://developers.facebook.com/docs/whatsapp/cloud-api" target="_blank" rel="noopener noreferrer" className={styles.link}>
                  online Help
                </a>.
              </p>
            </>
          )}

          {step === 2 && !loading && (
            <>
              <div className={styles.warningBox}>
                <span className={styles.warningIcon}>⚠️</span>
                <div>
                  <strong>Turn off your 2FA</strong>
                  <p>Please turn off the 2FA if you have it enabled for your existing WhatsApp Business number.</p>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Connection type <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value="WhatsApp Business Cloud"
                  disabled
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Connection name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Phone Number ID <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  placeholder="Hosting in Meta for Developers - WhatsApp - API Setup"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Access Token <span className={styles.required}>*</span>
                </label>
                <textarea
                  className={styles.textarea}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          {loading && (
            <div className={styles.loadingBox}>
              <div className={styles.spinner}></div>
              <p>Creating connection...</p>
              <p className={styles.loadingSubtext}>Please wait</p>
            </div>
          )}

          {step === 3 && (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>✓</div>
              <h3>Configuration complete</h3>
              <div className={styles.summary}>
                <p><strong>Webhook:</strong> {webhookName}</p>
                <p><strong>Connection:</strong> {connectionName}</p>
                <p><strong>Phone Number ID:</strong> {phoneNumberId}</p>
                <code className={styles.codeBlock}>https://icenter.ar/wp-json/momento/v1/wa</code>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {step < 3 ? (
            <>
              <button className={styles.btnCancel} onClick={onClose}>
                Close
              </button>
              <button 
                className={styles.btnContinue} 
                onClick={handleContinue}
                disabled={loading || (step === 1 && !webhookName)}
              >
                {step === 1 ? 'Continue' : 'Save'}
              </button>
            </>
          ) : (
            <button className={styles.btnDone} onClick={handleDone}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebhookSetupModal;
