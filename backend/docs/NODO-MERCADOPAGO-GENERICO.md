# Nodo Genérico: Mercado Pago

## Filosofía de Diseño

El nodo `mercadopago` es **100% configurable desde la base de datos** y puede generar links de pago para cualquier tipo de producto o servicio, sin código específico por empresa.

---

## Configuración del Nodo

### Tipo: `mercadopago`

```json
{
  "id": "mercadopago-checkout",
  "type": "mercadopago",
  "data": {
    "label": "Checkout Mercado Pago",
    "config": {
      "accessToken": "{{env.MERCADOPAGO_ACCESS_TOKEN}}",
      "publicKey": "{{env.MERCADOPAGO_PUBLIC_KEY}}",
      
      "titulo": "Compra en {{empresa.nombre}}",
      "descripcion": "Pedido #{{carrito_id}}",
      
      "notificationUrl": "{{env.BACKEND_URL}}/webhooks/mercadopago",
      
      "backUrls": {
        "success": "{{empresa.url}}/pago-exitoso",
        "failure": "{{empresa.url}}/pago-fallido",
        "pending": "{{empresa.url}}/pago-pendiente"
      },
      
      "metadata": {
        "empresa_id": "{{empresa.id}}",
        "contacto_id": "{{contacto_id}}",
        "telefono": "{{telefono_cliente}}"
      }
    }
  }
}
```

---

## Funcionamiento

1. **Obtiene el carrito activo** del contacto
2. **Valida que tenga items**
3. **Crea una preferencia** en Mercado Pago con los items del carrito
4. **Genera link de pago** (válido por 24 horas)
5. **Actualiza el carrito** con el ID de preferencia y link
6. **Devuelve el link** para enviar al usuario

---

## Variables de Entrada

El nodo utiliza estas variables del contexto del flujo:

- `contacto_id` - ID del contacto (automático)
- `telefono_empresa` - Teléfono de la empresa (automático)
- `carrito_id` - ID del carrito activo
- Cualquier otra variable configurada en `metadata`

---

## Variables de Salida

El nodo genera estas variables globales:

```typescript
{
  mercadopago_preferencia_id: string,  // ID de la preferencia creada
  mercadopago_link: string,            // Link de pago para el usuario
  mercadopago_success: boolean         // Si se creó exitosamente
}
```

---

## Output del Nodo

```json
{
  "success": true,
  "preferencia_id": "123456789-abc-def",
  "link_pago": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "mensaje": "💳 *¡Listo para pagar!*\n\nTu pedido:\n🛒 3 productos\n💰 Total: $125.700\n\n👇 Paga de forma segura:\nhttps://mpago.la/..."
}
```

---

## Configuración de Credenciales

### Variables de Entorno

```env
# Producción
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890-123456-abcdef1234567890abcdef1234567890-123456789
MERCADOPAGO_PUBLIC_KEY=APP_USR-abcdef12-3456-7890-abcd-ef1234567890

# Sandbox (Testing)
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-123456-abcdef1234567890abcdef1234567890-123456789
MERCADOPAGO_PUBLIC_KEY=TEST-abcdef12-3456-7890-abcd-ef1234567890

# Backend
BACKEND_URL=https://tu-backend.com
```

### Obtener Credenciales

1. Ir a: https://www.mercadopago.com.ar/developers
2. Crear aplicación
3. Ir a "Credenciales"
4. Copiar Access Token y Public Key
5. Usar credenciales de **Sandbox** para testing
6. Usar credenciales de **Producción** para real

---

## Webhook de Notificaciones

Mercado Pago enviará notificaciones POST a tu `notificationUrl` cuando:

- ✅ Se aprueba un pago
- ❌ Se rechaza un pago
- ⏳ Queda pendiente un pago
- 🔄 Se actualiza el estado

### Endpoint: `POST /webhooks/mercadopago`

**Headers:**
```
x-signature: <firma de seguridad>
x-request-id: <id único>
```

**Body:**
```json
{
  "action": "payment.created",
  "api_version": "v1",
  "data": {
    "id": "123456789"
  },
  "date_created": "2026-01-11T10:00:00Z",
  "id": 987654321,
  "live_mode": true,
  "type": "payment",
  "user_id": "123456789"
}
```

**Acciones a realizar:**

1. Verificar firma de seguridad (x-signature)
2. Obtener detalles del pago con el ID
3. Verificar estado del pago
4. Actualizar carrito en BD
5. Notificar al usuario por WhatsApp
6. Responder 200 OK a Mercado Pago

---

## Ejemplo de Flujo Completo

```
1. Usuario agrega productos al carrito
   ↓
2. Usuario dice "finalizar compra"
   ↓
3. [Nodo Carrito - Ver] Muestra resumen
   ↓
4. [Nodo Mercado Pago] Genera link de pago
   ↓
5. [Nodo WhatsApp] Envía link al usuario
   ↓
6. Usuario paga en Mercado Pago
   ↓
7. [Webhook] Recibe notificación de pago aprobado
   ↓
8. [Sistema] Actualiza carrito como "pagado"
   ↓
9. [WhatsApp] Confirma pago al usuario
```

---

## Mensaje de WhatsApp Sugerido

```
💳 *¡Listo para pagar!*

Tu pedido:
🛒 3 productos
💰 Total: $125.700

👇 Paga de forma segura con Mercado Pago:
https://mpago.la/2X4Y6Z8

⏰ Este link expira en 24 horas

Métodos de pago disponibles:
💳 Tarjetas de crédito/débito
🏦 Transferencia bancaria
💵 Efectivo (Rapipago, Pago Fácil)

Una vez que completes el pago, te confirmaremos tu pedido.
```

---

## Estados de Pago

| Estado | Descripción | Acción |
|--------|-------------|--------|
| `approved` | Pago aprobado | ✅ Confirmar pedido |
| `pending` | Pago pendiente | ⏳ Esperar confirmación |
| `in_process` | En proceso | ⏳ Esperar confirmación |
| `rejected` | Pago rechazado | ❌ Notificar error |
| `cancelled` | Pago cancelado | ❌ Cancelar pedido |
| `refunded` | Pago reembolsado | 💰 Procesar devolución |

---

## Seguridad

### Validación de Webhook

```typescript
import crypto from 'crypto';

function validarFirma(req: Request): boolean {
  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];
  
  // Extraer ts y hash de x-signature
  const parts = xSignature.split(',');
  const ts = parts[0].split('=')[1];
  const hash = parts[1].split('=')[1];
  
  // Construir string para validar
  const manifest = `id:${req.body.data.id};request-id:${xRequestId};ts:${ts};`;
  
  // Calcular HMAC
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(manifest);
  const calculatedHash = hmac.digest('hex');
  
  return calculatedHash === hash;
}
```

---

## Configuración desde el Frontend

### UI Sugerida:

```
┌─────────────────────────────────────────┐
│ 💳 Nodo Mercado Pago                    │
├─────────────────────────────────────────┤
│                                         │
│ Credenciales:                           │
│ ├─ Access Token: [{{env.MP_TOKEN}}]    │
│ └─ Public Key: [{{env.MP_PUBLIC_KEY}}] │
│                                         │
│ Configuración:                          │
│ ├─ Título: [Compra en {{empresa}}]     │
│ ├─ Descripción: [Pedido #{{carrito}}]  │
│ └─ Notification URL: [{{backend}}/...] │
│                                         │
│ URLs de Retorno:                        │
│ ├─ Éxito: [{{empresa}}/pago-exitoso]   │
│ ├─ Error: [{{empresa}}/pago-fallido]   │
│ └─ Pendiente: [{{empresa}}/pendiente]  │
│                                         │
│ Metadata Adicional:                     │
│ ├─ empresa_id: [{{empresa.id}}]        │
│ ├─ contacto_id: [{{contacto_id}}]      │
│ └─ [+ Agregar campo]                    │
│                                         │
│ [Guardar]  [Cancelar]                  │
└─────────────────────────────────────────┘
```

---

## Ventajas de este Diseño

1. ✅ **100% configurable desde BD**
2. ✅ **No requiere código por empresa**
3. ✅ **Funciona con cualquier carrito**
4. ✅ **Credenciales seguras (env vars)**
5. ✅ **Webhook genérico**
6. ✅ **Fácil de configurar desde frontend**

---

## Testing

### Tarjetas de Prueba (Sandbox)

| Tarjeta | Resultado |
|---------|-----------|
| 5031 7557 3453 0604 | ✅ Aprobado |
| 5031 4332 1540 6351 | ❌ Rechazado (fondos insuficientes) |
| 5031 3550 3604 2961 | ❌ Rechazado (otro motivo) |

**CVV:** Cualquier 3 dígitos  
**Vencimiento:** Cualquier fecha futura  
**Nombre:** APRO (aprobado) o OTHE (rechazado)

---

## Próximos Pasos

1. ✅ Implementar webhook handler
2. ✅ Crear UI en frontend
3. ✅ Testear con tarjetas de prueba
4. ✅ Configurar notificaciones de WhatsApp
5. ✅ Pasar a producción
