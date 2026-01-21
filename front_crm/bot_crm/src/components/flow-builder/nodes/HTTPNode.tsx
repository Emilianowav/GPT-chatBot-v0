import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { SimpleNode } from './SimpleNode';
import { Globe } from 'lucide-react';

const HTTPIcon = ({ size = 40, color = '#3b82f6' }: { size?: number; color?: string }) => (
  <Globe size={size} color={color} strokeWidth={2} />
);

interface HTTPNodeData {
  label: string;
  subtitle?: string;
  executionCount?: number;
  hasConnection?: boolean;
  onHandleClick?: (nodeId: string) => void;
  onNodeClick?: (nodeId: string) => void;
  config?: {
    module: string;
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: string;
    timeout?: number;
  };
}

function HTTPNode(props: NodeProps<HTTPNodeData>) {
  const color = '#3b82f6';

  const simpleNodeData = {
    ...props.data,
    label: props.data.label || 'HTTP',
    subtitle: props.data.config?.method || 'Request',
    icon: HTTPIcon,
    color,
    executionCount: props.data.executionCount || 1,
  };

  return <SimpleNode {...props} data={simpleNodeData} />;
}

export default memo(HTTPNode);
