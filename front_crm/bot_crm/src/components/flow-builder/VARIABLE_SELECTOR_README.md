# Variable Selector - Selector Flotante de Variables

## 📋 Descripción

Componente flotante para seleccionar variables disponibles en el flujo, similar al selector de Make.com.

## 🎯 Características

- ✅ **Selector flotante** - Aparece al lado del input
- ✅ **Búsqueda en tiempo real** - Filtra variables mientras escribes
- ✅ **Categorías** - Sistema, Globales, Nodos
- ✅ **Autocompletado** - Se abre automáticamente al escribir `{{`
- ✅ **Iconos por tipo** - Visual para identificar el tipo de variable
- ✅ **Inserción inteligente** - Inserta en la posición del cursor

## 📦 Componentes

### 1. `VariableSelector.tsx`
Selector flotante principal con lista de variables.

### 2. `VariableInput.tsx`
Input mejorado que integra el selector de variables.

## 🚀 Uso Básico

```tsx
import { VariableInput } from '@/components/flow-builder/VariableInput';

function MyComponent() {
  const [message, setMessage] = useState('');
  
  // Obtener nodos disponibles del flujo
  const availableNodes = [
    { id: 'gpt-1', label: 'GPT Clasificador', type: 'gpt' },
    { id: 'mercadopago-1', label: 'MercadoPago', type: 'mercadopago' }
  ];
  
  // Variables globales disponibles
  const globalVariables = [
    'mensaje_usuario',
    'telefono_cliente',
    'productos_carrito',
    'total'
  ];

  return (
    <VariableInput
      value={message}
      onChange={setMessage}
      label="Mensaje"
      placeholder="Escribe tu mensaje..."
      multiline
      rows={5}
      availableNodes={availableNodes}
      globalVariables={globalVariables}
    />
  );
}
```

## 🎨 Ejemplo de Integración en Modal

```tsx
import { VariableInput } from '@/components/flow-builder/VariableInput';
import { useNodes } from 'reactflow';

function WhatsAppConfigModal({ isOpen, onClose, onSave }) {
  const [config, setConfig] = useState({
    message: '',
    to: ''
  });
  
  const nodes = useNodes();
  const availableNodes = nodes.map(node => ({
    id: node.id,
    label: node.data.label || node.id,
    type: node.type
  }));

  return (
    <div className="modal">
      <h2>Configurar WhatsApp</h2>
      
      {/* Campo de mensaje con selector de variables */}
      <VariableInput
        value={config.message}
        onChange={(value) => setConfig({ ...config, message: value })}
        label="Mensaje"
        placeholder="Escribe el mensaje..."
        multiline
        rows={5}
        availableNodes={availableNodes}
        globalVariables={['mensaje_usuario', 'telefono_cliente']}
      />
      
      {/* Campo de destinatario con selector de variables */}
      <VariableInput
        value={config.to}
        onChange={(value) => setConfig({ ...config, to: value })}
        label="Destinatario"
        placeholder="Número de teléfono o variable..."
        availableNodes={availableNodes}
        globalVariables={['telefono_cliente']}
      />
      
      <button onClick={() => onSave(config)}>Guardar</button>
    </div>
  );
}
```

## 🔧 Props de VariableInput

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `string` | - | Valor actual del input |
| `onChange` | `(value: string) => void` | - | Callback cuando cambia el valor |
| `placeholder` | `string` | "Escribe o selecciona..." | Placeholder del input |
| `label` | `string` | - | Label del campo |
| `multiline` | `boolean` | `false` | Si es textarea o input |
| `rows` | `number` | `3` | Filas del textarea |
| `availableNodes` | `Array<{id, label, type}>` | `[]` | Nodos disponibles |
| `globalVariables` | `string[]` | `[]` | Variables globales |
| `className` | `string` | `''` | Clase CSS adicional |

## 📊 Variables por Tipo de Nodo

### GPT
- `{{nodo-id.respuesta_gpt}}` - Respuesta del GPT
- `{{nodo-id.tokens}}` - Tokens usados
- `{{nodo-id.costo}}` - Costo de la llamada

### MercadoPago
- `{{nodo-id.preferencia_id}}` - ID de preferencia
- `{{nodo-id.link_pago}}` - Link de pago
- `{{nodo-id.estado_pago}}` - Estado del pago
- `{{nodo-id.mensaje}}` - Mensaje formateado

### WooCommerce
- `{{nodo-id.productos}}` - Lista de productos
- `{{nodo-id.total_productos}}` - Total de productos

### Sistema
- `{{mensaje_usuario}}` - Mensaje actual del usuario
- `{{telefono_cliente}}` - Teléfono del cliente
- `{{telefono_empresa}}` - Teléfono de la empresa
- `{{phoneNumberId}}` - ID del número de WhatsApp
- `{{historial_conversacion}}` - Historial completo

## 🎯 Atajos de Teclado

- `{{` - Abre el selector automáticamente
- `ESC` - Cierra el selector
- Click fuera - Cierra el selector
- Click en variable - Inserta y cierra

## 🎨 Personalización

El selector usa Tailwind CSS y puede personalizarse modificando las clases en:
- `VariableSelector.tsx` - Estilos del selector flotante
- `VariableInput.tsx` - Estilos del input

## 📝 Notas

- El selector se posiciona automáticamente al lado derecho del input
- Las variables se insertan en la posición del cursor
- El contador de variables muestra cuántas variables hay en el texto
- Las categorías se pueden filtrar con los botones de la parte superior
