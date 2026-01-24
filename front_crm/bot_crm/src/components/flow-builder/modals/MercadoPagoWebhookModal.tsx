import { memo, useState, useEffect } from 'react';
import { X, Download, FileText, FileSpreadsheet, Loader2, ChevronRight, Calendar, DollarSign, CreditCard, User, Mail, Phone, Hash, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import styles from './MercadoPagoWebhookModal.module.css';

interface MercadoPagoWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresaId: string;
  empresaNombre?: string;
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

function MercadoPagoWebhookModal({
  isOpen,
  onClose,
  empresaId,
  empresaNombre
}: MercadoPagoWebhookModalProps) {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, empresaId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      // Cargar historial de pagos
      const paymentsResponse = await fetch(`${apiUrl}/api/modules/mercadopago/payments/history/${empresaId}`);
      const paymentsData = await paymentsResponse.json();
      
      if (paymentsData.success) {
        console.log('💰 Historial de pagos:', paymentsData);
        console.log('📦 Primer pago con items:', paymentsData.payments?.[0]);
        console.log('📦 Items del primer pago:', paymentsData.payments?.[0]?.items);
        setPayments(paymentsData.payments || []);
      } else {
        throw new Error('Error al cargar pagos');
      }
      
      // Cargar estadísticas
      const statsResponse = await fetch(`${apiUrl}/api/modules/mercadopago/payments/stats/${empresaId}`);
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setStats(statsData.stats);
      }
      
    } catch (err: any) {
      console.error('Error cargando datos:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
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
    link.download = `pagos_mercadopago_${empresaNombre || empresaId}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    if (payments.length === 0) return;
    
    // Crear contenido HTML para PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Historial de Pagos - ${empresaNombre || empresaId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #009ee3; font-size: 24px; margin-bottom: 10px; }
          .stats { display: flex; gap: 20px; margin: 20px 0; }
          .stat-card { background: #f5f5f5; padding: 15px; border-radius: 8px; flex: 1; }
          .stat-value { font-size: 24px; font-weight: bold; color: #009ee3; }
          .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
          th { background: #009ee3; color: white; padding: 8px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:hover { background: #f9f9f9; }
          .status-approved { color: #10b981; font-weight: bold; }
          .status-pending { color: #f59e0b; font-weight: bold; }
          .status-rejected { color: #ef4444; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>📊 Historial de Pagos - ${empresaNombre || empresaId}</h1>
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
    
    // Crear ventana para imprimir
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
        return <CheckCircle size={16} className={styles.statusIconApproved} />;
      case 'pending':
      case 'in_process':
        return <Clock size={16} className={styles.statusIconPending} />;
      case 'rejected':
      case 'cancelled':
        return <XCircle size={16} className={styles.statusIconRejected} />;
      default:
        return <AlertCircle size={16} className={styles.statusIconDefault} />;
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
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>
              💳 Historial de Pagos - MercadoPago
            </h3>
            {empresaNombre && (
              <p className={styles.modalSubtitle}>{empresaNombre}</p>
            )}
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <Loader2 size={32} className={styles.spinner} />
              <p>Cargando historial de pagos...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <AlertCircle size={32} />
              <p>{error}</p>
              <button className={styles.btnRetry} onClick={loadData}>
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              {stats && (
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <CheckCircle size={20} />
                    </div>
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>{stats.pagosAprobados}</div>
                      <div className={styles.statLabel}>Aprobados</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <DollarSign size={20} />
                    </div>
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>
                        ${stats.ingresosTotales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className={styles.statLabel}>Ingresos Totales</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <Calendar size={20} />
                    </div>
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>{stats.pagosDelMes}</div>
                      <div className={styles.statLabel}>Este Mes</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <Clock size={20} />
                    </div>
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>{stats.pagosPendientes}</div>
                      <div className={styles.statLabel}>Pendientes</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Export Buttons */}
              <div className={styles.exportButtons}>
                <button 
                  className={styles.btnExport}
                  onClick={exportToCSV}
                  disabled={payments.length === 0}
                >
                  <FileSpreadsheet size={16} />
                  Exportar CSV
                </button>
                <button 
                  className={styles.btnExport}
                  onClick={exportToPDF}
                  disabled={payments.length === 0}
                >
                  <FileText size={16} />
                  Exportar PDF
                </button>
              </div>

              {/* Payments List */}
              {payments.length === 0 ? (
                <div className={styles.emptyState}>
                  <CreditCard size={48} />
                  <p>No hay pagos registrados</p>
                </div>
              ) : (
                <div className={styles.paymentsContainer}>
                  <div className={styles.paymentsList}>
                    {payments.map((payment) => (
                      <div
                        key={payment._id}
                        className={`${styles.paymentItem} ${selectedPayment?._id === payment._id ? styles.paymentItemActive : ''}`}
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <div className={styles.paymentItemHeader}>
                          <div className={styles.paymentStatus}>
                            {getStatusIcon(payment.status)}
                            <span>{getStatusLabel(payment.status)}</span>
                          </div>
                          <div className={styles.paymentAmount}>
                            ${payment.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className={styles.paymentItemBody}>
                          <div className={styles.paymentInfo}>
                            <Hash size={12} />
                            <span>{payment.mpPaymentId}</span>
                          </div>
                          {payment.payerEmail && (
                            <div className={styles.paymentInfo}>
                              <Mail size={12} />
                              <span>{payment.payerEmail}</span>
                            </div>
                          )}
                          <div className={styles.paymentInfo}>
                            <Calendar size={12} />
                            <span>{new Date(payment.dateCreated || payment.createdAt).toLocaleDateString('es-AR')}</span>
                          </div>
                        </div>
                        <ChevronRight size={16} className={styles.paymentItemArrow} />
                      </div>
                    ))}
                  </div>

                  {/* Payment Detail */}
                  {selectedPayment && (
                    <div className={styles.paymentDetail}>
                      <h4 className={styles.detailTitle}>Detalle del Pago</h4>
                      
                      <div className={styles.detailSection}>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Estado:</span>
                          <div className={styles.detailValue}>
                            {getStatusIcon(selectedPayment.status)}
                            <span>{getStatusLabel(selectedPayment.status)}</span>
                          </div>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Monto:</span>
                          <span className={styles.detailValue}>
                            ${selectedPayment.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })} {selectedPayment.currency}
                          </span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>ID de Pago:</span>
                          <span className={styles.detailValue}>{selectedPayment.mpPaymentId}</span>
                        </div>
                        {selectedPayment.externalReference && (
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Referencia:</span>
                            <span className={styles.detailValue}>{selectedPayment.externalReference}</span>
                          </div>
                        )}
                      </div>

                      {(selectedPayment.paymentMethodId || selectedPayment.paymentTypeId) && (
                        <div className={styles.detailSection}>
                          <h5 className={styles.detailSectionTitle}>Método de Pago</h5>
                          {selectedPayment.paymentMethodId && (
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Método:</span>
                              <span className={styles.detailValue}>{selectedPayment.paymentMethodId}</span>
                            </div>
                          )}
                          {selectedPayment.paymentTypeId && (
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Tipo:</span>
                              <span className={styles.detailValue}>{selectedPayment.paymentTypeId}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedPayment.items && selectedPayment.items.length > 0 && (
                        <div className={styles.detailSection}>
                          <h5 className={styles.detailSectionTitle}>📦 Productos</h5>
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
                          <h5 className={styles.detailSectionTitle}>Información del Pagador</h5>
                          {selectedPayment.payerName && (
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Nombre:</span>
                              <span className={styles.detailValue}>{selectedPayment.payerName}</span>
                            </div>
                          )}
                          {selectedPayment.payerEmail && (
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Email:</span>
                              <span className={styles.detailValue}>{selectedPayment.payerEmail}</span>
                            </div>
                          )}
                          {selectedPayment.payerPhone && (
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Teléfono:</span>
                              <span className={styles.detailValue}>{selectedPayment.payerPhone}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className={styles.detailSection}>
                        <h5 className={styles.detailSectionTitle}>Fechas</h5>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Creación:</span>
                          <span className={styles.detailValue}>
                            {new Date(selectedPayment.dateCreated || selectedPayment.createdAt).toLocaleString('es-AR')}
                          </span>
                        </div>
                        {selectedPayment.dateApproved && (
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Aprobación:</span>
                            <span className={styles.detailValue}>
                              {new Date(selectedPayment.dateApproved).toLocaleString('es-AR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.btnClose} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(MercadoPagoWebhookModal);
