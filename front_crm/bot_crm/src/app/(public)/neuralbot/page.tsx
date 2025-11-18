import styles from './page.module.css';

export default function NeuralBotPage() {
  const whatsappLink = 'https://wa.me/5493794789169?text=Hola%2C%20quiero%20solicitar%20una%20demo%20de%20NeuralBot';
  const automateLink = 'https://wa.me/5493794789169?text=Hola%2C%20quiero%20automatizar%20mi%20atenci%C3%B3n%20con%20NeuralBot';

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              NeuralBot: tu nuevo equipo de<br />
              <span className={styles.gradient}>atención, ventas y soporte</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Un chatbot conversacional que entiende a tus clientes, responde, vende y se integra con las herramientas que ya usás.
            </p>
            <a 
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaPrimary}
            >
              Solicitar demo de NeuralBot
            </a>
          </div>
        </div>
      </section>

      {/* Qué hace NeuralBot */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Qué hace NeuralBot</h2>
          
          <div className={styles.modulesGrid}>
            <div className={styles.module}>
              <div>
                <h3 className={styles.moduleTitle}>Atención 24/7</h3>
                <p className={styles.moduleText}>
                  Responde consultas en WhatsApp, web, Instagram y más. Siempre disponible, siempre rápido.
                </p>
              </div>
              <div className={styles.moduleIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M30 40 Q30 30, 40 30 L80 30 Q90 30, 90 40 L90 70 Q90 80, 80 80 L50 80 L30 95 L30 80 Q20 80, 20 70 L20 40 Q20 30, 30 30"/>
                  <circle cx="45" cy="55" r="3"/>
                  <circle cx="60" cy="55" r="3"/>
                  <circle cx="75" cy="55" r="3"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.module}>
              <div>
                <h3 className={styles.moduleTitle}>Flujos personalizados</h3>
                <p className={styles.moduleText}>
                  Ventas, turnos, soporte, reclamos, seguimiento. Diseñamos el flujo que tu negocio necesita.
                </p>
              </div>
              <div className={styles.moduleIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <circle cx="60" cy="30" r="12"/>
                  <path d="M60 42 L60 60"/>
                  <circle cx="40" cy="75" r="12"/>
                  <circle cx="80" cy="75" r="12"/>
                  <path d="M60 60 L40 63 M60 60 L80 63"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.module}>
              <div>
                <h3 className={styles.moduleTitle}>Integraciones modulares</h3>
                <p className={styles.moduleText}>
                  ChatGPT, APIs propias, Mercado Pago, CRMs. Conectamos con lo que ya usás.
                </p>
              </div>
              <div className={styles.moduleIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <circle cx="30" cy="60" r="15"/>
                  <circle cx="90" cy="60" r="15"/>
                  <path d="M45 60 L75 60"/>
                  <circle cx="60" cy="30" r="10"/>
                  <circle cx="60" cy="90" r="10"/>
                  <path d="M60 40 L60 50 M60 70 L60 80"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Canales */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Presente donde está tu cliente</h2>
          
          <div className={styles.channelsGrid}>
            <div className={styles.channel}>
              <div>
                <h3 className={styles.channelName}>WhatsApp Business</h3>
                <p className={styles.channelDesc}>API oficial para atención profesional</p>
              </div>
              <div className={styles.channelIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <circle cx="60" cy="60" r="35"/>
                  <path d="M40 75 L45 60 Q50 50, 60 50 Q70 50, 75 60 L80 75"/>
                  <circle cx="50" cy="55" r="3"/>
                  <circle cx="70" cy="55" r="3"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.channel}>
              <div>
                <h3 className={styles.channelName}>Instagram / Facebook</h3>
                <p className={styles.channelDesc}>Respuestas automáticas en Meta</p>
              </div>
              <div className={styles.channelIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <rect x="35" y="35" width="50" height="50" rx="12"/>
                  <circle cx="60" cy="60" r="12"/>
                  <circle cx="75" cy="45" r="3"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.channel}>
              <div>
                <h3 className={styles.channelName}>Webchat embebido</h3>
                <p className={styles.channelDesc}>En tu sitio web, siempre visible</p>
              </div>
              <div className={styles.channelIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <rect x="25" y="35" width="70" height="50" rx="4"/>
                  <line x1="25" y1="45" x2="95" y2="45"/>
                  <circle cx="35" cy="40" r="2"/>
                  <circle cx="42" cy="40" r="2"/>
                  <circle cx="49" cy="40" r="2"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.channel}>
              <div>
                <h3 className={styles.channelName}>Integración API</h3>
                <p className={styles.channelDesc}>Conectá con otros canales personalizados</p>
              </div>
              <div className={styles.channelIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M40 50 L50 60 L40 70"/>
                  <path d="M80 50 L70 60 L80 70"/>
                  <line x1="55" y1="45" x2="65" y2="75"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo ayuda al negocio */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Cómo ayuda a tu negocio</h2>
          
          <div className={styles.benefitsGrid}>
            <div className={styles.benefit}>
              <div>
                <h3 className={styles.benefitTitle}>Más ventas</h3>
                <p className={styles.benefitText}>
                  Respuestas rápidas, sin perder leads. Atendés a todos, todo el tiempo.
                </p>
              </div>
              <div className={styles.benefitNumber}>01</div>
            </div>
            
            <div className={styles.benefit}>
              <div>
                <h3 className={styles.benefitTitle}>Menos soporte manual</h3>
                <p className={styles.benefitText}>
                  Ahorro de tiempo en respuestas repetitivas. Tu equipo se enfoca en lo importante.
                </p>
              </div>
              <div className={styles.benefitNumber}>02</div>
            </div>
            
            <div className={styles.benefit}>
              <div>
                <h3 className={styles.benefitTitle}>Mejor información</h3>
                <p className={styles.benefitText}>
                  Reportes de conversaciones, motivos de consulta, horas pico. Datos para decidir mejor.
                </p>
              </div>
              <div className={styles.benefitNumber}>03</div>
            </div>
          </div>
        </div>
      </section>

      {/* Integraciones clave */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Integraciones clave</h2>
          
          <div className={styles.integrationsGrid}>
            <div className={styles.integration}>
              <div>
                <h3 className={styles.integrationTitle}>ChatGPT / OpenAI</h3>
                <p className={styles.integrationText}>
                  Respuestas inteligentes y contextuales, entrenadas con tu información.
                </p>
              </div>
            </div>
            
            <div className={styles.integration}>
              <div>
                <h3 className={styles.integrationTitle}>Mercado Pago</h3>
                <p className={styles.integrationText}>
                  Cobros automatizados directamente desde el chat.
                </p>
              </div>
            </div>
            
            <div className={styles.integration}>
              <div>
                <h3 className={styles.integrationTitle}>CRMs y sistemas internos</h3>
                <p className={styles.integrationText}>
                  Sincronización con tus bases de datos y herramientas de gestión.
                </p>
              </div>
            </div>
            
            <div className={styles.integration}>
              <div>
                <h3 className={styles.integrationTitle}>E-commerce</h3>
                <p className={styles.integrationText}>
                  WooCommerce, Shopify, Tienda Nube y más plataformas de venta.
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
            Contanos qué proceso querés automatizar y te mostramos un flujo armado para tu negocio
          </h2>
          <a 
            href={automateLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaButton}
          >
            Quiero automatizar mi atención
          </a>
        </div>
      </section>
    </div>
  );
}
