import styles from './page.module.css';

export default function SobreNosotrosPage() {
  const whatsappLink = 'https://wa.me/5493794789169?text=Hola%2C%20quiero%20conocer%20m%C3%A1s%20sobre%20Momento%20IA';

  return (
    <div className={styles.page}>
      {/* Hero - Centered with Animated Loader */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            {/* Animated Loader */}
            <div className={styles.loaderContainer}>
              <svg className={styles.loaderSvg} viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#00D4FF', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#0047FF', stopOpacity: 1 }} />
                  </linearGradient>
                  <filter id="gooey">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur" />
                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" result="gooey" />
                    <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
                  </filter>
                </defs>
                <g filter="url(#gooey)">
                  <circle className={styles.blob} cx="100" cy="100" r="30" />
                  <circle className={styles.blob} cx="100" cy="100" r="30" />
                  <circle className={styles.blob} cx="100" cy="100" r="30" />
                  <circle className={styles.blob} cx="100" cy="100" r="30" />
                  <circle className={styles.blob} cx="100" cy="100" r="30" />
                  <circle className={styles.blob} cx="100" cy="100" r="30" />
                </g>
              </svg>
              <div className={styles.loaderGlow}></div>
            </div>
            
            <h1 className={styles.heroTitle}>
              Sobre <span className={styles.gradient}>Momento IA</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Un equipo obsesionado con hacer que la tecnología trabaje para vos.
            </p>
          </div>
        </div>
      </section>

      {/* Propósito */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.purposeContent}>
            <h2 className={styles.sectionTitle}>Nuestro propósito</h2>
            <p className={styles.purposeText}>
              Nacimos para traducir el mundo de la IA y el desarrollo en soluciones concretas que mejoren el día a día de las empresas. 
              Menos teoría, más cosas funcionando.
            </p>
            <p className={styles.purposeText}>
              Creemos que la tecnología debe ser accesible, práctica y medible. No vendemos humo: si no mejora tu operación, 
              no tiene sentido hacerlo.
            </p>
          </div>
        </div>
      </section>

      {/* El equipo */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>El equipo</h2>
          
          <div className={styles.teamGrid}>
            <div className={styles.teamMember}>
              <div className={styles.memberPhoto}>
                <div className={styles.photoPlaceholder}>FE</div>
              </div>
              <h3 className={styles.memberName}>Facundo Esquivel</h3>
              <p className={styles.memberRole}>Co-fundador · Senior Developer</p>
              <p className={styles.memberBio}>
                Especializado en arquitectura de software, automatización de procesos y diseño de sistemas escalables. 
                Lidera la parte técnica de los proyectos más complejos.
              </p>
            </div>

            <div className={styles.teamMember}>
              <div className={styles.memberPhoto}>
                <div className={styles.photoPlaceholder}>ED</div>
              </div>
              <h3 className={styles.memberName}>Emiliano De Biassi</h3>
              <p className={styles.memberRole}>Co-fundador · Senior Developer</p>
              <p className={styles.memberBio}>
                Foco en integraciones, APIs y performance. Traduce necesidades de negocio en soluciones estables y seguras.
              </p>
            </div>

            <div className={styles.teamMember}>
              <div className={styles.memberPhoto}>
                <div className={styles.photoPlaceholder}>IP</div>
              </div>
              <h3 className={styles.memberName}>Ignacio Prado</h3>
              <p className={styles.memberRole}>Diseño y Desarrollo Frontend</p>
              <p className={styles.memberBio}>
                Diseñador y programador junior. Se encarga de que las interfaces sean claras, estéticas y fáciles de usar para el cliente final.
              </p>
            </div>

            <div className={styles.teamMember}>
              <div className={styles.memberPhoto}>
                <div className={styles.photoPlaceholder}>JI</div>
              </div>
              <h3 className={styles.memberName}>Juan Ignacio</h3>
              <p className={styles.memberRole}>Dirección de Marketing y Desarrollo</p>
              <p className={styles.memberBio}>
                Estrategia, funnels y métricas. Ayuda a conectar la tecnología con objetivos comerciales reales.
              </p>
            </div>
          </div>

          <div className={styles.teamNote}>
            <p>
              Todos programamos, entendemos de negocio y hablamos el "idioma" del cliente. 
              No hay intermediarios entre tu problema y la solución.
            </p>
          </div>
        </div>
      </section>

      {/* Cómo trabajamos */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Cómo trabajamos</h2>
          
          <div className={styles.workingGrid}>
            <div className={styles.workingItem}>
              <div>
                <h3 className={styles.workingTitle}>Comunicación clara</h3>
                <p className={styles.workingText}>
                  Sin tecnicismos innecesarios. Te explicamos todo en lenguaje simple y directo.
                </p>
              </div>
              <div className={styles.workingIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M30 40 Q30 30, 40 30 L80 30 Q90 30, 90 40 L90 70 Q90 80, 80 80 L50 80 L30 95 L30 80"/>
                  <line x1="45" y1="50" x2="75" y2="50"/>
                  <line x1="45" y1="60" x2="65" y2="60"/>
                </svg>
              </div>
            </div>

            <div className={styles.workingItem}>
              <div>
                <h3 className={styles.workingTitle}>Enfoque en resultados</h3>
                <p className={styles.workingText}>
                  Medimos tiempo ahorrado, leads atendidos, ventas. No solo "features" implementadas.
                </p>
              </div>
              <div className={styles.workingIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <rect x="30" y="30" width="60" height="60"/>
                  <line x1="40" y1="70" x2="40" y2="50"/>
                  <line x1="50" y1="70" x2="50" y2="45"/>
                  <line x1="60" y1="70" x2="60" y2="55"/>
                  <line x1="70" y1="70" x2="70" y2="40"/>
                </svg>
              </div>
            </div>

            <div className={styles.workingItem}>
              <div>
                <h3 className={styles.workingTitle}>Relación a largo plazo</h3>
                <p className={styles.workingText}>
                  No solo "proyectos sueltos". Queremos ser tu equipo de tecnología de confianza.
                </p>
              </div>
              <div className={styles.workingIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M60 45 Q50 35, 40 45 Q30 55, 40 65 L60 85 L80 65 Q90 55, 80 45 Q70 35, 60 45"/>
                </svg>
              </div>
            </div>

            <div className={styles.workingItem}>
              <div>
                <h3 className={styles.workingTitle}>Iteración constante</h3>
                <p className={styles.workingText}>
                  Ajustamos sobre la marcha. Tu feedback es parte del proceso de desarrollo.
                </p>
              </div>
              <div className={styles.workingIcon}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth="1.5">
                  <circle cx="60" cy="60" r="30"/>
                  <path d="M60 30 L70 40 M60 30 L50 40"/>
                  <path d="M90 60 L80 70 M90 60 L80 50"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>
            ¿Querés conocer más sobre nosotros?
          </h2>
          <p className={styles.ctaSubtitle}>
            Charlemos sobre tu proyecto y cómo podemos ayudarte
          </p>
          <a 
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaButton}
          >
            Contactar con el equipo
          </a>
        </div>
      </section>
    </div>
  );
}
