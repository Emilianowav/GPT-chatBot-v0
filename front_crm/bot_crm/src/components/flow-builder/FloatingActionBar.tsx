'use client';

import { useState } from 'react';
import { Plus, Variable, BookOpen, Settings, Play, Pause, Save, StickyNote } from 'lucide-react';
import styles from './FloatingActionBar.module.css';

interface FloatingActionBarProps {
  onAddNode: () => void;
  onAddNote?: () => void;
  onOpenVariables: () => void;
  onOpenTopics: () => void;
  onOpenSettings?: () => void;
  onToggleFlowStatus?: () => void;
  onSave?: () => void;
  isFlowActive?: boolean;
  flowId?: string | null;
  hasUnsavedChanges?: boolean;
}

export default function FloatingActionBar({
  onAddNode,
  onAddNote,
  onOpenVariables,
  onOpenTopics,
  onOpenSettings,
  onToggleFlowStatus,
  onSave,
  isFlowActive = false,
  flowId,
  hasUnsavedChanges = false,
}: FloatingActionBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      id: 'add-node',
      icon: <Plus size={20} />,
      label: 'Agregar Nodo',
      color: '#8B5CF6',
      onClick: onAddNode,
    },
    {
      id: 'add-note',
      icon: <StickyNote size={20} />,
      label: 'Agregar Nota',
      color: '#F59E0B',
      onClick: onAddNote,
    },
    {
      id: 'variables',
      icon: <Variable size={20} />,
      label: 'Variables Globales',
      color: '#3B82F6',
      onClick: onOpenVariables,
    },
    {
      id: 'topics',
      icon: <BookOpen size={20} />,
      label: 'Tópicos',
      color: '#10B981',
      onClick: onOpenTopics,
    },
  ];

  if (onSave) {
    actions.push({
      id: 'save',
      icon: <Save size={20} />,
      label: 'Guardar Flujo',
      color: '#F59E0B',
      onClick: onSave,
    });
  }

  if (onToggleFlowStatus && flowId) {
    actions.push({
      id: 'flow-status',
      icon: isFlowActive ? <Pause size={20} /> : <Play size={20} />,
      label: isFlowActive ? 'Pausar flujo' : 'Activar flujo',
      color: isFlowActive ? '#10B981' : '#6B7280',
      onClick: onToggleFlowStatus,
    });
  }

  if (onOpenSettings) {
    actions.push({
      id: 'settings',
      icon: <Settings size={20} />,
      label: 'Configuración',
      color: '#6B7280',
      onClick: onOpenSettings,
    });
  }

  return (
    <div className={styles.container}>
      <div 
        className={`${styles.actionBar} ${isExpanded ? styles.expanded : ''}`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {actions.map((action, index) => (
          <button
            key={action.id}
            className={`${styles.actionButton} ${action.id === 'save' && hasUnsavedChanges ? styles.hasChanges : ''}`}
            onClick={action.onClick}
            style={{
              backgroundColor: action.color,
              transitionDelay: isExpanded ? `${index * 50}ms` : '0ms',
            }}
            title={action.label}
          >
            <div className={styles.iconWrapper}>
              {action.icon}
            </div>
            <span className={styles.label}>
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
