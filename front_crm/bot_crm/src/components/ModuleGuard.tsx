// 🛡️ Guard para proteger componentes que requieren módulos específicos
'use client';

import { ReactNode } from 'react';
import { useModules } from '@/hooks/useModules';
import styles from './ModuleGuard.module.css';

interface ModuleGuardProps {
  moduleId: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export default function ModuleGuard({ 
  moduleId, 
  children, 
  fallback,
  showUpgradePrompt = true 
}: ModuleGuardProps) {
  const { hasModule, getModule, loading } = useModules();

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Verificando acceso...</p>
      </div>
    );
  }

  if (!hasModule(moduleId)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradePrompt) {
      const module = getModule(moduleId);
      return (
        <div className={styles.upgradePrompt}>
          <div className={styles.upgradeContent}>
            <div className={styles.icon}>🔒</div>
            <h2>Módulo no disponible</h2>
            <p>
              {module ? (
                <>
                  El módulo <strong>{module.nombre}</strong> no está activo en tu plan.
                </>
              ) : (
                <>Este módulo no está disponible en tu plan actual.</>
              )}
            </p>
            {module && (
              <div className={styles.moduleInfo}>
                <div className={styles.moduleIcon}>{module.icono}</div>
                <div>
                  <h3>{module.nombre}</h3>
                  <p>{module.descripcion}</p>
                  <div className={styles.price}>
                    <span className={styles.priceAmount}>${module.precio}</span>
                    <span className={styles.pricePeriod}>/mes</span>
                  </div>
                </div>
              </div>
            )}
            <button className={styles.upgradeButton}>
              Activar módulo
            </button>
            <a href="/dashboard" className={styles.backLink}>
              Volver al dashboard
            </a>
          </div>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}
