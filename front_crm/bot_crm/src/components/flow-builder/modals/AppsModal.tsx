import { memo, useState } from 'react';
import { X, Search } from 'lucide-react';
import styles from './AppsModal.module.css';

/**
 * APPS MODAL - Modal de selección de apps estilo Make.com
 * 
 * Características:
 * - Lista de apps disponibles
 * - Búsqueda en la parte inferior
 * - Scroll vertical
 * - Categoría "ALL APPS"
 */

interface App {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  category?: string;
}

interface AppsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectApp: (app: App) => void;
  position?: { x: number; y: number };
}

// Iconos SVG de apps (en blanco)
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const OpenAIIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
);

const WooCommerceIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
    <path d="M23.5 9.5c-.3-1.2-1.5-1.9-2.7-1.6L19 8.6c-.4-1.9-1.9-3.4-3.8-3.8L14.5 3c.3-1.2-.4-2.4-1.6-2.7-1.2-.3-2.4.4-2.7 1.6l-.7 2.8c-1.9.4-3.4 1.9-3.8 3.8L3 8.9c-1.2-.3-2.4.4-2.7 1.6-.3 1.2.4 2.4 1.6 2.7l2.8.7c.4 1.9 1.9 3.4 3.8 3.8l.7 2.8c.3 1.2 1.5 1.9 2.7 1.6 1.2-.3 1.9-1.5 1.6-2.7l-.7-2.8c1.9-.4 3.4-1.9 3.8-3.8l2.8-.7c1.2-.3 1.9-1.5 1.6-2.7zM12 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
  </svg>
);

const AVAILABLE_APPS: App[] = [
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    icon: <div style={{ fontSize: '20px' }}>📊</div>,
    color: '#34a853',
  },
  {
    id: 'flow-control',
    name: 'Flow Control',
    icon: <div style={{ fontSize: '20px' }}>🔀</div>,
    color: '#a3e635',
  },
  {
    id: 'tools',
    name: 'Tools',
    icon: <div style={{ fontSize: '20px' }}>🔧</div>,
    color: '#6366f1',
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    icon: <div style={{ fontSize: '20px' }}>🔗</div>,
    color: '#c13584',
  },
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT, Sora, DALL-E, Whisper)',
    icon: <OpenAIIcon />,
    color: '#10a37f',
  },
  {
    id: 'http',
    name: 'HTTP',
    icon: <div style={{ fontSize: '20px' }}>🌐</div>,
    color: '#0ea5e9',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: <div style={{ fontSize: '20px' }}>📧</div>,
    color: '#ea4335',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    icon: <WooCommerceIcon />,
    color: '#96588a',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business Cloud',
    icon: <WhatsAppIcon />,
    color: '#25D366',
  },
];

function AppsModal({ isOpen, onClose, onSelectApp, position }: AppsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredApps = AVAILABLE_APPS.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAppClick = (app: App) => {
    onSelectApp(app);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        style={position ? {
          position: 'absolute',
          left: position.x + 150,
          top: position.y - 200,
        } : undefined}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>ALL APPS</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Lista de apps */}
        <div className={styles.appsList}>
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className={styles.appItem}
              onClick={() => handleAppClick(app)}
            >
              <div 
                className={styles.appIcon}
                style={{ background: app.color }}
              >
                {app.icon}
              </div>
              <span className={styles.appName}>{app.name}</span>
            </div>
          ))}
        </div>

        {/* Búsqueda */}
        <div className={styles.searchContainer}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search apps or modules"
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(AppsModal);
