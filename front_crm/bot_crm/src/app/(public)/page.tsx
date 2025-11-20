import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  const whatsappLink = 'https://wa.me/5493794789169?text=Hola%2C%20quiero%20hablar%20con%20un%20asesor%20de%20Momento%20IA';
  const demoBotLink = 'https://wa.me/5493794789169?text=Hola%2C%20quiero%20ver%20una%20demo%20de%20NeuralBot';

  return (
    <div className={styles.page}>
      {/* Sección 1 - Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Automatizá tu negocio con IA,<br />
              <span className={styles.gradient}>sin complicarte la vida</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Chatbots, dashboards y desarrollos a medida para que tu empresa venda más y atienda mejor, 24/7.
            </p>
            <div className={styles.heroCtas}>
              <a 
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaPrimary}
              >
                <span>Quiero hablar con un asesor</span>
              </a>
              <a 
                href={demoBotLink}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaSecondary}
              >
                Ver demo de NeuralBot
              </a>
            </div>
          </div>
        </div>

        {/* Tech Stack Scroll */}
        <div className={styles.techScroll}>
          <div className={styles.techTrack}>
            {/* Primera iteración */}
            <div className={styles.techItem}>
              <img src="/logos tecnologias/react.svg" alt="React" />
            </div>
            <div className={styles.techItem}>
              <img src="/logos tecnologias/next.svg" alt="Next.js" />
            </div>
            <div className={styles.techItem}>
              <img src="/logos tecnologias/node.svg" alt="Node.js" />
            </div>
            <div className={styles.techItem}>
              <img src="/logos tecnologias/openai.svg" alt="OpenAI" />
            </div>
            <div className={styles.techItem}>
              <img src="/logos tecnologias/chatgpt.svg" alt="ChatGPT" />
            </div>
            <div className={styles.techItem}>
              <img src="/logos tecnologias/whatsapp.svg" alt="WhatsApp" />
            </div>
            <div className={styles.techItem}>
              <img src="/logos tecnologias/meta.svg" alt="Meta" />
            </div>
            <div className={styles.techItem}>
              <img src="/logos tecnologias/mysql.svg" alt="MySQL" />
            </div>
            <div className={styles.techItem}>
              <img src="/logos tecnologias/mercadopago.svg" alt="Mercado Pago" />
            </div>
            <div className={styles.techItem}>
              <img src="/logos tecnologias/ssl.svg" alt="SSL" />
            </div>
            {/* Segunda iteración para scroll infinito */}
            <div className={styles.techItem}>
              <img src="/logos tecnologias/react.svg" alt="React" />
            </div>
            <div className={styles.techItem}>
              <img src="/logos tecnologias/next.svg" alt="Next.js" />
            </div>
            <div className={styles.techItem}>
              <img src="/logos tecnologias/node.svg" alt="Node.js" />
            </div>
            <div className={styles.techItem}>
              <img src="/logos tecnologias/openai.svg" alt="OpenAI" />
            </div>
            <div className={styles.techItem}>
              <img src="/logos tecnologias/chatgpt.svg" alt="ChatGPT" />
            </div>
            <div className={styles.techItem}>
              <img src="/logos tecnologias/whatsapp.svg" alt="WhatsApp" />
            </div>
            <div className={styles.techItem}>
              <img src="/logos tecnologias/meta.svg" alt="Meta" />
            </div>
            <div className={styles.techItem}>
              <img src="/logos tecnologias/mysql.svg" alt="MySQL" />
            </div>
            <div className={styles.techItem}>
              <img src="/logos tecnologias/mercadopago.svg" alt="Mercado Pago" />
            </div>
            <div className={styles.techItem}>
              <img src="/logos tecnologias/ssl.svg" alt="SSL" />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>+50</div>
            <div className={styles.statLabel}>Proyectos completados</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>24/7</div>
            <div className={styles.statLabel}>Disponibilidad</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>+100k</div>
            <div className={styles.statLabel}>Consultas procesadas</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>98%</div>
            <div className={styles.statLabel}>Satisfacción</div>
          </div>
        </div>
      </section>

      {/* Sección 2 - Qué es Momento IA */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Somos tu equipo de IA y automatización</h2>
          <p className={styles.sectionIntro}>
            En Momento IA combinamos desarrollo de software, diseño y marketing para crear soluciones que realmente se usan: 
            chatbots conversacionales, paneles para gestión de negocios y desarrollos a medida conectados con las herramientas que ya usás.
          </p>
          
          <div className={styles.pillarsGrid}>
            <div className={styles.pillar}>
              <div>
                <h3 className={styles.pillarTitle}>Automatización</h3>
                <p className={styles.pillarText}>
                  Menos tareas repetitivas, más tiempo para decidir.
                </p>
              </div>
              <div className={styles.pillarIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M60 30 L60 50 M60 70 L60 90 M30 60 L50 60 M70 60 L90 60"/>
                  <circle cx="60" cy="60" r="8"/>
                  <circle cx="60" cy="60" r="20"/>
                </svg>
              </div>
            </div>
            <div className={styles.pillar}>
              <div>
                <h3 className={styles.pillarTitle}>Integración</h3>
                <p className={styles.pillarText}>
                  Conectamos con las plataformas que ya usás.
                </p>
              </div>
              <div className={styles.pillarIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M30 60 L50 40 L70 60 L90 40"/>
                  <circle cx="30" cy="60" r="6"/>
                  <circle cx="50" cy="40" r="6"/>
                  <circle cx="70" cy="60" r="6"/>
                  <circle cx="90" cy="40" r="6"/>
                </svg>
              </div>
            </div>
            <div className={styles.pillar}>
              <div>
                <h3 className={styles.pillarTitle}>Acompañamiento</h3>
                <p className={styles.pillarText}>
                  No solo implementamos, te ayudamos a sacarle jugo.
                </p>
              </div>
              <div className={styles.pillarIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <circle cx="60" cy="60" r="40"/>
                  <path d="M40 60 L50 70 L80 40"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 3 - Productos destacados */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Nuestros productos</h2>
          
          <div className={styles.productsGrid}>
            {/* NeuralBot */}
            <div className={styles.productCard}>
              <div className={styles.productHeader}>
                <h3 className={styles.productTitle}>NeuralBot</h3>
                <p className={styles.productSubtitle}>Chatbot inteligente para atención y ventas</p>
              </div>
              <span className={styles.productIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <circle cx="60" cy="45" r="20"/>
                  <path d="M40 65 Q40 85, 60 85 Q80 85, 80 65"/>
                  <circle cx="50" cy="40" r="3"/>
                  <circle cx="70" cy="40" r="3"/>
                  <path d="M50 50 Q60 55, 70 50"/>
                </svg>
              </span>
            </div>

            {/* InmoDash */}
            <div className={styles.productCard}>
              <div className={styles.productHeader}>
                <h3 className={styles.productTitle}>InmoDash</h3>
                <p className={styles.productSubtitle}>Tablero de gestión para inmobiliarias</p>
              </div>
              <span className={styles.productIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <rect x="30" y="30" width="60" height="60"/>
                  <line x1="30" y1="50" x2="90" y2="50"/>
                  <line x1="30" y1="70" x2="90" y2="70"/>
                  <line x1="50" y1="30" x2="50" y2="90"/>
                  <line x1="70" y1="30" x2="70" y2="90"/>
                </svg>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 4 - Tecnologías */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Tecnologías que usamos todos los días</h2>
          
          <div className={styles.techGrid}>
            {[
              { name: 'React', logo: '/logos tecnologias/react.svg' },
              { name: 'Next.js', logo: '/logos tecnologias/next.svg' },
              { name: 'Node.js', logo: '/logos tecnologias/node.svg' },
              { name: 'OpenAI', logo: '/logos tecnologias/openai.svg' },
              { name: 'ChatGPT', logo: '/logos tecnologias/chatgpt.svg' },
              { name: 'WhatsApp', logo: '/logos tecnologias/whatsapp.svg' },
              { name: 'Meta', logo: '/logos tecnologias/meta.svg' },
              { name: 'MySQL', logo: '/logos tecnologias/mysql.svg' },
              { name: 'Mercado Pago', logo: '/logos tecnologias/mercadopago.svg' },
              { name: 'SSL', logo: '/logos tecnologias/ssl.svg' },
              { name: 'React', logo: '/logos tecnologias/react.svg' },
              { name: 'Next.js', logo: '/logos tecnologias/next.svg' },
              { name: 'Node.js', logo: '/logos tecnologias/node.svg' },
              { name: 'OpenAI', logo: '/logos tecnologias/openai.svg' },
              { name: 'ChatGPT', logo: '/logos tecnologias/chatgpt.svg' },
              { name: 'WhatsApp', logo: '/logos tecnologias/whatsapp.svg' },
              { name: 'Meta', logo: '/logos tecnologias/meta.svg' },
              { name: 'MySQL', logo: '/logos tecnologias/mysql.svg' },
            ].map((tech, i) => (
              <div key={i} className={styles.techItem}>
                <img src={tech.logo} alt={tech.name} />
              </div>
            ))}
          </div>
          
          <p className={styles.techNote}>
            No vendemos "humo técnico". Elegimos tecnologías probadas y las combinamos para resolver problemas concretos en tu operación diaria.
          </p>
        </div>
      </section>

      {/* Sección 5 - Casos de uso */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Casos de uso</h2>
          
          <div className={styles.useCasesGrid}>
            <div className={styles.useCase}>
              <div>
                <h3 className={styles.useCaseTitle}>Atención 24/7</h3>
                <p className={styles.useCaseText}>
                  Respuesta inmediata a consultas, estado de pedidos y turnos.
                </p>
              </div>
              <div className={styles.useCaseIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <circle cx="60" cy="60" r="40"/>
                  <path d="M40 60 L50 70 L80 40"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.useCase}>
              <div>
                <h3 className={styles.useCaseTitle}>Ventas asistidas</h3>
                <p className={styles.useCaseText}>
                  Calificación de leads y derivación inteligente a tu equipo.
                </p>
              </div>
              <div className={styles.useCaseIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M30 90 L60 30 L90 90"/>
                  <circle cx="60" cy="30" r="8"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.useCase}>
              <div>
                <h3 className={styles.useCaseTitle}>Gestión centralizada</h3>
                <p className={styles.useCaseText}>
                  Un dashboard para propiedades, clientes y resultados.
                </p>
              </div>
              <div className={styles.useCaseIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <rect x="30" y="30" width="60" height="60"/>
                  <line x1="30" y1="50" x2="90" y2="50"/>
                  <line x1="30" y1="70" x2="90" y2="70"/>
                  <line x1="50" y1="30" x2="50" y2="90"/>
                  <line x1="70" y1="30" x2="70" y2="90"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.useCase}>
              <div>
                <h3 className={styles.useCaseTitle}>Automatización</h3>
                <p className={styles.useCaseText}>
                  Conectamos sistemas y eliminamos tareas manuales.
                </p>
              </div>
              <div className={styles.useCaseIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <circle cx="60" cy="60" r="30"/>
                  <circle cx="60" cy="60" r="8"/>
                  <line x1="60" y1="30" x2="60" y2="45"/>
                  <line x1="60" y1="75" x2="60" y2="90"/>
                  <line x1="30" y1="60" x2="45" y2="60"/>
                  <line x1="75" y1="60" x2="90" y2="60"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.useCase}>
              <div>
                <h3 className={styles.useCaseTitle}>Integración total</h3>
                <p className={styles.useCaseText}>
                  Conectamos con tus herramientas actuales sin complicaciones.
                </p>
              </div>
              <div className={styles.useCaseIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M30 60 L50 40 L70 60 L90 40"/>
                  <circle cx="30" cy="60" r="6"/>
                  <circle cx="50" cy="40" r="6"/>
                  <circle cx="70" cy="60" r="6"/>
                  <circle cx="90" cy="40" r="6"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.useCase}>
              <div>
                <h3 className={styles.useCaseTitle}>Escalabilidad</h3>
                <p className={styles.useCaseText}>
                  Crece sin límites con infraestructura que se adapta.
                </p>
              </div>
              <div className={styles.useCaseIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M30 90 L45 60 L60 75 L75 45 L90 30"/>
                  <polyline points="75,30 90,30 90,45"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 6 - CTA Final */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>
            ¿Querés llevar IA a tu negocio sin volverte loco?
          </h2>
          <a 
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaButton}
          >
            <span>Agendar una llamada con Momento IA</span>
          </a>
        </div>
      </section>
    </div>
  );
}
