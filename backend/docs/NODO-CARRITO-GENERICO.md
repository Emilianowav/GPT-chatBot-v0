# Nodo Genérico: Carrito

## Filosofía de Diseño

El nodo `carrito` es **100% configurable desde la base de datos** y puede adaptarse a cualquier flujo de venta, sin importar el tipo de producto o empresa.

## Configuración del Nodo

### Tipo: `carrito`

```json
{
  "id": "carrito-1",
  "type": "carrito",
  "data": {
    "label": "Gestión de Carrito",
    "config": {
      "action": "agregar | ver | eliminar | vaciar | actualizar_cantidad",
      
      // Configuración de campos (mapeo desde variables del flujo)
      "itemFields": {
        "id": "{{producto_seleccionado.id}}",
        "nombre": "{{producto_seleccionado.name}}",
        "precio": "{{producto_seleccionado.price}}",
        "cantidad": "{{cantidad}}",
        "imagen": "{{producto_seleccionado.image}}",
        "metadata": {
          "sku": "{{producto_seleccionado.sku}}",
          "permalink": "{{producto_seleccionado.permalink}}",
          "categoria": "{{producto_seleccionado.categories[0].name}}"
        }
      },
      
      // Formato de salida para WhatsApp (opcional)
      "outputFormat": {
        "enabled": true,
        "template": "whatsapp",  // o "custom"
        "customTemplate": null   // Si es custom, usar plantilla personalizada
      }
    }
  }
}
```

---

## Acciones Disponibles

### 1. `agregar`
Agrega un item al carrito del contacto.

**Configuración:**
```json
{
  "action": "agregar",
  "itemFields": {
    "id": "{{producto.id}}",
    "nombre": "{{producto.name}}",
    "precio": "{{producto.price}}",
    "cantidad": "{{cantidad}}",
    "imagen": "{{producto.image}}",
    "metadata": {
      "sku": "{{producto.sku}}",
      "permalink": "{{producto.permalink}}"
    }
  }
}
```

**Output:**
```json
{
  "success": true,
  "action": "agregar",
  "carrito": {
    "id": "carrito_id",
    "items_count": 3,
    "total": 125700
  },
  "mensaje": "✅ Producto agregado al carrito"
}
```

---

### 2. `ver`
Muestra el contenido del carrito.

**Configuración:**
```json
{
  "action": "ver",
  "outputFormat": {
    "enabled": true,
    "template": "whatsapp"
  }
}
```

**Output:**
```json
{
  "success": true,
  "action": "ver",
  "carrito": {
    "id": "carrito_id",
    "items": [...],
    "items_count": 3,
    "total": 125700
  },
  "mensaje_formateado": "🛒 Tu Carrito:\n\n1. LA SOLEDAD\n..."
}
```

---

### 3. `eliminar`
Elimina un item específico del carrito.

**Configuración:**
```json
{
  "action": "eliminar",
  "itemId": "{{item_id_a_eliminar}}"
}
```

---

### 4. `vaciar`
Vacía completamente el carrito.

**Configuración:**
```json
{
  "action": "vaciar"
}
```

---

### 5. `actualizar_cantidad`
Actualiza la cantidad de un item.

**Configuración:**
```json
{
  "action": "actualizar_cantidad",
  "itemId": "{{item_id}}",
  "cantidad": "{{nueva_cantidad}}"
}
```

---

## Estructura de Datos en MongoDB

### Colección: `carritos`

```typescript
{
  _id: ObjectId,
  contactoId: ObjectId,
  empresaId: string,
  items: [
    {
      id: any,                    // ID del item (flexible: number, string, etc.)
      nombre: string,
      precio: string | number,
      cantidad: number,
      imagen?: string,
      metadata: {                 // Campos adicionales configurables
        [key: string]: any
      },
      subtotal: number
    }
  ],
  total: number,
  estado: 'activo' | 'pagado' | 'cancelado',
  fechaCreacion: Date,
  fechaActualizacion: Date
}
```

---

## Ejemplo de Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│              FLUJO GENÉRICO DE VENTA CON CARRITO            │
└─────────────────────────────────────────────────────────────┘

1. [Búsqueda] Usuario busca producto
   ↓
2. [API Externa] Obtiene lista de productos
   ↓
3. [GPT] Muestra productos con números
   ↓
4. [Usuario] Selecciona número
   ↓
5. [GPT Selector] Identifica producto seleccionado
   ↓
6. [Carrito - Agregar] 
   Config: {
     action: "agregar",
     itemFields: {
       id: "{{producto.id}}",
       nombre: "{{producto.name}}",
       precio: "{{producto.price}}",
       cantidad: 1
     }
   }
   ↓
7. [Router] ¿Qué hacer?
   - Ver carrito → [Carrito - Ver]
   - Seguir comprando → Volver a búsqueda
   - Checkout → [Mercado Pago]
```

---

## Variables de Output

El nodo `carrito` siempre genera estas variables:

```typescript
{
  carrito_id: string,
  carrito_items_count: number,
  carrito_total: number,
  carrito_estado: string,
  carrito_items: Array,
  mensaje_formateado: string  // Solo si outputFormat.enabled = true
}
```

---

## Adaptabilidad

Este nodo funciona con **cualquier tipo de producto**:

- ✅ Libros (WooCommerce)
- ✅ Comida (Menú de restaurante)
- ✅ Servicios (Reservas)
- ✅ Productos digitales
- ✅ Cualquier API externa

**Clave:** Los campos son configurables mediante `itemFields`, que mapea desde las variables del flujo.

---

## Configuración desde el Frontend

El frontend debe permitir:

1. **Seleccionar acción** (dropdown)
2. **Mapear campos** (inputs con autocompletado de variables)
3. **Configurar formato de salida** (toggle + selector de template)

### UI Sugerida:

```
┌─────────────────────────────────────────┐
│ 🛒 Nodo Carrito                         │
├─────────────────────────────────────────┤
│                                         │
│ Acción: [Agregar ▼]                    │
│                                         │
│ Campos del Item:                        │
│ ├─ ID: [{{producto.id}}]               │
│ ├─ Nombre: [{{producto.name}}]         │
│ ├─ Precio: [{{producto.price}}]        │
│ ├─ Cantidad: [{{cantidad}}]            │
│ └─ Imagen: [{{producto.image}}]        │
│                                         │
│ Metadata Adicional:                     │
│ ├─ sku: [{{producto.sku}}]             │
│ └─ [+ Agregar campo]                    │
│                                         │
│ ✅ Formatear salida para WhatsApp       │
│    Template: [WhatsApp estándar ▼]     │
│                                         │
│ [Guardar]  [Cancelar]                  │
└─────────────────────────────────────────┘
```

---

## Ventajas de este Diseño

1. ✅ **100% configurable desde BD**
2. ✅ **No requiere código personalizado por empresa**
3. ✅ **Funciona con cualquier API externa**
4. ✅ **Campos flexibles mediante metadata**
5. ✅ **Reutilizable en múltiples flujos**
6. ✅ **Fácil de configurar desde el frontend**

---

## Próximos Pasos

1. Implementar `executeCarritoNode()` en FlowExecutor
2. Crear UI en frontend para configurar el nodo
3. Documentar templates de formato de salida
4. Testear con diferentes tipos de productos
