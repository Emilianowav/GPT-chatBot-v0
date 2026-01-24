import { memo, useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, FileSpreadsheet, FileText, Calendar, DollarSign, Clock, ChevronRight, Hash, Mail, CreditCard, XCircle } from 'lucide-react';
import styles from './MercadoPagoWebhookConfigModal.module.css';

interface MercadoPagoWebhookConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData: any;
  onSave: (config: any) => void;
}

interface Payment {
  _id: string;
  mpPaymentId: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethodId?: string;
  paymentTypeId?: string;
  payerEmail?: string;
  payerName?: string;
  payerPhone?: string;
  externalReference?: string;
  dateCreated?: string;
  dateApproved?: string;
  createdAt: string;
  items?: Array<{
    nombre: string;
    precio: number;
    cantidad: number;
  }>;
}

interface PaymentStats {
  pagosAprobados: number;
  ingresosTotales: number;
  pagosDelMes: number;
  ingresosDelMes: number;
  pagosPendientes: number;
}

function MercadoPagoWebhookConfigModal({
  isOpen,
  onClose,
  nodeData,
  onSave
}: MercadoPagoWebhookConfigModalProps) {
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [view, setView] = useState<'loading' | 'connect' | 'config' | 'history'>('loading');
  
  // Config state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [enabled, setEnabled] = useState(true);
  
  // History state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkConnectionAndConfig();
    }
  }, [isOpen]);

  const checkConnectionAndConfig = async () => {
    setLoading(true);
    setView('loading');
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const mpApiUrl = process.env.NEXT_PUBLIC_MP_API_URL || 'http://localhost:3001';
      
      // Usar el empresaId de Veo Veo directamente
      const empresaId = '6940a9a181b92bfce970fdb5'; // Veo Veo
      console.log('🏢 Usando empresaId:', empresaId);
      
      // 1. Verificar si tiene MP conectado (buscar por internalId "default")
      console.log('🔍 Verificando conexión MP...');
      const mpResponse = await fetch(`${mpApiUrl}/sellers/by-internal/default`);
      
      if (!mpResponse.ok) {
        console.log('❌ No hay respuesta de MP API');
        setIsConnected(false);
        setView('connect');
        setLoading(false);
        return;
      }
      
      const mpData = await mpResponse.json();
      console.log('📊 Datos de MP:', mpData);
      
      if (!mpData.connected || !mpData.seller || !mpData.seller.active) {
        console.log('❌ MP no conectado o seller inactivo');
        setIsConnected(false);
        setView('connect');
        setLoading(false);
        return;
      }
      
      // MP está conectado
      setIsConnected(true);
      console.log('✅ MP conectado, seller:', mpData.seller._id);
      
      // 2. Para nodos de verificar_pago, intentar cargar historial directamente
      const isVerificarPago = nodeData?.data?.config?.action === 'verificar_pago' || 
                               nodeData?.id === 'mercadopago-verificar-pago';
      
      if (isVerificarPago) {
        console.log('📋 Nodo de verificar_pago, cargando historial...');
        
        // Intentar cargar historial
        try {
          const paymentsResponse = await fetch(`${apiUrl}/api/modules/mercadopago/payments/history/${empresaId}`);
          
          if (paymentsResponse.ok) {
            const paymentsData = await paymentsResponse.json();
            console.log('💰 Historial de pagos:', paymentsData);
            
            if (paymentsData.success && paymentsData.payments) {
              setPayments(paymentsData.payments);
              
              // Cargar estadísticas
              const statsResponse = await fetch(`${apiUrl}/api/modules/mercadopago/payments/stats/${empresaId}`);
              if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                if (statsData.success) {
                  setStats(statsData.stats);
                }
              }
              
              // Configurar webhook URL
              setIsConfigured(true);
              const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://gpt-chatbot-v0.onrender.com';
              setWebhookUrl(nodeData?.data?.config?.webhookUrl || `${backendUrl}/api/modules/mercadopago/webhooks`);
              setWebhookSecret(nodeData?.data?.config?.webhookSecret || '');
              setEnabled(nodeData?.data?.config?.enabled !== false);
              
              setView('history');
              console.log('✅ Vista de historial cargada');
            } else {
              console.log('⚠️ No hay pagos en el historial');
              // Si no hay pagos, mostrar config para que configure el webhook
              setIsConfigured(false);
              const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://gpt-chatbot-v0.onrender.com';
              setWebhookUrl(`${backendUrl}/api/modules/mercadopago/webhooks`);
              setView('config');
            }
          } else {
            console.log('❌ Error al cargar historial');
            // Si falla cargar historial, mostrar config
            setIsConfigured(false);
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://gpt-chatbot-v0.onrender.com';
            setWebhookUrl(`${backendUrl}/api/modules/mercadopago/webhooks`);
            setView('config');
          }
        } catch (historyError) {
          console.error('❌ Error cargando historial:', historyError);
          // Si hay error, mostrar config
          setIsConfigured(false);
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://gpt-chatbot-v0.onrender.com';
          setWebhookUrl(`${backendUrl}/api/modules/mercadopago/webhooks`);
          setView('config');
        }
      } else {
        // Para otros tipos de nodos, verificar configuración
        const hasConfig = nodeData?.data?.config?.webhookUrl || 
                         nodeData?.data?.config?.enabled ||
                         nodeData?.data?.config?.tipo === 'mercadopago_webhook';
        
        if (hasConfig) {
          setIsConfigured(true);
          setWebhookUrl(nodeData.data.config.webhookUrl || '');
          setWebhookSecret(nodeData.data.config.webhookSecret || '');
          setEnabled(nodeData.data.config.enabled !== false);
          await loadPaymentHistory(empresaId, apiUrl);
          setView('history');
        } else {
          setIsConfigured(false);
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://gpt-chatbot-v0.onrender.com';
          setWebhookUrl(`${backendUrl}/api/modules/mercadopago/webhooks`);
          setView('config');
        }
      }
      
    } catch (err) {
      console.error('❌ Error verificando conexión:', err);
      setIsConnected(false);
      setView('connect');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentHistory = async (empresaId: string, apiUrl: string) => {
    try {
      // Cargar historial de pagos
      const paymentsResponse = await fetch(`${apiUrl}/api/modules/mercadopago/payments/history/${empresaId}`);
      const paymentsData = await paymentsResponse.json();
      
      if (paymentsData.success) {
        setPayments(paymentsData.payments || []);
      }
      
      // Cargar estadísticas
      const statsResponse = await fetch(`${apiUrl}/api/modules/mercadopago/payments/stats/${empresaId}`);
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error('Error cargando historial:', err);
    }
  };

  const handleConnect = () => {
    const empresaId = localStorage.getItem('empresa_id') || 'default';
    const redirectUrl = `${window.location.origin}/dashboard/flow-builder`;
    const mpApiUrl = process.env.NEXT_PUBLIC_MP_API_URL || 'http://localhost:3001';
    
    const authUrl = `${mpApiUrl}/oauth/authorize?internalId=${encodeURIComponent(empresaId)}&redirectUrl=${encodeURIComponent(redirectUrl)}`;
    window.location.href = authUrl;
  };

  const handleSaveConfig = () => {
    const config = {
      tipo: 'mercadopago_webhook',
      webhookUrl,
      webhookSecret,
      enabled,
      // Indicar que MP está conectado (el backend obtendrá el token desde la BD)
      mercadoPagoConnected: true,
      empresaId: localStorage.getItem('empresa_id') || 'default',
      configuredAt: new Date().toISOString()
    };
    
    onSave(config);
    onClose();
  };

  const exportToCSV = () => {
    if (payments.length === 0) return;
    
    const headers = ['ID Pago', 'Estado', 'Monto', 'Moneda', 'Método', 'Email', 'Teléfono', 'Referencia', 'Fecha Creación', 'Fecha Aprobación'];
    const rows = payments.map(p => [
      p.mpPaymentId,
      p.status,
      p.amount,
      p.currency,
      p.paymentMethodId || '',
      p.payerEmail || '',
      p.payerPhone || '',
      p.externalReference || '',
      p.dateCreated || p.createdAt,
      p.dateApproved || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pagos_mercadopago_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    if (payments.length === 0) return;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Historial de Pagos - MercadoPago</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #009ee3; font-size: 20px; margin-bottom: 10px; }
          .stats { display: flex; gap: 15px; margin: 15px 0; }
          .stat-card { background: #f5f5f5; padding: 12px; border-radius: 6px; flex: 1; }
          .stat-value { font-size: 18px; font-weight: bold; color: #009ee3; }
          .stat-label { font-size: 11px; color: #666; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
          th { background: #009ee3; color: white; padding: 6px; text-align: left; }
          td { padding: 6px; border-bottom: 1px solid #ddd; }
          .status-approved { color: #10b981; font-weight: bold; }
          .status-pending { color: #f59e0b; font-weight: bold; }
          .status-rejected { color: #ef4444; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>📊 Historial de Pagos - MercadoPago Webhook</h1>
        <p>Generado el: ${new Date().toLocaleString('es-AR')}</p>
        
        ${stats ? `
        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${stats.pagosAprobados}</div>
            <div class="stat-label">Pagos Aprobados</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">$${stats.ingresosTotales.toLocaleString('es-AR')}</div>
            <div class="stat-label">Ingresos Totales</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.pagosDelMes}</div>
            <div class="stat-label">Pagos del Mes</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">$${stats.ingresosDelMes.toLocaleString('es-AR')}</div>
            <div class="stat-label">Ingresos del Mes</div>
          </div>
        </div>
        ` : ''}
        
        <table>
          <thead>
            <tr>
              <th>ID Pago</th>
              <th>Estado</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Email</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            ${payments.map(p => `
              <tr>
                <td>${p.mpPaymentId}</td>
                <td class="status-${p.status}">${getStatusLabel(p.status)}</td>
                <td>$${p.amount.toLocaleString('es-AR')} ${p.currency}</td>
                <td>${p.paymentMethodId || '-'}</td>
                <td>${p.payerEmail || '-'}</td>
                <td>${new Date(p.dateCreated || p.createdAt).toLocaleDateString('es-AR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={14} className={styles.statusIconApproved} />;
      case 'pending':
      case 'in_process':
        return <Clock size={14} className={styles.statusIconPending} />;
      case 'rejected':
      case 'cancelled':
        return <XCircle size={14} className={styles.statusIconRejected} />;
      default:
        return <AlertCircle size={14} className={styles.statusIconDefault} />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      approved: 'Aprobado',
      pending: 'Pendiente',
      in_process: 'En Proceso',
      rejected: 'Rechazado',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado',
      charged_back: 'Contracargo'
    };
    return labels[status] || status;
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.icon}>
              <img src="/logos tecnologias/mp-logo.png" alt="MercadoPago" width="28" height="28" />
            </div>
            <div>
              <h2 className={styles.title}>Webhook MercadoPago</h2>
              <p className={styles.subtitle}>
                {view === 'loading' && 'Verificando conexión...'}
                {view === 'connect' && 'Conecta tu cuenta para comenzar'}
                {view === 'config' && 'Configura el webhook para recibir notificaciones'}
                {view === 'history' && 'Historial de pagos recibidos'}
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
              <p>Verificando conexión a MercadoPago...</p>
            </div>
          )}

          {view === 'connect' && (
            <div className={styles.connectView}>
              <AlertCircle size={48} className={styles.connectIcon} />
              <h3 className={styles.connectTitle}>Conecta tu cuenta de MercadoPago</h3>
              <p className={styles.connectDescription}>
                Para recibir notificaciones de pagos, primero debes conectar tu cuenta de MercadoPago.
              </p>
              <button className={styles.connectButton} onClick={handleConnect}>
                Conectar con MercadoPago
              </button>
            </div>
          )}

          {view === 'config' && (
            <div className={styles.configView}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>URL del Webhook</h3>
                <p className={styles.sectionDescription}>
                  Esta URL debe configurarse en tu panel de MercadoPago
                </p>
                <input
                  type="text"
                  className={styles.input}
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  readOnly
                />
                <button 
                  className={styles.copyButton}
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    alert('URL copiada al portapapeles');
                  }}
                >
                  Copiar URL
                </button>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Secret Key (Opcional)</h3>
                <p className={styles.sectionDescription}>
                  Clave secreta para validar las notificaciones (configurada en variables de entorno)
                </p>
                <input
                  type="password"
                  className={styles.input}
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="MP_WEBHOOK_SECRET"
                />
              </div>

              <div className={styles.section}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                  />
                  <span>Webhook habilitado</span>
                </label>
              </div>

              <div className={styles.infoBox}>
                <AlertCircle size={16} />
                <div>
                  <h4>Configuración en MercadoPago</h4>
                  <p>
                    1. Ve a tu panel de MercadoPago → Integraciones → Webhooks<br/>
                    2. Agrega la URL del webhook<br/>
                    3. Selecciona eventos: <strong>payment</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {view === 'history' && (
            <div className={styles.historyView}>
              {/* Stats */}
              {stats && (
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <CheckCircle size={16} />
                    <div>
                      <div className={styles.statValue}>{stats.pagosAprobados}</div>
                      <div className={styles.statLabel}>Aprobados</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <DollarSign size={16} />
                    <div>
                      <div className={styles.statValue}>
                        ${stats.ingresosTotales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className={styles.statLabel}>Ingresos</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <Calendar size={16} />
                    <div>
                      <div className={styles.statValue}>{stats.pagosDelMes}</div>
                      <div className={styles.statLabel}>Este Mes</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <Clock size={16} />
                    <div>
                      <div className={styles.statValue}>{stats.pagosPendientes}</div>
                      <div className={styles.statLabel}>Pendientes</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Export Buttons */}
              <div className={styles.exportButtons}>
                <button className={styles.btnExport} onClick={exportToCSV} disabled={payments.length === 0}>
                  <FileSpreadsheet size={14} />
                  Exportar CSV
                </button>
                <button className={styles.btnExport} onClick={exportToPDF} disabled={payments.length === 0}>
                  <FileText size={14} />
                  Exportar PDF
                </button>
                <button 
                  className={styles.btnConfig}
                  onClick={() => setView('config')}
                >
                  Configuración
                </button>
              </div>

              {/* Payments List */}
              {payments.length === 0 ? (
                <div className={styles.emptyState}>
                  <CreditCard size={40} />
                  <p>No hay pagos registrados</p>
                </div>
              ) : (
                <div className={styles.paymentsContainer}>
                  <div className={styles.paymentsList}>
                    {payments.map((payment) => (
                      <div
                        key={payment._id}
                        className={`${styles.paymentItem} ${selectedPayment?._id === payment._id ? styles.active : ''}`}
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <div className={styles.paymentHeader}>
                          <div className={styles.paymentStatus}>
                            {getStatusIcon(payment.status)}
                            <span>{getStatusLabel(payment.status)}</span>
                          </div>
                          <div className={styles.paymentAmount}>
                            ${payment.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className={styles.paymentBody}>
                          <div className={styles.paymentInfo}>
                            <Hash size={10} />
                            <span>{payment.mpPaymentId}</span>
                          </div>
                          {payment.payerEmail && (
                            <div className={styles.paymentInfo}>
                              <Mail size={10} />
                              <span>{payment.payerEmail}</span>
                            </div>
                          )}
                          <div className={styles.paymentInfo}>
                            <Calendar size={10} />
                            <span>{new Date(payment.dateCreated || payment.createdAt).toLocaleDateString('es-AR')}</span>
                          </div>
                        </div>
                        <ChevronRight size={14} className={styles.arrow} />
                      </div>
                    ))}
                  </div>

                  {selectedPayment && (
                    <div className={styles.paymentDetail}>
                      <h4>Detalle del Pago</h4>
                      
                      <div className={styles.detailSection}>
                        <div className={styles.detailRow}>
                          <span>Estado:</span>
                          <div className={styles.detailValue}>
                            {getStatusIcon(selectedPayment.status)}
                            <span>{getStatusLabel(selectedPayment.status)}</span>
                          </div>
                        </div>
                        <div className={styles.detailRow}>
                          <span>Monto:</span>
                          <span>${selectedPayment.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })} {selectedPayment.currency}</span>
                        </div>
                        <div className={styles.detailRow}>
                          <span>ID:</span>
                          <span>{selectedPayment.mpPaymentId}</span>
                        </div>
                        {selectedPayment.externalReference && (
                          <div className={styles.detailRow}>
                            <span>Referencia:</span>
                            <span>{selectedPayment.externalReference}</span>
                          </div>
                        )}
                      </div>

                      {(selectedPayment.paymentMethodId || selectedPayment.paymentTypeId) && (
                        <div className={styles.detailSection}>
                          <h5>Método de Pago</h5>
                          {selectedPayment.paymentMethodId && (
                            <div className={styles.detailRow}>
                              <span>Método:</span>
                              <span>{selectedPayment.paymentMethodId}</span>
                            </div>
                          )}
                          {selectedPayment.paymentTypeId && (
                            <div className={styles.detailRow}>
                              <span>Tipo:</span>
                              <span>{selectedPayment.paymentTypeId}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedPayment.items && selectedPayment.items.length > 0 && (
                        <div className={styles.detailSection}>
                          <h5>📦 Productos</h5>
                          {selectedPayment.items.map((item, index) => (
                            <div key={index} className={styles.detailRow} style={{ 
                              padding: '12px',
                              background: '#f9fafb',
                              borderRadius: '6px',
                              marginBottom: '8px'
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                  {item.nombre}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                  Cantidad: {item.cantidad} × ${item.precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                              <div style={{ fontWeight: 600, color: '#059669' }}>
                                ${(item.cantidad * item.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {(selectedPayment.payerEmail || selectedPayment.payerName || selectedPayment.payerPhone) && (
                        <div className={styles.detailSection}>
                          <h5>Pagador</h5>
                          {selectedPayment.payerName && (
                            <div className={styles.detailRow}>
                              <span>Nombre:</span>
                              <span>{selectedPayment.payerName}</span>
                            </div>
                          )}
                          {selectedPayment.payerEmail && (
                            <div className={styles.detailRow}>
                              <span>Email:</span>
                              <span>{selectedPayment.payerEmail}</span>
                            </div>
                          )}
                          {selectedPayment.payerPhone && (
                            <div className={styles.detailRow}>
                              <span>Teléfono:</span>
                              <span>{selectedPayment.payerPhone}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className={styles.detailSection}>
                        <h5>Fechas</h5>
                        <div className={styles.detailRow}>
                          <span>Creación:</span>
                          <span>{new Date(selectedPayment.dateCreated || selectedPayment.createdAt).toLocaleString('es-AR')}</span>
                        </div>
                        {selectedPayment.dateApproved && (
                          <div className={styles.detailRow}>
                            <span>Aprobación:</span>
                            <span>{new Date(selectedPayment.dateApproved).toLocaleString('es-AR')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(view === 'config' || view === 'history') && (
          <div className={styles.footer}>
            <button className={styles.btnCancel} onClick={onClose}>
              {view === 'history' ? 'Cerrar' : 'Cancelar'}
            </button>
            {view === 'config' && (
              <button className={styles.btnSave} onClick={handleSaveConfig}>
                Guardar Configuración
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(MercadoPagoWebhookConfigModal);
