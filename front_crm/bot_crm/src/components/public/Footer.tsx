import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Columna 1: Empresa */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Momento IA</h3>
            <p className={styles.description}>
              Automatización inteligente para tu negocio. Chatbots, dashboards y desarrollos a medida.
            </p>
          </div>

          {/* Columna 2: Links rápidos */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Links rápidos</h4>
            <nav className={styles.linkList}>
              <Link href="/" className={styles.link}>Inicio</Link>
              <Link href="/neuralbot" className={styles.link}>NeuralBot</Link>
              <Link href="/inmodash" className={styles.link}>InmoDash</Link>
              <Link href="/desarrollos" className={styles.link}>Desarrollos a medida</Link>
              <Link href="/sobre-nosotros" className={styles.link}>Sobre Momento IA</Link>
            </nav>
          </div>

          {/* Columna 3: Contacto */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Contacto</h4>
            <div className={styles.linkList}>
              <a 
                href="https://wa.me/5493794789169" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.link}
              >
                WhatsApp
              </a>
              <a 
                href="mailto:contacto@momentoia.co" 
                className={styles.link}
              >
                Email
              </a>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.legal}>
            © {new Date().getFullYear()} Momento IA. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
