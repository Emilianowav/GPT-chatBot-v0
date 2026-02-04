# FLUJO COMPLETO DEL CARRITO - FULL STACK

## 📋 RESUMEN EJECUTIVO

Este documento mapea TODO el flujo del carrito desde que el usuario dice "quiero 2" hasta que paga y se marca como completado.

---

## 🔄 FLUJO PASO A PASO

### 1️⃣ USUARIO BUSCA PRODUCTOS

**Usuario:** "Lecturas a la carta 1"

**Backend:**
```
whatsappController.ts → FlowExecutor.execute()
  ↓
Nodo: gpt-clasificador-inteligente
  → Output: tipo_accion = "buscar_producto"
  ↓
Nodo: router-principal
  → Evalúa: tipo_accion == "buscar_producto" → TRUE
  → Ruta: "🔍 Buscar Producto"
  ↓
Nodo: gpt-formateador
  → Extrae: contenido = "Lecturas a la carta 1"
  ↓
Nodo: router (validación)
  → Evalúa: contenido != '' → TRUE
  → Ruta: "✅ Datos Completos"
  ↓
Nodo: woocommerce
  → Busca productos en WooCommerce
  → Devuelve: productos_formateados (lista de productos)
  ↓
Nodo: whatsapp-mostrar-productos
  → Envía mensaje con productos encontrados
```

**MongoDB:**
- ✅ `globalVariables.productos_formateados` guardado en `contacto_empresas.workflowState`

---

### 2️⃣ USUARIO AGREGA AL CARRITO

**Usuario:** "Quiero 2"

**Backend:**
```
whatsappController.ts → FlowExecutor.execute()
  ↓
Nodo: gpt-clasificador-inteligente
  → Output: tipo_accion = "comprar"
  ↓
Nodo: router-principal
  → Evalúa: tipo_accion == "comprar" → TRUE
  → Ruta: "🛒 Comprar"
  ↓
Nodo: gpt-armar-carrito
  → Contexto: historial + productos_formateados
  → Extrae:
    - carrito_items = [{id, nombre, precio, cantidad}]
    - carrito_total = 58000
    - confirmacion_compra = false
    - mensaje_carrito = "📦 LECTURAS A LA CARTA 1 - $29000 x 2 = $58000"
  
  🛒 PERSISTENCIA EN MONGODB (FlowExecutor.ts línea 998-1069):
    1. Parsear carrito_items (si es string JSON)
    2. Llamar a CarritoService.vaciarCarrito()
       → Busca carrito activo (estado: 'activo')
       → Limpia items y total
    3. Para cada item en carrito_items:
       → CarritoService.agregarProducto()
       → Agrega producto al carrito activo
       → Recalcula subtotal
    4. Obtener carrito actualizado de BD
    5. Actualizar carrito_total con valor REAL de BD
  ↓
Nodo: router-carrito
  → Evalúa: confirmacion_compra == true → FALSE
  → Ruta: "whatsapp-confirmacion-pago"
  ↓
Nodo: whatsapp-confirmacion-pago
  → Envía mensaje: "🛒 Tu carrito: ... ¿Confirmás la compra?"
```

**MongoDB:**
- ✅ Carrito creado/actualizado en colección `carritos`:
  ```json
  {
    "_id": "...",
    "contactoId": "...",
    "empresaId": "Veo Veo",
    "estado": "activo",
    "items": [
      {
        "productoId": "123",
        "nombre": "LECTURAS A LA CARTA 1",
        "precio": "29000",
        "cantidad": 2,
        "subtotal": 58000
      }
    ],
    "total": 58000,
    "telefono": "5493794946066",
    "fechaCreacion": "2026-02-04T12:00:00Z"
  }
  ```
- ✅ Variables globales guardadas en `contacto_empresas.workflowState.globalVariables`:
  - `carrito_items`
  - `carrito_total`
  - `confirmacion_compra`
  - `mensaje_carrito`

---

### 3️⃣ USUARIO CONFIRMA COMPRA

**Usuario:** "Sí"

**Backend:**
```
whatsappController.ts → FlowExecutor.execute()
  ↓
Nodo: gpt-clasificador-inteligente
  → Output: tipo_accion = "comprar"
  ↓
Nodo: router-principal
  → Evalúa: tipo_accion == "comprar" → TRUE
  → Ruta: "🛒 Comprar"
  ↓
Nodo: gpt-armar-carrito
  → Contexto: historial (incluye carrito anterior)
  → Extrae:
    - carrito_items = (mismo del historial)
    - carrito_total = (mismo del historial)
    - confirmacion_compra = TRUE ← CLAVE
    - mensaje_carrito = (mismo del historial)
  
  🛒 PERSISTENCIA EN MONGODB:
    → Carrito YA existe en BD (del paso anterior)
    → Se vuelve a limpiar y agregar productos
    → Total se recalcula desde BD
  ↓
Nodo: router-carrito
  → Evalúa: confirmacion_compra == true → TRUE ✅
  → Ruta: "mercadopago-crear-preference"
  ↓
Nodo: mercadopago-crear-preference
  → Busca carrito activo en BD
  → Crea preference en MercadoPago con items del carrito
  → Genera link de pago
  → Output: {
      link_pago: "https://mpago.la/...",
      mensaje: "💳 Link de pago: ..."
    }
  ↓
Nodo: whatsapp-link-pago
  → Envía link de pago al usuario
```

**MongoDB:**
- ✅ Carrito sigue en estado `activo` (aún no pagado)
- ✅ Variables globales actualizadas con `confirmacion_compra = true`

---

### 4️⃣ USUARIO PAGA

**Usuario:** Hace clic en el link y paga en MercadoPago

**Backend:**
```
MercadoPago → Webhook POST /api/modules/mercadopago/webhooks
  ↓
webhooksRoutes.ts → processPaymentNotification()
  → Verifica payment.status == "approved"
  → Busca carrito por mercadoPagoId
  → Marca carrito como 'completado'
  → Guarda items del carrito en Payment
  → Envía mensaje de confirmación al usuario
```

**MongoDB:**
- ✅ Carrito actualizado:
  ```json
  {
    "estado": "completado",  ← Cambió de 'activo' a 'completado'
    "fechaCompletado": "2026-02-04T12:30:00Z",
    "items": [...],  ← Mantiene los items para historial
    "total": 58000
  }
  ```
- ✅ Payment creado en colección `payments`:
  ```json
  {
    "mercadoPagoId": "...",
    "status": "approved",
    "items": [...],  ← Items del carrito guardados
    "total": 58000
  }
  ```

---

### 5️⃣ PRÓXIMA COMPRA

**Usuario:** "Hola, quiero otro libro"

**Backend:**
```
Nodo: gpt-armar-carrito
  → Extrae: carrito_items = [nuevo producto]
  
  🛒 PERSISTENCIA EN MONGODB:
    1. CarritoService.vaciarCarrito()
       → obtenerCarritoActivo() busca carrito con estado: 'activo'
       → NO encuentra (el anterior está 'completado')
       → Crea carrito NUEVO con estado: 'activo' ✅
    2. CarritoService.agregarProducto()
       → Agrega productos al carrito NUEVO
```

**MongoDB:**
- ✅ Carrito viejo sigue en estado `completado` (NO se toca)
- ✅ Carrito nuevo creado con estado `activo`

---

## 🔍 PUNTOS CRÍTICOS VERIFICADOS

### ✅ 1. Persistencia del Carrito
**Ubicación:** `FlowExecutor.ts` líneas 998-1069

**Qué hace:**
- Después de que GPT extrae `carrito_items`
- Llama a `CarritoService.vaciarCarrito()` y `CarritoService.agregarProducto()`
- Persiste el carrito en MongoDB
- Recalcula el total desde la BD

**Por qué es correcto:**
- Solo afecta carritos con estado `activo`
- Los carritos pagados/completados NO se tocan
- El total siempre es el REAL de la BD

---

### ✅ 2. Confirmación de Compra
**Ubicación:** `router-carrito` en MongoDB

**Qué hace:**
- Evalúa `confirmacion_compra == true`
- Si TRUE → `mercadopago-crear-preference`
- Si FALSE → `whatsapp-confirmacion-pago`

**Por qué es correcto:**
- El GPT extrae `confirmacion_compra` del mensaje del usuario
- Cuando dice "sí", marca como `true`
- El router tiene handles diferentes (b y c) para cada ruta

---

### ✅ 3. Generación de Link de MercadoPago
**Ubicación:** `FlowExecutor.carrito.ts` → `executeMercadoPagoNode()`

**Qué hace:**
- Busca carrito activo en BD
- Crea preference en MercadoPago con items del carrito
- Genera link de pago
- Guarda mercadoPagoId en el carrito

**Por qué es correcto:**
- Usa el carrito REAL de la BD (no variables globales)
- El total es el correcto
- Los items son los correctos

---

### ✅ 4. Webhook de Pago
**Ubicación:** `webhooksRoutes.ts` → `processPaymentNotification()`

**Qué hace:**
- Recibe notificación de MercadoPago
- Marca carrito como `completado`
- Guarda items en Payment
- Envía confirmación al usuario

**Por qué es correcto:**
- Marca como `completado`, no como `activo`
- NO limpia los items (mantiene historial)
- La próxima compra creará un carrito nuevo

---

## 🚨 REGLAS CRÍTICAS RESPETADAS

1. ✅ **Carritos pagados NO se tocan**
   - Todas las operaciones usan `obtenerCarritoActivo()`
   - Solo busca carritos con `estado: 'activo'`

2. ✅ **Carritos activos se pueden modificar**
   - `vaciarCarrito()` solo afecta carritos activos
   - `agregarProducto()` solo modifica carritos activos

3. ✅ **Total siempre es el REAL de la BD**
   - Después de agregar productos, se recalcula desde BD
   - `carrito_total` se actualiza con el valor real

4. ✅ **Historial de compras se mantiene**
   - Carritos completados mantienen sus items
   - Payments guardan los items del carrito

---

## 📊 COLECCIONES MONGODB

### `contacto_empresas`
```json
{
  "telefono": "5493794946066",
  "empresaId": "Veo Veo",
  "workflowState": {
    "globalVariables": {
      "carrito_items": "[...]",
      "carrito_total": 58000,
      "confirmacion_compra": true,
      "mensaje_carrito": "..."
    }
  }
}
```

### `carritos`
```json
{
  "contactoId": "...",
  "empresaId": "Veo Veo",
  "estado": "activo" | "completado",
  "items": [...],
  "total": 58000,
  "telefono": "5493794946066",
  "mercadoPagoId": "...",
  "fechaCreacion": "...",
  "fechaCompletado": "..."
}
```

### `payments`
```json
{
  "mercadoPagoId": "...",
  "status": "approved",
  "items": [...],
  "total": 58000,
  "contactoId": "...",
  "empresaId": "Veo Veo"
}
```

---

## ✅ CONCLUSIÓN

El flujo del carrito está **100% correcto** y maneja la lógica full stack:

1. **Frontend (WhatsApp):** Usuario envía mensajes
2. **Backend (FlowExecutor):** Procesa mensajes, extrae variables, ejecuta nodos
3. **Persistencia (MongoDB):** Guarda carritos, variables globales, payments
4. **Integración (MercadoPago):** Genera links de pago, recibe webhooks

**Todas las reglas se respetan:**
- Carritos pagados NO se tocan ✅
- Carritos activos se pueden modificar ✅
- Total siempre es el REAL de la BD ✅
- Historial se mantiene ✅
