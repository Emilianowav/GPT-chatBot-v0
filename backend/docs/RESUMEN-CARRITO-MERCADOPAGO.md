# Sistema de Carrito y Mercado Pago - Resumen Ejecutivo

## ✅ Estado de Implementación

### Completado:

1. ✅ **Modelo de Carrito** (`Carrito.ts`)
   - Colección MongoDB con items, total, estado
   - Soporte para metadata flexible

2. ✅ **Servicio de Carrito** (`CarritoService.ts`)
   - Agregar, eliminar, actualizar, vaciar
   - Formateo para WhatsApp
   - Gestión de estado

3. ✅ **Servicio de Mercado Pago** (`MercadoPagoService.ts`)
   - Crear preferencias de pago
   - Verificar estado de pagos
   - Gestión de webhooks

4. ✅ **Nodo Genérico Carrito**
   - 100% configurable desde BD
   - 5 acciones: agregar, ver, eliminar, vaciar, actualizar_cantidad
   - Mapeo flexible de campos

5. ✅ **Nodo Genérico Mercado Pago**
   - 100% configurable desde BD
   - Genera links de pago
   - Integración con carrito

6. ✅ **Integración en FlowExecutor**
   - Casos agregados en switch
   - Funciones importadas desde módulo externo
   - Contexto compartido

7. ✅ **Documentación Completa**
   - Guía de configuración de nodos
   - Ejemplos de uso
   - Especificaciones técnicas

---

## 📋 Pendiente de Implementación

### 1. Webhook Handler para Mercado Pago

**Archivo:** `backend/src/routes/webhooks.ts`

```typescript
import express from 'express';
import { MercadoPagoService } from '../services/MercadoPagoService.js';
import { CarritoService } from '../services/CarritoService.js';
import { enviarMensajeWhatsAppTexto } from '../services/metaService.js';

const router = express.Router();

router.post('/mercadopago', async (req, res) => {
  try {
    // 1. Validar firma de seguridad
    // 2. Obtener detalles del pago
    // 3. Actualizar carrito
    // 4. Notificar al usuario
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error en webhook MP:', error);
    res.status(500).send('Error');
  }
});

export default router;
```

### 2. UI en Frontend

**Componentes necesarios:**

- `CarritoNodeConfig.tsx` - Configuración del nodo carrito
- `MercadoPagoNodeConfig.tsx` - Configuración del nodo MP
- Selector de acciones
- Mapeo de campos con autocompletado
- Preview de mensajes

### 3. Testing

- [ ] Crear flujo de prueba en MongoDB
- [ ] Testear con productos de WooCommerce
- [ ] Probar con tarjetas de prueba de MP
- [ ] Verificar webhooks
- [ ] Validar notificaciones de WhatsApp

---

## 🎯 Flujo de Uso Recomendado

```
┌─────────────────────────────────────────────────────────────┐
│              FLUJO COMPLETO: BÚSQUEDA → PAGO                │
└─────────────────────────────────────────────────────────────┘

1. [WhatsApp Trigger] Usuario: "Hola"
   ↓
2. [GPT Conversacional] "¿Qué libro buscas?"
   ↓
3. [WhatsApp] Usuario: "La Soledad"
   ↓
4. [GPT Formateador] Extrae: titulo="La Soledad"
   ↓
5. [Router] ¿Tiene título? → SÍ
   ↓
6. [WooCommerce API] Busca productos
   ↓
7. [GPT Resultados] Muestra lista numerada
   ↓
8. [WhatsApp] Usuario: "1" (selecciona producto)
   ↓
9. [GPT Selector] Identifica producto_seleccionado
   ↓
10. [Carrito - Agregar]
    Config: {
      action: "agregar",
      itemFields: {
        id: "{{producto_seleccionado.id}}",
        nombre: "{{producto_seleccionado.name}}",
        precio: "{{producto_seleccionado.price}}",
        cantidad: 1,
        imagen: "{{producto_seleccionado.image}}",
        metadata: {
          permalink: "{{producto_seleccionado.permalink}}"
        }
      }
    }
    ↓
11. [GPT] "✅ Agregado. ¿Qué deseas hacer?
     1. Ver carrito
     2. Seguir comprando
     3. Finalizar compra"
    ↓
12. [Router Opciones]
    - "1" → [Carrito - Ver]
    - "2" → Volver a búsqueda
    - "3" → [Mercado Pago]
    ↓
13. [Carrito - Ver]
    Config: {
      action: "ver",
      outputFormat: {
        enabled: true,
        template: "whatsapp"
      }
    }
    ↓
14. [WhatsApp] Muestra carrito formateado
    ↓
15. [Usuario] "Finalizar compra"
    ↓
16. [Mercado Pago]
    Config: {
      accessToken: "{{env.MERCADOPAGO_ACCESS_TOKEN}}",
      titulo: "Veo Veo Libros",
      notificationUrl: "{{env.BACKEND_URL}}/webhooks/mercadopago"
    }
    ↓
17. [WhatsApp] Envía link de pago
    ↓
18. [Usuario] Paga en Mercado Pago
    ↓
19. [Webhook] Recibe notificación
    ↓
20. [Sistema] Actualiza carrito → "pagado"
    ↓
21. [WhatsApp] "✅ Pago confirmado. Pedido #12345"
```

---

## 🔧 Configuración Rápida

### 1. Variables de Entorno

```env
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxx
MERCADOPAGO_WEBHOOK_SECRET=xxxx

# Backend
BACKEND_URL=https://tu-backend.com
```

### 2. Crear Nodos en MongoDB

**Nodo Carrito - Agregar:**
```json
{
  "id": "carrito-agregar",
  "type": "carrito",
  "data": {
    "label": "Agregar al Carrito",
    "config": {
      "action": "agregar",
      "itemFields": {
        "id": "{{producto_seleccionado.id}}",
        "nombre": "{{producto_seleccionado.name}}",
        "precio": "{{producto_seleccionado.price}}",
        "cantidad": 1,
        "imagen": "{{producto_seleccionado.image}}",
        "metadata": {
          "permalink": "{{producto_seleccionado.permalink}}"
        }
      }
    }
  }
}
```

**Nodo Carrito - Ver:**
```json
{
  "id": "carrito-ver",
  "type": "carrito",
  "data": {
    "label": "Ver Carrito",
    "config": {
      "action": "ver",
      "outputFormat": {
        "enabled": true,
        "template": "whatsapp"
      }
    }
  }
}
```

**Nodo Mercado Pago:**
```json
{
  "id": "mercadopago-checkout",
  "type": "mercadopago",
  "data": {
    "label": "Checkout",
    "config": {
      "accessToken": "{{env.MERCADOPAGO_ACCESS_TOKEN}}",
      "titulo": "Veo Veo Libros",
      "notificationUrl": "{{env.BACKEND_URL}}/webhooks/mercadopago"
    }
  }
}
```

---

## 📊 Estructura de Archivos

```
backend/
├── src/
│   ├── models/
│   │   └── Carrito.ts ✅
│   ├── services/
│   │   ├── CarritoService.ts ✅
│   │   ├── MercadoPagoService.ts ✅
│   │   ├── FlowExecutor.ts ✅
│   │   └── FlowExecutor.carrito.ts ✅
│   └── routes/
│       └── webhooks.ts ⏳ (pendiente)
└── docs/
    ├── NODO-CARRITO-GENERICO.md ✅
    ├── NODO-MERCADOPAGO-GENERICO.md ✅
    ├── CARRITO-Y-MERCADOPAGO.md ✅
    └── RESUMEN-CARRITO-MERCADOPAGO.md ✅
```

---

## 🎨 Ventajas del Diseño

1. ✅ **Genérico y Reutilizable**
   - No hay código específico por empresa
   - Funciona con cualquier API de productos
   - Configurable desde BD

2. ✅ **Flexible**
   - Campos personalizables mediante `itemFields`
   - Metadata extensible
   - Templates de formato configurables

3. ✅ **Escalable**
   - Soporte para múltiples carritos simultáneos
   - Estados de carrito (activo, pagado, cancelado)
   - Historial de compras

4. ✅ **Seguro**
   - Validación de webhooks
   - Credenciales en variables de entorno
   - Verificación de pagos

5. ✅ **Fácil de Usar**
   - Configuración visual desde frontend
   - Mensajes pre-formateados
   - Integración automática con flujos

---

## 🚀 Próximos Pasos Inmediatos

1. **Implementar webhook handler** (30 min)
2. **Crear flujo de prueba en MongoDB** (15 min)
3. **Testear con productos reales** (30 min)
4. **Validar con tarjetas de prueba MP** (15 min)
5. **Documentar para frontend** (20 min)

**Total estimado:** ~2 horas

---

## 📞 Testing Rápido

### Script de Prueba:

```bash
# 1. Limpiar estado
node scripts/limpiar-mi-numero.js

# 2. En WhatsApp:
"hola"
"busco la soledad"
"cualquiera"
"1"  # Seleccionar primer producto
"3"  # Finalizar compra

# 3. Verificar:
# - Carrito creado en MongoDB
# - Link de MP generado
# - Mensaje con link enviado
```

---

## 🎯 Resultado Final

El usuario podrá:

1. ✅ Buscar productos
2. ✅ Agregar al carrito
3. ✅ Ver carrito
4. ✅ Modificar cantidades
5. ✅ Generar link de pago
6. ✅ Pagar con Mercado Pago
7. ✅ Recibir confirmación automática

**Todo configurable desde el frontend, sin tocar código.**
