'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function ContactoPage() {
  const whatsappNumber = '5493794789169';
  const email = 'contacto@momentoia.co';
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    mensaje: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const mensaje = `Hola, soy ${formData.nombre}.

Email: ${formData.email}
Teléfono: ${formData.telefono}

Mensaje:
${formData.mensaje}`;

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const agendarReunion = () => {
    const mensaje = 'Hola, quiero agendar una reunión de descubrimiento con Momento IA';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Hablemos de tu <span className={styles.gradient}>proyecto</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Estamos listos para escucharte y ayudarte a llevar tu negocio al siguiente nivel
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.contactGrid}>
            {/* Información de contacto */}
            <div className={styles.contactInfo}>
              <h2 className={styles.infoTitle}>Datos de contacto</h2>
              
              <div className={styles.contactMethods}>
                <a 
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.contactMethod}
                >
                  <div className={styles.methodContent}>
                    <h3 className={styles.methodTitle}>WhatsApp</h3>
                    <p className={styles.methodText}>+54 9 379 478-9169</p>
                    <span className={styles.methodAction}>Enviar mensaje →</span>
                  </div>
                  <div className={styles.methodIcon}>
                    <svg width="80" height="80" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                      <circle cx="60" cy="60" r="35"/>
                      <path d="M40 75 L45 60 Q50 50, 60 50 Q70 50, 75 60 L80 75"/>
                      <circle cx="50" cy="55" r="3"/>
                      <circle cx="70" cy="55" r="3"/>
                    </svg>
                  </div>
                </a>

                <a 
                  href={`mailto:${email}`}
                  className={styles.contactMethod}
                >
                  <div className={styles.methodContent}>
                    <h3 className={styles.methodTitle}>Email</h3>
                    <p className={styles.methodText}>{email}</p>
                    <span className={styles.methodAction}>Enviar email →</span>
                  </div>
                  <div className={styles.methodIcon}>
                    <svg width="80" height="80" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                      <rect x="25" y="35" width="70" height="50" rx="4"/>
                      <path d="M25 35 L60 60 L95 35"/>
                    </svg>
                  </div>
                </a>
              </div>

              <div className={styles.ctaBox}>
                <h3 className={styles.ctaBoxTitle}>¿Preferís una reunión?</h3>
                <p className={styles.ctaBoxText}>
                  Agendá una llamada de 30 minutos para conocernos y entender tu proyecto
                </p>
                <button 
                  onClick={agendarReunion}
                  className={styles.ctaBoxButton}
                >
                  Agendar reunión de descubrimiento
                </button>
              </div>
            </div>

            {/* Formulario */}
            <div className={styles.formWrapper}>
              <h2 className={styles.formTitle}>Envianos un mensaje</h2>
              <p className={styles.formSubtitle}>
                Completá el formulario y te respondemos a la brevedad
              </p>
              
              <form onSubmit={handleSubmit} className={styles.form}>
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
                    placeholder="Tu nombre completo"
                  />
                </div>

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
                  <label htmlFor="telefono" className={styles.label}>Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="+54 9 379 478-9169"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="mensaje" className={styles.label}>Mensaje *</label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleChange}
                    required
                    className={styles.textarea}
                    placeholder="Contanos qué necesitás o qué te gustaría automatizar..."
                    rows={6}
                  />
                </div>

                <button type="submit" className={styles.submitButton}>
                  Enviar por WhatsApp
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ rápido */}
      <section className={styles.faqSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Preguntas frecuentes</h2>
          
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>¿Cuánto tarda un proyecto?</h3>
              <p className={styles.faqAnswer}>
                Depende del alcance. Un chatbot básico puede estar en 2-3 semanas. Desarrollos más complejos pueden tomar 1-3 meses.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>¿Cómo es el proceso de trabajo?</h3>
              <p className={styles.faqAnswer}>
                Relevamiento → Propuesta → Desarrollo iterativo → Lanzamiento → Acompañamiento. Siempre con comunicación constante.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>¿Dan soporte después del lanzamiento?</h3>
              <p className={styles.faqAnswer}>
                Sí. Todos nuestros proyectos incluyen soporte post-lanzamiento y ajustes según necesites.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>¿Trabajan con empresas de cualquier tamaño?</h3>
              <p className={styles.faqAnswer}>
                Sí. Desde emprendimientos hasta empresas medianas. Lo importante es que haya un problema concreto que resolver.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
