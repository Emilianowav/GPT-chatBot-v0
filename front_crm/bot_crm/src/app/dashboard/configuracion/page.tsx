'use client';

// ⚙️ Página de Configuración
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { apiClient } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import styles from './configuracion.module.css';

export default function ConfiguracionPage() {
  const { isAuthenticated, empresa, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [empresaData, setEmpresaData] = useState<any>(null);

  const loadEmpresa = async () => {
    if (!empresa) return;
    
    try {
      setLoading(true);
      const data = await apiClient.getEmpresa(empresa.empresaId);
      setEmpresaData(data.empresa);
    } catch (error) {
      console.error('Error al cargar empresa:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated && empresa) {
      loadEmpresa();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading, empresa, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresa) return;

    try {
      setSaving(true);
      setMessage('');
      
      await apiClient.updateEmpresa(empresa.empresaId, {
        email: empresaData.email,
        modelo: empresaData.modelo,
        prompt: empresaData.prompt,
        saludos: empresaData.saludos
      });

      setMessage('✅ Configuración guardada exitosamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Error al guardar la configuración');
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <DashboardLayout title="Configuración">
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando configuración...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Configuración">
      <div className={styles.container}>
        {message && (
          <div className={`${styles.message} ${message.includes('❌') ? styles.error : styles.success}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Apariencia */}
          <div className={styles.section}>
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"/>
                <path d="M14.5 11.5c-.83.83-2.17.83-3 0"/>
              </svg>
              Apariencia
            </h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Modo de Visualización</label>
                <div className={styles.themeToggle}>
                  <button
                    type="button"
                    className={`${styles.themeButton} ${theme === 'light' ? styles.active : ''}`}
                    onClick={() => theme === 'dark' && toggleTheme()}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px'}}>
                      <circle cx="12" cy="12" r="5"/>
                      <line x1="12" y1="1" x2="12" y2="3"/>
                      <line x1="12" y1="21" x2="12" y2="23"/>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                      <line x1="1" y1="12" x2="3" y2="12"/>
                      <line x1="21" y1="12" x2="23" y2="12"/>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                    Claro
                  </button>
                  <button
                    type="button"
                    className={`${styles.themeButton} ${theme === 'dark' ? styles.active : ''}`}
                    onClick={() => theme === 'light' && toggleTheme()}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px'}}>
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                    Oscuro
                  </button>
                </div>
                <span className={styles.helpText}>
                  Cambia entre modo claro y oscuro
                </span>
              </div>
            </div>
          </div>

          {/* Información General */}
          <div className={styles.section}>
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Información General
            </h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nombre de la Empresa</label>
                <input
                  type="text"
                  value={empresaData?.nombre || ''}
                  disabled
                  className={styles.inputDisabled}
                />
                <span className={styles.helpText}>No se puede modificar</span>
              </div>

              <div className={styles.formGroup}>
                <label>Categoría</label>
                <input
                  type="text"
                  value={empresaData?.categoria || ''}
                  disabled
                  className={styles.inputDisabled}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Teléfono</label>
                <input
                  type="text"
                  value={empresaData?.telefono || ''}
                  disabled
                  className={styles.inputDisabled}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email de Contacto</label>
                <input
                  type="email"
                  value={empresaData?.email || ''}
                  onChange={(e) => setEmpresaData({ ...empresaData, email: e.target.value })}
                  placeholder="contacto@empresa.com"
                />
                <span className={styles.helpText}>Para recibir notificaciones</span>
              </div>
            </div>
          </div>

          {/* Configuración de IA */}
          <div className={styles.section}>
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}}>
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              Configuración de IA
            </h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Modelo de OpenAI</label>
                <select
                  value={empresaData?.modelo || 'gpt-3.5-turbo'}
                  onChange={(e) => setEmpresaData({ ...empresaData, modelo: e.target.value })}
                >
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Rápido y económico)</option>
                  <option value="gpt-4">GPT-4 (Más preciso)</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo (Balance)</option>
                </select>
                <span className={styles.helpText}>
                  GPT-4 es más costoso pero más preciso
                </span>
              </div>

              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Prompt del Sistema</label>
                <textarea
                  value={empresaData?.prompt || ''}
                  onChange={(e) => setEmpresaData({ ...empresaData, prompt: e.target.value })}
                  rows={6}
                  placeholder="Instrucciones para el asistente de IA..."
                />
                <span className={styles.helpText}>
                  Define cómo debe comportarse el asistente
                </span>
              </div>

              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Saludos Personalizados</label>
                <textarea
                  value={empresaData?.saludos?.join('\n') || ''}
                  onChange={(e) => setEmpresaData({ 
                    ...empresaData, 
                    saludos: e.target.value.split('\n').filter(s => s.trim()) 
                  })}
                  rows={4}
                  placeholder="Hola, ¿en qué puedo ayudarte?&#10;¡Bienvenido! ¿Cómo estás?"
                />
                <span className={styles.helpText}>
                  Un saludo por línea. Se elegirá uno al azar
                </span>
              </div>
            </div>
          </div>

          {/* Catálogo */}
          <div className={styles.section}>
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}}>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
              Catálogo de Productos/Servicios
            </h2>
            <div className={styles.catalogInfo}>
              <p><strong>Archivo actual:</strong> {empresaData?.catalogoPath || 'No configurado'}</p>
              {empresaData?.linkCatalogo && (
                <p>
                  <strong>Link:</strong>{' '}
                  <a href={empresaData.linkCatalogo} target="_blank" rel="noopener noreferrer">
                    Ver catálogo
                  </a>
                </p>
              )}
              <p className={styles.helpText}>
                Para actualizar el catálogo, contacta al administrador del sistema
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className={styles.actions}>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={() => loadEmpresa()}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className={styles.saveButton}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
