import { useState, useEffect, memo } from 'react';
import styles from './MercadoPagoConfigModal.module.css';

const MP_API_URL = process.env.NEXT_PUBLIC_MP_API_URL || 'http://localhost:3001';

interface MercadoPagoConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData: any;
  onSave: (config: any) => void;
}

interface PaymentLink {
  _id: string;
  slug: string;
  title: string;
  description: string;
  unitPrice: number;
  priceType: string;
  active: boolean;
  totalUses: number;
  paymentUrl: string;
}

function MercadoPagoConfigModal({ isOpen, onClose, nodeData, onSave }: MercadoPagoConfigModalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState<string>('');
  const [linkType, setLinkType] = useState<'fixed' | 'dynamic'>('fixed');

  useEffect(() => {
    if (isOpen) {
      checkConnection();
      if (nodeData?.config) {
        setSelectedLinkId(nodeData.config.linkId || '');
        setLinkType(nodeData.config.linkType || 'fixed');
      }
    }
  }, [isOpen, nodeData]);

  const checkConnection = async () => {
    const empresaId = localStorage.getItem('empresa_id') || 'default';
    
    try {
      // Verificar si la empresa tiene MP conectado
      const response = await fetch(`${MP_API_URL}/sellers/by-internal/${empresaId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.connected && data.seller && data.seller.active) {
          // MP está conectado, obtener payment links
          const mpUserId = data.seller.userId;
          localStorage.setItem('mp_user_id', mpUserId);
          
          try {
            const linksResponse = await fetch(`${MP_API_URL}/payment-links?sellerId=${mpUserId}`);
            if (linksResponse.ok) {
              const linksData = await linksResponse.json();
              setPaymentLinks(linksData.links || []);
            }
          } catch (err) {
            console.log('No se pudieron cargar payment links');
          }
          
          setIsConnected(true);
          return;
        }
      }
      
      // No está conectado
      setIsConnected(false);
      localStorage.removeItem('mp_user_id');
    } catch (err) {
      console.error('Error verificando conexión:', err);
      setIsConnected(false);
      localStorage.removeItem('mp_user_id');
    }
  };

  const handleConnect = () => {
    setLoading(true);
    
    const empresaId = localStorage.getItem('empresa_id') || 'default';
    const redirectUrl = `${window.location.origin}/dashboard/flow-builder`;
    
    const authUrl = `${MP_API_URL}/oauth/authorize?internalId=${encodeURIComponent(empresaId)}&redirectUrl=${encodeURIComponent(redirectUrl)}`;
    window.location.href = authUrl;
  };

  const handleSave = () => {
    const config = {
      linkId: selectedLinkId,
      linkType,
      action: 'create_payment_link',
      // Indicar que MP está conectado (el backend obtendrá el token desde la BD)
      mercadoPagoConnected: true,
      empresaId: localStorage.getItem('empresa_id') || 'default',
    };
    
    onSave(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.icon}>
              <img src="/logos tecnologias/mercado-pago.svg" alt="MercadoPago" width="32" height="32" />
            </div>
            <div>
              <h2 className={styles.title}>Configurar MercadoPago</h2>
              <p className={styles.subtitle}>
                {isConnected ? 'Selecciona cómo generar el link de pago' : 'Conecta tu cuenta para comenzar'}
              </p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {!isConnected ? (
            // Vista: No conectado
            <div className={styles.connectView}>
              <div className={styles.connectIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#009ee3" strokeWidth="1.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </div>
              <h3 className={styles.connectTitle}>Conecta tu cuenta de MercadoPago</h3>
              <p className={styles.connectDescription}>
                Para generar links de pago dinámicos, primero debes conectar tu cuenta de MercadoPago.
                Esto te permitirá crear links personalizados para cada cliente.
              </p>
              <div className={styles.features}>
                <div className={styles.feature}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Links de pago personalizados</span>
                </div>
                <div className={styles.feature}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Generación automática desde el chatbot</span>
                </div>
                <div className={styles.feature}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Seguimiento de pagos en tiempo real</span>
                </div>
              </div>
              <button 
                className={styles.connectButton}
                onClick={handleConnect}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className={styles.spinner}></div>
                    Conectando...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Conectar con MercadoPago
                  </>
                )}
              </button>
            </div>
          ) : (
            // Vista: Conectado - Generadores de link
            <div className={styles.configView}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Tipo de Link de Pago</h3>
                <p className={styles.sectionDescription}>
                  Selecciona cómo se generará el link de pago para el cliente
                </p>
                
                <div className={styles.radioGroup}>
                  <label className={`${styles.radioOption} ${linkType === 'fixed' ? styles.radioOptionActive : ''}`}>
                    <input
                      type="radio"
                      name="linkType"
                      value="fixed"
                      checked={linkType === 'fixed'}
                      onChange={(e) => setLinkType(e.target.value as 'fixed' | 'dynamic')}
                    />
                    <div className={styles.radioContent}>
                      <div className={styles.radioHeader}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                        </svg>
                        <h4>Link Fijo</h4>
                      </div>
                      <p>Usa un link de pago existente. Ideal para productos con precio fijo.</p>
                    </div>
                  </label>

                  <label className={`${styles.radioOption} ${linkType === 'dynamic' ? styles.radioOptionActive : ''}`}>
                    <input
                      type="radio"
                      name="linkType"
                      value="dynamic"
                      checked={linkType === 'dynamic'}
                      onChange={(e) => setLinkType(e.target.value as 'fixed' | 'dynamic')}
                    />
                    <div className={styles.radioContent}>
                      <div className={styles.radioHeader}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                        </svg>
                        <h4>Link Dinámico</h4>
                        <span className={styles.badge}>Recomendado</span>
                      </div>
                      <p>Genera un link único con datos del carrito. Ideal para ventas personalizadas.</p>
                    </div>
                  </label>
                </div>
              </div>

              {linkType === 'fixed' && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Seleccionar Link de Pago</h3>
                  <p className={styles.sectionDescription}>
                    Elige el link de pago que se enviará al cliente
                  </p>
                  
                  {paymentLinks.length === 0 ? (
                    <div className={styles.emptyState}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="3" y1="9" x2="21" y2="9"/>
                      </svg>
                      <p>No tienes links de pago creados</p>
                      <span>Ve a Integraciones → MercadoPago para crear uno</span>
                    </div>
                  ) : (
                    <select
                      className={styles.select}
                      value={selectedLinkId}
                      onChange={(e) => setSelectedLinkId(e.target.value)}
                    >
                      <option key="empty" value="">Selecciona un link...</option>
                      {paymentLinks.filter(l => l.active).map((link) => (
                        <option key={link._id} value={link._id}>
                          {link.title} - ${link.unitPrice.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {linkType === 'dynamic' && (
                <div className={styles.section}>
                  <div className={styles.infoBox}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <div>
                      <h4>Generación Dinámica</h4>
                      <p>
                        El link se generará automáticamente usando los datos del carrito del contexto global.
                        Asegúrate de que el nodo GPT-Carrito haya creado la variable <code>carrito</code> antes.
                      </p>
                    </div>
                  </div>

                  <div className={styles.variableInfo}>
                    <h4>Variables requeridas del contexto:</h4>
                    <ul>
                      <li><code>carrito.productos</code> - Array de productos con id, nombre, precio, cantidad</li>
                      <li><code>carrito.total</code> - Total a cobrar</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {isConnected && (
          <div className={styles.footer}>
            <button className={styles.cancelButton} onClick={onClose}>
              Cancelar
            </button>
            <button 
              className={styles.saveButton} 
              onClick={handleSave}
              disabled={linkType === 'fixed' && !selectedLinkId}
            >
              Guardar Configuración
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(MercadoPagoConfigModal);
