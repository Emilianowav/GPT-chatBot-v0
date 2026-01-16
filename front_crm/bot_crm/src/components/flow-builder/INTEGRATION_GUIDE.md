# Guía de Integración - Variable Selector

## 🎯 Cómo Integrar el Selector en Modales Existentes

### Paso 1: Importar el componente

```tsx
import { VariableInput } from '@/components/flow-builder/VariableInput';
import { useNodes } from 'reactflow';
```

### Paso 2: Obtener nodos disponibles

```tsx
function MyModal() {
  const nodes = useNodes();
  
  // Convertir nodos a formato del selector
  const availableNodes = nodes
    .filter(node => node.id !== currentNodeId) // Excluir nodo actual
    .map(node => ({
      id: node.id,
      label: node.data?.label || node.id,
      type: node.type || 'unknown'
    }));
  
  // Variables globales comunes
  const globalVariables = [
    'mensaje_usuario',
    'telefono_cliente',
    'telefono_empresa',
    'phoneNumberId',
    'historial_conversacion',
    'productos_carrito',
    'total',
    'confirmacion_compra',
    'mercadopago_link',
    'mercadopago_estado'
  ];
  
  // ... resto del componente
}
```

### Paso 3: Reemplazar inputs normales con VariableInput

**Antes:**
```tsx
<textarea
  value={config.message}
  onChange={(e) => setConfig({ ...config, message: e.target.value })}
  placeholder="Mensaje..."
  rows={5}
  className="w-full px-3 py-2 border rounded-md"
/>
```

**Después:**
```tsx
<VariableInput
  value={config.message}
  onChange={(value) => setConfig({ ...config, message: value })}
  label="Mensaje"
  placeholder="Mensaje..."
  multiline
  rows={5}
  availableNodes={availableNodes}
  globalVariables={globalVariables}
/>
```

## 📋 Modales a Actualizar

### 1. GPTConfigModal.tsx
- `systemPrompt` → VariableInput multiline
- `personalidad` → VariableInput multiline
- Contenido de tópicos → VariableInput multiline

### 2. WhatsAppNode.tsx (modal interno)
- `message` → VariableInput multiline
- `to` → VariableInput
- `phoneNumberId` → VariableInput

### 3. MercadoPagoConfigModal.tsx
- `titulo` → VariableInput
- `notificationUrl` → VariableInput

### 4. EdgeConfigModal.tsx (filtros)
- Valor de condición → VariableInput

### 5. WooCommerceNode.tsx (modal interno)
- Parámetros de búsqueda → VariableInput

## 🔧 Ejemplo Completo: WhatsApp Modal

```tsx
import React, { useState } from 'react';
import { useNodes } from 'reactflow';
import { VariableInput } from '@/components/flow-builder/VariableInput';

interface WhatsAppConfig {
  module: 'send-message' | 'send-media';
  message?: string;
  to?: string;
  phoneNumberId?: string;
}

export function WhatsAppConfigModal({ 
  isOpen, 
  onClose, 
  onSave,
  currentNodeId 
}: Props) {
  const [config, setConfig] = useState<WhatsAppConfig>({
    module: 'send-message',
    message: '',
    to: '{{1.from}}',
    phoneNumberId: ''
  });

  const nodes = useNodes();
  const availableNodes = nodes
    .filter(node => node.id !== currentNodeId)
    .map(node => ({
      id: node.id,
      label: node.data?.label || node.id,
      type: node.type || 'unknown'
    }));

  const globalVariables = [
    'mensaje_usuario',
    'telefono_cliente',
    'phoneNumberId',
    'mercadopago_link'
  ];

  if (!isOpen) return null;

  return (
    <div className="modal">
      <h2>Configurar WhatsApp</h2>
      
      {/* Módulo */}
      <div className="mb-4">
        <label>Módulo</label>
        <select
          value={config.module}
          onChange={(e) => setConfig({ 
            ...config, 
            module: e.target.value as any 
          })}
        >
          <option value="send-message">Enviar Mensaje</option>
          <option value="send-media">Enviar Media</option>
        </select>
      </div>

      {/* Mensaje con selector de variables */}
      <VariableInput
        value={config.message || ''}
        onChange={(value) => setConfig({ ...config, message: value })}
        label="Mensaje"
        placeholder="Escribe el mensaje o usa variables..."
        multiline
        rows={5}
        availableNodes={availableNodes}
        globalVariables={globalVariables}
      />

      {/* Destinatario con selector de variables */}
      <VariableInput
        value={config.to || ''}
        onChange={(value) => setConfig({ ...config, to: value })}
        label="Destinatario"
        placeholder="{{1.from}} o número directo"
        availableNodes={availableNodes}
        globalVariables={globalVariables}
      />

      {/* Phone Number ID (opcional) */}
      <VariableInput
        value={config.phoneNumberId || ''}
        onChange={(value) => setConfig({ ...config, phoneNumberId: value })}
        label="Phone Number ID (opcional)"
        placeholder="Dejar vacío para usar el predeterminado"
        availableNodes={availableNodes}
        globalVariables={globalVariables}
      />

      <div className="flex gap-2 mt-4">
        <button onClick={onClose}>Cancelar</button>
        <button onClick={() => onSave(config)}>Guardar</button>
      </div>
    </div>
  );
}
```

## 🎨 Estilos Requeridos

El componente usa Tailwind CSS. Asegúrate de que tu proyecto tenga configurado:

```js
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      zIndex: {
        '9999': '9999',
      }
    },
  },
}
```

## 📝 Notas Importantes

1. **Z-Index**: El selector usa `z-[9999]` para aparecer sobre modales
2. **Posicionamiento**: Se posiciona automáticamente al lado del input
3. **Responsive**: Ajusta su posición si no hay espacio
4. **Accesibilidad**: Soporta navegación con teclado (ESC para cerrar)
5. **Performance**: Usa `memo` y `useCallback` para optimizar renders

## 🚀 Deploy

Después de integrar en todos los modales:

```bash
cd front_crm/bot_crm
npm run build
git add .
git commit -m "feat: agregar selector flotante de variables en modales"
git push
```
