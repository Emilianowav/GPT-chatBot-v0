import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './NodeConfigPanel.module.css';
import GPTConfigPanel from './GPTConfigPanel';

interface NodeConfigPanelProps {
  node: any;
  onClose: () => void;
  onSave: (nodeId: string, config: any) => void;
  globalVariables?: Record<string, any>;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, onClose, onSave, globalVariables = {} }) => {
  const [config, setConfig] = useState(node?.data?.config || {});
  const [label, setLabel] = useState(node?.data?.label || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setConfig(node?.data?.config || {});
    setLabel(node?.data?.label || '');
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    onSave(node.id, { ...config, label });
    onClose();
  };

  const renderGPTConfig = () => {
    const gptConfig = {
      tipo: config.tipo || 'conversacional',
      module: config.module || 'conversacional',
      modelo: config.modelo || 'gpt-4',
      temperatura: config.temperatura !== undefined ? config.temperatura : 0.7,
      maxTokens: config.maxTokens || 500,
      instrucciones: config.instrucciones || '',
      personalidad: config.personalidad || '',
      topicos: config.topicos || [],
      variablesRecopilar: config.variablesRecopilar || [],
      accionesCompletado: config.accionesCompletado || [],
      variablesEntrada: config.variablesEntrada || [],
      variablesSalida: config.variablesSalida || [],
      globalVariablesOutput: config.globalVariablesOutput || [],
      outputFormat: config.outputFormat || 'text',
      jsonSchema: config.jsonSchema,
      systemPrompt: config.systemPrompt,
      configuracionExtraccion: config.configuracionExtraccion || undefined
    };

    return (
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <GPTConfigPanel 
          config={gptConfig}
          onChange={(newConfig) => setConfig(newConfig)}
          globalVariables={globalVariables}
        />
      </div>
    );
  };

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
        setTestResult({ success: true, message: '✅ Webhook funcionando correctamente' });
      } else {
        setTestResult({ success: false, message: `❌ Error: ${data.error || 'No se pudo conectar'}` });
      }
    } catch (error: any) {
      setTestResult({ success: false, message: `❌ Error: ${error.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  const renderWhatsAppConfig = () => {
    if (config.module === 'watch-events') {
      return (
        <>
          <div className={styles.section}>
            <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>WhatsApp Watch Events</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
              Escucha mensajes entrantes de WhatsApp
            </p>
            
            <div className={styles.formGroup}>
              <label style={{ fontSize: '12px' }}>📱 Teléfono de WhatsApp</label>
              <input 
                type="text"
                value={config.telefono || ''}
                onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                placeholder="+5493794044057"
                style={{ fontSize: '13px', padding: '8px' }}
              />
              <small style={{ fontSize: '11px' }}>Número de WhatsApp Business</small>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  const event = new CustomEvent('openWebhookConfig', { 
                    detail: { nodeId: node.id, config } 
                  });
                  window.dispatchEvent(event);
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                ⚙️ Configuración
              </button>
              
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={!config.phoneNumberId || !config.accessToken || isTesting}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: isTesting ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: (!config.phoneNumberId || !config.accessToken || isTesting) ? 'not-allowed' : 'pointer',
                  opacity: (!config.phoneNumberId || !config.accessToken || isTesting) ? 0.6 : 1,
                }}
              >
                {isTesting ? '⏳ Probando...' : '🧪 Probar'}
              </button>
            </div>

            {testResult && (
              <div style={{
                marginTop: '10px',
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '500',
                background: testResult.success ? '#d1fae5' : '#fee2e2',
                color: testResult.success ? '#065f46' : '#991b1b',
                border: `1px solid ${testResult.success ? '#6ee7b7' : '#fca5a5'}`,
              }}>
                {testResult.message}
              </div>
            )}
          </div>
        </>
      );
    }

    return (
      <>
        <div className={styles.formGroup}>
          <label>Phone Number ID</label>
          <input 
            type="text"
            value={config.phoneNumberId || ''}
            onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
            placeholder="906667632531979"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Destinatario (To)</label>
          <input 
            type="text"
            value={config.to || ''}
            onChange={(e) => setConfig({ ...config, to: e.target.value })}
            placeholder="{{1.from}}"
          />
          <small>Usar variables como {`{{1.from}}`} para responder al remitente</small>
        </div>

        <div className={styles.formGroup}>
          <label>Mensaje</label>
          <textarea 
            rows={6}
            value={config.message || ''}
            onChange={(e) => setConfig({ ...config, message: e.target.value })}
            placeholder="Mensaje a enviar. Usa variables como {{gpt-conversacional.respuesta_gpt}}"
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
          />
          <small>Puedes usar variables de nodos anteriores: {`{{nodeId.variable}}`}</small>
        </div>

        {config.tipo === 'recopilar' && (
          <>
            <div className={styles.formGroup}>
              <label>Nombre de Variable</label>
              <input 
                type="text"
                value={config.nombreVariable || ''}
                onChange={(e) => setConfig({ ...config, nombreVariable: e.target.value })}
                placeholder="nombre_variable"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Tipo de Validación</label>
              <select 
                value={config.validacion?.tipo || 'texto'}
                onChange={(e) => setConfig({ 
                  ...config, 
                  validacion: { ...config.validacion, tipo: e.target.value }
                })}
              >
                <option value="texto">Texto</option>
                <option value="numero">Número</option>
                <option value="opcion">Opción</option>
              </select>
            </div>
          </>
        )}
      </>
    );
  };

  const renderWebhookConfig = () => {
    return (
      <>
        <div className={styles.formGroup}>
          <label>Tipo</label>
          <select 
            value={config.tipo || 'listener'}
            onChange={(e) => setConfig({ ...config, tipo: e.target.value })}
          >
            <option value="listener">Listener (Escuchar)</option>
            <option value="trigger">Trigger (Disparar)</option>
          </select>
        </div>

        {config.tipo === 'trigger' && (
          <>
            <div className={styles.formGroup}>
              <label>Endpoint</label>
              <input 
                type="text"
                value={config.endpoint || ''}
                onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                placeholder="https://api.ejemplo.com/webhook"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Método</label>
              <select 
                value={config.metodo || 'POST'}
                onChange={(e) => setConfig({ ...config, metodo: e.target.value })}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </>
        )}
      </>
    );
  };

  const renderRouterConfig = () => {
    return (
      <>
        <div className={styles.formGroup}>
          <label>Número de Rutas</label>
          <input 
            type="number"
            min="2"
            max="10"
            value={config.numRoutes || 2}
            onChange={(e) => setConfig({ ...config, numRoutes: parseInt(e.target.value) })}
          />
          <small>Define cuántas rutas saldrán de este router</small>
        </div>

        <div className={styles.formGroup}>
          <label>Modo de Evaluación</label>
          <select 
            value={config.evaluationMode || 'sequential'}
            onChange={(e) => setConfig({ ...config, evaluationMode: e.target.value })}
          >
            <option value="sequential">Secuencial (primera que cumpla)</option>
            <option value="all">Todas las rutas</option>
          </select>
        </div>
      </>
    );
  };

  const renderMercadoPagoConfig = () => {
    return (
      <>
        <div className={styles.formGroup}>
          <label>Acción</label>
          <select 
            value={config.action || 'create-preference'}
            onChange={(e) => setConfig({ ...config, action: e.target.value })}
          >
            <option value="create-preference">Crear Preferencia de Pago</option>
            <option value="check-payment">Verificar Pago</option>
          </select>
        </div>

        {config.action === 'create-preference' && (
          <>
            <div className={styles.formGroup}>
              <label>Título</label>
              <input 
                type="text"
                value={config.title || ''}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                placeholder="Producto o Servicio"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Monto</label>
              <input 
                type="number"
                value={config.amount || ''}
                onChange={(e) => setConfig({ ...config, amount: parseFloat(e.target.value) })}
                placeholder="100.00"
              />
            </div>
          </>
        )}
      </>
    );
  };

  const renderWooCommerceConfig = () => {
    return (
      <>
        <div className={styles.formGroup}>
          <label>Acción</label>
          <select 
            value={config.action || 'get-products'}
            onChange={(e) => setConfig({ ...config, action: e.target.value })}
          >
            <option value="get-products">Obtener Productos</option>
            <option value="create-order">Crear Orden</option>
            <option value="get-order">Obtener Orden</option>
          </select>
        </div>

        {config.action === 'create-order' && (
          <>
            <div className={styles.formGroup}>
              <label>Email del Cliente</label>
              <input 
                type="email"
                value={config.customerEmail || ''}
                onChange={(e) => setConfig({ ...config, customerEmail: e.target.value })}
                placeholder="cliente@ejemplo.com"
              />
            </div>
          </>
        )}
      </>
    );
  };

  const renderConfigContent = () => {
    const nodeType = node.type;

    switch (nodeType) {
      case 'gpt':
        return renderGPTConfig();
      case 'whatsapp':
        return renderWhatsAppConfig();
      case 'webhook':
        return renderWebhookConfig();
      case 'router':
        return renderRouterConfig();
      case 'mercadopago':
        return renderMercadoPagoConfig();
      case 'woocommerce':
        return renderWooCommerceConfig();
      default:
        return (
          <div className={styles.formGroup}>
            <label>Configuración no disponible</label>
            <p>Este tipo de nodo aún no tiene configuración específica.</p>
          </div>
        );
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Configurar Nodo</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.formGroup}>
            <label>Nombre del Nodo</label>
            <input 
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Nombre descriptivo"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Tipo de Nodo</label>
            <input 
              type="text"
              value={node.type}
              disabled
              style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
            />
          </div>

          {renderConfigContent()}
        </div>

        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.btnSave} onClick={handleSave}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeConfigPanel;
