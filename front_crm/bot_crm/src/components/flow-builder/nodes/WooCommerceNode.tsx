import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { SimpleNode } from './SimpleNode';

const WooCommerceIcon = ({ size = 60 }: { size?: number; color?: string }) => (
  <img 
    src="/logos tecnologias/woocommerce.png" 
    alt="WooCommerce" 
    style={{ width: `${size}px`, height: `${size}px`, objectFit: 'contain' }}
  />
);

interface WooCommerceNodeData {
  label: string;
  subtitle?: string;
  executionCount?: number;
  hasConnection?: boolean;
  onHandleClick?: (nodeId: string) => void;
  onNodeClick?: (nodeId: string) => void;
  config?: {
    apiConfigId: string;
    endpointId: string;
    parametros?: Record<string, any>;
    responseConfig?: {
      arrayPath?: string;
      idField?: string;
      displayField?: string;
      priceField?: string;
      stockField?: string;
    };
    mensajeSinResultados?: string;
  };
}

function WooCommerceNode(props: NodeProps<WooCommerceNodeData>) {
  const color = '#96588a'; // WooCommerce purple

  const simpleNodeData = {
    ...props.data,
    label: props.data.label || 'WooCommerce',
    subtitle: 'E-commerce',
    icon: WooCommerceIcon,
    color,
    executionCount: props.data.executionCount || 1,
  };

  return <SimpleNode {...props} data={simpleNodeData} />;
}

export default memo(WooCommerceNode);
