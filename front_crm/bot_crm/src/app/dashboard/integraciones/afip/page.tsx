'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import AFIPFieldHelp from '@/components/integrations/AFIPFieldHelp';
import { generateAFIPCertificate, downloadFile } from '@/utils/certificateGenerator';
import styles from './afip.module.css';

const AFIP_API_URL = process.env.NEXT_PUBLIC_AFIP_API_URL || 'http://localhost:3000';

interface AFIPSeller {
  _id: string;
  empresaId: string;
  cuit: string;
  razonSocial: string;
  puntoVenta: number;
  environment: 'testing' | 'production';
  activo: boolean;
  tipoComprobanteDefault?: number;
  conceptoDefault?: number;
  totalFacturas: number;
  totalNotasCredito: number;
  totalNotasDebito: number;
  tokenExpiration?: string;
  createdAt: string;
}

interface Invoice {
  _id: string;
  tipoComprobante: number;
  tipoComprobanteLabel: string;
  puntoVenta: number;
  numero: number;
  numeroCompleto: string;
  fecha: string;
  clienteTipoDoc?: string;
  clienteNroDoc?: string;
  clienteRazonSocial?: string;
  concepto?: string;
  importeNeto?: number;
  importeIVA?: number;
  importeTotal: number;
  cae?: string;
  caeVencimiento?: string;
  resultado: 'A' | 'R' | 'P';
  observaciones?: string;
  environment?: 'testing' | 'production';
  createdAt: string;
}

export default function AFIPIntegrationPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'facturas' | 'crear' | 'nota-credito' | 'config'>('facturas');
  const [loading, setLoading] = useState(false);
  const [sellers, setSellers] = useState<AFIPSeller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<AFIPSeller | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [availablePuntosVenta, setAvailablePuntosVenta] = useState<number[]>([]);
  const [loadingPuntosVenta, setLoadingPuntosVenta] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configStep, setConfigStep] = useState<'initial' | 'generate' | 'upload'>('initial');
  const [generatedKeys, setGeneratedKeys] = useState<{ privateKey: string; csr: string } | null>(null);
  
  // Form de configuración
  const [configForm, setConfigForm] = useState({
    cuit: '',
    razonSocial: '',
    puntoVenta: '1',
    certificado: '',
    clavePrivada: '',
    environment: 'production' as 'testing' | 'production'
  });
  
  // Form de factura
  const [invoiceForm, setInvoiceForm] = useState({
    sellerId: '',
    tipoComprobante: '11', // Factura C por defecto
    concepto: '1',
    clienteTipoDoc: '99',
    clienteNroDoc: '0',
    clienteRazonSocial: '',
    importeTotal: '',
    importeNeto: '',
    importeIVA: '0',
    fechaDesde: new Date().toISOString().split('T')[0],
    fechaHasta: new Date().toISOString().split('T')[0]
  });

  // Form de nota de crédito
  const [creditNoteForm, setCreditNoteForm] = useState({
    facturaId: '',
    motivo: '',
    tipo: 'total' as 'total' | 'parcial',
    importeTotal: '',
    importeNeto: '',
    importeIVA: '0'
  });

  const empresaId = typeof window !== 'undefined' ? localStorage.getItem('empresa_id') : null;

  useEffect(() => {
    if (empresaId) {
      loadData();
    }
  }, [empresaId]);

  const loadData = async () => {
    if (!empresaId) return;
    
    try {
      // Cargar todos los sellers (CUITs registrados)
      const sellerRes = await fetch(`${AFIP_API_URL}/api/modules/afip/sellers?empresaId=${empresaId}`);
      const sellerData = await sellerRes.json();
      
      if (sellerData.success && sellerData.sellers) {
        setSellers(sellerData.sellers);
        if (sellerData.sellers.length > 0) {
          setSelectedSeller(sellerData.sellers[0]);
          setInvoiceForm(prev => ({ ...prev, sellerId: sellerData.sellers[0]._id }));
        }
      }
      
      // Cargar facturas
      const invoicesRes = await fetch(`${AFIP_API_URL}/api/modules/afip/invoices?empresaId=${empresaId}&limit=20`);
      const invoicesData = await invoicesRes.json();
      
      if (invoicesData.success) {
        setInvoices(invoicesData.invoices);
      }
      
      // Cargar estadísticas
      const statsRes = await fetch(`${AFIP_API_URL}/api/modules/afip/invoices/stats/${empresaId}`);
      const statsData = await statsRes.json();
      
      if (statsData.success) {
        setStats(statsData.stats);
      }
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!empresaId) {
      alert('No se encontró el ID de empresa');
      return;
    }
    
    if (!configForm.certificado || !configForm.clavePrivada) {
      alert('Debes subir el certificado y la clave privada');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch(`${AFIP_API_URL}/api/modules/afip/sellers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId,
          cuit: configForm.cuit,
          razonSocial: configForm.razonSocial,
          puntoVenta: parseInt(configForm.puntoVenta),
          certificado: configForm.certificado,
          clavePrivada: configForm.clavePrivada,
          environment: configForm.environment
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('✅ CUIT registrado exitosamente');
        await loadData();
        
        // Cerrar modal y limpiar formulario
        setShowConfigModal(false);
        setConfigForm({
          cuit: '',
          razonSocial: '',
          puntoVenta: '1',
          certificado: '',
          clavePrivada: '',
          environment: 'testing'
        });
        
        // Cargar puntos de venta disponibles después de guardar
        if (data.seller && data.seller._id) {
          await fetchAvailablePuntosVenta(data.seller._id);
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar la configuración');
    }
    
    setLoading(false);
  };

  const handleGenerateCertificate = async () => {
    if (!configForm.cuit || !configForm.razonSocial) {
      alert('Por favor completa CUIT y Razón Social');
      return;
    }

    setLoading(true);
    try {
      const keys = await generateAFIPCertificate({
        cuit: configForm.cuit,
        razonSocial: configForm.razonSocial,
      });

      setGeneratedKeys(keys);
      setConfigStep('generate');
      alert('✅ Claves generadas exitosamente. Descarga los archivos y sigue las instrucciones.');
    } catch (error: any) {
      console.error('Error generando certificado:', error);
      alert('Error al generar el certificado: ' + error.message);
    }
    setLoading(false);
  };

  const handleDownloadPrivateKey = () => {
    if (!generatedKeys) return;
    downloadFile(generatedKeys.privateKey, `${configForm.cuit}_private.key`, 'application/x-pem-file');
  };

  const handleDownloadCSR = () => {
    if (!generatedKeys) return;
    downloadFile(generatedKeys.csr, `${configForm.cuit}_request.csr`, 'application/pkcs10');
  };

  const handleTestAuth = async () => {
    if (!selectedSeller) {
      alert('Primero debes guardar la configuración');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch(`${AFIP_API_URL}/api/modules/afip/sellers/${selectedSeller._id}/test-auth`, {
        method: 'POST'
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('✅ Autenticación exitosa con AFIP');
        await loadData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error en test de autenticación:', error);
      alert('Error al autenticar con AFIP');
    }
    
    setLoading(false);
  };

  const handleCheckPuntosVenta = async () => {
    if (!selectedSeller) {
      alert('Primero debes guardar la configuración');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch(`${AFIP_API_URL}/api/modules/afip/sellers/${selectedSeller._id}/puntos-venta`);
      const data = await res.json();
      
      if (data.success) {
        // Actualizar el estado con los puntos de venta disponibles
        setAvailablePuntosVenta(data.puntosVenta);
        
        const puntosVentaList = data.puntosVenta.join(', ');
        const esValido = data.esValido ? '✅' : '❌';
        
        if (data.puntosVenta.length === 0) {
          alert('⚠️ No se encontraron puntos de venta en AFIP. Debes crear al menos un punto de venta tipo "Web Services" en el portal de AFIP.');
        } else {
          alert(
            `📊 Puntos de Venta Disponibles en AFIP:\n\n` +
            `Puntos de venta: ${puntosVentaList}\n\n` +
            `Punto de venta actual: ${data.puntoVentaActual} ${esValido}\n\n` +
            (data.esValido 
              ? 'Tu punto de venta es válido ✅' 
              : '⚠️ Tu punto de venta NO existe en AFIP. Debes cambiarlo a uno de los disponibles.')
          );
          
          // Si el punto de venta actual no es válido, seleccionar el primero disponible
          if (!data.esValido && data.puntosVenta.length > 0) {
            setConfigForm(prev => ({
              ...prev,
              puntoVenta: data.puntosVenta[0].toString()
            }));
          }
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error consultando puntos de venta:', error);
      alert('Error al consultar puntos de venta en AFIP');
    }
    
    setLoading(false);
  };

  const fetchAvailablePuntosVenta = async (sellerId: string) => {
    setLoadingPuntosVenta(true);
    try {
      const res = await fetch(`${AFIP_API_URL}/api/modules/afip/sellers/${sellerId}/puntos-venta`);
      const data = await res.json();
      
      if (data.success) {
        setAvailablePuntosVenta(data.puntosVenta);
        
        if (data.puntosVenta.length === 0) {
          alert('⚠️ No se encontraron puntos de venta en AFIP. Debes crear al menos un punto de venta tipo "Web Services" en el portal de AFIP.');
        } else if (!data.esValido) {
          // Si el punto de venta actual no es válido, seleccionar el primero disponible
          setConfigForm(prev => ({
            ...prev,
            puntoVenta: data.puntosVenta[0].toString()
          }));
        }
      }
    } catch (error: any) {
      console.error('Error obteniendo puntos de venta:', error);
    } finally {
      setLoadingPuntosVenta(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!empresaId) {
      alert('No se encontró el ID de empresa');
      return;
    }
    
    if (!selectedSeller) {
      alert('Primero debes configurar AFIP');
      return;
    }
    
    const importeTotal = parseFloat(invoiceForm.importeTotal);
    const importeNeto = parseFloat(invoiceForm.importeNeto || invoiceForm.importeTotal);
    const importeIVA = parseFloat(invoiceForm.importeIVA);
    
    if (isNaN(importeTotal) || importeTotal <= 0) {
      alert('El importe total debe ser mayor a 0');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch(`${AFIP_API_URL}/api/modules/afip/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId,
          invoiceData: {
            tipoComprobante: parseInt(invoiceForm.tipoComprobante),
            concepto: parseInt(invoiceForm.concepto),
            clienteTipoDoc: parseInt(invoiceForm.clienteTipoDoc),
            clienteNroDoc: parseInt(invoiceForm.clienteNroDoc),
            clienteRazonSocial: invoiceForm.clienteRazonSocial || undefined,
            importeTotal,
            importeNeto,
            importeIVA,
            importeExento: 0
          }
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        const warningMsg = data.isTestingMode 
          ? '\n\n⚠️ MODO TESTING: Este comprobante fue emitido en homologación. NO es válido fiscalmente y NO aparecerá en AFIP real.'
          : '';
        alert(`✅ Factura creada exitosamente\n\nNúmero: ${data.numeroCompleto}\nCAE: ${data.cae}\nVencimiento CAE: ${data.caeVencimiento}${warningMsg}`);
        setInvoiceForm({
          sellerId: invoiceForm.sellerId,
          tipoComprobante: '11',
          concepto: '1',
          clienteTipoDoc: '99',
          clienteNroDoc: '0',
          clienteRazonSocial: '',
          importeTotal: '',
          importeNeto: '',
          importeIVA: '0',
          fechaDesde: new Date().toISOString().split('T')[0],
          fechaHasta: new Date().toISOString().split('T')[0]
        });
        await loadData();
        setActiveTab('facturas');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error creando factura:', error);
      alert('Error al crear la factura');
    }
    
    setLoading(false);
  };

  const handleCreateCreditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!empresaId) {
      alert('No se encontró el ID de empresa');
      return;
    }
    
    if (!selectedSeller) {
      alert('Primero debes configurar AFIP');
      return;
    }
    
    if (!creditNoteForm.facturaId) {
      alert('Debes seleccionar una factura');
      return;
    }
    
    const importeTotal = parseFloat(creditNoteForm.importeTotal);
    const importeNeto = parseFloat(creditNoteForm.importeNeto || creditNoteForm.importeTotal);
    const importeIVA = parseFloat(creditNoteForm.importeIVA);
    
    if (isNaN(importeTotal) || importeTotal <= 0) {
      alert('El importe total debe ser mayor a 0');
      return;
    }
    
    setLoading(true);
    
    try {
      // Buscar la factura original
      const facturaOriginal = invoices.find(inv => inv._id === creditNoteForm.facturaId);
      if (!facturaOriginal) {
        alert('Factura no encontrada');
        setLoading(false);
        return;
      }
      
      // Determinar tipo de nota de crédito según tipo de factura
      let tipoNotaCredito = 13; // Nota de Crédito C por defecto
      if (facturaOriginal.tipoComprobante === 1) tipoNotaCredito = 3; // NC A
      if (facturaOriginal.tipoComprobante === 6) tipoNotaCredito = 8; // NC B
      
      const res = await fetch(`${AFIP_API_URL}/api/modules/afip/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId,
          invoiceData: {
            tipoComprobante: tipoNotaCredito,
            concepto: 1,
            clienteTipoDoc: 99,
            clienteNroDoc: 0,
            clienteRazonSocial: facturaOriginal.clienteRazonSocial || undefined,
            importeTotal,
            importeNeto,
            importeIVA,
            importeExento: 0,
            comprobanteAsociado: {
              tipo: facturaOriginal.tipoComprobante,
              puntoVenta: facturaOriginal.puntoVenta,
              numero: facturaOriginal.numero
            }
          }
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        const facturaAsociada = `${facturaOriginal.tipoComprobanteLabel} ${facturaOriginal.numeroCompleto}`;
        alert(`✅ Nota de Crédito creada exitosamente\n\nNúmero: ${data.numeroCompleto}\nCAE: ${data.cae}\nVencimiento CAE: ${data.caeVencimiento}\n\nFactura asociada: ${facturaAsociada}\nMonto acreditado: $${importeTotal.toLocaleString()}`);
        setCreditNoteForm({
          facturaId: '',
          motivo: '',
          tipo: 'total',
          importeTotal: '',
          importeNeto: '',
          importeIVA: '0'
        });
        await loadData();
        setActiveTab('facturas');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error creando nota de crédito:', error);
      alert('Error al crear la nota de crédito');
    }
    
    setLoading(false);
  };

  const handleFileUpload = (field: 'certificado' | 'clavePrivada', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setConfigForm({ ...configForm, [field]: content });
    };
    reader.readAsText(file);
  };

  return (
    <DashboardLayout title="Integración ARCA">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => router.back()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className={styles.headerInfo}>
            <div className={styles.headerLogo} style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #264469 100%)', color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>
              ARCA
            </div>
            <div>
              <h1 className={styles.title}>ARCA - Facturación Electrónica</h1>
              <p className={styles.subtitle}>Gestiona tus comprobantes electrónicos</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'facturas' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('facturas')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Comprobantes
          </button>
          <button
            className={`${styles.tab} ${styles.tabPrimary} ${activeTab === 'crear' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('crear')}
            disabled={sellers.length === 0}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva Factura
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'nota-credito' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('nota-credito')}
            disabled={sellers.length === 0 || invoices.length === 0}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            Nota de Crédito
          </button>
          <button
            className={`${styles.tab} ${styles.tabConfig} ${activeTab === 'config' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('config')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m8.66-15.66l-4.24 4.24m-4.24 4.24l-4.24 4.24M23 12h-6m-6 0H1m20.66 8.66l-4.24-4.24m-4.24-4.24l-4.24-4.24"/>
            </svg>
            Dar de Alta en ARCA
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {activeTab === 'config' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Configuración ARCA</h2>
                  <p>Gestiona los CUITs registrados para facturación electrónica</p>
                </div>
                <button 
                  className={styles.submitButton} 
                  onClick={() => setShowConfigModal(true)}
                  style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}
                >
                  ➕ Agregar Nuevo CUIT
                </button>
              </div>

              {/* Lista de CUITs registrados */}
              {sellers.length > 0 ? (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>CUIT</th>
                        <th>Razón Social</th>
                        <th>Punto de Venta</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellers.map((s) => (
                        <tr key={s._id}>
                          <td className={styles.invoiceType}>{s.cuit}</td>
                          <td>{s.razonSocial}</td>
                          <td>{s.puntoVenta}</td>
                          <td>
                            <span className={`${styles.badge} ${s.activo ? styles.badgeSuccess : styles.badgeError}`}>
                              {s.activo ? '✅ Activo' : '❌ Inactivo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6m8.66-15.66l-4.24 4.24m-4.24 4.24l-4.24 4.24M23 12h-6m-6 0H1m20.66 8.66l-4.24-4.24m-4.24-4.24l-4.24-4.24"/>
                  </svg>
                  <p>No hay CUITs registrados</p>
                  <span>Agrega tu primer CUIT para comenzar a facturar</span>
                </div>
              )}
            </div>
          )}

          {/* Modal de configuración de nuevo CUIT */}
          {showConfigModal && (
            <div className={styles.modal} onClick={() => { setShowConfigModal(false); setConfigStep('initial'); setGeneratedKeys(null); }}>
              <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: configStep === 'generate' ? '900px' : '700px' }}>
                <div className={styles.modalHeader}>
                  <h3>
                    {configStep === 'initial' && 'Paso 1: Datos del CUIT'}
                    {configStep === 'generate' && 'Paso 2: Generar Certificado'}
                    {configStep === 'upload' && 'Paso 3: Subir Certificado'}
                  </h3>
                  <button className={styles.modalClose} onClick={() => { setShowConfigModal(false); setConfigStep('initial'); setGeneratedKeys(null); }}>
                    ✕
                  </button>
                </div>
                <div className={styles.modalBody}>
                  
                  {/* PASO 1: Datos básicos */}
                  {configStep === 'initial' && (
                    <>
                      <div className={styles.formGroup}>
                        <label>
                          CUIT *
                          <AFIPFieldHelp field="cuit" />
                        </label>
                        <input
                          type="text"
                          value={configForm.cuit}
                          onChange={(e) => setConfigForm({...configForm, cuit: e.target.value})}
                          placeholder="20123456789"
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>
                          Razón Social *
                          <AFIPFieldHelp field="razonSocial" />
                        </label>
                        <input
                          type="text"
                          value={configForm.razonSocial}
                          onChange={(e) => setConfigForm({...configForm, razonSocial: e.target.value})}
                          placeholder="Mi Empresa SRL"
                          required
                        />
                      </div>

                      <div style={{ 
                        background: '#f0f9ff', 
                        border: '1px solid #0ea5e9', 
                        borderRadius: '8px', 
                        padding: '1rem',
                        marginTop: '1.5rem'
                      }}>
                        <h4 style={{ margin: '0 0 0.5rem', color: '#0369a1', fontSize: '0.95rem' }}>
                          🔐 ¿Necesitas generar un certificado?
                        </h4>
                        <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#475569' }}>
                          Podemos generar las claves criptográficas en tu navegador de forma segura. 
                          Tu clave privada NUNCA saldrá de tu computadora hasta que la descargues.
                        </p>
                        <button
                          type="button"
                          onClick={handleGenerateCertificate}
                          disabled={loading || !configForm.cuit || !configForm.razonSocial}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 600,
                            cursor: !configForm.cuit || !configForm.razonSocial ? 'not-allowed' : 'pointer',
                            opacity: !configForm.cuit || !configForm.razonSocial ? 0.5 : 1
                          }}
                        >
                          {loading ? 'Generando...' : '🔑 Generar Certificado en el Navegador'}
                        </button>
                      </div>

                      <div style={{ 
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: '#fefce8',
                        border: '1px solid #fbbf24',
                        borderRadius: '8px'
                      }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e' }}>
                          <strong>¿Ya tienes un certificado?</strong> Puedes continuar directamente al paso 3 haciendo click en "Ya tengo certificado" abajo.
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setConfigStep('upload')}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: 'white',
                            color: '#64748b',
                            border: '2px solid #e2e8f0',
                            borderRadius: '6px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Ya tengo certificado →
                        </button>
                      </div>
                    </>
                  )}

                  {/* PASO 2: Certificado generado */}
                  {configStep === 'generate' && generatedKeys && (
                    <>
                      <div style={{ 
                        background: '#f0fdf4', 
                        border: '2px solid #22c55e', 
                        borderRadius: '8px', 
                        padding: '1.5rem',
                        marginBottom: '1.5rem'
                      }}>
                        <h4 style={{ margin: '0 0 0.5rem', color: '#15803d', fontSize: '1rem' }}>
                          ✅ Claves generadas exitosamente
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#166534' }}>
                          Tu clave privada se generó de forma segura en tu navegador. El CSR está listo para subir a AFIP.
                        </p>
                      </div>

                      <div style={{ 
                        background: '#f0f9ff', 
                        border: '1px solid #0ea5e9', 
                        borderRadius: '8px', 
                        padding: '1.5rem',
                        marginBottom: '1.5rem'
                      }}>
                        <h4 style={{ margin: '0 0 1rem', color: '#0369a1', fontSize: '0.95rem' }}>
                          📥 Descarga estos 2 archivos:
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <button
                            type="button"
                            onClick={handleDownloadPrivateKey}
                            style={{
                              padding: '1rem',
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            🔑 Clave Privada (.key)
                          </button>
                          <button
                            type="button"
                            onClick={handleDownloadCSR}
                            style={{
                              padding: '1rem',
                              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            📄 CSR (.csr)
                          </button>
                        </div>
                      </div>

                      <div style={{ 
                        background: '#fffbeb', 
                        border: '1px solid #fbbf24', 
                        borderRadius: '8px', 
                        padding: '1.5rem'
                      }}>
                        <h4 style={{ margin: '0 0 1rem', color: '#92400e', fontSize: '0.95rem' }}>
                          📋 Ahora ve a AFIP y obtén tu certificado:
                        </h4>
                        <ol style={{ margin: 0, paddingLeft: '1.5rem', color: '#78350f', fontSize: '0.85rem', lineHeight: '1.8' }}>
                          <li><strong>Descarga ambos archivos</strong> usando los botones de arriba (🔑 clave privada y 📄 CSR)</li>
                          <li><strong>Ve a AFIP</strong> → <a href="https://auth.afip.gob.ar/contribuyente_/login.xhtml" target="_blank" style={{ color: '#0369a1', textDecoration: 'underline' }}>Ingresar a AFIP</a> → Administrador de Relaciones de Clave Fiscal → Administrador de Certificados Digitales</li>
                          <li><strong>Crear Certificado</strong> → Selecciona "Solicitud de Certificado" → Sube el archivo <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '3px' }}>23405864789_request.csr</code></li>
                          <li><strong>AFIP procesará tu CSR</strong> y te devolverá un certificado firmado (archivo <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '3px' }}>.crt</code> o <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '3px' }}>.pem</code>)</li>
                          <li><strong>Descarga el certificado</strong> firmado que AFIP te devuelve</li>
                        </ol>
                        <div style={{ 
                          marginTop: '1rem', 
                          padding: '0.75rem', 
                          background: '#dcfce7', 
                          border: '1px solid #22c55e',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          color: '#166534'
                        }}>
                          ✅ <strong>Cuando tengas el certificado de AFIP:</strong> Haz click en "Ya tengo el certificado de AFIP" abajo y sube:
                          <br/>• El <strong>certificado firmado</strong> que descargaste de AFIP (.pem o .crt)
                          <br/>• La <strong>clave privada</strong> que generaste aquí (.key)
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setConfigStep('initial')}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: 'white',
                            color: '#64748b',
                            border: '2px solid #e2e8f0',
                            borderRadius: '6px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          ← Volver
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfigStep('upload')}
                          style={{
                            flex: 1,
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Ya tengo el certificado de AFIP →
                        </button>
                      </div>
                    </>
                  )}

                  {/* PASO 3: Subir certificado */}
                  {configStep === 'upload' && (
                    <form className={styles.form} onSubmit={handleSaveConfig}>
                      <div style={{ 
                        background: '#f0f9ff', 
                        border: '1px solid #0ea5e9', 
                        borderRadius: '8px', 
                        padding: '1.5rem',
                        marginBottom: '1.5rem'
                      }}>
                        <h4 style={{ margin: '0 0 0.75rem', color: '#0369a1', fontSize: '0.95rem' }}>
                          📤 Sube los archivos para completar el registro
                        </h4>
                        <div style={{ fontSize: '0.85rem', color: '#0c4a6e', lineHeight: '1.6' }}>
                          <p style={{ margin: '0 0 0.5rem' }}>
                            Necesitas subir <strong>2 archivos</strong>:
                          </p>
                          <ul style={{ margin: '0 0 0.75rem', paddingLeft: '1.5rem' }}>
                            <li><strong>Certificado firmado por AFIP</strong> (archivo <code style={{ background: '#e0f2fe', padding: '2px 6px', borderRadius: '3px' }}>.pem</code> o <code style={{ background: '#e0f2fe', padding: '2px 6px', borderRadius: '3px' }}>.crt</code>) - Este es el que descargaste de AFIP después de subir el CSR</li>
                            <li><strong>Clave privada</strong> (archivo <code style={{ background: '#e0f2fe', padding: '2px 6px', borderRadius: '3px' }}>.key</code>) - Esta es la que generaste en el paso anterior</li>
                          </ul>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#0369a1' }}>
                            💡 Si ya tenías un certificado de AFIP, puedes subirlo directamente aquí junto con su clave privada.
                          </p>
                        </div>
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>
                            Punto de Venta *
                            <AFIPFieldHelp field="puntoVenta" />
                          </label>
                          {availablePuntosVenta.length > 0 ? (
                            <select
                              value={configForm.puntoVenta}
                              onChange={(e) => setConfigForm({...configForm, puntoVenta: e.target.value})}
                              required
                              disabled={loadingPuntosVenta}
                            >
                              {availablePuntosVenta.map(pv => (
                                <option key={pv} value={pv}>
                                  Punto de Venta {pv}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="number"
                              value={configForm.puntoVenta}
                              onChange={(e) => setConfigForm({...configForm, puntoVenta: e.target.value})}
                              min="1"
                              required
                              placeholder="Ej: 4"
                            />
                          )}
                          {loadingPuntosVenta && <small>⏳ Cargando puntos de venta...</small>}
                        </div>

                        <div className={styles.formGroup}>
                          <label>Ambiente</label>
                          <div style={{
                            padding: '0.75rem 1rem',
                            background: '#dcfce7',
                            border: '2px solid #22c55e',
                            borderRadius: '6px',
                            color: '#166534',
                            fontWeight: 600
                          }}>
                            🟢 Producción (AFIP Real)
                          </div>
                          <small style={{ color: '#166534' }}>Todos los comprobantes se emiten en AFIP real</small>
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label>
                          Certificado ARCA (.pem) *
                          <AFIPFieldHelp field="certificado" />
                        </label>
                        <input
                          type="file"
                          accept=".pem,.crt"
                          onChange={(e) => handleFileUpload('certificado', e)}
                          required={sellers.length === 0}
                        />
                        <small>Archivo .pem del certificado obtenido de ARCA</small>
                      </div>

                      <div className={styles.formGroup}>
                        <label>
                          Clave Privada (.key) *
                          <AFIPFieldHelp field="clavePrivada" />
                        </label>
                        <input
                          type="file"
                          accept=".key,.pem"
                          onChange={(e) => handleFileUpload('clavePrivada', e)}
                          required={sellers.length === 0}
                        />
                        <small>Archivo .key de la clave privada generada</small>
                      </div>

                      <div className={styles.formActions}>
                        <button 
                          type="button"
                          onClick={() => setConfigStep('initial')}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: 'white',
                            color: '#64748b',
                            border: '2px solid #e2e8f0',
                            borderRadius: '6px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginRight: '1rem'
                          }}
                        >
                          ← Volver
                        </button>
                        <button type="submit" className={styles.submitButton} disabled={loading}>
                          {loading ? 'Guardando...' : '✅ Guardar Nuevo CUIT'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'facturas' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Comprobantes Emitidos</h2>
                  <p>Historial de facturas y notas de crédito/débito</p>
                </div>
              </div>

              {/* Estadísticas */}
              {stats && (
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>📄</div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{stats.totalFacturas}</span>
                      <span className={styles.statLabel}>Facturas</span>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>📝</div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{stats.totalNotasCredito}</span>
                      <span className={styles.statLabel}>Notas de Crédito</span>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>📋</div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{stats.totalNotasDebito}</span>
                      <span className={styles.statLabel}>Notas de Débito</span>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>💰</div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>${stats.importeDelMes?.toLocaleString() || 0}</span>
                      <span className={styles.statLabel}>Facturado este mes</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla de comprobantes */}
              {invoices.length === 0 ? (
                <div className={styles.emptyState}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <p>No hay comprobantes emitidos</p>
                  <span>Crea tu primera factura para comenzar</span>
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Número</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Importe</th>
                        <th>CAE</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice._id} onClick={() => setSelectedInvoice(invoice)} style={{ cursor: 'pointer' }}>
                          <td className={styles.invoiceType}>{invoice.tipoComprobanteLabel}</td>
                          <td className={styles.invoiceNumberCell}>{invoice.numeroCompleto}</td>
                          <td>{invoice.clienteRazonSocial || 'Consumidor Final'}</td>
                          <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                          <td className={styles.amountCell}>${invoice.importeTotal.toLocaleString()}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{invoice.cae || '-'}</td>
                          <td>
                            <span className={`${styles.badge} ${invoice.resultado === 'A' ? styles.badgeSuccess : styles.badgeError}`}>
                              {invoice.resultado === 'A' ? '✅ Aprobado' : invoice.resultado === 'R' ? '❌ Rechazado' : '⏳ Pendiente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'crear' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Nueva Factura</h2>
                  <p>Emite un nuevo comprobante electrónico</p>
                </div>
              </div>

              <form className={styles.form} onSubmit={handleCreateInvoice}>
                {/* Selector de CUIT */}
                <div className={styles.formGroup}>
                  <label>Seleccionar CUIT para Facturar *</label>
                  <select
                    value={invoiceForm.sellerId}
                    onChange={(e) => {
                      setInvoiceForm({...invoiceForm, sellerId: e.target.value});
                      const seller = sellers.find(s => s._id === e.target.value);
                      if (seller) setSelectedSeller(seller);
                    }}
                    required
                  >
                    <option value="">Seleccione un CUIT</option>
                    {sellers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.cuit} - {s.razonSocial}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Comprobante */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Tipo de Comprobante *</label>
                    <select
                      value={invoiceForm.tipoComprobante}
                      onChange={(e) => setInvoiceForm({...invoiceForm, tipoComprobante: e.target.value})}
                    >
                      <option value="11">Factura C</option>
                      <option value="6">Factura B</option>
                      <option value="1">Factura A</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Concepto *</label>
                    <select
                      value={invoiceForm.concepto}
                      onChange={(e) => setInvoiceForm({...invoiceForm, concepto: e.target.value})}
                    >
                      <option value="1">Productos</option>
                      <option value="2">Servicios</option>
                      <option value="3">Productos y Servicios</option>
                    </select>
                  </div>
                </div>

                {/* Rango de Facturación */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Fecha Desde *</label>
                    <input
                      type="date"
                      value={invoiceForm.fechaDesde}
                      onChange={(e) => setInvoiceForm({...invoiceForm, fechaDesde: e.target.value})}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Fecha Hasta *</label>
                    <input
                      type="date"
                      value={invoiceForm.fechaHasta}
                      onChange={(e) => setInvoiceForm({...invoiceForm, fechaHasta: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {/* Datos del Cliente - Solo para Factura A */}
                {invoiceForm.tipoComprobante === '1' && (
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#264469', marginBottom: '1rem' }}>Datos del Cliente</h3>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Tipo de Documento *</label>
                        <select
                          value={invoiceForm.clienteTipoDoc}
                          onChange={(e) => setInvoiceForm({...invoiceForm, clienteTipoDoc: e.target.value})}
                        >
                          <option value="80">CUIT</option>
                          <option value="86">CUIL</option>
                          <option value="96">DNI</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label>Número de Documento *</label>
                        <input
                          type="text"
                          value={invoiceForm.clienteNroDoc}
                          onChange={(e) => setInvoiceForm({...invoiceForm, clienteNroDoc: e.target.value})}
                          placeholder="20123456789"
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Razón Social *</label>
                      <input
                        type="text"
                        value={invoiceForm.clienteRazonSocial}
                        onChange={(e) => setInvoiceForm({...invoiceForm, clienteRazonSocial: e.target.value})}
                        placeholder="Razón Social del Cliente"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Importes */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#264469', marginBottom: '1rem' }}>Importes</h3>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Importe Total *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={invoiceForm.importeTotal}
                        onChange={(e) => setInvoiceForm({...invoiceForm, importeTotal: e.target.value})}
                        placeholder="1000.00"
                        required
                      />
                    </div>

                    {invoiceForm.tipoComprobante === '1' && (
                      <>
                        <div className={styles.formGroup}>
                          <label>Importe Neto Gravado</label>
                          <input
                            type="number"
                            step="0.01"
                            value={invoiceForm.importeNeto}
                            onChange={(e) => setInvoiceForm({...invoiceForm, importeNeto: e.target.value})}
                            placeholder="Base imponible"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>Importe IVA</label>
                          <input
                            type="number"
                            step="0.01"
                            value={invoiceForm.importeIVA}
                            onChange={(e) => setInvoiceForm({...invoiceForm, importeIVA: e.target.value})}
                            placeholder="IVA 21%"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Creando...' : '📄 Crear Comprobante'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'nota-credito' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Nueva Nota de Crédito</h2>
                  <p>Emite una nota de crédito asociada a una factura</p>
                </div>
              </div>

              <form className={styles.form} onSubmit={handleCreateCreditNote}>
                <div className={styles.formGroup}>
                  <label>Factura a Acreditar *</label>
                  <select
                    value={creditNoteForm.facturaId}
                    onChange={(e) => {
                      const factura = invoices.find(inv => inv._id === e.target.value);
                      setCreditNoteForm({
                        ...creditNoteForm,
                        facturaId: e.target.value,
                        tipo: 'total',
                        importeTotal: factura?.importeTotal.toString() || '',
                        importeNeto: factura?.importeTotal.toString() || ''
                      });
                    }}
                    required
                  >
                    <option value="">Selecciona una factura</option>
                    {invoices.filter(inv => inv.resultado === 'A' && [1, 6, 11].includes(inv.tipoComprobante)).map((invoice) => (
                      <option key={invoice._id} value={invoice._id}>
                        {invoice.numeroCompleto} - ${invoice.importeTotal.toLocaleString()} - {invoice.clienteRazonSocial || 'Consumidor Final'}
                      </option>
                    ))}
                  </select>
                  <small>Solo se muestran facturas aprobadas</small>
                </div>

                {/* Tipo de Nota de Crédito */}
                <div className={styles.formGroup}>
                  <label>Tipo de Nota de Crédito *</label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const factura = invoices.find(inv => inv._id === creditNoteForm.facturaId);
                        setCreditNoteForm({
                          ...creditNoteForm,
                          tipo: 'total',
                          importeTotal: factura?.importeTotal.toString() || '',
                          importeNeto: factura?.importeTotal.toString() || ''
                        });
                      }}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: creditNoteForm.tipo === 'total' ? 'linear-gradient(135deg, #264469 0%, #1e3a5f 100%)' : '#f8fafc',
                        color: creditNoteForm.tipo === 'total' ? 'white' : '#64748b',
                        border: creditNoteForm.tipo === 'total' ? 'none' : '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      💯 Total
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreditNoteForm({...creditNoteForm, tipo: 'parcial', importeTotal: '', importeNeto: ''})}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: creditNoteForm.tipo === 'parcial' ? 'linear-gradient(135deg, #264469 0%, #1e3a5f 100%)' : '#f8fafc',
                        color: creditNoteForm.tipo === 'parcial' ? 'white' : '#64748b',
                        border: creditNoteForm.tipo === 'parcial' ? 'none' : '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      📊 Parcial
                    </button>
                  </div>
                  <small>{creditNoteForm.tipo === 'total' ? 'Se acreditará el monto total de la factura' : 'Ingresa el monto parcial a acreditar'}</small>
                </div>

                <div className={styles.formGroup}>
                  <label>Motivo de la Nota de Crédito *</label>
                  <textarea
                    value={creditNoteForm.motivo}
                    onChange={(e) => setCreditNoteForm({...creditNoteForm, motivo: e.target.value})}
                    placeholder="Ej: Devolución de mercadería, Error en facturación, Descuento aplicado..."
                    rows={3}
                    required
                  />
                </div>

                {/* Solo mostrar campos de importe para notas parciales */}
                {creditNoteForm.tipo === 'parcial' && (
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Importe Total *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={creditNoteForm.importeTotal}
                        onChange={(e) => setCreditNoteForm({...creditNoteForm, importeTotal: e.target.value})}
                        placeholder="0.00"
                        required
                      />
                      <small>Ingresa el monto parcial a acreditar</small>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Importe Neto</label>
                      <input
                        type="number"
                        step="0.01"
                        value={creditNoteForm.importeNeto}
                        onChange={(e) => setCreditNoteForm({...creditNoteForm, importeNeto: e.target.value})}
                        placeholder="Igual al total si no hay IVA"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Importe IVA</label>
                      <input
                        type="number"
                        step="0.01"
                        value={creditNoteForm.importeIVA}
                        onChange={(e) => setCreditNoteForm({...creditNoteForm, importeIVA: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}

                <div className={styles.formActions}>
                  <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Creando...' : '📝 Crear Nota de Crédito'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal de detalle de comprobante */}
        {selectedInvoice && (
          <div className={styles.modal} onClick={() => setSelectedInvoice(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
              <div className={styles.modalHeader}>
                <h3>📄 Detalle del Comprobante</h3>
                <button className={styles.modalClose} onClick={() => setSelectedInvoice(null)}>
                  ✕
                </button>
              </div>
              <div className={styles.modalBody}>
                {/* Estado y tipo */}
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: selectedInvoice.resultado === 'A' ? '#f0fdf4' : '#fef2f2',
                  border: `2px solid ${selectedInvoice.resultado === 'A' ? '#22c55e' : '#ef4444'}`,
                  borderRadius: '8px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Tipo de Comprobante</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>{selectedInvoice.tipoComprobanteLabel}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Estado</div>
                    <span className={`${styles.badge} ${selectedInvoice.resultado === 'A' ? styles.badgeSuccess : styles.badgeError}`} style={{ fontSize: '0.9rem' }}>
                      {selectedInvoice.resultado === 'A' ? '✅ Aprobado' : selectedInvoice.resultado === 'R' ? '❌ Rechazado' : '⏳ Pendiente'}
                    </span>
                  </div>
                </div>

                {/* Información principal */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Número de Comprobante</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>{selectedInvoice.numeroCompleto}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedInvoice.numeroCompleto);
                          alert('📋 Número copiado al portapapeles');
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#e0e7ff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          color: '#4f46e5'
                        }}
                        title="Copiar número"
                      >
                        📋
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Fecha de Emisión</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
                      {new Date(selectedInvoice.createdAt).toLocaleDateString('es-AR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>

                {/* CAE - Destacado */}
                {selectedInvoice.cae && (
                  <div style={{ 
                    padding: '1.5rem', 
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
                    borderRadius: '8px', 
                    border: '2px solid #0ea5e9',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ fontSize: '0.85rem', color: '#0369a1', marginBottom: '0.75rem', fontWeight: 600 }}>
                      🔐 Código de Autorización Electrónico (CAE)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: 700, 
                        color: '#0c4a6e',
                        fontFamily: 'monospace',
                        letterSpacing: '0.05em'
                      }}>
                        {selectedInvoice.cae}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedInvoice.cae || '');
                          alert('✅ CAE copiado al portapapeles');
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#0ea5e9',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600
                        }}
                      >
                        📋 Copiar CAE
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#0369a1' }}>
                        ⏰ Vencimiento: <strong>{selectedInvoice.caeVencimiento || 'N/A'}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Cliente */}
                <div style={{ padding: '1rem', background: '#fefce8', borderRadius: '8px', border: '1px solid #fbbf24', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#92400e', marginBottom: '0.5rem' }}>👤 Cliente</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#78350f' }}>
                    {selectedInvoice.clienteRazonSocial || 'Consumidor Final'}
                  </div>
                  {selectedInvoice.clienteNroDoc && selectedInvoice.clienteNroDoc !== '0' && (
                    <div style={{ fontSize: '0.85rem', color: '#92400e', marginTop: '0.25rem' }}>
                      {selectedInvoice.clienteTipoDoc === '80' ? 'CUIT' : 'DNI'}: {selectedInvoice.clienteNroDoc}
                    </div>
                  )}
                </div>

                {/* Importes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Importe Neto</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>
                      ${selectedInvoice.importeNeto?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>IVA</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>
                      ${selectedInvoice.importeIVA?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div style={{ padding: '1rem', background: '#dcfce7', borderRadius: '8px', border: '2px solid #22c55e', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#166534', marginBottom: '0.5rem', fontWeight: 600 }}>Total</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#15803d' }}>
                      ${selectedInvoice.importeTotal.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div style={{ 
                  padding: '1rem', 
                  background: '#f8fafc', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0',
                  fontSize: '0.85rem',
                  color: '#64748b'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <strong>Punto de Venta:</strong> {selectedInvoice.puntoVenta}
                    </div>
                    <div>
                      <strong>Concepto:</strong> {selectedInvoice.concepto === '1' ? 'Productos' : selectedInvoice.concepto === '2' ? 'Servicios' : 'Productos y Servicios'}
                    </div>
                    {selectedInvoice.observaciones && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <strong>Observaciones:</strong> {selectedInvoice.observaciones}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón de copiar todo */}
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => {
                      const texto = `
COMPROBANTE AFIP
================
Tipo: ${selectedInvoice.tipoComprobanteLabel}
Número: ${selectedInvoice.numeroCompleto}
Fecha: ${new Date(selectedInvoice.createdAt).toLocaleDateString('es-AR')}
Estado: ${selectedInvoice.resultado === 'A' ? 'Aprobado' : 'Rechazado'}

CAE: ${selectedInvoice.cae || 'N/A'}
Vencimiento CAE: ${selectedInvoice.caeVencimiento || 'N/A'}

Cliente: ${selectedInvoice.clienteRazonSocial || 'Consumidor Final'}
${selectedInvoice.clienteNroDoc && selectedInvoice.clienteNroDoc !== '0' ? `Documento: ${selectedInvoice.clienteNroDoc}` : ''}

Importe Neto: $${selectedInvoice.importeNeto?.toLocaleString() || '0'}
IVA: $${selectedInvoice.importeIVA?.toLocaleString() || '0'}
TOTAL: $${selectedInvoice.importeTotal.toLocaleString()}
                      `.trim();
                      navigator.clipboard.writeText(texto);
                      alert('✅ Información completa copiada al portapapeles');
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
                    📋 Copiar Toda la Información
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
