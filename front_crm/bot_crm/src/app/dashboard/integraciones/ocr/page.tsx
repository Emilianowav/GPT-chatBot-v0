'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import styles from './ocr.module.css';

const OCR_API_URL = process.env.NEXT_PUBLIC_OCR_API_URL || 'http://localhost:3000';
const MP_API_URL = process.env.NEXT_PUBLIC_MP_API_URL || 'http://localhost:3001';

interface OCRDocument {
  _id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedData: {
    proveedorCuit?: string;
    proveedorRazonSocial?: string;
    tipoComprobante?: string;
    numeroComprobante?: string;
    fecha?: string;
    cae?: string;
    total?: number;
    subtotal?: number;
    iva?: number;
  };
  confidence: number;
  status: string;
  createdAt: string;
}

export default function OCRIntegrationPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'config' | 'upload' | 'documents'>('config');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [documents, setDocuments] = useState<OCRDocument[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Estados de conexión
  const [mpConnected, setMpConnected] = useState(false);
  const [afipConnected, setAfipConnected] = useState(false);
  const [checkingConnections, setCheckingConnections] = useState(true);
  
  // Configuración OCR
  const [ocrConfig, setOcrConfig] = useState({
    mpValidationEnabled: false,
    afipInvoicingEnabled: false,
    autoProcessWhatsApp: false
  });

  const empresaId = typeof window !== 'undefined' ? localStorage.getItem('empresa_id') : null;

  useEffect(() => {
    if (empresaId) {
      checkConnections();
      loadData();
      loadOCRConfig();
    }
  }, [empresaId]);

  const checkConnections = async () => {
    setCheckingConnections(true);
    try {
      // Verificar conexión MP
      const mpRes = await fetch(`${MP_API_URL}/sellers?empresaId=${empresaId}`);
      const mpData = await mpRes.json();
      setMpConnected(mpData.success && mpData.sellers && mpData.sellers.length > 0);
      
      // Verificar conexión AFIP
      const afipRes = await fetch(`${OCR_API_URL}/api/modules/afip/sellers?empresaId=${empresaId}`);
      const afipData = await afipRes.json();
      setAfipConnected(afipData.success && afipData.sellers && afipData.sellers.length > 0);
    } catch (error) {
      console.error('Error verificando conexiones:', error);
    }
    setCheckingConnections(false);
  };

  const loadOCRConfig = async () => {
    if (!empresaId) return;
    try {
      const res = await fetch(`${OCR_API_URL}/api/modules/ocr/config/${empresaId}`);
      const data = await res.json();
      if (data.success && data.config) {
        setOcrConfig(data.config);
      }
    } catch (error) {
      console.error('Error cargando configuración OCR:', error);
    }
  };

  const saveOCRConfig = async () => {
    if (!empresaId) return;
    setLoading(true);
    try {
      const res = await fetch(`${OCR_API_URL}/api/modules/ocr/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId, ...ocrConfig })
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Configuración guardada correctamente');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar la configuración');
    }
    setLoading(false);
  };

  const loadData = async () => {
    if (!empresaId) return;
    
    try {
      // Cargar documentos
      const docsRes = await fetch(`${OCR_API_URL}/api/modules/ocr/documents?empresaId=${empresaId}&limit=20`);
      const docsData = await docsRes.json();
      
      if (docsData.success) {
        setDocuments(docsData.documents);
      }
      
      // Cargar estadísticas
      const statsRes = await fetch(`${OCR_API_URL}/api/modules/ocr/stats/${empresaId}`);
      const statsData = await statsRes.json();
      
      if (statsData.success) {
        setStats(statsData.stats);
      }
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Formato de archivo no permitido. Use JPG, PNG, WEBP o PDF');
      return;
    }
    
    // Validar tamaño (10MB)
    if (file.size > 10485760) {
      alert('El archivo es demasiado grande. Máximo 10MB');
      return;
    }
    
    setSelectedFile(file);
  };

  const handleProcessImage = async () => {
    if (!selectedFile || !empresaId) {
      alert('Selecciona un archivo primero');
      return;
    }
    
    setProcessing(true);
    setExtractedData(null);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('empresaId', empresaId);
      
      const res = await fetch(`${OCR_API_URL}/api/modules/ocr/process`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (data.success) {
        setExtractedData(data.document.extractedData);
        alert(`✅ Procesamiento completado\n\nConfianza: ${data.document.confidence.toFixed(2)}%\nTiempo: ${data.document.processingTime}ms`);
        await loadData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error procesando imagen:', error);
      alert('Error al procesar la imagen');
    }
    
    setProcessing(false);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setExtractedData(null);
  };

  return (
    <DashboardLayout title="OCR - Carga de Datos por Imagen">
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
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <path d="M9 11l3 3L22 4"/>
              </svg>
            </div>
            <div>
              <h1 className={styles.title}>OCR - Carga de Datos por Imagen</h1>
              <p className={styles.subtitle}>Extrae datos de facturas y comprobantes automáticamente</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'config' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('config')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Configuración
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'upload' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Subir Imagen
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'documents' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Documentos
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {activeTab === 'config' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Configuración de Integraciones</h2>
                  <p>Conecta OCR con Mercado Pago y AFIP para automatizar procesos</p>
                </div>
              </div>

              {checkingConnections ? (
                <div className={styles.loadingState}>
                  <span className={styles.spinner}></span>
                  <p>Verificando conexiones...</p>
                </div>
              ) : (
                <>
                  {/* Estado de Conexiones */}
                  <div className={styles.connectionsGrid}>
                    <div className={`${styles.connectionCard} ${mpConnected ? styles.connectionCardConnected : ''}`}>
                      <div className={styles.connectionHeader}>
                        <div className={styles.connectionIcon}>
                          <img src="/logos tecnologias/mp-logo.png" alt="MP" width="32" height="32" />
                        </div>
                        <div className={styles.connectionInfo}>
                          <h3>Mercado Pago</h3>
                          <p>Validación de comprobantes de pago</p>
                        </div>
                        {mpConnected ? (
                          <span className={styles.badgeConnected}>✓ Conectado</span>
                        ) : (
                          <span className={styles.badgeDisconnected}>✕ No conectado</span>
                        )}
                      </div>
                      {!mpConnected && (
                        <div className={styles.connectionAlert}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          <span>Conecta Mercado Pago para validar transferencias desde WhatsApp</span>
                          <button 
                            className={styles.connectButton}
                            onClick={() => router.push('/dashboard/integraciones')}
                          >
                            Conectar MP
                          </button>
                        </div>
                      )}
                    </div>

                    <div className={`${styles.connectionCard} ${afipConnected ? styles.connectionCardConnected : ''}`}>
                      <div className={styles.connectionHeader}>
                        <div className={styles.connectionIcon} style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #264469 100%)', color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>
                          ARCA
                        </div>
                        <div className={styles.connectionInfo}>
                          <h3>ARCA</h3>
                          <p>Carga automática de facturas</p>
                        </div>
                        {afipConnected ? (
                          <span className={styles.badgeConnected}>✓ Conectado</span>
                        ) : (
                          <span className={styles.badgeDisconnected}>✕ No conectado</span>
                        )}
                      </div>
                      {!afipConnected && (
                        <div className={styles.connectionAlert}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          <span>Configura ARCA para cargar facturas automáticamente en el dashboard</span>
                          <button 
                            className={styles.connectButton}
                            onClick={() => router.push('/dashboard/integraciones/afip')}
                          >
                            Configurar ARCA
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Configuración OCR */}
                  <div className={styles.configSection}>
                    <h3>Automatizaciones OCR</h3>
                    <p className={styles.configDescription}>
                      Configura cómo OCR debe procesar los documentos según las integraciones disponibles
                    </p>

                    <div className={styles.configForm}>
                      {/* Validación MP */}
                      <div className={styles.configOption}>
                        <div className={styles.configOptionHeader}>
                          <div className={styles.configOptionInfo}>
                            <h4>💳 Validar Comprobantes de Pago (Mercado Pago)</h4>
                            <p>El chatbot de WhatsApp enviará fotos de transferencias al OCR para validar pagos</p>
                          </div>
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              checked={ocrConfig.mpValidationEnabled}
                              onChange={(e) => setOcrConfig({ ...ocrConfig, mpValidationEnabled: e.target.checked })}
                              disabled={!mpConnected}
                            />
                            <span className={styles.slider}></span>
                          </label>
                        </div>
                        {!mpConnected && (
                          <div className={styles.configWarning}>
                            ⚠️ Debes conectar Mercado Pago primero
                          </div>
                        )}
                      </div>

                      {/* Facturación ARCA */}
                      <div className={styles.configOption}>
                        <div className={styles.configOptionHeader}>
                          <div className={styles.configOptionInfo}>
                            <h4>📄 Carga Automática de Facturas (ARCA)</h4>
                            <p>Las facturas procesadas se cargarán automáticamente en el dashboard de ARCA</p>
                          </div>
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              checked={ocrConfig.afipInvoicingEnabled}
                              onChange={(e) => setOcrConfig({ ...ocrConfig, afipInvoicingEnabled: e.target.checked })}
                              disabled={!afipConnected}
                            />
                            <span className={styles.slider}></span>
                          </label>
                        </div>
                        {!afipConnected && (
                          <div className={styles.configWarning}>
                            ⚠️ Debes configurar ARCA primero
                          </div>
                        )}
                      </div>

                      {/* Auto-procesamiento WhatsApp */}
                      <div className={styles.configOption}>
                        <div className={styles.configOptionHeader}>
                          <div className={styles.configOptionInfo}>
                            <h4>🤖 Procesamiento Automático desde WhatsApp</h4>
                            <p>Procesar automáticamente imágenes enviadas por WhatsApp sin confirmación</p>
                          </div>
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              checked={ocrConfig.autoProcessWhatsApp}
                              onChange={(e) => setOcrConfig({ ...ocrConfig, autoProcessWhatsApp: e.target.checked })}
                            />
                            <span className={styles.slider}></span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Botón Guardar */}
                    <div className={styles.configActions}>
                      <button
                        className={styles.saveButton}
                        onClick={saveOCRConfig}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className={styles.spinner}></span>
                            Guardando...
                          </>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                              <polyline points="17 21 17 13 7 13 7 21"/>
                              <polyline points="7 3 7 8 15 8"/>
                            </svg>
                            Guardar Configuración
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Información de uso */}
                  <div className={styles.infoBox}>
                    <h4>💡 ¿Cómo funciona?</h4>
                    <ul>
                      <li><strong>Validación MP:</strong> Cuando un cliente envía foto de transferencia por WhatsApp, OCR extrae datos y valida el pago con Mercado Pago</li>
                      <li><strong>Carga ARCA:</strong> Las facturas procesadas se guardan automáticamente en tu dashboard de ARCA para gestión posterior</li>
                      <li><strong>Auto-proceso:</strong> El bot procesará imágenes inmediatamente sin pedir confirmación (útil para alto volumen)</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Subir Imagen</h2>
                  <p>Arrastra una imagen o selecciona un archivo para procesar</p>
                </div>
              </div>

              {/* Upload Area */}
              <div
                className={`${styles.uploadArea} ${dragActive ? styles.uploadAreaActive : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {!selectedFile ? (
                  <>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <h3>Arrastra tu imagen aquí</h3>
                    <p>o haz clic para seleccionar</p>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      onChange={handleFileInput}
                      className={styles.fileInput}
                    />
                    <small>JPG, PNG, WEBP o PDF (máx. 10MB)</small>
                  </>
                ) : (
                  <div className={styles.fileSelected}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <div className={styles.fileInfo}>
                      <h4>{selectedFile.name}</h4>
                      <p>{(selectedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <button className={styles.clearButton} onClick={handleClearFile}>
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Process Button */}
              {selectedFile && (
                <div className={styles.actions}>
                  <button
                    className={styles.processButton}
                    onClick={handleProcessImage}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <span className={styles.spinner}></span>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 11l3 3L22 4"/>
                        </svg>
                        Procesar Imagen
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Extracted Data */}
              {extractedData && (
                <div className={styles.extractedData}>
                  <h3>Datos Extraídos</h3>
                  <div className={styles.dataGrid}>
                    {extractedData.proveedorRazonSocial && (
                      <div className={styles.dataItem}>
                        <span className={styles.dataLabel}>Proveedor:</span>
                        <span className={styles.dataValue}>{extractedData.proveedorRazonSocial}</span>
                      </div>
                    )}
                    {extractedData.proveedorCuit && (
                      <div className={styles.dataItem}>
                        <span className={styles.dataLabel}>CUIT:</span>
                        <span className={styles.dataValue}>{extractedData.proveedorCuit}</span>
                      </div>
                    )}
                    {extractedData.tipoComprobante && (
                      <div className={styles.dataItem}>
                        <span className={styles.dataLabel}>Tipo:</span>
                        <span className={styles.dataValue}>{extractedData.tipoComprobante}</span>
                      </div>
                    )}
                    {extractedData.numeroComprobante && (
                      <div className={styles.dataItem}>
                        <span className={styles.dataLabel}>Número:</span>
                        <span className={styles.dataValue}>{extractedData.numeroComprobante}</span>
                      </div>
                    )}
                    {extractedData.fecha && (
                      <div className={styles.dataItem}>
                        <span className={styles.dataLabel}>Fecha:</span>
                        <span className={styles.dataValue}>{extractedData.fecha}</span>
                      </div>
                    )}
                    {extractedData.cae && (
                      <div className={styles.dataItem}>
                        <span className={styles.dataLabel}>CAE:</span>
                        <span className={styles.dataValue}>{extractedData.cae}</span>
                      </div>
                    )}
                    {extractedData.total && (
                      <div className={styles.dataItem}>
                        <span className={styles.dataLabel}>Total:</span>
                        <span className={styles.dataValue}>${extractedData.total.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Documentos Procesados</h2>
                  <p>Historial de imágenes procesadas con OCR</p>
                </div>
              </div>

              {/* Stats */}
              {stats && (
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>📄</div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{stats.totalDocuments}</span>
                      <span className={styles.statLabel}>Total Documentos</span>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{stats.completedDocuments}</span>
                      <span className={styles.statLabel}>Completados</span>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>📊</div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{stats.avgConfidence}%</span>
                      <span className={styles.statLabel}>Confianza Promedio</span>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>⚡</div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{stats.avgProcessingTime}ms</span>
                      <span className={styles.statLabel}>Tiempo Promedio</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents List */}
              <div className={styles.documentsList}>
                {documents.length === 0 ? (
                  <div className={styles.emptyState}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <p>No hay documentos procesados</p>
                    <span>Sube tu primera imagen para comenzar</span>
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div key={doc._id} className={styles.documentCard}>
                      <div className={styles.documentHeader}>
                        <div>
                          <h4>{doc.fileName}</h4>
                          <p className={styles.documentDate}>
                            {new Date(doc.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className={styles.documentConfidence}>
                          {doc.confidence.toFixed(0)}%
                        </div>
                      </div>
                      <div className={styles.documentDetails}>
                        {doc.extractedData.proveedorRazonSocial && (
                          <div className={styles.documentDetail}>
                            <span className={styles.detailLabel}>Proveedor:</span>
                            <span className={styles.detailValue}>{doc.extractedData.proveedorRazonSocial}</span>
                          </div>
                        )}
                        {doc.extractedData.numeroComprobante && (
                          <div className={styles.documentDetail}>
                            <span className={styles.detailLabel}>Número:</span>
                            <span className={styles.detailValue}>{doc.extractedData.numeroComprobante}</span>
                          </div>
                        )}
                        {doc.extractedData.total && (
                          <div className={styles.documentDetail}>
                            <span className={styles.detailLabel}>Total:</span>
                            <span className={styles.detailValue}>${doc.extractedData.total.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
