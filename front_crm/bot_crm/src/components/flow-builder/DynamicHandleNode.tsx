import { memo, useMemo } from 'react';
import { Handle, Position, NodeProps, useStore } from 'reactflow';
import styles from './CustomNode.module.css';
import { 
  MessageSquare, 
  GitBranch, 
  Database, 
  CheckCircle, 
  AlertCircle,
  Webhook,
  Mail,
  Clock,
  Plus
} from 'lucide-react';

// Iconos SVG de apps
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const OpenAIIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
);

const WooCommerceIcon = () => (
  <img 
    src="/logos tecnologias/woocommerce.png" 
    alt="WooCommerce" 
    width="32" 
    height="32"
    style={{ borderRadius: '4px' }}
  />
);

const appIcons: Record<string, any> = {
  'WhatsApp Business Cloud': WhatsAppIcon,
  'WhatsApp': WhatsAppIcon,
  'OpenAI (ChatGPT, Sora, DALL-E, Whisper)': OpenAIIcon,
  'OpenAI': OpenAIIcon,
  'GPT': OpenAIIcon,
  'WooCommerce': WooCommerceIcon,
};

const appColors: Record<string, string> = {
  'WhatsApp Business Cloud': '#25D366',
  'WhatsApp': '#25D366',
  'OpenAI (ChatGPT, Sora, DALL-E, Whisper)': '#10a37f',
  'OpenAI': '#10a37f',
  'GPT': '#10a37f',
  'WooCommerce': '#96588a',
  'MercadoPago': '#009ee3',
  'HTTP': '#0ea5e9',
  'Webhooks': '#c13584',
  'Gmail': '#ea4335',
};

const nodeIcons: Record<string, any> = {
  message: MessageSquare,
  input: MessageSquare,
  question: MessageSquare,
  condition: GitBranch,
  api: Database,
  api_call: Database,
  webhook: Webhook,
  email: Mail,
  delay: Clock,
  validation: CheckCircle,
  error: AlertCircle,
  gpt: OpenAIIcon,
};

const nodeColors: Record<string, string> = {
  message: '#6366f1',
  input: '#25D366',
  question: '#8b5cf6',
  condition: '#f59e0b',
  api: '#10b981',
  api_call: '#96588a',
  webhook: '#ec4899',
  email: '#3b82f6',
  delay: '#6b7280',
  validation: '#14b8a6',
  error: '#ef4444',
  gpt: '#10a37f',
};

// Función para calcular ángulo entre dos puntos
function calculateAngle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

// Función para obtener posición del handle según ángulo
function getHandlePosition(angle: number): Position {
  const deg = (angle * 180) / Math.PI;
  
  if (deg >= -45 && deg < 45) return Position.Right;
  if (deg >= 45 && deg < 135) return Position.Bottom;
  if (deg >= 135 || deg < -135) return Position.Left;
  return Position.Top;
}

function DynamicHandleNode({ id, data, selected }: NodeProps) {
  const AppIcon = data.appName ? appIcons[data.appName] : null;
  const Icon = AppIcon || nodeIcons[data.type] || MessageSquare;
  const color = data.appName ? (appColors[data.appName] || '#6366f1') : (nodeColors[data.type] || '#6366f1');

  // Obtener posiciones de todos los nodos y edges
  const nodes = useStore((state) => state.nodeInternals);
  const edges = useStore((state) => state.edges);

  // Calcular handles dinámicos basados en conexiones
  const dynamicHandles = useMemo(() => {
    const currentNode = nodes.get(id);
    if (!currentNode) return [];

    const handles: Array<{
      id: string;
      type: 'source' | 'target';
      position: Position;
      angle: number;
      connectedNodeId: string;
    }> = [];

    // Encontrar edges conectados a este nodo
    const connectedEdges = edges.filter(
      (edge) => edge.source === id || edge.target === id
    );

    connectedEdges.forEach((edge) => {
      const isSource = edge.source === id;
      const connectedNodeId = isSource ? edge.target : edge.source;
      const connectedNode = nodes.get(connectedNodeId);

      if (connectedNode) {
        const angle = calculateAngle(
          currentNode.position.x,
          currentNode.position.y,
          connectedNode.position.x,
          connectedNode.position.y
        );

        const position = getHandlePosition(angle);

        // Usar connectedNodeId como parte del ID para que sea único y consistente
        handles.push({
          id: `${isSource ? 'source' : 'target'}-${connectedNodeId}`,
          type: isSource ? 'source' : 'target',
          position,
          angle,
          connectedNodeId,
        });
      }
    });

    // Si no hay conexiones, agregar handles por defecto
    if (handles.length === 0) {
      handles.push(
        { id: 'default-top', type: 'target', position: Position.Top, angle: -Math.PI / 2, connectedNodeId: '' },
        { id: 'default-bottom', type: 'source', position: Position.Bottom, angle: Math.PI / 2, connectedNodeId: '' }
      );
    }

    return handles;
  }, [id, nodes, edges]);

  return (
    <div className={styles.nodeContainer}>
      {/* Círculo principal del nodo */}
      <div 
        className={`${styles.nodeCircle} ${selected ? styles.selected : ''}`}
        style={{ 
          background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
          boxShadow: `0 6px 16px ${color}40`,
          border: '4px solid #f5f5f7'
        }}
      >
        {AppIcon ? <AppIcon /> : <Icon size={32} color="white" strokeWidth={2} />}
      </div>

      {/* Handles dinámicos que giran alrededor del nodo */}
      {dynamicHandles.map((handle) => {
        // Calcular posición en el círculo usando el ángulo
        // Radio del círculo (40px) + mitad del handle (10px) = 50px
        const radius = 50;
        const x = Math.cos(handle.angle) * radius;
        const y = Math.sin(handle.angle) * radius;

        return (
          <Handle
            key={handle.id}
            type={handle.type}
            position={handle.position}
            id={handle.id}
            className={styles.handleDynamic}
            style={{
              background: color,
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}

      {/* Botón + para agregar */}
      <button 
        className={styles.addButtonDynamic}
        title="Agregar módulo"
        style={{ 
          background: color,
          right: '-45px',
          top: '50%',
          transform: 'translateY(-50%)'
        }}
      >
        <Plus size={16} color="white" strokeWidth={3} />
      </button>

      {/* Badge con número */}
      {data.config?.id && (
        <div 
          className={styles.nodeBadge}
          style={{
            top: '-8px',
            right: '-8px'
          }}
        >
          {data.config.id.split('-').pop()?.substring(0, 2) || '1'}
        </div>
      )}

      {/* Nombre del nodo debajo */}
      <div className={styles.nodeLabel}>
        {data.label}
      </div>

      {/* Subtítulo/descripción */}
      {data.config?.message && (
        <div className={styles.nodeSubtitle}>
          {data.config.message.substring(0, 30)}
          {data.config.message.length > 30 ? '...' : ''}
        </div>
      )}
    </div>
  );
}

export default memo(DynamicHandleNode);
