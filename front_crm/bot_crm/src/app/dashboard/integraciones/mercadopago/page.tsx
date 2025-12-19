'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import styles from './mercadopago.module.css';

const MP_API_URL = process.env.NEXT_PUBLIC_MP_API_URL || 'http://localhost:3001';

interface PaymentLink {
  _id: string;
  id?: string;
  slug: string;
  title: string;
  description: string;
  unitPrice: number;
  priceType: string;
  active: boolean;
  totalUses: number;
  paymentUrl: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  trialDays: number;
  active: boolean;
  subscriberCount: number;
}

interface ChatbotFlowConfig {
  enabled: boolean;
  triggerOn: 'ticket_close' | 'reservation_confirm' | 'manual';
  defaultLinkId: string | null;
  sendMessage: string;
}

interface Payment {
  _id: string;
  mpPaymentId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' | 'in_process';
  statusDetail?: string;
  amount: number;
  currency: string;
  payerEmail?: string;
  payerName?: string;
  payerPhone?: string;
  paymentMethodId?: string;
  paymentTypeId?: string;
  externalReference?: string;
  createdAt: string;
  dateApproved?: string;
}

export default function MercadoPagoConfigPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'productos' | 'suscripciones' | 'pagos' | 'chatbot'>('productos');
  const [loading, setLoading] = useState(false);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentStats, setPaymentStats] = useState<{
    pagosAprobados: number;
    ingresosTotales: number;
    pagosDelMes: number;
    ingresosDelMes: number;
    pagosPendientes: number;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
  // Estados para crear nuevo
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [editingLink, setEditingLink] = useState<PaymentLink | null>(null);
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<any>(null);
  
  // Form de producto
  const [productForm, setProductForm] = useState({
    title: '',
    unitPrice: '',
    description: '',
    priceType: 'fixed',
  });
  
  // Form de suscripción
  const [planForm, setPlanForm] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    trialDays: '0',
    description: '',
  });

  // Config del chatbot
  const [chatbotConfig, setChatbotConfig] = useState<ChatbotFlowConfig>({
    enabled: false,
    triggerOn: 'ticket_close',
    defaultLinkId: null,
    sendMessage: '¡Gracias por tu compra! Aquí está tu link de pago:',
  });

  // Usar empresa_id para filtrar datos por empresa (no mp_user_id que es compartido)
  const empresaId = typeof window !== 'undefined' 
    ? localStorage.getItem('empresa_id') || '' 
    : '';
  
  // mp_user_id solo se usa para verificar si MP está conectado
  const mpUserId = typeof window !== 'undefined' 
    ? localStorage.getItem('mp_user_id') || '' 
    : '';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Si no hay mpUserId, no cargar datos de MP
    if (!mpUserId) {
      setLoading(false);
      return;
    }
    
    try {
      const [linksRes, plansRes, paymentsRes, statsRes] = await Promise.all([
        fetch(`${MP_API_URL}/payment-links?sellerId=${mpUserId}`),
        fetch(`${MP_API_URL}/subscriptions/plans?sellerId=${mpUserId}`),
        fetch(`${MP_API_URL}/payments/history/${empresaId}?limit=50`),
        fetch(`${MP_API_URL}/payments/stats/${empresaId}`),
      ]);
      
      if (linksRes.ok) {
        const data = await linksRes.json();
        setPaymentLinks(data.links || []);
      }
      
      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data.plans || []);
      }
      
      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        setPayments(data.payments || []);
      }
      
      if (statsRes.ok) {
        const data = await statsRes.json();
        setPaymentStats(data.stats || null);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
    setLoading(false);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que MP esté conectado
    if (!mpUserId) {
      alert('Debes conectar tu cuenta de Mercado Pago primero');
      return;
    }
    
    // Validar y convertir precio
    const priceStr = productForm.unitPrice.replace(/\./g, '').replace(',', '.');
    const price = parseFloat(priceStr);
    
    if (isNaN(price) || price <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch(`${MP_API_URL}/payment-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: mpUserId,
          title: productForm.title,
          unitPrice: price,
          description: productForm.description || undefined,
          priceType: productForm.priceType,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        alert(`Error: ${error.error || 'No se pudo crear el link'}`);
        setLoading(false);
        return;
      }
      
      setProductForm({ title: '', unitPrice: '', description: '', priceType: 'fixed' });
      setShowNewProduct(false);
      await loadData();
    } catch (err) {
      console.error('Error creando producto:', err);
      alert('Error al crear el link de pago');
    }
    setLoading(false);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que MP esté conectado
    if (!mpUserId) {
      alert('Debes conectar tu cuenta de Mercado Pago primero');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch(`${MP_API_URL}/subscriptions/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: mpUserId, // ✅ Usar mp_user_id en lugar de empresa_id
          name: planForm.name,
          amount: parseFloat(planForm.amount),
          frequency: planForm.frequency,
          trialDays: parseInt(planForm.trialDays) || 0,
          description: planForm.description || undefined,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        alert(`Error: ${error.error || 'No se pudo crear el plan'}`);
        setLoading(false);
        return;
      }
      
      setPlanForm({ name: '', amount: '', frequency: 'monthly', trialDays: '0', description: '' });
      setShowNewPlan(false);
      await loadData();
    } catch (err) {
      console.error('Error creando plan:', err);
      alert('Error al crear el plan de suscripción');
    }
    setLoading(false);
  };

  const handleEditLink = (link: PaymentLink) => {
    setEditingLink(link);
    setProductForm({
      title: link.title,
      unitPrice: link.unitPrice.toString().replace('.', ','),
      description: link.description || '',
      priceType: link.priceType || 'fixed'
    });
    setShowNewProduct(false);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingLink) return;
    
    // Validar y convertir precio
    const priceStr = productForm.unitPrice.replace(/\./g, '').replace(',', '.');
    const price = parseFloat(priceStr);
    
    if (isNaN(price) || price <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }
    
    // Verificar si el título cambió (esto cambiaría el slug/URL)
    const titleChanged = productForm.title !== editingLink.title;
    
    if (titleChanged) {
      // Mostrar advertencia
      setPendingEdit({
        id: editingLink._id,
        title: productForm.title,
        unitPrice: price,
        description: productForm.description,
        priceType: productForm.priceType
      });
      setShowEditWarning(true);
      return;
    }
    
    // Si no cambió el título, actualizar directamente
    await performUpdate({
      id: editingLink._id,
      title: productForm.title,
      unitPrice: price,
      description: productForm.description,
      priceType: productForm.priceType
    });
  };
  
  const performUpdate = async (data: any) => {
    setLoading(true);
    
    try {
      const res = await fetch(`${MP_API_URL}/payment-links/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          unitPrice: data.unitPrice,
          description: data.description,
          priceType: data.priceType
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        alert(`Error: ${error.error || 'No se pudo actualizar el link'}`);
        setLoading(false);
        return;
      }
      
      setProductForm({ title: '', unitPrice: '', description: '', priceType: 'fixed' });
      setEditingLink(null);
      setShowEditWarning(false);
      setPendingEdit(null);
      await loadData();
    } catch (err) {
      console.error('Error actualizando link:', err);
      alert('Error al actualizar el link de pago');
    }
    setLoading(false);
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('¿Eliminar este link de pago?')) return;
    
    try {
      await fetch(`${MP_API_URL}/payment-links/${linkId}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error('Error eliminando link:', err);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('¿Eliminar este plan?')) return;
    
    try {
      await fetch(`${MP_API_URL}/subscriptions/plans/${planId}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error('Error eliminando:', err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveChatbotConfig = () => {
    localStorage.setItem('mp_chatbot_config', JSON.stringify(chatbotConfig));
    alert('Configuración guardada');
  };

  const frequencyLabels: Record<string, string> = {
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    yearly: 'Anual',
  };

  const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pendiente', color: '#d97706', bg: '#fef3c7' },
    approved: { label: 'Aprobado', color: '#15803d', bg: '#dcfce7' },
    rejected: { label: 'Rechazado', color: '#dc2626', bg: '#fef2f2' },
    cancelled: { label: 'Cancelado', color: '#6b7280', bg: '#f3f4f6' },
    refunded: { label: 'Reembolsado', color: '#7c3aed', bg: '#ede9fe' },
    in_process: { label: 'En proceso', color: '#2563eb', bg: '#dbeafe' },
    authorized: { label: 'Autorizado', color: '#0891b2', bg: '#cffafe' },
    in_mediation: { label: 'En mediación', color: '#ea580c', bg: '#ffedd5' },
    charged_back: { label: 'Contracargo', color: '#be123c', bg: '#ffe4e6' },
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout title="Configurar Mercado Pago">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => router.back()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className={styles.headerInfo}>
            <div className={styles.headerLogo}>
              <img src="/logos tecnologias/mp-logo.png" alt="MP" width="32" height="32" />
            </div>
            <div>
              <h1 className={styles.title}>Mercado Pago</h1>
              <p className={styles.subtitle}>Configura tus cobros y suscripciones</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeSection === 'productos' ? styles.tabActive : ''}`}
            onClick={() => setActiveSection('productos')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            Cobrar Productos
          </button>
          <button
            className={`${styles.tab} ${activeSection === 'suscripciones' ? styles.tabActive : ''}`}
            onClick={() => setActiveSection('suscripciones')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Cobrar Suscripciones
          </button>
          <button
            className={`${styles.tab} ${activeSection === 'pagos' ? styles.tabActive : ''}`}
            onClick={() => setActiveSection('pagos')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            Historial Pagos
          </button>
          <button
            className={`${styles.tab} ${activeSection === 'chatbot' ? styles.tabActive : ''}`}
            onClick={() => setActiveSection('chatbot')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Flujo Chatbot
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {activeSection === 'productos' ? (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Links de Pago</h2>
                  <p>Crea links para cobrar productos o servicios</p>
                </div>
                <button 
                  className={styles.addButton}
                  onClick={() => setShowNewProduct(true)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Nuevo Link
                </button>
              </div>

              {/* Form nuevo/editar producto */}
              {(showNewProduct || editingLink) && (
                <form className={styles.formModern} onSubmit={editingLink ? handleUpdateProduct : handleCreateProduct}>
                  <div className={styles.formHeader}>
                    <h3>{editingLink ? 'Editar Link de Pago' : 'Crear Link de Pago'}</h3>
                  </div>
                  
                  <div className={styles.formBody}>
                    <div className={styles.formGroupModern}>
                      <label>Nombre del producto o servicio *</label>
                      <input
                        type="text"
                        value={productForm.title}
                        onChange={(e) => setProductForm({...productForm, title: e.target.value})}
                        placeholder="Ej: Consultoría 1 hora"
                        required
                        className={styles.inputModern}
                      />
                    </div>
                    
                    <div className={styles.formGroupModern}>
                      <label>Precio (ARS) *</label>
                      <div className={styles.priceInputWrapper}>
                        <span className={styles.pricePrefix}>$</span>
                        <input
                          type="text"
                          value={productForm.unitPrice}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9,]/g, '');
                            const parts = value.split(',');
                            if (parts.length > 2) return;
                            if (parts[1] && parts[1].length > 2) return;
                            setProductForm({...productForm, unitPrice: value});
                          }}
                          placeholder="1.000,00"
                          required
                          className={styles.inputModern}
                        />
                      </div>
                      <small className={styles.helpText}>Usa coma para decimales (ej: 1.500,50)</small>
                    </div>
                    
                    <div className={styles.formGroupModern}>
                      <label>Tipo de precio</label>
                      <select
                        value={productForm.priceType}
                        onChange={(e) => setProductForm({...productForm, priceType: e.target.value})}
                        className={styles.selectModern}
                      >
                        <option value="fixed">💰 Precio fijo</option>
                        <option value="minimum">📊 Precio mínimo (cliente puede pagar más)</option>
                        <option value="customer_chooses">✏️ Cliente elige el monto</option>
                      </select>
                    </div>
                    
                    <div className={styles.formGroupModern}>
                      <label>Descripción (opcional)</label>
                      <textarea
                        value={productForm.description}
                        onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                        placeholder="Agrega detalles sobre el producto o servicio..."
                        rows={2}
                        className={styles.textareaModern}
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formActionsModern}>
                    <button type="button" className={styles.btnCancel} onClick={() => {
                      setShowNewProduct(false);
                      setEditingLink(null);
                      setProductForm({ title: '', unitPrice: '', description: '', priceType: 'fixed' });
                    }}>
                      Cancelar
                    </button>
                    <button type="submit" className={styles.btnSubmit} disabled={loading}>
                      {loading ? (editingLink ? 'Actualizando...' : 'Creando...') : (editingLink ? 'Actualizar Link' : 'Crear Link')}
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de links */}
              <div className={styles.list}>
                {paymentLinks.length === 0 ? (
                  <div className={styles.emptyState}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <line x1="3" y1="9" x2="21" y2="9"/>
                    </svg>
                    <p>No tienes links de pago creados</p>
                    <span>Crea tu primer link para empezar a cobrar</span>
                  </div>
                ) : (
                  paymentLinks.filter(l => l.active).map((link) => (
                    <div key={link._id} className={styles.listItem}>
                      <div className={styles.itemInfo}>
                        <h4>{link.title}</h4>
                        <p>${link.unitPrice.toLocaleString()}</p>
                      </div>
                      <div className={styles.itemStats}>
                        <span>{link.totalUses} usos</span>
                      </div>
                      <div className={styles.itemActions}>
                        <button 
                          className={`${styles.copyButton} ${copiedId === link._id ? styles.copied : ''}`}
                          onClick={() => copyToClipboard(link.paymentUrl, link._id)}
                          title="Copiar link"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                        </button>
                        <button 
                          className={styles.editButton}
                          onClick={() => handleEditLink(link)}
                          title="Editar"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button 
                          className={styles.deleteButton}
                          onClick={() => handleDeleteLink(link._id)}
                          title="Eliminar"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeSection === 'suscripciones' ? (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Planes de Suscripción</h2>
                  <p>Crea planes para cobros recurrentes</p>
                </div>
                <button 
                  className={styles.addButton}
                  onClick={() => setShowNewPlan(true)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Nuevo Plan
                </button>
              </div>

              {/* Form nuevo plan */}
              {showNewPlan && (
                <form className={styles.form} onSubmit={handleCreatePlan}>
                  <h3>Crear Plan de Suscripción</h3>
                  
                  <div className={styles.formGroup}>
                    <label>Nombre del plan *</label>
                    <input
                      type="text"
                      value={planForm.name}
                      onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                      placeholder="Ej: Plan Premium"
                      required
                    />
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Precio *</label>
                      <input
                        type="number"
                        value={planForm.amount}
                        onChange={(e) => setPlanForm({...planForm, amount: e.target.value})}
                        placeholder="2999"
                        min="1"
                        required
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>Frecuencia *</label>
                      <select
                        value={planForm.frequency}
                        onChange={(e) => setPlanForm({...planForm, frequency: e.target.value})}
                      >
                        <option value="monthly">Mensual</option>
                        <option value="quarterly">Trimestral</option>
                        <option value="yearly">Anual</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Días de prueba gratis (opcional)</label>
                    <input
                      type="number"
                      value={planForm.trialDays}
                      onChange={(e) => setPlanForm({...planForm, trialDays: e.target.value})}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Descripción (opcional)</label>
                    <textarea
                      value={planForm.description}
                      onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
                      placeholder="Qué incluye este plan"
                      rows={2}
                    />
                  </div>
                  
                  <div className={styles.formActions}>
                    <button type="button" className={styles.cancelButton} onClick={() => setShowNewPlan(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className={styles.submitButton} disabled={loading}>
                      {loading ? 'Creando...' : 'Crear Plan'}
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de planes */}
              <div className={styles.list}>
                {plans.length === 0 ? (
                  <div className={styles.emptyState}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <p>No tienes planes de suscripción</p>
                    <span>Crea tu primer plan para cobros recurrentes</span>
                  </div>
                ) : (
                  plans.filter(p => p.active).map((plan) => (
                    <div key={plan.id} className={styles.listItem}>
                      <div className={styles.itemInfo}>
                        <h4>{plan.name}</h4>
                        <p>${plan.amount.toLocaleString()} / {frequencyLabels[plan.frequency] || plan.frequency}</p>
                      </div>
                      <div className={styles.itemStats}>
                        <span>{plan.subscriberCount} suscriptores</span>
                        {plan.trialDays > 0 && <span className={styles.trialBadge}>{plan.trialDays} días gratis</span>}
                      </div>
                      <div className={styles.itemActions}>
                        <button 
                          className={`${styles.copyButton} ${copiedId === plan.id ? styles.copied : ''}`}
                          onClick={() => copyToClipboard(`${MP_API_URL}/subscriptions/checkout/${plan.id}`, plan.id)}
                          title="Copiar link"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                        </button>
                        <button 
                          className={styles.deleteButton}
                          onClick={() => handleDeletePlan(plan.id)}
                          title="Eliminar"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeSection === 'pagos' ? (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Historial de Pagos</h2>
                  <p>Consulta el estado de todos los pagos recibidos</p>
                </div>
                <button className={styles.refreshButton} onClick={loadData} disabled={loading}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  {loading ? 'Cargando...' : 'Actualizar'}
                </button>
              </div>

              {/* Stats Cards */}
              {paymentStats && (
                <div className={styles.statsCards}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#dcfce7' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{paymentStats.pagosAprobados}</span>
                      <span className={styles.statLabel}>Pagos Aprobados</span>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#dbeafe' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23"/>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>${paymentStats.ingresosTotales.toLocaleString()}</span>
                      <span className={styles.statLabel}>Ingresos Totales</span>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#fef3c7' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{paymentStats.pagosDelMes}</span>
                      <span className={styles.statLabel}>Pagos del Mes</span>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#ede9fe' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{paymentStats.pagosPendientes}</span>
                      <span className={styles.statLabel}>Pendientes</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla de Pagos */}
              <div className={styles.paymentsTable}>
                {payments.length === 0 ? (
                  <div className={styles.emptyState}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    <p>No hay pagos registrados</p>
                    <span>Los pagos aparecerán aquí cuando se procesen</span>
                  </div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Pago</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Pagador</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => {
                        const statusInfo = statusLabels[payment.status] || { label: payment.status, color: '#6b7280', bg: '#f3f4f6' };
                        return (
                          <tr key={payment._id} onClick={() => setSelectedPayment(payment)} className={styles.clickableRow}>
                            <td>
                              <div className={styles.paymentCell}>
                                <div className={styles.paymentAvatar} style={{ background: statusInfo.bg }}>
                                  {payment.status === 'approved' ? '✓' : payment.status === 'pending' ? '⏳' : payment.status === 'rejected' ? '✕' : '•'}
                                </div>
                                <div className={styles.paymentInfo}>
                                  <span className={styles.paymentId}>#{payment.mpPaymentId}</span>
                                  <span className={styles.paymentMethod}>{payment.paymentMethodId || 'N/A'}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={styles.amount}>${payment.amount.toLocaleString()}</span>
                              <span className={styles.currency}>{payment.currency}</span>
                            </td>
                            <td>
                              <span 
                                className={styles.statusBadge}
                                style={{ background: statusInfo.bg, color: statusInfo.color }}
                              >
                                {statusInfo.label}
                              </span>
                            </td>
                            <td>
                              <div className={styles.payerCell}>
                                <span>{payment.payerName || 'Sin nombre'}</span>
                                <span className={styles.payerEmail}>{payment.payerPhone || payment.payerEmail || '-'}</span>
                              </div>
                            </td>
                            <td>
                              <span className={styles.date}>{formatDate(payment.createdAt)}</span>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className={styles.actions}>
                                <button
                                  onClick={() => setSelectedPayment(payment)}
                                  className={styles.btnVer}
                                  title="Ver detalles"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Modal de Detalles del Pago */}
              {selectedPayment && (
                <div className={styles.modal} onClick={() => setSelectedPayment(null)}>
                  <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                      <div className={styles.modalPaymentIcon} style={{ background: statusLabels[selectedPayment.status]?.bg || '#f3f4f6' }}>
                        {selectedPayment.status === 'approved' ? '✓' : selectedPayment.status === 'pending' ? '⏳' : '•'}
                      </div>
                      <div>
                        <h2>Pago #{selectedPayment.mpPaymentId}</h2>
                        <span 
                          className={styles.statusBadge}
                          style={{ 
                            background: statusLabels[selectedPayment.status]?.bg || '#f3f4f6', 
                            color: statusLabels[selectedPayment.status]?.color || '#6b7280' 
                          }}
                        >
                          {statusLabels[selectedPayment.status]?.label || selectedPayment.status}
                        </span>
                      </div>
                      <button className={styles.modalClose} onClick={() => setSelectedPayment(null)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>

                    <div className={styles.modalBody}>
                      <div className={styles.modalSection}>
                        <h4>Información del Pago</h4>
                        <div className={styles.modalInfo}>
                          <div className={styles.modalInfoItem}>
                            <span className={styles.label}>Monto:</span>
                            <span className={styles.amountLarge}>${selectedPayment.amount.toLocaleString()} {selectedPayment.currency}</span>
                          </div>
                          <div className={styles.modalInfoItem}>
                            <span className={styles.label}>Método:</span>
                            <span>{selectedPayment.paymentMethodId || 'N/A'} ({selectedPayment.paymentTypeId || 'N/A'})</span>
                          </div>
                          <div className={styles.modalInfoItem}>
                            <span className={styles.label}>Fecha creación:</span>
                            <span>{formatDate(selectedPayment.createdAt)}</span>
                          </div>
                          {selectedPayment.dateApproved && (
                            <div className={styles.modalInfoItem}>
                              <span className={styles.label}>Fecha aprobación:</span>
                              <span>{formatDate(selectedPayment.dateApproved)}</span>
                            </div>
                          )}
                          {selectedPayment.statusDetail && (
                            <div className={styles.modalInfoItem}>
                              <span className={styles.label}>Detalle estado:</span>
                              <span>{selectedPayment.statusDetail}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={styles.modalSection}>
                        <h4>Información del Pagador</h4>
                        <div className={styles.modalInfo}>
                          <div className={styles.modalInfoItem}>
                            <span className={styles.label}>Nombre:</span>
                            <span>{selectedPayment.payerName || 'No disponible'}</span>
                          </div>
                          <div className={styles.modalInfoItem}>
                            <span className={styles.label}>Email:</span>
                            <span>{selectedPayment.payerEmail || 'No disponible'}</span>
                          </div>
                          {selectedPayment.payerPhone && (
                            <div className={styles.modalInfoItem}>
                              <span className={styles.label}>Teléfono:</span>
                              <span>{selectedPayment.payerPhone}</span>
                            </div>
                          )}
                          {selectedPayment.externalReference && (
                            <div className={styles.modalInfoItem}>
                              <span className={styles.label}>Referencia:</span>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>{selectedPayment.externalReference}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.modalActions}>
                      <button onClick={() => setSelectedPayment(null)} className={styles.btnModalCerrar}>
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeSection === 'chatbot' ? (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Flujo del Chatbot</h2>
                  <p>Configura cuándo y cómo enviar links de pago automáticamente</p>
                </div>
              </div>

              <div className={styles.chatbotConfig}>
                {/* Toggle principal */}
                <div className={styles.configCard}>
                  <div className={styles.configToggle}>
                    <div>
                      <h4>Enviar links de pago automáticamente</h4>
                      <p>El chatbot enviará un link de pago cuando se complete una acción</p>
                    </div>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={chatbotConfig.enabled}
                        onChange={(e) => setChatbotConfig({...chatbotConfig, enabled: e.target.checked})}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>

                {chatbotConfig.enabled && (
                  <>
                    {/* Cuándo enviar */}
                    <div className={styles.configCard}>
                      <h4>¿Cuándo enviar el link?</h4>
                      <div className={styles.radioGroup}>
                        <label className={styles.radioOption}>
                          <input
                            type="radio"
                            name="triggerOn"
                            value="ticket_close"
                            checked={chatbotConfig.triggerOn === 'ticket_close'}
                            onChange={() => setChatbotConfig({...chatbotConfig, triggerOn: 'ticket_close'})}
                          />
                          <div>
                            <strong>Al cerrar un ticket</strong>
                            <span>Cuando el cliente confirma su pedido</span>
                          </div>
                        </label>
                        <label className={styles.radioOption}>
                          <input
                            type="radio"
                            name="triggerOn"
                            value="reservation_confirm"
                            checked={chatbotConfig.triggerOn === 'reservation_confirm'}
                            onChange={() => setChatbotConfig({...chatbotConfig, triggerOn: 'reservation_confirm'})}
                          />
                          <div>
                            <strong>Al confirmar una reserva</strong>
                            <span>Cuando se agenda un turno o cita</span>
                          </div>
                        </label>
                        <label className={styles.radioOption}>
                          <input
                            type="radio"
                            name="triggerOn"
                            value="manual"
                            checked={chatbotConfig.triggerOn === 'manual'}
                            onChange={() => setChatbotConfig({...chatbotConfig, triggerOn: 'manual'})}
                          />
                          <div>
                            <strong>Manual (paso específico)</strong>
                            <span>Configurar en el editor de flujos</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Link por defecto */}
                    <div className={styles.configCard}>
                      <h4>Link de pago por defecto</h4>
                      <p className={styles.configHint}>Se usará cuando no haya un producto específico en el ticket</p>
                      <select
                        className={styles.configSelect}
                        value={chatbotConfig.defaultLinkId || ''}
                        onChange={(e) => setChatbotConfig({...chatbotConfig, defaultLinkId: e.target.value || null})}
                      >
                        <option value="">Usar monto del ticket</option>
                        {paymentLinks.filter(l => l.active).map((link) => (
                          <option key={link._id} value={link._id}>
                            {link.title} - ${link.unitPrice.toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Mensaje */}
                    <div className={styles.configCard}>
                      <h4>Mensaje del chatbot</h4>
                      <textarea
                        className={styles.configTextarea}
                        value={chatbotConfig.sendMessage}
                        onChange={(e) => setChatbotConfig({...chatbotConfig, sendMessage: e.target.value})}
                        placeholder="Mensaje que acompaña al link de pago"
                        rows={2}
                      />
                    </div>

                    {/* Guardar */}
                    <button className={styles.saveButton} onClick={handleSaveChatbotConfig}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                      </svg>
                      Guardar configuración
                    </button>
                  </>
                )}

                {!chatbotConfig.enabled && (
                  <div className={styles.disabledHint}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 16v-4M12 8h.01"/>
                    </svg>
                    <p>Activa la opción para configurar el flujo de pagos del chatbot</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal de advertencia al editar título */}
        {showEditWarning && pendingEdit && (
          <div className={styles.modalOverlay} onClick={() => setShowEditWarning(false)}>
            <div className={styles.modalWarning} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalWarningHeader}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <h3>⚠️ Advertencia: El link cambiará</h3>
              </div>
              <div className={styles.modalWarningBody}>
                <p>
                  Al cambiar el <strong>nombre del producto</strong>, se generará un nuevo link (URL).
                </p>
                <p>
                  <strong>Esto significa que:</strong>
                </p>
                <ul>
                  <li>❌ El link anterior dejará de funcionar</li>
                  <li>❌ Los links compartidos previamente quedarán rotos</li>
                  <li>❌ Deberás compartir el nuevo link a tus clientes</li>
                </ul>
                <p className={styles.warningQuestion}>
                  ¿Estás seguro de que deseas continuar?
                </p>
              </div>
              <div className={styles.modalWarningActions}>
                <button 
                  className={styles.btnWarningCancel} 
                  onClick={() => {
                    setShowEditWarning(false);
                    setPendingEdit(null);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  className={styles.btnWarningConfirm} 
                  onClick={() => performUpdate(pendingEdit)}
                >
                  Sí, actualizar de todas formas
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
