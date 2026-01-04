'use client';

import { useState } from 'react';
import { X, Search, MessageSquare, Bot, Globe, DollarSign, Webhook as WebhookIcon, Mail, ShoppingCart } from 'lucide-react';
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

const apps: App[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business Cloud',
    icon: MessageSquare,
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
    icon: Bot,
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
    icon: ShoppingCart,
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
    icon: DollarSign,
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
    icon: Globe,
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
    icon: WebhookIcon,
    color: '#c13584',
    category: 'Integrations',
    modules: [
      { id: 'webhook_trigger', name: 'Webhook Trigger', description: 'Inicia flujo con webhook', type: 'webhook' }
    ]
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: Mail,
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
