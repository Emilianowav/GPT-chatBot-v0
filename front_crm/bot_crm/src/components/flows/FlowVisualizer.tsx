'use client';

import { useState, useEffect } from 'react';
import { Menu, MessageSquare, GitBranch, Zap, Globe, Brain, Play } from 'lucide-react';
import styles from './FlowVisualizer.module.css';

interface FlowNode {
  _id?: string;
  id: string;
  type: string;
  name: string;
  next?: string;
  options?: Array<{ text: string; next?: string }>;
  conditions?: Array<{ next?: string }>;
  action?: { onSuccess?: string; onError?: string };
}

interface FlowVisualizerProps {
  nodes: FlowNode[];
  startNode: string;
  onSelectNode: (node: FlowNode) => void;
}

const nodeTypeIcons: Record<string, any> = {
  menu: Menu,
  input: MessageSquare,
  message: MessageSquare,
  condition: GitBranch,
  action: Zap,
  api_call: Globe,
  gpt: Brain
};

export default function FlowVisualizer({ nodes, startNode, onSelectNode }: FlowVisualizerProps) {
  const [nodeMap, setNodeMap] = useState<Map<string, FlowNode>>(new Map());

  useEffect(() => {
    const map = new Map<string, FlowNode>();
    nodes.forEach(node => map.set(node.id, node));
    setNodeMap(map);
  }, [nodes]);

  const getIconClass = (type: string) => {
    const classMap: Record<string, string> = {
      menu: styles.nodeIconMenu,
      input: styles.nodeIconInput,
      message: styles.nodeIconMessage,
      condition: styles.nodeIconCondition,
      action: styles.nodeIconAction,
      api_call: styles.nodeIconApiCall,
      gpt: styles.nodeIconGpt
    };
    return classMap[type] || styles.nodeIconMenu;
  };

  const renderNode = (node: FlowNode, isStart: boolean = false) => {
    const Icon = nodeTypeIcons[node.type] || MessageSquare;

    return (
      <div
        key={node.id}
        onClick={() => onSelectNode(node)}
        className={styles.node}
      >
        <div className={styles.nodeHeader}>
          <div className={`${styles.nodeIcon} ${getIconClass(node.type)}`}>
            <Icon style={{ width: '18px', height: '18px' }} />
          </div>
          <div className={styles.nodeInfo}>
            <div className={styles.nodeName}>{node.name}</div>
            <div className={styles.nodeType}>{node.type}</div>
          </div>
        </div>
        {isStart && <div className={styles.startBadge}>INICIO</div>}
      </div>
    );
  };

  if (nodes.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <Brain className={styles.emptyIcon} />
          <div className={styles.emptyTitle}>Sin nodos</div>
          <div className={styles.emptyText}>
            Crea nodos para visualizar el flujo conversacional
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.canvas}>
        {nodes.map((node, index) => (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: `${(index % 3) * 250 + 40}px`,
              top: `${Math.floor(index / 3) * 150 + 40}px`
            }}
          >
            {renderNode(node, node.id === startNode)}
          </div>
        ))}
      </div>
    </div>
  );
}
