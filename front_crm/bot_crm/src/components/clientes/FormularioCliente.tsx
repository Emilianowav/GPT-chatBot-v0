// 👤 Formulario de Cliente - Modal de Pasos
'use client';

import { useState, useEffect, useRef } from 'react';
import type { Cliente, CrearClienteData } from '@/lib/clientesApi';
import styles from './FormularioCliente.module.css';

// Lista de códigos de país
const COUNTRY_CODES = [
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+55', country: 'Brasil', flag: '🇧🇷' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+52', country: 'México', flag: '🇲🇽' },
  { code: '+51', country: 'Perú', flag: '🇵🇪' },
  { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
  { code: '+1', country: 'Estados Unidos', flag: '🇺🇸' },
  { code: '+34', country: 'España', flag: '🇪🇸' },
  { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
  { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
  { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
  { code: '+506', country: 'Costa Rica', flag: '🇨🇷' },
  { code: '+507', country: 'Panamá', flag: '🇵🇦' },
];

interface FormularioClienteProps {
  onSubmit: (data: CrearClienteData) => Promise<void>;
  onCancel: () => void;
  clienteInicial?: Cliente | null;
}

export default function FormularioCliente({ 
  onSubmit, 
  onCancel, 
  clienteInicial 
}: FormularioClienteProps) {
  const [step, setStep] = useState(1);
  const [countryCode, setCountryCode] = useState('+54');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<CrearClienteData>({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    codigoPostal: '',
    fechaNacimiento: '',
    dni: '',
    notas: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (clienteInicial) {
      // Extraer código de país del teléfono si existe
      const tel = clienteInicial.telefono || '';
      const matchedCode = COUNTRY_CODES.find(c => tel.startsWith(c.code));
      if (matchedCode) {
        setCountryCode(matchedCode.code);
      }
      
      setFormData({
        nombre: clienteInicial.nombre,
        apellido: clienteInicial.apellido,
        telefono: matchedCode ? tel.replace(matchedCode.code, '') : tel,
        email: clienteInicial.email || '',
        direccion: clienteInicial.direccion || '',
        ciudad: clienteInicial.ciudad || '',
        provincia: clienteInicial.provincia || '',
        codigoPostal: clienteInicial.codigoPostal || '',
        fechaNacimiento: clienteInicial.fechaNacimiento 
          ? clienteInicial.fechaNacimiento.split('T')[0] 
          : '',
        dni: clienteInicial.dni || '',
        notas: clienteInicial.notas || ''
      });
    }
  }, [clienteInicial]);

  const totalSteps = 3;
  const stepTitles = ['Datos Básicos', 'Contacto', 'Dirección'];

  const canGoNext = () => {
    if (step === 1) {
      return formData.nombre.trim() && formData.apellido.trim();
    }
    if (step === 2) {
      return formData.telefono.trim();
    }
    return true;
  };

  const goNext = () => {
    if (step < totalSteps && canGoNext()) {
      setStep(step + 1);
      setError(null);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      setStep(1);
      return;
    }
    if (!formData.apellido.trim()) {
      setError('El apellido es requerido');
      setStep(1);
      return;
    }
    if (!formData.telefono.trim()) {
      setError('El teléfono es requerido');
      setStep(2);
      return;
    }

    try {
      setLoading(true);
      
      // Limpiar campos vacíos y agregar código de país
      const telefonoCompleto = countryCode + formData.telefono.trim().replace(/^0+/, '');
      
      const dataLimpia: any = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        telefono: telefonoCompleto
      };

      if (formData.email?.trim()) dataLimpia.email = formData.email.trim();
      if (formData.direccion?.trim()) dataLimpia.direccion = formData.direccion.trim();
      if (formData.ciudad?.trim()) dataLimpia.ciudad = formData.ciudad.trim();
      if (formData.provincia?.trim()) dataLimpia.provincia = formData.provincia.trim();
      if (formData.codigoPostal?.trim()) dataLimpia.codigoPostal = formData.codigoPostal.trim();
      if (formData.fechaNacimiento) dataLimpia.fechaNacimiento = formData.fechaNacimiento;
      if (formData.dni?.trim()) dataLimpia.dni = formData.dni.trim();
      if (formData.notas?.trim()) dataLimpia.notas = formData.notas.trim();

      await onSubmit(dataLimpia);
    } catch (err: any) {
      setError(err.message || 'Error al guardar el cliente');
    } finally {
      setLoading(false);
    }
  };

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={styles.container}>
        {/* Header con pasos */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h2>{clienteInicial ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <button onClick={onCancel} className={styles.btnClose} type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          
          {/* Indicador de pasos */}
          <div className={styles.stepsIndicator}>
            {stepTitles.map((title, idx) => (
              <div 
                key={idx} 
                className={`${styles.stepItem} ${step === idx + 1 ? styles.stepActive : ''} ${step > idx + 1 ? styles.stepCompleted : ''}`}
              >
                <div className={styles.stepNumber}>
                  {step > idx + 1 ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : idx + 1}
                </div>
                <span className={styles.stepLabel}>{title}</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* PASO 1: Datos Básicos */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <div className={styles.stepHeader}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <div>
                  <h3>Datos Básicos</h3>
                  <p>Información personal del cliente</p>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="nombre">Nombre *</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Juan"
                  autoFocus
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="apellido">Apellido *</label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  placeholder="Pérez"
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="dni">DNI / Documento</label>
                  <input
                    type="text"
                    id="dni"
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                    placeholder="12345678"
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="fechaNacimiento">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    id="fechaNacimiento"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: Contacto */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <div className={styles.stepHeader}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <div>
                  <h3>Información de Contacto</h3>
                  <p>Teléfono y email del cliente</p>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="telefono">Teléfono *</label>
                <div className={styles.phoneInput} ref={dropdownRef}>
                  <button 
                    type="button" 
                    className={styles.countrySelector}
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  >
                    <span className={styles.flag}>{selectedCountry.flag}</span>
                    <span className={styles.code}>{selectedCountry.code}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  
                  {showCountryDropdown && (
                    <div className={styles.countryDropdown}>
                      {COUNTRY_CODES.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          className={`${styles.countryOption} ${country.code === countryCode ? styles.countryOptionActive : ''}`}
                          onClick={() => {
                            setCountryCode(country.code);
                            setShowCountryDropdown(false);
                          }}
                        >
                          <span className={styles.flag}>{country.flag}</span>
                          <span className={styles.countryName}>{country.country}</span>
                          <span className={styles.code}>{country.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="1112345678"
                    className={styles.phoneNumber}
                    autoFocus
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="cliente@ejemplo.com"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="notas">Notas</label>
                <textarea
                  id="notas"
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Información adicional..."
                />
              </div>
            </div>
          )}

          {/* PASO 3: Dirección */}
          {step === 3 && (
            <div className={styles.stepContent}>
              <div className={styles.stepHeader}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <div>
                  <h3>Dirección</h3>
                  <p>Ubicación del cliente (opcional)</p>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="direccion">Calle y Número</label>
                <input
                  type="text"
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Av. Corrientes 1234"
                  autoFocus
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="ciudad">Ciudad</label>
                  <input
                    type="text"
                    id="ciudad"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    placeholder="Buenos Aires"
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="provincia">Provincia</label>
                  <input
                    type="text"
                    id="provincia"
                    name="provincia"
                    value={formData.provincia}
                    onChange={handleChange}
                    placeholder="CABA"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="codigoPostal">Código Postal</label>
                <input
                  type="text"
                  id="codigoPostal"
                  name="codigoPostal"
                  value={formData.codigoPostal}
                  onChange={handleChange}
                  placeholder="C1043"
                />
              </div>
            </div>
          )}

          {/* Botones de navegación */}
          <div className={styles.actions}>
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className={styles.btnBack}
                disabled={loading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Anterior
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancel}
                className={styles.btnCancel}
                disabled={loading}
              >
                Cancelar
              </button>
            )}
            
            {step < totalSteps ? (
              <button
                type="button"
                onClick={goNext}
                className={styles.btnNext}
                disabled={!canGoNext()}
              >
                Siguiente
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                className={styles.btnSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {clienteInicial ? 'Actualizar' : 'Crear Cliente'}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
