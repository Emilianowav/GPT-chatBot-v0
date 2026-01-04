'use client';

import { useState } from 'react';
import { X, Search } from 'lucide-react';
import styles from './AppsModal.module.css';

interface App {
  id: string;
  name: string;
  icon: any;
  color: string;
  category: string;
  modules?: Module[];
}

interface Module {
  id: string;
  name: string;
  description: string;
  type: string;
}

// Iconos SVG de marcas oficiales
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const OpenAIIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
);

const WooCommerceIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M23.004 8.5c-.002-1.381-1.119-2.498-2.5-2.5H3.497c-1.381.002-2.498 1.119-2.5 2.5v7c.002 1.381 1.119 2.498 2.5 2.5h17.007c1.381-.002 2.498-1.119 2.5-2.5v-7zm-1.5 7c-.001.827-.673 1.499-1.5 1.5H3.497c-.827-.001-1.499-.673-1.5-1.5v-7c.001-.827.673-1.499 1.5-1.5h17.007c.827.001 1.499.673 1.5 1.5v7z"/>
    <path d="M5.5 10h2v4h-2zm3 0h2v4h-2zm3 0h2v4h-2zm3 0h2v4h-2zm3 0h2v4h-2z"/>
  </svg>
);

const MercadoPagoIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M15.5 2.5h-7C6.57 2.5 5 4.07 5 6v12c0 1.93 1.57 3.5 3.5 3.5h7c1.93 0 3.5-1.57 3.5-3.5V6c0-1.93-1.57-3.5-3.5-3.5zm-7 1.5h7c1.1 0 2 .9 2 2v.5H6.5V6c0-1.1.9-2 2-2zm7 15h-7c-1.1 0-2-.9-2-2V8.5h11V18c0 1.1-.9 2-2 2z"/>
    <circle cx="12" cy="13.5" r="2.5"/>
  </svg>
);

const HTTPIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 5-5v3h4v4h-4v3zm10-5l-5 5v-3h-4v-4h4V7l5 5z"/>
  </svg>
);

const WebhooksIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M10 15l5.88-5.88c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41L11.41 16.5c-.39.39-1.02.39-1.41 0-.39-.39-.39-1.02 0-1.41zM17.5 8.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5.67 1.5 1.5 1.5 1.5-.67 1.5-1.5zM8.5 14.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
  </svg>
);

const GmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
  </svg>
);

const apps: App[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business Cloud',
    icon: WhatsAppIcon,
    color: '#25D366',
    category: 'Communication',
    modules: [
      { id: 'whatsapp_send', name: 'Enviar Mensaje', description: 'Envía un mensaje de WhatsApp', type: 'conversational_response' },
      { id: 'whatsapp_receive', name: 'Recibir Mensaje', description: 'Recibe mensajes de WhatsApp', type: 'webhook' },
      { id: 'whatsapp_collect', name: 'Recopilar Respuesta', description: 'Pregunta y guarda la respuesta', type: 'conversational_collect' }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT, Sora, DALL-E, Whisper)',
    icon: OpenAIIcon,
    color: '#10a37f',
    category: 'AI',
    modules: [
      { id: 'gpt_chat', name: 'Chat Completion', description: 'Genera respuestas con GPT', type: 'gpt_transform' },
      { id: 'gpt_transform', name: 'Transformar Datos', description: 'Convierte texto a JSON', type: 'gpt_transform' },
      { id: 'gpt_analyze', name: 'Analizar Texto', description: 'Analiza sentimiento o intención', type: 'gpt_transform' }
    ]
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    icon: WooCommerceIcon,
    color: '#96588a',
    category: 'E-commerce',
    modules: [
      { id: 'woo_get_products', name: 'Obtener Productos', description: 'Lista productos de la tienda', type: 'api_call' },
      { id: 'woo_search', name: 'Buscar Productos', description: 'Busca productos por término', type: 'api_call' },
      { id: 'woo_create_order', name: 'Crear Pedido', description: 'Crea un nuevo pedido', type: 'api_call' }
    ]
  },
  {
    id: 'mercadopago',
    name: 'MercadoPago',
    icon: MercadoPagoIcon,
    color: '#009ee3',
    category: 'Payments',
    modules: [
      { id: 'mp_payment_link', name: 'Generar Link de Pago', description: 'Crea un link de pago', type: 'mercadopago_payment' },
      { id: 'mp_check_payment', name: 'Verificar Pago', description: 'Consulta estado de pago', type: 'api_call' }
    ]
  },
  {
    id: 'http',
    name: 'HTTP',
    icon: HTTPIcon,
    color: '#0ea5e9',
    category: 'Integrations',
    modules: [
      { id: 'http_get', name: 'GET Request', description: 'Realiza petición GET', type: 'api_call' },
      { id: 'http_post', name: 'POST Request', description: 'Realiza petición POST', type: 'api_call' }
    ]
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    icon: WebhooksIcon,
    color: '#c13584',
    category: 'Integrations',
    modules: [
      { id: 'webhook_trigger', name: 'Webhook Trigger', description: 'Inicia flujo con webhook', type: 'webhook' }
    ]
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: GmailIcon,
    color: '#ea4335',
    category: 'Communication',
    modules: [
      { id: 'gmail_send', name: 'Enviar Email', description: 'Envía un correo electrónico', type: 'api_call' }
    ]
  }
];

interface AppsModalProps {
  onClose: () => void;
  onSelectModule: (moduleType: string, moduleName: string, appName: string) => void;
  position?: { x: number; y: number };
}

export default function AppsModal({ onClose, onSelectModule, position }: AppsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<App | null>(null);

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAppClick = (app: App) => {
    if (app.modules && app.modules.length > 0) {
      setSelectedApp(app);
    } else {
      onSelectModule('custom', app.name, app.name);
    }
  };

  const handleModuleClick = (module: Module) => {
    if (selectedApp) {
      onSelectModule(module.type, module.name, selectedApp.name);
      onClose();
    }
  };

  const handleBack = () => {
    setSelectedApp(null);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{selectedApp ? selectedApp.name : 'ALL APPS'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {!selectedApp ? (
          <>
            <div className={styles.searchContainer}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search apps or modules"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
                autoFocus
              />
            </div>

            <div className={styles.appsList}>
              {filteredApps.map((app) => {
                const Icon = app.icon;
                return (
                  <div
                    key={app.id}
                    className={styles.appItem}
                    onClick={() => handleAppClick(app)}
                  >
                    <div 
                      className={styles.appIcon}
                      style={{ background: app.color }}
                    >
                      <Icon size={24} />
                    </div>
                    <div className={styles.appInfo}>
                      <div className={styles.appName}>{app.name}</div>
                      <div className={styles.appCategory}>{app.category}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <button className={styles.backBtn} onClick={handleBack}>
              ← Volver a apps
            </button>

            <div className={styles.modulesList}>
              {selectedApp.modules?.map((module) => (
                <div
                  key={module.id}
                  className={styles.moduleItem}
                  onClick={() => handleModuleClick(module)}
                >
                  <div className={styles.moduleName}>{module.name}</div>
                  <div className={styles.moduleDescription}>{module.description}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
