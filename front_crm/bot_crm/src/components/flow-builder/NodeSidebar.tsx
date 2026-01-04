'use client';

import { useState } from 'react';
import { 
  MessageSquare, 
  Bot, 
  Filter, 
  Globe, 
  DollarSign, 
  GitBranch,
  Webhook as WebhookIcon,
  Search
} from 'lucide-react';
import styles from './NodeSidebar.module.css';

interface NodeCategory {
  name: string;
  items: {
    type: string;
    label: string;
    icon: any;
    description: string;
  }[];
}

const nodeCategories: NodeCategory[] = [
  {
    name: 'Conversational',
    items: [
      {
        type: 'conversational_collect',
        label: 'Recopilar Info',
        icon: MessageSquare,
        description: 'Pregunta al usuario y guarda su respuesta'
      },
      {
        type: 'conversational_response',
        label: 'Responder',
        icon: MessageSquare,
        description: 'Envía un mensaje al usuario'
      }
    ]
  },
  {
    name: 'AI & Transform',
    items: [
      {
        type: 'gpt_transform',
        label: 'GPT Transform',
        icon: Bot,
        description: 'Transforma datos usando GPT'
      }
    ]
  },
  {
    name: 'Flow Control',
    items: [
      {
        type: 'filter',
        label: 'Filtro/Condición',
        icon: Filter,
        description: 'Evalúa condiciones IF/THEN'
      },
      {
        type: 'router',
        label: 'Router',
        icon: GitBranch,
        description: 'Divide el flujo en múltiples rutas'
      }
    ]
  },
  {
    name: 'Integrations',
    items: [
      {
        type: 'api_call',
        label: 'API Call',
        icon: Globe,
        description: 'Llama a una API externa (WooCommerce, etc.)'
      },
      {
        type: 'webhook',
        label: 'Webhook',
        icon: WebhookIcon,
        description: 'Punto de entrada del flujo'
      }
    ]
  },
  {
    name: 'Payments',
    items: [
      {
        type: 'mercadopago_payment',
        label: 'MercadoPago',
        icon: DollarSign,
        description: 'Genera un link de pago'
      }
    ]
  }
];

interface NodeSidebarProps {
  onAddNode: (nodeType: string) => void;
}

export default function NodeSidebar({ onAddNode }: NodeSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Conversational', 'Flow Control']);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const filteredCategories = nodeCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h3>Módulos</h3>
      </div>

      <div className={styles.searchContainer}>
        <Search size={16} />
        <input
          type="text"
          placeholder="Buscar módulos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.categories}>
        {filteredCategories.map((category) => (
          <div key={category.name} className={styles.category}>
            <button
              className={styles.categoryHeader}
              onClick={() => toggleCategory(category.name)}
            >
              <span>{category.name}</span>
              <span className={styles.categoryToggle}>
                {expandedCategories.includes(category.name) ? '−' : '+'}
              </span>
            </button>

            {expandedCategories.includes(category.name) && (
              <div className={styles.categoryItems}>
                {category.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.type}
                      className={styles.nodeItem}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.type)}
                      onClick={() => onAddNode(item.type)}
                    >
                      <div className={styles.nodeIcon}>
                        <Icon size={20} />
                      </div>
                      <div className={styles.nodeInfo}>
                        <div className={styles.nodeLabel}>{item.label}</div>
                        <div className={styles.nodeDescription}>{item.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
