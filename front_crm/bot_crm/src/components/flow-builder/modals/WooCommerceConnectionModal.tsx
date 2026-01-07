import React, { useState } from 'react';
import styles from './WooCommerceConnectionModal.module.css';
import type { WooCommerceConnection } from '../../../types/woocommerce.types';

interface WooCommerceConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (connection: WooCommerceConnection) => void;
  existingConnection?: WooCommerceConnection;
}

const WooCommerceConnectionModal: React.FC<WooCommerceConnectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingConnection
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<Partial<WooCommerceConnection>>({
    id: existingConnection?.id || `woo-conn-${Date.now()}`,
    name: existingConnection?.name || 'My WooCommerce connection',
    eshopUrl: existingConnection?.eshopUrl || '',
    consumerKey: existingConnection?.consumerKey || '',
    consumerSecret: existingConnection?.consumerSecret || '',
    selfSignedCert: existingConnection?.selfSignedCert || ''
  });

  if (!isOpen) return null;

  const handleSave = () => {
    // Validar campos obligatorios
    if (!formData.name || !formData.eshopUrl || !formData.consumerKey || !formData.consumerSecret) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validar que sea HTTPS
    if (!formData.eshopUrl.startsWith('https://')) {
      alert('La URL debe usar HTTPS');
      return;
    }

    onSave(formData as WooCommerceConnection);
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Create a connection</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <div className={styles.modalBody}>
          {/* Connection name */}
          <div className={styles.formGroup}>
            <label>
              <span className={styles.indicator}>⊙</span> Connection name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My WooCommerce connection"
            />
          </div>

          {/* Eshop URL */}
          <div className={styles.formGroup}>
            <label>
              <span className={styles.indicator}>⊙</span> Eshop URL <span className={styles.required}>*</span>
            </label>
            <input
              type="url"
              value={formData.eshopUrl}
              onChange={(e) => setFormData({ ...formData, eshopUrl: e.target.value })}
              placeholder="https://my-eshop.com"
            />
            <div className={styles.helpText}>
              For example, <span className={styles.code}>https://my-eshop.com</span>. HTTPS is required.
            </div>
            <div className={styles.helpText}>
              If you encounter an error 404, please try reset the permalinks:
              <ol>
                <li>Log in to the WordPress dashboard.</li>
                <li>Navigate to Settings &gt; Permalinks.</li>
                <li>Select a different permalink structure and save.</li>
                <li>Change back to the original setting and save again.</li>
              </ol>
            </div>
          </div>

          {/* Consumer Key */}
          <div className={styles.formGroup}>
            <label>
              <span className={styles.indicator}>⊙</span> Consumer Key <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={formData.consumerKey}
              onChange={(e) => setFormData({ ...formData, consumerKey: e.target.value })}
              placeholder="ck_..."
            />
          </div>

          {/* Consumer Secret */}
          <div className={styles.formGroup}>
            <label>
              <span className={styles.indicator}>⊙</span> Consumer Secret <span className={styles.required}>*</span>
            </label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.consumerSecret}
                onChange={(e) => setFormData({ ...formData, consumerSecret: e.target.value })}
                placeholder="cs_..."
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Self-signed certificate */}
          <div className={styles.formGroup}>
            <label>
              <span className={styles.indicator}>⊙</span> Self-signed certificate
            </label>
            <div className={styles.certWrapper}>
              <input
                type="text"
                value={formData.selfSignedCert}
                onChange={(e) => setFormData({ ...formData, selfSignedCert: e.target.value })}
                placeholder="Paste certificate here..."
              />
              <button type="button" className={styles.extractButton}>
                Extract
              </button>
            </div>
            <div className={styles.helpText}>
              If you are using a self-signed certificate, you are required to provide the public certificate here for the connection to work. You may copy or extract the .cr file.
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelButton}>
            Close
          </button>
          <button onClick={handleSave} className={styles.saveButton}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default WooCommerceConnectionModal;
