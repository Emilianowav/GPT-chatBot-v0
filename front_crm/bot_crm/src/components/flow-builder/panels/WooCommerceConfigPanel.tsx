import React, { useState } from 'react';
import styles from './WooCommerceConfigPanel.module.css';
import VariableSelector from '../common/VariableSelector';
import WooCommerceConnectionModal from '../modals/WooCommerceConnectionModal';
import type { WooCommerceConfig, WooCommerceConnection, WooCommerceModule, WOOCOMMERCE_MODULES } from '../../../types/woocommerce.types';

interface WooCommerceConfigPanelProps {
  config: WooCommerceConfig;
  onChange: (config: WooCommerceConfig) => void;
  nodes: any[];
  currentNodeId: string;
  empresaId?: string;
}

const WooCommerceConfigPanel: React.FC<WooCommerceConfigPanelProps> = ({
  config,
  onChange,
  nodes,
  currentNodeId,
  empresaId = 'Veo Veo' // Default para compatibilidad
}) => {
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  const handleConnectionSave = (connection: WooCommerceConnection, apiConfigId: string) => {
    onChange({
      ...config,
      connection,
      connectionId: connection.id,
      apiConfigId // Guardar el ID de la API en MongoDB
    });
  };

  const renderModuleConfig = () => {
    switch (config.module) {
      case 'get-product':
        return (
          <div className={styles.moduleConfig}>
            <div className={styles.formGroup}>
              <label>
                <span className={styles.indicator}>⊙</span> Product ID <span className={styles.required}>*</span>
              </label>
              <VariableSelector
                nodes={nodes}
                currentNodeId={currentNodeId}
                value={config.params?.productId || ''}
                onChange={(value) => onChange({
                  ...config,
                  params: { ...config.params, productId: value }
                })}
                placeholder="Enter product ID or select variable..."
              />
              <div className={styles.helpText}>
                Enter the ID of the product to retrieve.
              </div>
            </div>
          </div>
        );

      case 'search-product':
        return (
          <div className={styles.moduleConfig}>
            <div className={styles.formGroup}>
              <label>
                <span className={styles.indicator}>⊙</span> Search Term <span className={styles.required}>*</span>
              </label>
              <VariableSelector
                nodes={nodes}
                currentNodeId={currentNodeId}
                value={config.params?.search || ''}
                onChange={(value) => onChange({
                  ...config,
                  params: { ...config.params, search: value }
                })}
                placeholder="Enter search term or select variable..."
              />
              <div className={styles.helpText}>
                Search for products by title, description, or SKU.
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>
                <span className={styles.indicator}>⊙</span> Category
              </label>
              <VariableSelector
                nodes={nodes}
                currentNodeId={currentNodeId}
                value={config.params?.category || ''}
                onChange={(value) => onChange({
                  ...config,
                  params: { ...config.params, category: value }
                })}
                placeholder="Optional: Filter by category..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <span className={styles.indicator}>⊙</span> Limit
              </label>
              <input
                type="number"
                value={config.params?.limit || 10}
                onChange={(e) => onChange({
                  ...config,
                  params: { ...config.params, limit: parseInt(e.target.value) }
                })}
                min="1"
                max="100"
              />
              <div className={styles.helpText}>
                Maximum number of products to return (1-100).
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>
                <span className={styles.indicator}>⊙</span> Order By
              </label>
              <select
                value={config.params?.orderBy || 'relevance'}
                onChange={(e) => onChange({
                  ...config,
                  params: { ...config.params, orderBy: e.target.value }
                })}
              >
                <option value="relevance">Relevance</option>
                <option value="date">Date</option>
                <option value="title">Title</option>
                <option value="price">Price</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>
          </div>
        );

      case 'create-order':
        return (
          <div className={styles.moduleConfig}>
            <div className={styles.formGroup}>
              <label>
                <span className={styles.indicator}>⊙</span> Customer ID
              </label>
              <VariableSelector
                nodes={nodes}
                currentNodeId={currentNodeId}
                value={config.params?.customerId || ''}
                onChange={(value) => onChange({
                  ...config,
                  params: { ...config.params, customerId: value }
                })}
                placeholder="Select customer ID..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <span className={styles.indicator}>⊙</span> Product ID <span className={styles.required}>*</span>
              </label>
              <VariableSelector
                nodes={nodes}
                currentNodeId={currentNodeId}
                value={config.params?.productId || ''}
                onChange={(value) => onChange({
                  ...config,
                  params: { ...config.params, productId: value }
                })}
                placeholder="Select product ID..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <span className={styles.indicator}>⊙</span> Quantity <span className={styles.required}>*</span>
              </label>
              <VariableSelector
                nodes={nodes}
                currentNodeId={currentNodeId}
                value={config.params?.quantity || '1'}
                onChange={(value) => onChange({
                  ...config,
                  params: { ...config.params, quantity: value }
                })}
                placeholder="Enter quantity..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <span className={styles.indicator}>⊙</span> Customer Phone
              </label>
              <VariableSelector
                nodes={nodes}
                currentNodeId={currentNodeId}
                value={config.params?.customerPhone || ''}
                onChange={(value) => onChange({
                  ...config,
                  params: { ...config.params, customerPhone: value }
                })}
                placeholder="Select phone number..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <span className={styles.indicator}>⊙</span> Customer Name
              </label>
              <VariableSelector
                nodes={nodes}
                currentNodeId={currentNodeId}
                value={config.params?.customerName || ''}
                onChange={(value) => onChange({
                  ...config,
                  params: { ...config.params, customerName: value }
                })}
                placeholder="Select customer name..."
              />
            </div>
          </div>
        );

      default:
        return (
          <div className={styles.emptyState}>
            <p>Configuración para este módulo próximamente...</p>
          </div>
        );
    }
  };

  return (
    <div className={styles.wooConfigPanel}>
      {/* Connection Section */}
      <div className={styles.section}>
        <div className={styles.formGroup}>
          <label>
            <span className={styles.indicator}>⊙</span> Connection <span className={styles.required}>*</span>
          </label>
          
          {config.connection ? (
            <div className={styles.connectionSelected}>
              <div className={styles.connectionInfo}>
                <div className={styles.connectionName}>{config.connection.name}</div>
                <div className={styles.connectionUrl}>{config.connection.eshopUrl}</div>
              </div>
              <button
                onClick={() => setShowConnectionModal(true)}
                className={styles.editButton}
              >
                Edit
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConnectionModal(true)}
              className={styles.createConnectionButton}
            >
              🟣 Create a connection
            </button>
          )}

          <div className={styles.helpText}>
            For more information on how to create a connection to WooCommerce, see the <a href="https://www.make.com/en/help/app/woocommerce" target="_blank" rel="noopener noreferrer">online Help</a>.
          </div>
        </div>
      </div>

      {/* Module Configuration */}
      {config.connection && (
        <>
          <div className={styles.divider} />
          {renderModuleConfig()}
        </>
      )}

      {/* Connection Modal */}
      <WooCommerceConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        onSave={handleConnectionSave}
        existingConnection={config.connection}
        empresaId={empresaId}
      />
    </div>
  );
};

export default WooCommerceConfigPanel;
