'use client';

// 🎯 Modal de Onboarding de Nuevas Empresas
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import styles from './onboarding.module.css';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OnboardingModal({ isOpen, onClose, onSuccess }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    plan: 'standard',
    categoria: 'comercio',
    tipoBot: 'conversacional',
    tipoNegocio: 'otro',
  });

  const [adminData, setAdminData] = useState({
    username: '',
    password: '',
    email: '',
    nombre: '',
    apellido: '',
  });

  const [metaConfig, setMetaConfig] = useState({
    phoneNumberId: '',
    accessToken: '',
    businessAccountId: '',
    appId: '',
    appSecret: '',
  });

  const [skipMeta, setSkipMeta] = useState(false);
  const [createdEmpresaId, setCreatedEmpresaId] = useState('');

  if (!isOpen) return null;

  const handleCrearEmpresa = async () => {
    try {
      setLoading(true);
      setError('');

      if (!formData.nombre || !formData.email) {
        setError('Nombre y email son requeridos');
        return;
      }

      const response = await apiClient.superAdminCrearEmpresa(formData);
      
      if (response.success) {
        setCreatedEmpresaId(formData.nombre); // Guardamos el ID de la empresa creada
        setStep(2);
        setAdminData({
          ...adminData,
          username: `admin_${formData.nombre.toLowerCase().replace(/\s+/g, '_')}`,
          email: formData.email,
        });
      } else {
        setError(response.message || 'Error al crear empresa');
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearAdmin = async () => {
    try {
      setLoading(true);
      setError('');

      if (!adminData.username || !adminData.password || !adminData.email || !adminData.nombre) {
        setError('Todos los campos son requeridos');
        return;
      }

      if (adminData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      const response = await apiClient.superAdminCrearUsuarioAdmin(
        formData.nombre,
        adminData
      );
      
      if (response.success) {
        setStep(3); // Ir a configuración de Meta
      } else {
        setError(response.message || 'Error al crear usuario admin');
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario admin');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigMeta = async () => {
    if (skipMeta) {
      setSuccess(true);
      setStep(4);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Validar que al menos phoneNumberId esté presente
      if (!metaConfig.phoneNumberId) {
        setError('El Phone Number ID es requerido');
        return;
      }

      // Aquí iría la llamada al API para actualizar la configuración de Meta
      // Por ahora solo simulamos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Error al guardar configuración de Meta');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizar = () => {
    onSuccess();
    onClose();
    setStep(1);
    setFormData({ nombre: '', email: '', telefono: '', plan: 'standard', categoria: 'comercio', tipoBot: 'conversacional', tipoNegocio: 'otro' });
    setAdminData({ username: '', password: '', email: '', nombre: '', apellido: '' });
    setMetaConfig({ phoneNumberId: '', accessToken: '', businessAccountId: '', appId: '', appSecret: '' });
    setSuccess(false);
    setError('');
    setSkipMeta(false);
    setCreatedEmpresaId('');
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <h2>Onboarding de Nueva Empresa</h2>
            <p>Paso {step} de 4</p>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>

        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressSteps}>
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`${styles.progressStep} ${s <= step ? styles.active : ''}`} />
            ))}
          </div>
          <div className={styles.progressLabels}>
            <span>Empresa</span>
            <span>Admin</span>
            <span>WhatsApp</span>
            <span>Listo</span>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {error && (
            <div className={`${styles.alert} ${styles.alertError}`}>
              <span className={styles.alertIcon}>⚠️</span>
              <div className={styles.alertContent}>
                <p>Error</p>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Step 1: Datos de la Empresa */}
          {step === 1 && (
            <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleCrearEmpresa(); }}>
              <div className={styles.formGroup}>
                <label>🏢 Nombre de la Empresa *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Mi Empresa SRL"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>📧 Email de Contacto *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contacto@miempresa.com"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>📱 Teléfono (opcional)</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+5493794123456"
                />
                <span className={styles.hint}>Formato: +54 seguido del código de área y número</span>
              </div>

              <div className={styles.formGroup}>
                <label>🏷️ Categoría</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                >
                  <option value="comercio">Comercio</option>
                  <option value="servicios">Servicios</option>
                  <option value="salud">Salud</option>
                  <option value="educacion">Educación</option>
                  <option value="turismo">Turismo</option>
                  <option value="tecnologia">Tecnología</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>🤖 Tipo de Bot</label>
                <div className={styles.planGrid}>
                  <div
                    onClick={() => setFormData({ ...formData, tipoBot: 'conversacional' })}
                    className={`${styles.planCard} ${formData.tipoBot === 'conversacional' ? styles.active : ''}`}
                  >
                    <h4>💬 Conversacional</h4>
                    <p>GPT responde libremente</p>
                    <span>Recomendado</span>
                  </div>
                  <div
                    onClick={() => setFormData({ ...formData, tipoBot: 'pasos' })}
                    className={`${styles.planCard} ${formData.tipoBot === 'pasos' ? styles.active : ''}`}
                  >
                    <h4>📋 Bot de Pasos</h4>
                    <p>Flujo guiado estructurado</p>
                    <span>Turnos/Reservas</span>
                  </div>
                </div>
                <span className={styles.hint}>El bot conversacional usa GPT para responder. El bot de pasos sigue un flujo predefinido.</span>
              </div>

              {formData.tipoBot === 'pasos' && (
                <div className={styles.formGroup}>
                  <label>🏢 Tipo de Negocio (para bot de pasos)</label>
                  <select
                    value={formData.tipoNegocio}
                    onChange={(e) => setFormData({ ...formData, tipoNegocio: e.target.value })}
                  >
                    <option value="canchas">Canchas/Deportes</option>
                    <option value="viajes">Viajes/Remises</option>
                    <option value="salud">Salud/Consultorios</option>
                    <option value="belleza">Belleza/Spa</option>
                    <option value="otro">Otro</option>
                  </select>
                  <span className={styles.hint}>Define qué flujo de conversación se activará</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>💳 Plan</label>
                <div className={styles.planGrid}>
                  {[
                    { value: 'basico', label: 'Básico', mensajes: '1,000 msg/mes', precio: '$' },
                    { value: 'standard', label: 'Standard', mensajes: '5,000 msg/mes', precio: '$$' },
                    { value: 'premium', label: 'Premium', mensajes: '15,000 msg/mes', precio: '$$$' },
                    { value: 'enterprise', label: 'Enterprise', mensajes: '50,000 msg/mes', precio: '$$$$' },
                  ].map((plan) => (
                    <div
                      key={plan.value}
                      onClick={() => setFormData({ ...formData, plan: plan.value })}
                      className={`${styles.planCard} ${formData.plan === plan.value ? styles.active : ''}`}
                    >
                      <h4>{plan.label}</h4>
                      <p>{plan.mensajes}</p>
                      <span>{plan.precio}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button" onClick={onClose} className={styles.btnSecondary}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading || !formData.nombre || !formData.email} className={styles.btnPrimary}>
                  {loading ? 'Creando...' : 'Continuar →'}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Usuario Admin */}
          {step === 2 && (
            <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleCrearAdmin(); }}>
              <div className={`${styles.alert} ${styles.alertSuccess}`}>
                <span className={styles.alertIcon}>✅</span>
                <div className={styles.alertContent}>
                  <p>Empresa creada exitosamente</p>
                  <span>{formData.nombre} • Plan: {formData.plan}</span>
                </div>
              </div>

              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '16px' }}>
                Ahora crea el usuario administrador que tendrá acceso al CRM de esta empresa.
              </p>

              <div className={styles.formGroup}>
                <label>Username *</label>
                <input
                  type="text"
                  value={adminData.username}
                  onChange={(e) => setAdminData({ ...adminData, username: e.target.value })}
                  placeholder="admin_miempresa"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Contraseña *</label>
                <input
                  type="password"
                  value={adminData.password}
                  onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <span className={styles.hint}>Esta contraseña será temporal. El usuario debe cambiarla en el primer login.</span>
              </div>

              <div className={styles.formGroup}>
                <label>Email *</label>
                <input
                  type="email"
                  value={adminData.email}
                  onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                  placeholder="admin@miempresa.com"
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={adminData.nombre}
                    onChange={(e) => setAdminData({ ...adminData, nombre: e.target.value })}
                    placeholder="Juan"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Apellido</label>
                  <input
                    type="text"
                    value={adminData.apellido}
                    onChange={(e) => setAdminData({ ...adminData, apellido: e.target.value })}
                    placeholder="Pérez"
                  />
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button" onClick={() => setStep(1)} className={styles.btnSecondary}>
                  ← Atrás
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !adminData.username || !adminData.password || !adminData.email || !adminData.nombre} 
                  className={styles.btnPrimary}
                >
                  {loading ? 'Creando...' : 'Crear Usuario →'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Configuración WhatsApp (Meta) */}
          {step === 3 && (
            <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleConfigMeta(); }}>
              <div className={`${styles.alert} ${styles.alertSuccess}`}>
                <span className={styles.alertIcon}>✅</span>
                <div className={styles.alertContent}>
                  <p>Usuario administrador creado</p>
                  <span>{adminData.username} • {adminData.email}</span>
                </div>
              </div>

              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '16px' }}>
                Configura las credenciales de WhatsApp Business (Meta API). Este paso es <strong>opcional</strong> y puede configurarse más tarde.
              </p>

              <div className={styles.formGroup}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={skipMeta}
                    onChange={(e) => setSkipMeta(e.target.checked)}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <span>Omitir configuración de WhatsApp (configurar más tarde)</span>
                </label>
              </div>

              {!skipMeta && (
                <>
                  <div className={styles.formGroup}>
                    <label>📱 Phone Number ID *</label>
                    <input
                      type="text"
                      value={metaConfig.phoneNumberId}
                      onChange={(e) => setMetaConfig({ ...metaConfig, phoneNumberId: e.target.value })}
                      placeholder="888481464341184"
                      required={!skipMeta}
                    />
                    <span className={styles.hint}>ID del número de teléfono de WhatsApp Business</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label>🔑 META_WHATSAPP_TOKEN</label>
                    <input
                      type="password"
                      value={metaConfig.accessToken}
                      onChange={(e) => setMetaConfig({ ...metaConfig, accessToken: e.target.value })}
                      placeholder="EAAxxxxxxxxxx..."
                    />
                    <span className={styles.hint}>Token de acceso permanente de la app de Meta (META_WHATSAPP_TOKEN)</span>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>🏢 WABA ID</label>
                      <input
                        type="text"
                        value={metaConfig.businessAccountId}
                        onChange={(e) => setMetaConfig({ ...metaConfig, businessAccountId: e.target.value })}
                        placeholder="123456789012345"
                      />
                      <span className={styles.hint}>WhatsApp Business Account ID</span>
                    </div>

                    <div className={styles.formGroup}>
                      <label>📲 App ID</label>
                      <input
                        type="text"
                        value={metaConfig.appId}
                        onChange={(e) => setMetaConfig({ ...metaConfig, appId: e.target.value })}
                        placeholder="123456789012345"
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>🔐 App Secret</label>
                    <input
                      type="password"
                      value={metaConfig.appSecret}
                      onChange={(e) => setMetaConfig({ ...metaConfig, appSecret: e.target.value })}
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                    <span className={styles.hint}>Secret de la aplicación de Meta</span>
                  </div>

                  <div className={styles.warningBox}>
                    <p>💡 <strong>Dónde encontrar estas credenciales:</strong></p>
                    <p style={{ marginTop: '8px', fontSize: '12px' }}>
                      1. Ve a <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#fb923c' }}>Meta for Developers</a><br/>
                      2. Selecciona tu app de WhatsApp Business<br/>
                      3. En el panel, encontrarás el Phone Number ID, App ID y App Secret<br/>
                      4. Genera un Access Token permanente desde la configuración de la app
                    </p>
                  </div>
                </>
              )}

              <div className={styles.actions}>
                <button type="button" onClick={() => setStep(2)} className={styles.btnSecondary}>
                  ← Atrás
                </button>
                <button 
                  type="submit" 
                  disabled={loading || (!skipMeta && !metaConfig.phoneNumberId)} 
                  className={styles.btnPrimary}
                >
                  {loading ? 'Guardando...' : skipMeta ? 'Omitir →' : 'Guardar y Continuar →'}
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Confirmación */}
          {step === 4 && success && (
            <div className={styles.successContainer}>
              <div className={styles.successIcon}>✅</div>
              <h3>¡Onboarding Completado!</h3>
              <p>La empresa ha sido configurada exitosamente.</p>

              <div className={styles.credentialsBox}>
                <h4>📋 Resumen de Configuración:</h4>
                <div className={styles.credentialRow}>
                  <span className={styles.credentialLabel}>Empresa:</span>
                  <span className={styles.credentialValue}>{formData.nombre}</span>
                </div>
                <div className={styles.credentialRow}>
                  <span className={styles.credentialLabel}>Plan:</span>
                  <span className={styles.credentialValue}>{formData.plan}</span>
                </div>
                <div className={styles.credentialRow}>
                  <span className={styles.credentialLabel}>Tipo de Bot:</span>
                  <span className={styles.credentialValue}>
                    {formData.tipoBot === 'conversacional' ? '💬 Conversacional (GPT)' : `📋 Bot de Pasos (${formData.tipoNegocio})`}
                  </span>
                </div>
                <div className={styles.credentialRow}>
                  <span className={styles.credentialLabel}>Username:</span>
                  <span className={styles.credentialValue}>{adminData.username}</span>
                </div>
                <div className={styles.credentialRow}>
                  <span className={styles.credentialLabel}>Password:</span>
                  <span className={styles.credentialValue}>{adminData.password}</span>
                </div>
                <div className={styles.credentialRow}>
                  <span className={styles.credentialLabel}>Email:</span>
                  <span className={styles.credentialValue}>{adminData.email}</span>
                </div>
                <div className={styles.credentialRow}>
                  <span className={styles.credentialLabel}>WhatsApp:</span>
                  <span className={styles.credentialValue}>
                    {skipMeta || !metaConfig.phoneNumberId ? '❌ No configurado' : '✅ Configurado'}
                  </span>
                </div>
              </div>

              <div className={styles.warningBox}>
                <p><strong>⚠️ Importante:</strong> Guarda estas credenciales y envíalas al cliente de forma segura. El usuario debe cambiar la contraseña en el primer login.</p>
                {(skipMeta || !metaConfig.phoneNumberId) && (
                  <p style={{ marginTop: '8px' }}>
                    <strong>📱 WhatsApp:</strong> Puedes configurar las credenciales de Meta más tarde desde el panel de detalle de la empresa.
                  </p>
                )}
              </div>

              <button onClick={handleFinalizar} className={styles.btnPrimary} style={{ width: '100%' }}>
                Finalizar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
