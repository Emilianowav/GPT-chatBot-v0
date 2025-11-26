'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.css';

export default function Header() {
  const whatsappNumber = '5493794789169';

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <Image 
            src="/momento_logo.svg" 
            alt="Momento IA" 
            width={100}
            height={24}
            className={styles.logoSvg}
            priority
          />
        </Link>

        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Inicio</Link>
          <div className={styles.dropdown}>
            <button className={styles.navLink} type="button">Productos</button>
            <div className={styles.dropdownContent}>
              <Link href="/neuralbot" className={styles.dropdownLink}>NeuralBot</Link>
              <Link href="/inmodash" className={styles.dropdownLink}>InmoDash</Link>
              <Link href="/desarrollos" className={styles.dropdownLink}>Desarrollo a medida</Link>
            </div>
          </div>
          <Link href="/sobre-nosotros" className={styles.navLink}>Sobre nosotros</Link>
        </nav>
      </div>
      
      <div className={styles.rightButtons}>
        <Link href="/login" className={styles.loginButton}>
          <span>Log in</span>
          <span>Log in</span>
        </Link>
        <a 
          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hola, quiero más información sobre Momento IA')}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.contactButton}
        >
          Contactarnos
        </a>
      </div>
    </header>
  );
}
