'use client';

// 📊 Modal de Detalle y Edición de Empresa
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { EmpresaDetalle } from '@/types';
import styles from './empresa-detail.module.css';

interface EmpresaDetailModalProps {
  isOpen: boolean;
  empresaId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EmpresaDetailModal({ isOpen, empresaId, onClose, onUpdate }: EmpresaDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'limites' | 'whatsapp' | 'config'>('info');
  const [empresa, setEmpresa] = useState<EmpresaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    plan: '',
    estadoFacturacion: '',
    limitesMensajes: 0,
    limiteUsuarios: 0,
    limiteAlmacenamiento: 0,
    limiteIntegraciones: 0,
    limiteExportaciones: 0,
    limiteAgentes: 0,
    maxUsuarios: 0,
    maxAdmins: 0,
  });

  const [metaConfig, setMetaConfig] = useState({
    phoneNumberId: '',
    accessToken: '',
    businessAccountId: '',
    appId: '',
    appSecret: '',
  });

  useEffect(() => {
    if (isOpen && empresaId) {
      cargarEmpresa();
    }
  }, [isOpen, empresaId]);

  const cargarEmpresa = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.superAdminGetEmpresaDetalle(empresaId);
      if (response.success && response.empresa) {
        const emp = response.empresa as unknown as EmpresaDetalle;
        setEmpresa(emp);
        setFormData({
          plan: emp.plan,
          estadoFacturacion: emp.facturacion.estado,
          limitesMensajes: emp.limites.mensajesMensuales,
          limiteUsuarios: emp.limites.usuariosActivos,
          limiteAlmacenamiento: emp.limites.almacenamiento,
          limiteIntegraciones: emp.limites.integraciones,
          limiteExportaciones: emp.limites.exportacionesMensuales,
          limiteAgentes: emp.limites.agentesSimultaneos,
          maxUsuarios: emp.limites.maxUsuarios,
          maxAdmins: emp.limites.maxAdmins,
        });
        setMetaConfig({
          phoneNumberId: emp.phoneNumberId || '',
          accessToken: emp.accessToken || '',
          businessAccountId: emp.businessAccountId || '',
          appId: emp.appId || '',
          appSecret: emp.appSecret || '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Aquí iría la llamada al API para actualizar la empresa
      // Por ahora solo simulamos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Cambios guardados exitosamente');
      setEditMode(false);
      onUpdate();
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleGuardarMeta = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Aquí iría la llamada al API para actualizar las credenciales de Meta
      // Por ahora solo simulamos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Credenciales de WhatsApp guardadas exitosamente');
      setEditMode(false);
      onUpdate();
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar credenciales');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    try {
      setDeleting(true);
      setError('');

      const response = await apiClient.superAdminEliminarEmpresa(empresaId);
      
      if (response.success) {
        setSuccess('Empresa eliminada exitosamente');
        setShowDeleteConfirm(false);
        
        // Actualizar la lista antes de cerrar
        await onUpdate();
        
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(response.message || 'Error al eliminar empresa');
        setShowDeleteConfirm(false);
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar empresa');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  const getPorcentaje = (usado: number, limite: number) => {
    return limite > 0 ? Math.min((usado / limite) * 100, 100).toFixed(1) : '0';
  };

  const getProgressClass = (porcentaje: number) => {
    if (porcentaje > 80) return styles.progressRed;
    if (porcentaje > 60) return styles.progressOrange;
    return styles.progressGreen;
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>🏢</div>
            <div className={styles.headerTitle}>
              <h2>{empresa?.nombre || empresaId}</h2>
              <p>Gestión y configuración de empresa</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <button 
              onClick={() => setShowDeleteConfirm(true)} 
              className={styles.closeBtn}
              style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.5)', marginRight: '8px' }}
              title="Eliminar empresa"
            >
              🗑️
            </button>
            <button onClick={onClose} className={styles.closeBtn}>×</button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.content}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'info' ? styles.active : ''}`}
              onClick={() => setActiveTab('info')}
            >
              📊 Información
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'limites' ? styles.active : ''}`}
              onClick={() => setActiveTab('limites')}
            >
              ⚙️ Límites y Plan
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'whatsapp' ? styles.active : ''}`}
              onClick={() => setActiveTab('whatsapp')}
            >
              📱 WhatsApp
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'config' ? styles.active : ''}`}
              onClick={() => setActiveTab('config')}
            >
              🔧 Configuración
            </button>
          </div>

          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Cargando información...</p>
            </div>
          ) : error && !empresa ? (
            <div className={`${styles.alert} ${styles.alertError}`}>
              <span className={styles.alertIcon}>⚠️</span>
              <div className={styles.alertContent}>
                <p>{error}</p>
              </div>
            </div>
          ) : empresa ? (
            <>
              {success && (
                <div className={`${styles.alert} ${styles.alertSuccess}`}>
                  <span className={styles.alertIcon}>✅</span>
                  <div className={styles.alertContent}>
                    <p>{success}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className={`${styles.alert} ${styles.alertError}`}>
                  <span className={styles.alertIcon}>⚠️</span>
                  <div className={styles.alertContent}>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {/* Tab: Información */}
              {activeTab === 'info' && (
                <>
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>📋 Datos Generales</h3>
                    <div className={styles.infoGrid}>
                      <div className={styles.infoCard}>
                        <div className={styles.infoLabel}>Nombre</div>
                        <div className={styles.infoValue}>{empresa.nombre}</div>
                      </div>
                      <div className={styles.infoCard}>
                        <div className={styles.infoLabel}>Email</div>
                        <div className={styles.infoValue}>{empresa.email}</div>
                      </div>
                      <div className={styles.infoCard}>
                        <div className={styles.infoLabel}>Teléfono</div>
                        <div className={styles.infoValue}>{empresa.telefono}</div>
                      </div>
                      <div className={styles.infoCard}>
                        <div className={styles.infoLabel}>Categoría</div>
                        <div className={styles.infoValue}>{empresa.categoria}</div>
                      </div>
                      <div className={styles.infoCard}>
                        <div className={styles.infoLabel}>Plan</div>
                        <div className={styles.infoValue}>{empresa.plan}</div>
                      </div>
                      <div className={styles.infoCard}>
                        <div className={styles.infoLabel}>Estado</div>
                        <div className={styles.infoValue}>
                          <span className={`${styles.badge} ${
                            empresa.facturacion.estado === 'activo' ? styles.badgeActivo :
                            empresa.facturacion.estado === 'suspendido' ? styles.badgeSuspendido :
                            styles.badgePrueba
                          }`}>
                            {empresa.facturacion.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>📈 Métricas de Uso</h3>
                    <div className={styles.statsGrid}>
                      <div className={styles.statCard}>
                        <h4>Mensajes Este Mes</h4>
                        <p>{empresa.uso.mensajesEsteMes.toLocaleString()}</p>
                        <span>de {empresa.limites.mensajesMensuales.toLocaleString()}</span>
                      </div>
                      <div className={styles.statCard}>
                        <h4>Usuarios Activos</h4>
                        <p>{empresa.uso.usuariosActivos}</p>
                        <span>de {empresa.limites.usuariosActivos}</span>
                      </div>
                      <div className={styles.statCard}>
                        <h4>Total Clientes</h4>
                        <p>{empresa.metricas.totalClientes}</p>
                        <span>registrados</span>
                      </div>
                      <div className={styles.statCard}>
                        <h4>Staff</h4>
                        <p>{empresa.metricas.totalStaff}</p>
                        <span>usuarios internos</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>📊 Progreso de Uso</h3>
                    <div className={styles.progressSection}>
                      <div className={styles.progressItem}>
                        <div className={styles.progressHeader}>
                          <span className={styles.progressLabel}>Mensajes Mensuales</span>
                          <span className={styles.progressValue}>
                            {empresa.uso.mensajesEsteMes.toLocaleString()} / {empresa.limites.mensajesMensuales.toLocaleString()} ({empresa.metricas.porcentajeUsoMensajes})
                          </span>
                        </div>
                        <div className={styles.progressBar}>
                          <div
                            className={`${styles.progressFill} ${getProgressClass(parseFloat(empresa.metricas.porcentajeUsoMensajes))}`}
                            style={{ width: empresa.metricas.porcentajeUsoMensajes }}
                          />
                        </div>
                      </div>

                      <div className={styles.progressItem}>
                        <div className={styles.progressHeader}>
                          <span className={styles.progressLabel}>Usuarios Activos</span>
                          <span className={styles.progressValue}>
                            {empresa.uso.usuariosActivos} / {empresa.limites.usuariosActivos} ({empresa.metricas.porcentajeUsoUsuarios})
                          </span>
                        </div>
                        <div className={styles.progressBar}>
                          <div
                            className={`${styles.progressFill} ${getProgressClass(parseFloat(empresa.metricas.porcentajeUsoUsuarios))}`}
                            style={{ width: empresa.metricas.porcentajeUsoUsuarios }}
                          />
                        </div>
                      </div>

                      <div className={styles.progressItem}>
                        <div className={styles.progressHeader}>
                          <span className={styles.progressLabel}>Almacenamiento</span>
                          <span className={styles.progressValue}>
                            {empresa.uso.almacenamientoUsado} MB / {empresa.limites.almacenamiento} MB
                          </span>
                        </div>
                        <div className={styles.progressBar}>
                          <div
                            className={`${styles.progressFill} ${getProgressClass((empresa.uso.almacenamientoUsado / empresa.limites.almacenamiento) * 100)}`}
                            style={{ width: `${getPorcentaje(empresa.uso.almacenamientoUsado, empresa.limites.almacenamiento)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {empresa.alertas && empresa.alertas.length > 0 && (
                    <div className={styles.section}>
                      <h3 className={styles.sectionTitle}>⚠️ Alertas</h3>
                      {empresa.alertas.map((alerta, index) => (
                        <div key={index} className={`${styles.alert} ${
                          alerta.tipo === 'error' ? styles.alertError :
                          alerta.tipo === 'warning' ? styles.alertWarning :
                          styles.alertSuccess
                        }`}>
                          <span className={styles.alertIcon}>
                            {alerta.tipo === 'error' ? '🚨' : alerta.tipo === 'warning' ? '⚠️' : 'ℹ️'}
                          </span>
                          <div className={styles.alertContent}>
                            <p>{alerta.mensaje}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Tab: Límites y Plan */}
              {activeTab === 'limites' && (
                <>
                  <div className={styles.section}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 className={styles.sectionTitle}>⚙️ Configuración de Límites</h3>
                      {!editMode && (
                        <button onClick={() => setEditMode(true)} className={styles.btnPrimary} style={{ flex: 'none', width: 'auto' }}>
                          ✏️ Editar
                        </button>
                      )}
                    </div>

                    <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleGuardar(); }}>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>Plan</label>
                          <select
                            value={formData.plan}
                            onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                            disabled={!editMode}
                          >
                            <option value="basico">Básico</option>
                            <option value="standard">Standard</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </div>

                        <div className={styles.formGroup}>
                          <label>Estado de Facturación</label>
                          <select
                            value={formData.estadoFacturacion}
                            onChange={(e) => setFormData({ ...formData, estadoFacturacion: e.target.value })}
                            disabled={!editMode}
                          >
                            <option value="activo">Activo</option>
                            <option value="suspendido">Suspendido</option>
                            <option value="prueba">Prueba</option>
                          </select>
                        </div>
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>💬 Límite Mensajes Mensuales</label>
                          <input
                            type="number"
                            value={formData.limitesMensajes}
                            onChange={(e) => setFormData({ ...formData, limitesMensajes: parseInt(e.target.value) || 0 })}
                            disabled={!editMode}
                            min="0"
                          />
                          <span className={styles.hint}>Cantidad máxima de mensajes por mes</span>
                        </div>

                        <div className={styles.formGroup}>
                          <label>👥 Límite Usuarios Activos</label>
                          <input
                            type="number"
                            value={formData.limiteUsuarios}
                            onChange={(e) => setFormData({ ...formData, limiteUsuarios: parseInt(e.target.value) || 0 })}
                            disabled={!editMode}
                            min="0"
                          />
                          <span className={styles.hint}>Usuarios simultáneos permitidos</span>
                        </div>
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>💾 Límite Almacenamiento (MB)</label>
                          <input
                            type="number"
                            value={formData.limiteAlmacenamiento}
                            onChange={(e) => setFormData({ ...formData, limiteAlmacenamiento: parseInt(e.target.value) || 0 })}
                            disabled={!editMode}
                            min="0"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>🔌 Límite Integraciones</label>
                          <input
                            type="number"
                            value={formData.limiteIntegraciones}
                            onChange={(e) => setFormData({ ...formData, limiteIntegraciones: parseInt(e.target.value) || 0 })}
                            disabled={!editMode}
                            min="0"
                          />
                        </div>
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>📥 Exportaciones Mensuales</label>
                          <input
                            type="number"
                            value={formData.limiteExportaciones}
                            onChange={(e) => setFormData({ ...formData, limiteExportaciones: parseInt(e.target.value) || 0 })}
                            disabled={!editMode}
                            min="0"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>👤 Agentes Simultáneos</label>
                          <input
                            type="number"
                            value={formData.limiteAgentes}
                            onChange={(e) => setFormData({ ...formData, limiteAgentes: parseInt(e.target.value) || 0 })}
                            disabled={!editMode}
                            min="0"
                          />
                        </div>
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>👥 Máximo Usuarios Totales</label>
                          <input
                            type="number"
                            value={formData.maxUsuarios}
                            onChange={(e) => setFormData({ ...formData, maxUsuarios: parseInt(e.target.value) || 0 })}
                            disabled={!editMode}
                            min="0"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>👨‍💼 Máximo Administradores</label>
                          <input
                            type="number"
                            value={formData.maxAdmins}
                            onChange={(e) => setFormData({ ...formData, maxAdmins: parseInt(e.target.value) || 0 })}
                            disabled={!editMode}
                            min="0"
                          />
                        </div>
                      </div>

                      {editMode && (
                        <div className={styles.actions}>
                          <button type="button" onClick={() => setEditMode(false)} className={styles.btnSecondary} disabled={saving}>
                            Cancelar
                          </button>
                          <button type="submit" className={styles.btnPrimary} disabled={saving}>
                            {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                          </button>
                        </div>
                      )}
                    </form>
                  </div>
                </>
              )}

              {/* Tab: WhatsApp (Meta API) */}
              {activeTab === 'whatsapp' && (
                <>
                  <div className={styles.section}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 className={styles.sectionTitle}>📱 Configuración de WhatsApp Business</h3>
                      {!editMode && (
                        <button onClick={() => setEditMode(true)} className={styles.btnPrimary} style={{ flex: 'none', width: 'auto' }}>
                          ✏️ Editar
                        </button>
                      )}
                    </div>

                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '20px' }}>
                      Configura las credenciales de la API de Meta para conectar WhatsApp Business con esta empresa.
                    </p>

                    <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleGuardarMeta(); }}>
                      <div className={styles.formGroup}>
                        <label>📱 Phone Number ID</label>
                        <input
                          type="text"
                          value={metaConfig.phoneNumberId}
                          onChange={(e) => setMetaConfig({ ...metaConfig, phoneNumberId: e.target.value })}
                          disabled={!editMode}
                          placeholder="888481464341184"
                        />
                        <span className={styles.hint}>ID del número de teléfono de WhatsApp Business</span>
                      </div>

                      <div className={styles.formGroup}>
                        <label>🔑 META_WHATSAPP_TOKEN</label>
                        <input
                          type="password"
                          value={metaConfig.accessToken}
                          onChange={(e) => setMetaConfig({ ...metaConfig, accessToken: e.target.value })}
                          disabled={!editMode}
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
                            disabled={!editMode}
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
                            disabled={!editMode}
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
                          disabled={!editMode}
                          placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        />
                        <span className={styles.hint}>Secret de la aplicación de Meta</span>
                      </div>

                      <div className={`${styles.alert} ${styles.alertWarning}`}>
                        <span className={styles.alertIcon}>💡</span>
                        <div className={styles.alertContent}>
                          <p>Dónde encontrar estas credenciales:</p>
                          <div style={{ fontSize: '12px', marginTop: '8px', color: 'rgba(255, 255, 255, 0.8)' }}>
                            1. Ve a <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#fb923c' }}>Meta for Developers</a><br/>
                            2. Selecciona tu app de WhatsApp Business<br/>
                            3. En el panel, encontrarás el Phone Number ID, App ID y App Secret<br/>
                            4. Genera un Access Token permanente desde la configuración de la app
                          </div>
                        </div>
                      </div>

                      {editMode && (
                        <div className={styles.actions}>
                          <button type="button" onClick={() => setEditMode(false)} className={styles.btnSecondary} disabled={saving}>
                            Cancelar
                          </button>
                          <button type="submit" className={styles.btnPrimary} disabled={saving}>
                            {saving ? 'Guardando...' : '💾 Guardar Credenciales'}
                          </button>
                        </div>
                      )}
                    </form>
                  </div>
                </>
              )}

              {/* Tab: Configuración */}
              {activeTab === 'config' && (
                <>
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>🔧 Configuración Avanzada</h3>
                    <div className={styles.infoGrid}>
                      <div className={styles.infoCard}>
                        <div className={styles.infoLabel}>Modelo IA</div>
                        <div className={styles.infoValue}>{empresa.modelo}</div>
                      </div>
                      <div className={styles.infoCard}>
                        <div className={styles.infoLabel}>WhatsApp</div>
                        <div className={styles.infoValue}>
                          {empresa.metricas.whatsappConectado ? '✅ Conectado' : '❌ Desconectado'}
                        </div>
                      </div>
                      <div className={styles.infoCard}>
                        <div className={styles.infoLabel}>Fecha Creación</div>
                        <div className={styles.infoValue}>
                          {new Date(empresa.fechaCreacion).toLocaleDateString('es-AR')}
                        </div>
                      </div>
                      <div className={styles.infoCard}>
                        <div className={styles.infoLabel}>Última Actualización</div>
                        <div className={styles.infoValue}>
                          {new Date(empresa.fechaActualizacion).toLocaleDateString('es-AR')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>🎯 Módulos Activos</h3>
                    <div className={styles.infoGrid}>
                      {empresa.modulos.map((modulo) => (
                        <div key={modulo.id} className={styles.infoCard}>
                          <div className={styles.infoLabel}>{modulo.nombre}</div>
                          <div className={styles.infoValue}>
                            {modulo.activo ? '✅ Activo' : '❌ Inactivo'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>💳 Facturación</h3>
                    <div className={styles.infoGrid}>
                      <div className={styles.infoCard}>
                        <div className={styles.infoLabel}>Estado</div>
                        <div className={styles.infoValue}>
                          <span className={`${styles.badge} ${
                            empresa.facturacion.estado === 'activo' ? styles.badgeActivo :
                            empresa.facturacion.estado === 'suspendido' ? styles.badgeSuspendido :
                            styles.badgePrueba
                          }`}>
                            {empresa.facturacion.estado}
                          </span>
                        </div>
                      </div>
                      {empresa.facturacion.metodoPago && (
                        <div className={styles.infoCard}>
                          <div className={styles.infoLabel}>Método de Pago</div>
                          <div className={styles.infoValue}>{empresa.facturacion.metodoPago}</div>
                        </div>
                      )}
                      {empresa.facturacion.ultimoPago && (
                        <div className={styles.infoCard}>
                          <div className={styles.infoLabel}>Último Pago</div>
                          <div className={styles.infoValue}>
                            {new Date(empresa.facturacion.ultimoPago).toLocaleDateString('es-AR')}
                          </div>
                        </div>
                      )}
                      {empresa.facturacion.proximoPago && (
                        <div className={styles.infoCard}>
                          <div className={styles.infoLabel}>Próximo Pago</div>
                          <div className={styles.infoValue}>
                            {new Date(empresa.facturacion.proximoPago).toLocaleDateString('es-AR')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirm && (
        <div className={styles.overlay} style={{ zIndex: 1100 }} onClick={(e) => e.target === e.currentTarget && setShowDeleteConfirm(false)}>
          <div className={styles.modal} style={{ maxWidth: '500px' }}>
            <div className={styles.header} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' }}>
              <div className={styles.headerLeft}>
                <div className={styles.headerIcon}>⚠️</div>
                <div className={styles.headerTitle}>
                  <h2>Eliminar Empresa</h2>
                  <p>Esta acción no se puede deshacer</p>
                </div>
              </div>
              <button onClick={() => setShowDeleteConfirm(false)} className={styles.closeBtn}>×</button>
            </div>
            <div className={styles.content}>
              <div className={`${styles.alert} ${styles.alertError}`}>
                <span className={styles.alertIcon}>🚨</span>
                <div className={styles.alertContent}>
                  <p>¿Estás seguro que deseas eliminar esta empresa?</p>
                </div>
              </div>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', marginBottom: '16px' }}>
                Se eliminará permanentemente:
              </p>
              <ul style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '24px', paddingLeft: '20px' }}>
                <li>Todos los datos de la empresa</li>
                <li>Todos los usuarios y administradores</li>
                <li>Todas las conversaciones y mensajes</li>
                <li>Toda la configuración y módulos</li>
              </ul>
              <p style={{ color: '#f87171', fontSize: '14px', fontWeight: 600, marginBottom: '24px' }}>
                Esta acción es irreversible. La empresa "{empresa?.nombre}" será eliminada permanentemente.
              </p>
              <div className={styles.actions}>
                <button onClick={() => setShowDeleteConfirm(false)} className={styles.btnSecondary} disabled={deleting}>
                  Cancelar
                </button>
                <button onClick={handleEliminar} className={styles.btnDanger} disabled={deleting}>
                  {deleting ? 'Eliminando...' : '🗑️ Eliminar Empresa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
