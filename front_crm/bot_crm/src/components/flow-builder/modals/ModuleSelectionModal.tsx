import { memo, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import styles from './ModuleSelectionModal.module.css';

/**
 * MODULE SELECTION MODAL - Modal de selección de módulo estilo Make.com
 * 
 * Características:
 * - Header con nombre de app + badge "Verified"
 * - Botón "BACK"
 * - Categorías: MESSAGE, MEDIA, etc.
 * - Lista de módulos por categoría
 * - Badges: INSTANT, ACID
 * - Búsqueda en la parte inferior
 */

interface Module {
  id: string;
  name: string;
  description: string;
  category: string;
  badges?: string[];
  icon?: React.ReactNode;
}

interface ModuleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  appName: string;
  appIcon: React.ReactNode;
  appColor: string;
  verified?: boolean;
  modules: Module[];
  onSelectModule: (module: Module) => void;
}

function ModuleSelectionModal({
  isOpen,
  onClose,
  onBack,
  appName,
  appIcon,
  appColor,
  verified = true,
  modules,
  onSelectModule,
}: ModuleSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredModules = modules.filter(module =>
    module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Agrupar módulos por categoría
  const modulesByCategory = filteredModules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <button className={styles.backButton} onClick={onBack}>
            <ArrowLeft size={20} />
            <span>BACK</span>
          </button>
        </div>

        {/* App Info */}
        <div 
          className={styles.appInfo}
          style={{ background: `${appColor}15` }}
        >
          <div 
            className={styles.appIconLarge}
            style={{ background: appColor }}
          >
            {appIcon}
          </div>
          <div className={styles.appDetails}>
            <h2 className={styles.appName}>{appName}</h2>
            {verified && (
              <span className={styles.verifiedBadge}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Verified
              </span>
            )}
          </div>
        </div>

        {/* Módulos por categoría */}
        <div className={styles.modulesList}>
          {Object.entries(modulesByCategory).map(([category, categoryModules]) => (
            <div key={category} className={styles.categorySection}>
              <h3 className={styles.categoryTitle}>{category}</h3>
              {categoryModules.map((module) => (
                <div
                  key={module.id}
                  className={styles.moduleItem}
                  onClick={() => onSelectModule(module)}
                >
                  <div 
                    className={styles.moduleIcon}
                    style={{ background: appColor }}
                  >
                    {module.icon || appIcon}
                  </div>
                  <div className={styles.moduleInfo}>
                    <div className={styles.moduleHeader}>
                      <span className={styles.moduleName}>{module.name}</span>
                      {module.badges && module.badges.length > 0 && (
                        <div className={styles.moduleBadges}>
                          {module.badges.map((badge, index) => (
                            <span 
                              key={index}
                              className={styles.moduleBadge}
                              style={{ 
                                background: badge === 'INSTANT' ? '#8b5cf6' : '#10a37f' 
                              }}
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className={styles.moduleDescription}>{module.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Búsqueda */}
        <div className={styles.searchContainer}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search modules"
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(ModuleSelectionModal);
