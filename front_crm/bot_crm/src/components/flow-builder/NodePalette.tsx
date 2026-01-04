import { X, MessageSquare, GitBranch, Database, Webhook, Mail, Clock, CheckCircle } from 'lucide-react';
import styles from './NodePalette.module.css';

interface NodePaletteProps {
  onSelectNode: (type: string) => void;
  onClose: () => void;
}

const nodeTypes = [
  { type: 'message', label: 'Mensaje', icon: MessageSquare, color: '#6366f1', description: 'Enviar un mensaje al usuario' },
  { type: 'question', label: 'Pregunta', icon: MessageSquare, color: '#8b5cf6', description: 'Hacer una pregunta y recopilar respuesta' },
  { type: 'condition', label: 'Condición', icon: GitBranch, color: '#f59e0b', description: 'Evaluar una condición y ramificar' },
  { type: 'api', label: 'API Call', icon: Database, color: '#10b981', description: 'Llamar a una API externa' },
  { type: 'webhook', label: 'Webhook', icon: Webhook, color: '#ec4899', description: 'Enviar datos a un webhook' },
  { type: 'email', label: 'Email', icon: Mail, color: '#3b82f6', description: 'Enviar un correo electrónico' },
  { type: 'delay', label: 'Espera', icon: Clock, color: '#6b7280', description: 'Esperar un tiempo determinado' },
  { type: 'validation', label: 'Validación', icon: CheckCircle, color: '#14b8a6', description: 'Validar datos del usuario' },
];

export default function NodePalette({ onSelectNode, onClose }: NodePaletteProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.palette} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Agregar Nodo</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.grid}>
          {nodeTypes.map((node) => {
            const Icon = node.icon;
            return (
              <button
                key={node.type}
                className={styles.nodeCard}
                onClick={() => onSelectNode(node.type)}
              >
                <div 
                  className={styles.nodeIcon}
                  style={{ background: node.color }}
                >
                  <Icon size={24} color="white" />
                </div>
                <div className={styles.nodeInfo}>
                  <div className={styles.nodeLabel}>{node.label}</div>
                  <div className={styles.nodeDescription}>{node.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
