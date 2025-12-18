'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import styles from './mercadopago.module.css';

const MP_API_URL = process.env.NEXT_PUBLIC_MP_API_URL || 'http://localhost:3001';

interface PaymentLink {
  id: string;
  slug: string;
  title: string;
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

export default function MercadoPagoConfigPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'productos' | 'suscripciones' | 'chatbot'>('productos');
  const [loading, setLoading] = useState(false);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Estados para crear nuevo
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [showNewPlan, setShowNewPlan] = useState(false);
  
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

  const sellerId = typeof window !== 'undefined' 
    ? localStorage.getItem('mp_user_id') || 'default' 
    : 'default';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [linksRes, plansRes] = await Promise.all([
        fetch(`${MP_API_URL}/payment-links?sellerId=${sellerId}`),
        fetch(`${MP_API_URL}/subscriptions/plans?sellerId=${sellerId}`),
      ]);
      
      if (linksRes.ok) {
        const data = await linksRes.json();
        setPaymentLinks(data.links || []);
      }
      
      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data.plans || []);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
    setLoading(false);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${MP_API_URL}/payment-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId,
          title: productForm.title,
          unitPrice: parseFloat(productForm.unitPrice),
          description: productForm.description || undefined,
          priceType: productForm.priceType,
        }),
      });
      
      if (res.ok) {
        setProductForm({ title: '', unitPrice: '', description: '', priceType: 'fixed' });
        setShowNewProduct(false);
        loadData();
      }
    } catch (err) {
      console.error('Error creando producto:', err);
    }
    setLoading(false);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${MP_API_URL}/subscriptions/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId,
          name: planForm.name,
          amount: parseFloat(planForm.amount),
          frequency: planForm.frequency,
          trialDays: parseInt(planForm.trialDays) || 0,
          description: planForm.description || undefined,
        }),
      });
      
      if (res.ok) {
        setPlanForm({ name: '', amount: '', frequency: 'monthly', trialDays: '0', description: '' });
        setShowNewPlan(false);
        loadData();
      }
    } catch (err) {
      console.error('Error creando plan:', err);
    }
    setLoading(false);
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('¿Eliminar este link de pago?')) return;
    
    try {
      await fetch(`${MP_API_URL}/payment-links/${linkId}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error('Error eliminando:', err);
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

              {/* Form nuevo producto */}
              {showNewProduct && (
                <form className={styles.form} onSubmit={handleCreateProduct}>
                  <h3>Crear Link de Pago</h3>
                  
                  <div className={styles.formGroup}>
                    <label>Nombre del producto o servicio *</label>
                    <input
                      type="text"
                      value={productForm.title}
                      onChange={(e) => setProductForm({...productForm, title: e.target.value})}
                      placeholder="Ej: Consultoría 1 hora"
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Precio *</label>
                    <input
                      type="number"
                      value={productForm.unitPrice}
                      onChange={(e) => setProductForm({...productForm, unitPrice: e.target.value})}
                      placeholder="1000"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Tipo de precio</label>
                    <select
                      value={productForm.priceType}
                      onChange={(e) => setProductForm({...productForm, priceType: e.target.value})}
                    >
                      <option value="fixed">Precio fijo</option>
                      <option value="minimum">Precio mínimo (cliente puede pagar más)</option>
                      <option value="customer_chooses">Cliente elige el monto</option>
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Descripción (opcional)</label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      placeholder="Descripción del producto o servicio"
                      rows={2}
                    />
                  </div>
                  
                  <div className={styles.formActions}>
                    <button type="button" className={styles.cancelButton} onClick={() => setShowNewProduct(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className={styles.submitButton} disabled={loading}>
                      {loading ? 'Creando...' : 'Crear Link'}
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
                    <div key={link.id} className={styles.listItem}>
                      <div className={styles.itemInfo}>
                        <h4>{link.title}</h4>
                        <p>${link.unitPrice.toLocaleString()}</p>
                      </div>
                      <div className={styles.itemStats}>
                        <span>{link.totalUses} usos</span>
                      </div>
                      <div className={styles.itemActions}>
                        <button 
                          className={`${styles.copyButton} ${copiedId === link.id ? styles.copied : ''}`}
                          onClick={() => copyToClipboard(link.paymentUrl, link.id)}
                          title="Copiar link"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                        </button>
                        <button 
                          className={styles.deleteButton}
                          onClick={() => handleDeleteLink(link.id)}
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
                          <option key={link.id} value={link.id}>
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
      </div>
    </DashboardLayout>
  );
}
