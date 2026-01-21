import React, { useEffect, useState } from 'react';
import { Node, Edge } from 'reactflow';
import { AlertTriangle, CheckCircle, XCircle, Info, GripVertical } from 'lucide-react';
import styles from './FlowValidationPanel.module.css';

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  nodeId?: string;
  nodeLabel?: string;
  message: string;
}

interface FlowValidationPanelProps {
  nodes: Node[];
  edges: Edge[];
  onNodeSelect?: (nodeId: string) => void;
  onOpenNodeConfig?: (nodeId: string, nodeType: string) => void;
}

export const FlowValidationPanel: React.FC<FlowValidationPanelProps> = ({ 
  nodes, 
  edges,
  onNodeSelect,
  onOpenNodeConfig
}) => {
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('flowValidationPanelPosition');
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 420, y: 20 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    validateFlow();
  }, [nodes, edges]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.grip-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.preventDefault();
      e.stopPropagation();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Limitar a los bordes de la ventana
        const maxX = window.innerWidth - 400;
        const maxY = window.innerHeight - 100;
        
        const boundedX = Math.max(0, Math.min(newX, maxX));
        const boundedY = Math.max(0, Math.min(newY, maxY));
        
        setPosition({ x: boundedX, y: boundedY });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        localStorage.setItem('flowValidationPanelPosition', JSON.stringify(position));
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, position]);

  const validateFlow = () => {
    const foundIssues: ValidationIssue[] = [];

    // Función helper para obtener número de nodo secuencial
    const getNodeNumber = (nodeId: string): number => {
      const index = nodes.findIndex(n => n.id === nodeId);
      return index + 1; // 1-indexed
    };

    // Verificar nodo WhatsApp inicial
    const whatsappNode = nodes.find(n => n.type === 'whatsapp');
    if (!whatsappNode) {
      foundIssues.push({
        type: 'error',
        message: 'No hay nodo WhatsApp inicial (webhook) configurado'
      });
    } else if (whatsappNode.data?.config?.module !== 'watch-events') {
      const nodeNumber = getNodeNumber(whatsappNode.id);
      foundIssues.push({
        type: 'warning',
        nodeId: whatsappNode.id,
        nodeLabel: whatsappNode.data?.label,
        message: `[Nodo #${nodeNumber}] ${whatsappNode.data?.label}: Debe estar configurado como "watch-events"`
      });
    }

    // Verificar nodos GPT
    const gptNodes = nodes.filter(n => n.type === 'gpt');
    gptNodes.forEach(node => {
      const config = node.data?.config || {};
      const label = node.data?.label || 'GPT sin nombre';
      const nodeNumber = getNodeNumber(node.id);

      // API Key ya no es necesaria - se usa la del sistema automáticamente
      
      // Verificar modelo
      if (!config.modelo) {
        foundIssues.push({
          type: 'error',
          nodeId: node.id,
          nodeLabel: label,
          message: `[Nodo #${nodeNumber}] ${label}: Falta seleccionar modelo de GPT`
        });
      }

      // Verificaciones específicas por tipo
      if (config.tipo === 'conversacional' || config.tipo === 'procesador') {
        if (!config.personalidad || config.personalidad.trim() === '') {
          foundIssues.push({
            type: 'warning',
            nodeId: node.id,
            nodeLabel: label,
            message: `[Nodo #${nodeNumber}] ${label}: Sin personalidad configurada (prompt system)`
          });
        }

        if (!config.topicos || config.topicos.length === 0) {
          foundIssues.push({
            type: 'warning',
            nodeId: node.id,
            nodeLabel: label,
            message: `[Nodo #${nodeNumber}] ${label}: Sin tópicos de información estática`
          });
        }

        if (!config.variablesEntrada || config.variablesEntrada.length === 0) {
          foundIssues.push({
            type: 'info',
            nodeId: node.id,
            nodeLabel: label,
            message: `[Nodo #${nodeNumber}] ${label}: Sin variables de entrada configuradas`
          });
        }
      }
    });

    // Verificar nodos HTTP
    const httpNodes = nodes.filter(n => n.type === 'http');
    httpNodes.forEach(node => {
      const config = node.data?.config || {};
      const label = node.data?.label || 'HTTP sin nombre';
      const nodeNumber = getNodeNumber(node.id);

      if (!config.url || config.url.trim() === '') {
        foundIssues.push({
          type: 'error',
          nodeId: node.id,
          nodeLabel: label,
          message: `[Nodo #${nodeNumber}] ${label}: Falta configurar URL del endpoint`
        });
      }

      if (!config.method) {
        foundIssues.push({
          type: 'warning',
          nodeId: node.id,
          nodeLabel: label,
          message: `[Nodo #${nodeNumber}] ${label}: Falta seleccionar método HTTP`
        });
      }
    });

    // Verificar nodos sin conexiones
    const connectedNodes = new Set<string>();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const disconnectedNodes = nodes.filter(n => 
      !connectedNodes.has(n.id) && n.type !== 'note'
    );

    disconnectedNodes.forEach(node => {
      const nodeNumber = getNodeNumber(node.id);
      foundIssues.push({
        type: 'warning',
        nodeId: node.id,
        nodeLabel: node.data?.label,
        message: `[Nodo #${nodeNumber}] ${node.data?.label || 'Nodo'}: Sin conexiones en el flujo`
      });
    });

    setIssues(foundIssues);
  };

  const handleIssueClick = (nodeId?: string) => {
    if (!nodeId) return;
    
    // Encontrar el nodo
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.type) return;
    
    // Abrir el modal de configuración correspondiente
    if (onOpenNodeConfig) {
      onOpenNodeConfig(nodeId, node.type);
    } else if (onNodeSelect) {
      // Fallback: solo seleccionar el nodo
      onNodeSelect(nodeId);
    }
  };

  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  const infos = issues.filter(i => i.type === 'info');

  if (issues.length === 0) {
    return (
      <div 
        className={styles.validationPanel}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
        onMouseDown={handleMouseDown}
      >
        <div className={`${styles.header} grip-handle`} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
          <GripVertical size={16} style={{ color: '#6c757d', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }} onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
            <CheckCircle size={20} className={styles.successIcon} />
            <span className={styles.title}>Flujo Validado</span>
          </div>
        </div>
        {isExpanded && (
          <div className={styles.content}>
            <div className={styles.successMessage}>
              ✅ El flujo está completamente configurado y listo para usar
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={styles.validationPanel}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className={`${styles.header} grip-handle`} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
        <GripVertical size={16} style={{ color: '#6c757d', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }} onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
          <AlertTriangle size={20} className={styles.warningIcon} />
          <span className={styles.title}>
            Validación del Flujo ({errors.length} errores, {warnings.length} advertencias)
          </span>
          <span className={styles.toggle}>{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.content}>
          {errors.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <XCircle size={16} className={styles.errorIcon} />
                <span>Errores Críticos ({errors.length})</span>
              </div>
              {errors.map((issue, index) => (
                <div 
                  key={index} 
                  className={`${styles.issue} ${styles.error} ${issue.nodeId ? styles.clickable : ''}`}
                  onClick={() => handleIssueClick(issue.nodeId)}
                >
                  {issue.message}
                </div>
              ))}
            </div>
          )}

          {warnings.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <AlertTriangle size={16} className={styles.warningIcon} />
                <span>Advertencias ({warnings.length})</span>
              </div>
              {warnings.map((issue, index) => (
                <div 
                  key={index} 
                  className={`${styles.issue} ${styles.warning} ${issue.nodeId ? styles.clickable : ''}`}
                  onClick={() => handleIssueClick(issue.nodeId)}
                >
                  {issue.message}
                </div>
              ))}
            </div>
          )}

          {infos.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Info size={16} className={styles.infoIcon} />
                <span>Información ({infos.length})</span>
              </div>
              {infos.map((issue, index) => (
                <div 
                  key={index} 
                  className={`${styles.issue} ${styles.info} ${issue.nodeId ? styles.clickable : ''}`}
                  onClick={() => handleIssueClick(issue.nodeId)}
                >
                  {issue.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
