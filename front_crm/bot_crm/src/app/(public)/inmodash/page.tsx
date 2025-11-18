import styles from './page.module.css';

export default function InmoDashPage() {
  const whatsappLink = 'https://wa.me/5493794789169?text=Hola%2C%20quiero%20probar%20InmoDash%20en%20mi%20inmobiliaria';

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              InmoDash: el tablero de control<br />
              <span className={styles.gradient}>para tu inmobiliaria</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Clientes, consultas, propiedades y resultados en un mismo lugar.
            </p>
            <a 
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaPrimary}
            >
              Quiero probar InmoDash
            </a>
          </div>
        </div>
      </section>

      {/* Módulos principales */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Módulos principales</h2>
          
          <div className={styles.modulesGrid}>
            <div className={styles.module}>
              <div>
                <h3 className={styles.moduleTitle}>Gestión de propiedades</h3>
                <p className={styles.moduleText}>
                  Altas, bajas, características, estado. Todo tu inventario organizado y actualizado.
                </p>
              </div>
              <div className={styles.moduleIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M30 60 L60 30 L90 60 L90 90 L30 90 Z"/>
                  <rect x="50" y="65" width="20" height="25"/>
                  <rect x="40" y="45" width="15" height="15"/>
                  <rect x="65" y="45" width="15" height="15"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.module}>
              <div>
                <h3 className={styles.moduleTitle}>Gestión de consultas</h3>
                <p className={styles.moduleText}>
                  De dónde llegan, quién las atiende, en qué estado están. Sin perder ningún lead.
                </p>
              </div>
              <div className={styles.moduleIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <rect x="30" y="35" width="60" height="50" rx="4"/>
                  <line x1="40" y1="45" x2="70" y2="45"/>
                  <line x1="40" y1="55" x2="80" y2="55"/>
                  <line x1="40" y1="65" x2="75" y2="65"/>
                  <line x1="40" y1="75" x2="65" y2="75"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.module}>
              <div>
                <h3 className={styles.moduleTitle}>Embudo de ventas</h3>
                <p className={styles.moduleText}>
                  Etapas claras: nuevo, en contacto, visita, oferta, cerrado. Seguimiento visual.
                </p>
              </div>
              <div className={styles.moduleIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M35 30 L85 30 L75 50 L65 70 L55 90"/>
                  <line x1="35" y1="30" x2="45" y2="50"/>
                  <line x1="85" y1="30" x2="75" y2="50"/>
                  <line x1="45" y1="50" x2="65" y2="70"/>
                  <line x1="75" y1="50" x2="65" y2="70"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.module}>
              <div>
                <h3 className={styles.moduleTitle}>Reportes</h3>
                <p className={styles.moduleText}>
                  Propiedades más consultadas, responsables, tiempos de respuesta. Datos para decidir.
                </p>
              </div>
              <div className={styles.moduleIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <line x1="30" y1="80" x2="90" y2="80"/>
                  <line x1="30" y1="80" x2="30" y2="30"/>
                  <polyline points="40,70 50,55 60,60 70,40 80,50"/>
                  <circle cx="40" cy="70" r="3"/>
                  <circle cx="50" cy="55" r="3"/>
                  <circle cx="60" cy="60" r="3"/>
                  <circle cx="70" cy="40" r="3"/>
                  <circle cx="80" cy="50" r="3"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integración con captación */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Integración con captación</h2>
          
          <div className={styles.integrationContent}>
            <div className={styles.integrationText}>
              <h3 className={styles.integrationSubtitle}>Automatizá la carga de consultas</h3>
              <p className={styles.integrationDesc}>
                Conectamos con tus canales de captación para que no pierdas ningún lead:
              </p>
              <ul className={styles.integrationList}>
                <li>Formularios web de tu sitio</li>
                <li>Chatbots (NeuralBot integrado)</li>
                <li>Campañas en redes sociales (Meta, Google)</li>
                <li>Portales inmobiliarios (ZonaProp, Mercado Libre, etc.)</li>
              </ul>
              <p className={styles.integrationNote}>
                Todo se carga automáticamente en InmoDash, asignado al responsable correcto.
              </p>
            </div>
            
            <div className={styles.integrationVisual}>
              <div className={styles.visualBox}>
                <div className={styles.visualItem}>📱 WhatsApp</div>
                <div className={styles.visualItem}>🌐 Web Forms</div>
                <div className={styles.visualItem}>📸 Instagram</div>
                <div className={styles.visualItem}>🏢 Portales</div>
                <div className={styles.visualArrow}>↓</div>
                <div className={styles.visualDash}>InmoDash</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Beneficios para tu inmobiliaria</h2>
          
          <div className={styles.benefitsGrid}>
            <div className={styles.benefit}>
              <div>
                <h3 className={styles.benefitTitle}>Más claridad</h3>
                <p className={styles.benefitText}>
                  Estado de cada operación en tiempo real. Sabés exactamente qué está pasando.
                </p>
              </div>
              <div className={styles.benefitNumber}>01</div>
            </div>
            
            <div className={styles.benefit}>
              <div>
                <h3 className={styles.benefitTitle}>Menos Excel y WhatsApp</h3>
                <p className={styles.benefitText}>
                  Todo centralizado en un solo lugar. Adiós a las planillas desactualizadas.
                </p>
              </div>
              <div className={styles.benefitNumber}>02</div>
            </div>
            
            <div className={styles.benefit}>
              <div>
                <h3 className={styles.benefitTitle}>Mejor seguimiento</h3>
                <p className={styles.benefitText}>
                  Control del equipo comercial. Quién atiende qué, tiempos de respuesta, conversión.
                </p>
              </div>
              <div className={styles.benefitNumber}>03</div>
            </div>
          </div>
        </div>
      </section>

      {/* Características adicionales */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Características adicionales</h2>
          
          <div className={styles.featuresGrid}>
            <div className={styles.feature}>
              <div>
                <h3 className={styles.featureTitle}>Gestión de clientes</h3>
                <p className={styles.featureText}>
                  Base de datos completa con historial de interacciones y preferencias.
                </p>
              </div>
            </div>
            
            <div className={styles.feature}>
              <div>
                <h3 className={styles.featureTitle}>Notificaciones</h3>
                <p className={styles.featureText}>
                  Alertas de nuevas consultas, seguimientos pendientes y tareas del día.
                </p>
              </div>
            </div>
            
            <div className={styles.feature}>
              <div>
                <h3 className={styles.featureTitle}>Acceso móvil</h3>
                <p className={styles.featureText}>
                  Gestioná desde cualquier dispositivo, en la oficina o en la calle.
                </p>
              </div>
            </div>
            
            <div className={styles.feature}>
              <div>
                <h3 className={styles.featureTitle}>Roles y permisos</h3>
                <p className={styles.featureText}>
                  Control de acceso por usuario: agentes, supervisores, administradores.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>
            Llevá tu inmobiliaria al siguiente nivel
          </h2>
          <p className={styles.ctaSubtitle}>
            Agenda una demo personalizada y te mostramos cómo InmoDash puede transformar tu operación
          </p>
          <a 
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaButton}
          >
            Quiero ver InmoDash en acción
          </a>
        </div>
      </section>
    </div>
  );
}
