'use client';

// 📐 Layout del Dashboard
import { useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '../Sidebar/Sidebar';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { empresa } = useAuth();

  return (
    <div className={styles.container}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <button 
            className={styles.menuButton}
            onClick={() => setSidebarOpen(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className={styles.headerContent}>
            {title && <h1 className={styles.title}>{title}</h1>}
            <div className={styles.headerRight}>
              <span className={styles.empresaBadge}>
                {empresa?.empresaNombre}
              </span>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
