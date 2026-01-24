import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { SimpleNode } from './SimpleNode';

const MercadoPagoIcon = ({ size = 60 }: { size?: number; color?: string }) => (
  <img 
    src="/logos tecnologias/mp-logo.png" 
    alt="MercadoPago" 
    style={{ width: `${size}px`, height: `${size}px`, objectFit: 'contain' }}
  />
);

interface MercadoPagoNodeData {
  label: string;
  subtitle?: string;
  executionCount?: number;
  onHandleClick?: (nodeId: string) => void;
  onNodeClick?: (nodeId: string) => void;
  config?: {
    tipo: 'crear_preferencia' | 'verificar_pago';
    credenciales?: any;
    configuracion?: any;
  };
}

function MercadoPagoNode(props: NodeProps<MercadoPagoNodeData>) {
  const color = '#009ee3'; // MercadoPago blue

  const subtitle = props.data.config?.tipo === 'crear_preferencia' 
    ? 'Link de Pago' 
    : props.data.config?.tipo || props.data.subtitle;

  const simpleNodeData = {
    ...props.data,
    label: props.data.label || 'MercadoPago',
    subtitle: 'Payment',
    icon: MercadoPagoIcon,
    color,
    executionCount: props.data.executionCount || 1,
  };

  return <SimpleNode {...props} data={simpleNodeData} />;
}

export default memo(MercadoPagoNode);
