import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';

const WooCommerceIcon = () => (
  <img 
    src="/logos tecnologias/woocommerce.png" 
    alt="WooCommerce" 
    width="48" 
    height="48"
    style={{ borderRadius: '4px' }}
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

  const baseNodeData = {
    ...props.data,
    icon: WooCommerceIcon,
    color,
  };

  return <BaseNode {...props} data={baseNodeData} />;
}

export default memo(WooCommerceNode);
