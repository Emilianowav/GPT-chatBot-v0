# Integración Modal Webhook MercadoPago

## ✅ Archivos Creados

### 1. Componente Modal
**Ubicación:** `front_crm/bot_crm/src/components/flow-builder/modals/MercadoPagoWebhookModal.tsx`

**Características:**
- ✅ Loader mientras carga la conexión a MercadoPago
- ✅ Historial de pagos con vista de lista compacta
- ✅ Vista de detalle de cada pago individual
- ✅ Estadísticas (pagos aprobados, ingresos totales, pagos del mes, pendientes)
- ✅ Exportación a CSV
- ✅ Exportación a PDF (impresión)
- ✅ Estilos compactos y modernos

### 2. Estilos CSS
**Ubicación:** `front_crm/bot_crm/src/components/flow-builder/modals/MercadoPagoWebhookModal.module.css`

**Características:**
- Diseño compacto y responsive
- Grid de 2 columnas (lista + detalle)
- Scrollbars personalizados
- Estados de loading, error y vacío
- Colores según estado del pago (aprobado, pendiente, rechazado)

## 🔧 Integración Pendiente

### Paso 1: Importar el Modal en page.tsx

Agregar al inicio del archivo `front_crm/bot_crm/src/app/dashboard/flow-builder/page.tsx`:

```typescript
import MercadoPagoWebhookModal from '@/components/flow-builder/modals/MercadoPagoWebhookModal';
```

### Paso 2: Agregar Estado para el Modal

Agregar después de la línea 263 (donde están los otros estados de modales):

```typescript
const [showMercadoPagoWebhookModal, setShowMercadoPagoWebhookModal] = useState(false);
```

### Paso 3: Modificar la Lógica de Click en Nodos Webhook

Modificar la función `handleNodeClick` (líneas 340-364) para detectar webhooks de MercadoPago:

```typescript
const handleNodeClick = useCallback((nodeId: string) => {
  setNodes(currentNodes => {
    const node = currentNodes.find(n => n.id === nodeId);
    if (node) {
      // Si es un nodo HTTP, abrir modal específico
      if (node.type === 'http') {
        setSelectedNode(node);
        setShowHTTPConfigModal(true);
      }
      // Si es un nodo WhatsApp/Webhook, verificar si es webhook de MercadoPago
      else if (node.type === 'whatsapp' || node.type === 'webhook') {
        // Verificar si es webhook de MercadoPago por el label o config
        const isMercadoPagoWebhook = 
          node.data?.label?.toLowerCase().includes('mercadopago') ||
          node.data?.label?.toLowerCase().includes('verificar') ||
          node.data?.config?.module === 'mercadopago-webhook';
        
        if (isMercadoPagoWebhook) {
          setSelectedNode(node);
          setShowMercadoPagoWebhookModal(true);
        } else {
          setSelectedNode(node);
          setShowWebhookConfigModal(true);
        }
      }
      // Si es un nodo de MercadoPago, abrir modal específico
      else if (node.type === 'mercadopago') {
        setSelectedNode(node);
        setShowMercadoPagoConfigModal(true);
      } else {
        setSelectedNode(node);
        setShowConfigPanel(true);
      }
    }
    return currentNodes;
  });
}, []);
```

### Paso 4: Agregar el Modal al JSX

Agregar después del `<MercadoPagoConfigModal>` (alrededor de la línea 1910):

```typescript
<MercadoPagoWebhookModal
  isOpen={showMercadoPagoWebhookModal}
  onClose={() => {
    setShowMercadoPagoWebhookModal(false);
    setSelectedNode(null);
  }}
  empresaId={selectedNode?.data?.config?.empresaId || 'default'}
  empresaNombre={selectedNode?.data?.config?.empresaNombre}
/>
```

### Paso 5: Obtener empresaId del Contexto

Si no tienes `empresaId` en el nodo, puedes obtenerlo del contexto global o de localStorage:

```typescript
// Opción 1: Desde localStorage
const empresaId = localStorage.getItem('empresaId') || 'default';

// Opción 2: Desde el contexto del flow
const empresaId = currentFlowId || 'default';

// Usar en el modal:
<MercadoPagoWebhookModal
  isOpen={showMercadoPagoWebhookModal}
  onClose={() => {
    setShowMercadoPagoWebhookModal(false);
    setSelectedNode(null);
  }}
  empresaId={empresaId}
  empresaNombre="Veo Veo Libros"
/>
```

## 🎨 Características del Modal

### Vista de Lista
- Muestra pagos en orden cronológico descendente
- Información compacta: estado, monto, ID, email, fecha
- Iconos de estado con colores:
  - ✅ Verde: Aprobado
  - ⏰ Amarillo: Pendiente
  - ❌ Rojo: Rechazado
- Click en un pago para ver detalle

### Vista de Detalle
- Estado y monto destacados
- ID de pago de MercadoPago
- Referencia externa (carrito ID)
- Método y tipo de pago
- Información del pagador (nombre, email, teléfono)
- Fechas de creación y aprobación

### Estadísticas
- 4 cards compactos en la parte superior:
  - Pagos Aprobados (total)
  - Ingresos Totales ($)
  - Pagos del Mes (cantidad)
  - Ingresos del Mes ($)

### Exportación
- **CSV**: Descarga archivo con todos los pagos en formato tabular
- **PDF**: Abre ventana de impresión con reporte formateado

## 🔌 API Backend

El modal consume estos endpoints:

1. **GET** `/api/modules/mercadopago/payments/history/:empresaId`
   - Lista todos los pagos de una empresa
   - Parámetros opcionales: `status`, `limit`, `offset`

2. **GET** `/api/modules/mercadopago/payments/stats/:empresaId`
   - Estadísticas agregadas de pagos

## 🧪 Testing

1. Abrir el flow builder
2. Crear o seleccionar un nodo webhook de MercadoPago
3. Click en el nodo
4. Verificar que se abre el modal con loader
5. Verificar que carga el historial de pagos
6. Click en un pago para ver detalle
7. Probar exportación a CSV
8. Probar exportación a PDF

## 📝 Notas

- El modal detecta automáticamente si hay conexión a MercadoPago
- Si no hay pagos, muestra un estado vacío amigable
- Si hay error, muestra mensaje de error con botón de reintentar
- Los estilos son compactos y responsive (funciona en mobile)
- El scrollbar está personalizado para mejor UX
