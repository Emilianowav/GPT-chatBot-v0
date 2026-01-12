# Sistema de Carrito y Mercado Pago

## Arquitectura General

```
Usuario → WhatsApp → Búsqueda Productos → Agregar al Carrito → Ver Carrito → Checkout → Mercado Pago
```

## 1. Modelo de Datos

### Colección: `carritos`

```typescript
{
  _id: ObjectId,
  contactoId: ObjectId,           // Referencia al contacto
  empresaId: string,              // ID de la empresa
  items: [
    {
      productoId: number,          // ID del producto en WooCommerce
      nombre: string,
      precio: string,
      cantidad: number,
      imagen: string,
      permalink: string,
      subtotal: number
    }
  ],
  total: number,
  estado: 'activo' | 'pagado' | 'cancelado',
  fechaCreacion: Date,
  fechaActualizacion: Date,
  mercadoPagoLink: string | null,
  mercadoPagoId: string | null
}
```

## 2. Nodos del Flujo

### A. Nodo: `agregar-al-carrito`

**Tipo:** `carrito-action`

**Configuración:**
```json
{
  "type": "carrito-action",
  "config": {
    "action": "agregar",
    "productoId": "{{producto_seleccionado.id}}",
    "nombre": "{{producto_seleccionado.name}}",
    "precio": "{{producto_seleccionado.price}}",
    "cantidad": "{{cantidad}}",
    "imagen": "{{producto_seleccionado.image}}",
    "permalink": "{{producto_seleccionado.permalink}}"
  }
}
```

**Output:**
```json
{
  "success": true,
  "carrito": { /* datos del carrito */ },
  "mensaje": "✅ Producto agregado al carrito"
}
```

---

### B. Nodo: `ver-carrito`

**Tipo:** `carrito-action`

**Configuración:**
```json
{
  "type": "carrito-action",
  "config": {
    "action": "ver"
  }
}
```

**Output:**
```json
{
  "carrito": { /* datos del carrito */ },
  "items_count": 3,
  "total": 125700,
  "mensaje_formateado": "🛒 Tu Carrito:\n\n1. LA SOLEDAD\n   💰 $39.900\n..."
}
```

---

### C. Nodo: `vaciar-carrito`

**Tipo:** `carrito-action`

**Configuración:**
```json
{
  "type": "carrito-action",
  "config": {
    "action": "vaciar"
  }
}
```

---

### D. Nodo: `checkout-mercadopago`

**Tipo:** `mercadopago-checkout`

**Configuración:**
```json
{
  "type": "mercadopago-checkout",
  "config": {
    "accessToken": "{{env.MERCADOPAGO_ACCESS_TOKEN}}",
    "titulo": "Veo Veo Libros",
    "notificationUrl": "https://tu-backend.com/webhooks/mercadopago",
    "backUrls": {
      "success": "https://www.veoveolibros.com.ar/pago-exitoso",
      "failure": "https://www.veoveolibros.com.ar/pago-fallido",
      "pending": "https://www.veoveolibros.com.ar/pago-pendiente"
    }
  }
}
```

**Output:**
```json
{
  "success": true,
  "preferencia_id": "123456789-abc-def",
  "link_pago": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "mensaje": "💳 Link de pago generado:\n\nhttps://mpago.la/..."
}
```

---

## 3. Flujo Completo Sugerido

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO WOOCOMMERCE + CARRITO              │
└─────────────────────────────────────────────────────────────┘

1. [WhatsApp] Usuario: "Hola"
   ↓
2. [GPT] "¿Qué libro buscas?"
   ↓
3. [WhatsApp] Usuario: "La Soledad"
   ↓
4. [GPT Formateador] Extrae: titulo="La Soledad"
   ↓
5. [Router] ¿Tiene título? → SÍ
   ↓
6. [WooCommerce API] Busca productos
   ↓
7. [GPT Resultados] Formatea lista con botones:
   "📚 Resultados:
    1. LA SOLEDAD - $39.900
    2. CIEN AÑOS DE SOLEDAD - $36.000
    
    Responde con el número para agregar al carrito"
   ↓
8. [WhatsApp] Usuario: "1"
   ↓
9. [GPT Selector] Identifica producto seleccionado
   ↓
10. [Agregar al Carrito] Agrega producto
    ↓
11. [GPT] "✅ Agregado al carrito. ¿Deseas:
     1. Ver carrito
     2. Seguir comprando
     3. Finalizar compra"
    ↓
12. [Router Opciones]
    - Si "1" → [Ver Carrito]
    - Si "2" → Volver a búsqueda
    - Si "3" → [Checkout Mercado Pago]
    ↓
13. [Checkout Mercado Pago] Genera link de pago
    ↓
14. [WhatsApp] Envía link: "💳 Paga aquí: https://mpago.la/..."
```

---

## 4. Variables Globales Necesarias

```typescript
{
  // Búsqueda
  titulo: string,
  editorial: string,
  edicion: string,
  
  // Productos
  productos_encontrados: Array,
  producto_seleccionado: Object,
  
  // Carrito
  carrito_id: string,
  carrito_items_count: number,
  carrito_total: number,
  
  // Mercado Pago
  mercadopago_link: string,
  mercadopago_preferencia_id: string,
  
  // Usuario
  contacto_id: string,
  telefono_cliente: string
}
```

---

## 5. Configuración de Mercado Pago

### Variables de Entorno

```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxx
MERCADOPAGO_WEBHOOK_URL=https://tu-backend.com/webhooks/mercadopago
```

### Obtener Credenciales

1. Ir a: https://www.mercadopago.com.ar/developers
2. Crear aplicación
3. Obtener Access Token (Producción o Sandbox)
4. Configurar Webhook URL para notificaciones

---

## 6. Webhook de Mercado Pago

Mercado Pago enviará notificaciones a tu webhook cuando:
- Se aprueba un pago
- Se rechaza un pago
- Se cancela un pago

**Endpoint:** `POST /webhooks/mercadopago`

**Payload:**
```json
{
  "action": "payment.created",
  "data": {
    "id": "123456789"
  }
}
```

**Acciones:**
1. Verificar firma de seguridad
2. Obtener detalles del pago
3. Actualizar estado del carrito
4. Notificar al usuario por WhatsApp

---

## 7. Ejemplo de Implementación en FlowExecutor

```typescript
// En executeNode()
case 'carrito-action':
  return await this.executeCarritoActionNode(node, input);

case 'mercadopago-checkout':
  return await this.executeMercadoPagoCheckoutNode(node, input);
```

---

## 8. Mensajes de WhatsApp Sugeridos

### Producto Agregado
```
✅ *Producto agregado al carrito*

📚 LA SOLEDAD
💰 $39.900
📦 Cantidad: 1

🛒 Tu carrito ahora tiene 1 item(s)
💵 Total: $39.900

¿Qué deseas hacer?
1️⃣ Ver carrito completo
2️⃣ Seguir comprando
3️⃣ Finalizar compra
```

### Ver Carrito
```
🛒 *Tu Carrito:*

1. *LA SOLEDAD*
   💰 $39.900
   📦 Cantidad: 1
   💵 Subtotal: $39.900

2. *CIEN AÑOS DE SOLEDAD*
   💰 $36.000
   📦 Cantidad: 2
   💵 Subtotal: $72.000

━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL: $111.900*

📝 Total de items: 2

¿Qué deseas hacer?
1️⃣ Finalizar compra
2️⃣ Vaciar carrito
3️⃣ Seguir comprando
```

### Link de Pago
```
💳 *¡Listo para pagar!*

Tu pedido:
🛒 2 productos
💰 Total: $111.900

👇 Paga de forma segura con Mercado Pago:
https://mpago.la/2X4Y6Z8

⏰ Este link expira en 24 horas

Una vez que completes el pago, te confirmaremos tu pedido.
```

---

## 9. Próximos Pasos

1. ✅ Crear modelos y servicios (Carrito, MercadoPago)
2. ⏳ Implementar nodos en FlowExecutor
3. ⏳ Crear webhook para notificaciones de MP
4. ⏳ Configurar flujo en MongoDB
5. ⏳ Testear flujo completo
6. ⏳ Implementar UI en frontend para configurar nodos

---

## 10. Consideraciones de Seguridad

- ✅ Validar que el usuario solo pueda acceder a su propio carrito
- ✅ Verificar firma de webhooks de Mercado Pago
- ✅ No exponer Access Token en el frontend
- ✅ Validar precios desde WooCommerce antes de crear preferencia
- ✅ Implementar rate limiting en webhooks
