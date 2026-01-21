import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { SimpleNode } from './SimpleNode';
import { Bell } from 'lucide-react';

const WebhookIcon = ({ size = 40, color = '#C13584' }: { size?: number; color?: string }) => (
  <Bell size={size} color={color} strokeWidth={2} />
);

interface WebhookNodeData {
  label: string;
  subtitle?: string;
  executionCount?: number;
  onHandleClick?: (nodeId: string) => void;
  onNodeClick?: (nodeId: string) => void;
  config?: {
    tipo: 'listener' | 'trigger';
    endpoint?: string;
    metodo?: string;
    filtros?: any;
    timeout?: number;
  };
}

function WebhookNode(props: NodeProps<WebhookNodeData>) {
  const color = '#ff6b6b'; // Webhook red

  const subtitle = props.data.config?.tipo === 'listener' 
    ? 'Escuchando' 
    : props.data.config?.tipo || props.data.subtitle;

  const simpleNodeData = {
    ...props.data,
    label: props.data.label || 'Webhook',
    subtitle: 'Trigger',
    icon: WebhookIcon,
    color,
    executionCount: props.data.executionCount || 1,
  };

  return <SimpleNode {...props} data={simpleNodeData} />;
}

export default memo(WebhookNode);
