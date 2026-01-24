import { memo, useState, useEffect } from 'react';
import { X, TestTube, Loader2, AlertCircle, MessageSquare, Clock, User, Phone } from 'lucide-react';
import styles from './WebhookConfigModal.module.css';

interface WebhookConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData: any;
  onSave: (config: any) => void;
  allNodes?: any[]; // Para leer configuración global del webhook watch-events
  initialConfig?: WebhookConfig;
  nodeId: string;
}

interface WebhookConfig {
  // Estructura que el backend espera
  module?: string; // 'watch-events' o 'send-message'
  phoneNumberId: string; // Requerido por backend
  verifyToken?: string; // Requerido por backend
  accessToken?: string; // Token de Meta
  // Campos adicionales
  webhookName: string;
  telefono: string;
  businessAccountId: string;
  appId: string;
  appSecret: string;
  capturePhoneNumber?: boolean;
  phoneNumberVariableName?: string;
  message?: string;
  destinationVariable?: string;
}

function WebhookConfigModal({ isOpen, onClose, nodeData, onSave, allNodes = [], initialConfig, nodeId }: WebhookConfigModalProps) {
  const [config, setConfig] = useState<WebhookConfig>({
    module: 'watch-events',
    webhookName: 'WhatsApp Business Webhook',
    telefono: '',
    phoneNumberId: '',
    verifyToken: '2001-ic', // Token por defecto
    accessToken: '',
    businessAccountId: '',
    appId: '',
    appSecret: '',
    capturePhoneNumber: true,
    phoneNumberVariableName: 'telefono_usuario',
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [view, setView] = useState<'loading' | 'config' | 'history'>('loading');
  const [recentMessages, setRecentMessages] = useState<any[]>([]);

  // Cargar configuración global de WhatsApp al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadGlobalWhatsAppConfig();
    }
  }, [isOpen, allNodes, initialConfig, nodeData]);

  const loadGlobalWhatsAppConfig = async () => {
    setLoading(true);
    setView('loading');
    
    console.log('🔍 [WebhookConfigModal] Modal abierto');
    console.log('📸 [WebhookConfigModal] initialConfig recibido:', initialConfig);
    
    // Buscar el nodo webhook watch-events para obtener la configuración global
    const watchEventsNode = allNodes.find(n => 
      (n.type === 'webhook' || n.type === 'whatsapp') && 
      (n.data?.config?.module === 'watch-events' || n.data?.config?.trigger === 'whatsapp_message')
    );
    
    console.log('🔍 [WebhookConfigModal] Nodo watch-events encontrado:', watchEventsNode);
    
    if (watchEventsNode?.data?.config) {
      const globalConfig = watchEventsNode.data.config;
      console.log('✅ [WebhookConfigModal] Configuración global encontrada:', globalConfig);
      
      // Si el nodo watch-events tiene configuración completa, usarla
      if (globalConfig.phoneNumberId && globalConfig.accessToken) {
        setIsConfigured(true);
        
        // Cargar configuración en el estado
        const loadedConfig = {
          module: globalConfig.module || 'watch-events',
          webhookName: globalConfig.webhookName || 'WhatsApp Business Webhook',
          telefono: globalConfig.telefono || '',
          phoneNumberId: globalConfig.phoneNumberId || '',
          verifyToken: globalConfig.verifyToken || '2001-ic',
          accessToken: globalConfig.accessToken || '',
          businessAccountId: globalConfig.businessAccountId || '',
          appId: globalConfig.appId || '',
          appSecret: globalConfig.appSecret || '',
          capturePhoneNumber: globalConfig.capturePhoneNumber ?? true,
          phoneNumberVariableName: globalConfig.phoneNumberVariableName || 'telefono_usuario',
        };
        
        console.log('📝 [WebhookConfigModal] Config cargado desde watch-events:', loadedConfig);
        setConfig(loadedConfig);
        
        // Si es el nodo watch-events, mostrar historial
        if (nodeData?.data?.config?.module === 'watch-events' || nodeData?.data?.config?.trigger === 'whatsapp_message') {
          await loadRecentMessages();
          setView('history');
        } else {
          // Para otros nodos de WhatsApp, mostrar config
          setView('config');
        }
      } else {
        console.log('⚠️ [WebhookConfigModal] Configuración incompleta, mostrar formulario');
        setIsConfigured(false);
        setView('config');
      }
    } else {
      console.log('⚠️ [WebhookConfigModal] No hay configuración global, mostrar formulario');
      setIsConfigured(false);
      setView('config');
    }
    
    setLoading(false);
    
    // Si hay initialConfig específico del nodo, sobrescribir
    if (initialConfig && Object.keys(initialConfig).length > 1) {
      console.log('✅ [WebhookConfigModal] Sobrescribiendo con initialConfig del nodo');
        const newConfig = {
          module: initialConfig.module || 'watch-events',
          webhookName: initialConfig.webhookName || 'WhatsApp Business Webhook',
          telefono: initialConfig.telefono || '',
          phoneNumberId: initialConfig.phoneNumberId || '',
          verifyToken: initialConfig.verifyToken || '2001-ic',
          accessToken: initialConfig.accessToken || '',
          businessAccountId: initialConfig.businessAccountId || '',
          appId: initialConfig.appId || '',
          appSecret: initialConfig.appSecret || '',
          capturePhoneNumber: initialConfig.capturePhoneNumber ?? true,
          phoneNumberVariableName: initialConfig.phoneNumberVariableName || 'telefono_usuario',
        };
      console.log('📝 [WebhookConfigModal] Config sobrescrito:', newConfig);
      setConfig(newConfig);
    }
  };

  const loadRecentMessages = async () => {
    try {
      // TODO: Implementar llamada al backend para obtener últimos mensajes
      // Por ahora, datos de ejemplo
      setRecentMessages([
        { id: 1, from: '+5493794946066', message: 'Hola', timestamp: new Date().toISOString() },
        { id: 2, from: '+5493794123456', message: 'Quiero comprar', timestamp: new Date().toISOString() },
      ]);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

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

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <div className={styles.icon}>
              <svg viewBox="0 0 24 24" fill="#25D366" width="28" height="28">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </div>
            <div>
              <h2 className={styles.title}>WhatsApp Webhook</h2>
              <p className={styles.subtitle}>
                {view === 'loading' && 'Verificando configuración...'}
                {view === 'config' && 'Configura el webhook para recibir mensajes'}
                {view === 'history' && 'Historial de mensajes recientes'}
              </p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {view === 'loading' && (
            <div className={styles.loadingView}>
              <Loader2 size={32} className={styles.spinner} />
              <p>Cargando configuración de WhatsApp...</p>
            </div>
          )}

          {view === 'config' && (
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

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      🔐 Verify Token
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      value={config.verifyToken || '2001-ic'}
                      onChange={(e) => setConfig({ ...config, verifyToken: e.target.value })}
                      placeholder="2001-ic"
                    />
                    <span className={styles.hint}>Token de verificación del webhook (usado por Meta para validar)</span>
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
          )}

          {view === 'history' && (
          <div className={styles.historyView}>
            {/* Stats */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <MessageSquare size={16} />
                <div>
                  <div className={styles.statValue}>{recentMessages.length}</div>
                  <div className={styles.statLabel}>Mensajes Recientes</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <Clock size={16} />
                <div>
                  <div className={styles.statValue}>
                    {recentMessages.length > 0 ? 'Activo' : 'Sin actividad'}
                  </div>
                  <div className={styles.statLabel}>Estado</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <User size={16} />
                <div>
                  <div className={styles.statValue}>
                    {new Set(recentMessages.map(m => m.from)).size}
                  </div>
                  <div className={styles.statLabel}>Contactos Únicos</div>
                </div>
              </div>
            </div>

            {/* Config Button */}
            <div className={styles.exportButtons}>
              <button 
                className={styles.btnConfig}
                onClick={() => setView('config')}
              >
                Ver Configuración
              </button>
            </div>

            {/* Messages List */}
            <div className={styles.messagesList}>
              <h3 className={styles.messagesTitle}>Últimos Mensajes</h3>
              {recentMessages.length === 0 ? (
                <div className={styles.emptyState}>
                  <MessageSquare size={48} className={styles.emptyIcon} />
                  <p>No hay mensajes recientes</p>
                  <span>Los mensajes aparecerán aquí cuando lleguen</span>
                </div>
              ) : (
                <div className={styles.messagesContainer}>
                  {recentMessages.map((msg) => (
                    <div key={msg.id} className={styles.messageCard}>
                      <div className={styles.messageHeader}>
                        <div className={styles.messageFrom}>
                          <Phone size={14} />
                          <span>{msg.from}</span>
                        </div>
                        <div className={styles.messageTime}>
                          {new Date(msg.timestamp).toLocaleString('es-AR')}
                        </div>
                      </div>
                      <div className={styles.messageContent}>
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        </div>

        {/* Footer */}
        {view === 'config' && (
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
        )}

        {view === 'history' && (
          <div className={styles.modalFooter}>
            <button className={styles.btnCancel} onClick={onClose}>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(WebhookConfigModal);
export type { WebhookConfig };
