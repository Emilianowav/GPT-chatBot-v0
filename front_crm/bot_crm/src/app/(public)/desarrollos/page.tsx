'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function DesarrollosPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    empresa: '',
    email: '',
    whatsapp: '',
    sector: '',
    descripcion: '',
    presupuesto: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construir mensaje para WhatsApp
    const mensaje = `Hola, soy ${formData.nombre} de ${formData.empresa}.
    
Sector: ${formData.sector}
Email: ${formData.email}
WhatsApp: ${formData.whatsapp}

Descripción del proyecto:
${formData.descripcion}

Presupuesto estimado: ${formData.presupuesto}`;

    const whatsappUrl = `https://wa.me/5493794789169?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Desarrollos a medida<br />
              <span className={styles.gradient}>con foco en tu operación</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Conectamos sistemas, creamos paneles y armamos soluciones específicas para tu negocio.
            </p>
          </div>
        </div>
      </section>

      {/* Qué hacemos */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Qué hacemos</h2>
          
          <div className={styles.servicesGrid}>
            <div className={styles.service}>
              <div>
                <h3 className={styles.serviceTitle}>Automatización de procesos</h3>
                <p className={styles.serviceText}>
                  Identificamos tareas repetitivas y las convertimos en flujos automáticos que ahorran tiempo y reducen errores.
                </p>
              </div>
              <div className={styles.serviceIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <circle cx="60" cy="60" r="30"/>
                  <circle cx="60" cy="60" r="20"/>
                  <circle cx="60" cy="60" r="5"/>
                  <line x1="60" y1="30" x2="60" y2="40"/>
                  <line x1="60" y1="80" x2="60" y2="90"/>
                  <line x1="30" y1="60" x2="40" y2="60"/>
                  <line x1="80" y1="60" x2="90" y2="60"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.service}>
              <div>
                <h3 className={styles.serviceTitle}>Integraciones entre sistemas</h3>
                <p className={styles.serviceText}>
                  Conectamos APIs, ERPs, e-commerce y otras plataformas para que tus sistemas hablen entre sí.
                </p>
              </div>
              <div className={styles.serviceIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <circle cx="35" cy="60" r="15"/>
                  <circle cx="85" cy="60" r="15"/>
                  <path d="M50 60 L70 60"/>
                  <circle cx="60" cy="35" r="10"/>
                  <circle cx="60" cy="85" r="10"/>
                  <path d="M60 45 L60 50 M60 70 L60 75"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.service}>
              <div>
                <h3 className={styles.serviceTitle}>Dashboards de gestión</h3>
                <p className={styles.serviceText}>
                  Paneles personalizados con la información que realmente necesitás para tomar decisiones.
                </p>
              </div>
              <div className={styles.serviceIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <rect x="25" y="25" width="70" height="70" rx="4"/>
                  <line x1="35" y1="45" x2="55" y2="45"/>
                  <line x1="35" y1="55" x2="85" y2="55"/>
                  <rect x="35" y="65" width="20" height="20"/>
                  <rect x="60" y="70" width="25" height="15"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.service}>
              <div>
                <h3 className={styles.serviceTitle}>Chatbots y asistentes internos</h3>
                <p className={styles.serviceText}>
                  Herramientas conversacionales para tu equipo: consultas internas, reportes, acceso a datos.
                </p>
              </div>
              <div className={styles.serviceIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <rect x="35" y="30" width="50" height="50" rx="8"/>
                  <circle cx="50" cy="50" r="4"/>
                  <circle cx="70" cy="50" r="4"/>
                  <path d="M45 65 Q60 70, 75 65"/>
                  <rect x="30" y="25" width="10" height="10" rx="2"/>
                  <rect x="80" y="25" width="10" height="10" rx="2"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo trabajamos */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Cómo trabajamos</h2>
          
          <div className={styles.processGrid}>
            <div className={styles.processStep}>
              <div>
                <h3 className={styles.stepTitle}>Relevamiento</h3>
                <p className={styles.stepText}>
                  Entendemos tu operación y tus dolores. Hablamos con tu equipo y mapeamos el flujo actual.
                </p>
              </div>
              <div className={styles.stepNumber}>01</div>
            </div>
            
            <div className={styles.processStep}>
              <div>
                <h3 className={styles.stepTitle}>Propuesta de solución</h3>
                <p className={styles.stepText}>
                  Diseño funcional aterrizado a tu día a día. Te mostramos cómo va a funcionar antes de programar.
                </p>
              </div>
              <div className={styles.stepNumber}>02</div>
            </div>
            
            <div className={styles.processStep}>
              <div>
                <h3 className={styles.stepTitle}>Desarrollo e integración</h3>
                <p className={styles.stepText}>
                  Iteramos con tu equipo. Ajustamos sobre la marcha y te mantenemos al tanto del progreso.
                </p>
              </div>
              <div className={styles.stepNumber}>03</div>
            </div>
            
            <div className={styles.processStep}>
              <div>
                <h3 className={styles.stepTitle}>Acompañamiento</h3>
                <p className={styles.stepText}>
                  Ajustes, soporte, nuevas iteraciones. No te dejamos solo después del lanzamiento.
                </p>
              </div>
              <div className={styles.stepNumber}>04</div>
            </div>
          </div>
        </div>
      </section>

      {/* Formulario de consulta */}
      <section className={styles.formSection}>
        <div className={styles.container}>
          <div className={styles.formWrapper}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Contanos tu proyecto</h2>
              <p className={styles.formSubtitle}>
                Completá el formulario y te contactamos para entender mejor tu necesidad
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="nombre" className={styles.label}>Nombre *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className={styles.input}
                    placeholder="Tu nombre"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="empresa" className={styles.label}>Empresa *</label>
                  <input
                    type="text"
                    id="empresa"
                    name="empresa"
                    value={formData.empresa}
                    onChange={handleChange}
                    required
                    className={styles.input}
                    placeholder="Nombre de tu empresa"
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={styles.input}
                    placeholder="tu@email.com"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="whatsapp" className={styles.label}>WhatsApp *</label>
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    required
                    className={styles.input}
                    placeholder="+54 9 379 4789169"
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="sector" className={styles.label}>Sector / Rubro *</label>
                <input
                  type="text"
                  id="sector"
                  name="sector"
                  value={formData.sector}
                  onChange={handleChange}
                  required
                  className={styles.input}
                  placeholder="Ej: Inmobiliaria, E-commerce, Servicios, etc."
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="descripcion" className={styles.label}>
                  ¿Qué te gustaría automatizar o mejorar? *
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  required
                  className={styles.textarea}
                  placeholder="Contanos en detalle qué proceso querés mejorar, qué problema querés resolver o qué idea tenés en mente..."
                  rows={6}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="presupuesto" className={styles.label}>Presupuesto estimado</label>
                <select
                  id="presupuesto"
                  name="presupuesto"
                  value={formData.presupuesto}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">Seleccioná un rango</option>
                  <option value="Menos de USD 1.000">Menos de USD 1.000</option>
                  <option value="USD 1.000 - 3.000">USD 1.000 - 3.000</option>
                  <option value="USD 3.000 - 5.000">USD 3.000 - 5.000</option>
                  <option value="USD 5.000 - 10.000">USD 5.000 - 10.000</option>
                  <option value="Más de USD 10.000">Más de USD 10.000</option>
                  <option value="A definir">A definir</option>
                </select>
              </div>
              
              <button type="submit" className={styles.submitButton}>
                Enviar consulta por WhatsApp
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
