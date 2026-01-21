# CONFIGURACIÓN DETALLADA DE NODOS

## Índice
1. [Nodo GPT](#nodo-gpt)
2. [Nodo Router](#nodo-router)
3. [Nodo WhatsApp](#nodo-whatsapp)
4. [Nodo WooCommerce](#nodo-woocommerce)
5. [Nodo MercadoPago](#nodo-mercadopago)
6. [Nodo Webhook](#nodo-webhook)

---

## Nodo GPT

### Tipos de GPT

#### 1. GPT Conversacional
**Uso:** Mantiene historial de conversación, responde al usuario.

```typescript
{
  id: "gpt-asistente",
  type: "gpt",
  data: {
    label: "GPT Asistente de Ventas",
    config: {
      tipo: "conversacional",
      modelo: "gpt-4",
      systemPrompt: `Sos un asistente de ventas de la Librería Veo Veo 📚.

TU TAREA:
- Presentar resultados de búsqueda de forma atractiva
- Ayudar al cliente a elegir productos
- Ser amigable y usar emojis

IMPORTANTE:
- Usá la información que tenés en tu contexto directamente
- NO uses variables como {{variable}}, usá el texto directamente`,
      
      topicos: []  // Tópicos locales (opcional)
    }
  }
}
```

**Input esperado:**
```json
{
  "mensaje_usuario": "busco harry potter",
  "productos": [...]  // Si viene de WooCommerce
}
```

**Output:**
```json
{
  "respuesta_gpt": "Perfecto😊, encontré estos libros:\n\n📚 Harry Potter y la Piedra Filosofal\n💰 Precio: $2000\n📦 Stock: 10\n\n¿Te interesa?"
}
```

#### 2. GPT Formateador (Extractor de Datos)
**Uso:** Extraer datos estructurados del mensaje del usuario.

```typescript
{
  id: "gpt-extractor",
  type: "gpt",
  data: {
    label: "GPT Extractor de Datos",
    config: {
      tipo: "formateador",
      modelo: "gpt-4",
      extractionConfig: {
        enabled: true,
        method: "advanced",
        contextSource: "mensaje_actual",
        systemPrompt: "Extrae los siguientes datos del mensaje del usuario",
        variables: [
          {
            nombre: "nombre_completo",
            tipo: "string",
            requerido: true,
            descripcion: "Nombre y apellido del cliente"
          },
          {
            nombre: "telefono",
            tipo: "string",
            requerido: true,
            descripcion: "Número de teléfono"
          },
          {
            nombre: "direccion",
            tipo: "string",
            requerido: false,
            descripcion: "Dirección de envío"
          }
        ]
      }
    }
  }
}
```

**Input esperado:**
```json
{
  "mensaje_usuario": "Mi nombre es Juan Pérez, mi teléfono es 3794123456"
}
```

**Output:**
```json
{
  "datos_extraidos": {
    "nombre_completo": "Juan Pérez",
    "telefono": "3794123456",
    "direccion": null
  },
  "datos_completos": false,
  "campos_faltantes": ["direccion"]
}
```

#### 3. GPT Transform
**Uso:** Transformar datos sin mantener historial.

```typescript
{
  id: "gpt-transform",
  type: "gpt",
  data: {
    label: "GPT Transform",
    config: {
      tipo: "transform",
      modelo: "gpt-4",
      systemPrompt: "Convierte el array de productos en un mensaje de WhatsApp formateado"
    }
  }
}
```

### Inyección Automática de Tópicos

Si `flow.config.topicos_habilitados = true`, **TODOS** los nodos GPT reciben automáticamente los tópicos globales en su systemPrompt:

```
SYSTEM PROMPT ORIGINAL
+
═══ INFORMACIÓN DE LA EMPRESA ═══

**EMPRESA:**
  • nombre: Librería Veo Veo
  • ubicacion: San Juan 1037, Corrientes Capital

**HORARIOS:**
  • lunes_viernes: 8:30-12:00 y 17:00-21:00

**POLITICA ENVIOS:**
  • descripcion: Envíos a todo el país. Costo según destino.
```

**Código en FlowExecutor:**
```typescript
// FlowExecutor.ts - executeGPTNode()
if (this.flow?.config?.topicos_habilitados && this.topicos) {
  let topicosSection = '\n\n═══ INFORMACIÓN DE LA EMPRESA ═══\n';
  
  Object.entries(this.topicos).forEach(([key, value]) => {
    if (typeof value === 'object') {
      topicosSection += `\n**${key.toUpperCase()}:**\n`;
      Object.entries(value).forEach(([subKey, subValue]) => {
        topicosSection += `  • ${subKey}: ${subValue}\n`;
      });
    }
  });
  
  systemPrompt += topicosSection;
}
```

---

## Nodo Router

### Propósito
Dirigir el flujo a diferentes caminos según condiciones.

### Estructura Completa

```typescript
{
  id: "router-principal",
  type: "router",
  data: {
    label: "Router Principal",
    config: {},
    handles: [
      {
        id: "route-busqueda",
        label: "Búsqueda",
        condition: "{{gpt-clasificador.intencion}} == 'busqueda'"
      },
      {
        id: "route-carrito",
        label: "Carrito",
        condition: "{{gpt-clasificador.intencion}} == 'carrito'"
      },
      {
        id: "route-consulta",
        label: "Consulta",
        condition: "{{gpt-clasificador.intencion}} == 'consulta'"
      },
      {
        id: "route-default",
        label: "Otro",
        condition: "true"  // Ruta por defecto
      }
    ]
  }
}
```

### Conexiones desde Router

**CRÍTICO:** Cada handle debe tener una conexión con `sourceHandle` igual al `id` del handle.

```json
[
  {
    "id": "edge-router-busqueda",
    "source": "router-principal",
    "sourceHandle": "route-busqueda",
    "target": "woocommerce-search",
    "type": "default"
  },
  {
    "id": "edge-router-carrito",
    "source": "router-principal",
    "sourceHandle": "route-carrito",
    "target": "gpt-armar-carrito",
    "type": "default"
  }
]
```

### Tipos de Condiciones Soportadas

#### 1. Comparación Simple
```typescript
"{{variable}} == 'valor'"
"{{variable}} != 'valor'"
"{{numero}} > 5"
"{{numero}} < 10"
"{{numero}} >= 5"
"{{numero}} <= 10"
```

#### 2. Verificar Existencia
```typescript
"{{variable}}"  // true si existe y no está vacío
"!{{variable}}" // true si no existe o está vacío
```

#### 3. Verificar Array
```typescript
"{{productos.length}} > 0"
"{{productos.length}} == 0"
```

#### 4. Condición por Defecto
```typescript
"true"  // Siempre se ejecuta (usar como fallback)
```

### Evaluación de Condiciones en FlowExecutor

```typescript
// FlowExecutor.ts - evaluateCondition()
private evaluateCondition(condition: string): boolean {
  // 1. Resolver variables
  const resolved = this.resolveVariableInString(condition);
  
  // 2. Evaluar operadores
  if (resolved.includes('==')) {
    const [left, right] = resolved.split('==').map(s => s.trim());
    return left === right.replace(/['"]/g, '');
  }
  
  if (resolved.includes('>')) {
    const [left, right] = resolved.split('>').map(s => s.trim());
    return parseFloat(left) > parseFloat(right);
  }
  
  // 3. Booleano directo
  return resolved === 'true' || (resolved !== 'false' && resolved !== '');
}
```

### Ejemplo Completo: Router con 3 Rutas

```typescript
// Nodo Router
{
  id: "router-carrito",
  type: "router",
  data: {
    label: "Router Carrito",
    handles: [
      {
        id: "route-pagar",
        label: "Pagar",
        condition: "{{gpt-armar-carrito.accion}} == 'pagar'"
      },
      {
        id: "route-modificar",
        label: "Modificar",
        condition: "{{gpt-armar-carrito.accion}} == 'modificar'"
      },
      {
        id: "route-cancelar",
        label: "Cancelar",
        condition: "{{gpt-armar-carrito.accion}} == 'cancelar'"
      }
    ]
  }
}

// Conexiones
[
  {
    "source": "router-carrito",
    "sourceHandle": "route-pagar",
    "target": "mercadopago-crear-preference"
  },
  {
    "source": "router-carrito",
    "sourceHandle": "route-modificar",
    "target": "woocommerce-search"
  },
  {
    "source": "router-carrito",
    "sourceHandle": "route-cancelar",
    "target": "whatsapp-cancelacion"
  }
]
```

---

## Nodo WhatsApp

### Propósito
Enviar mensajes de WhatsApp al usuario.

### Configuración

```typescript
{
  id: "whatsapp-respuesta",
  type: "whatsapp",
  data: {
    label: "WhatsApp Respuesta",
    config: {
      telefono: "{{telefono}}",
      mensaje: "{{gpt-asistente.respuesta_gpt}}"
    }
  }
}
```

### Campos de Configuración

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `telefono` | string | Número de teléfono destino | `"{{telefono}}"` |
| `mensaje` | string | Texto del mensaje | `"{{gpt.respuesta}}"` |
| `to` | string | (Legacy) Alias de `telefono` | `"{{telefono}}"` |

### Resolución de Mensaje

El FlowExecutor busca el mensaje en este orden:

1. `config.mensaje`
2. `config.message`
3. `input.message`
4. `input.mensaje`

```typescript
// FlowExecutor.ts - resolveWhatsAppMessage()
private resolveWhatsAppMessage(config: any, input: any): string {
  const configMessage = config.mensaje || config.message;
  if (configMessage) {
    return this.resolveVariableInString(configMessage);
  }
  
  const inputMessage = input.message || input.mensaje;
  if (inputMessage) {
    return this.resolveVariableInString(String(inputMessage));
  }
  
  return '';
}
```

### Ejemplos de Uso

#### 1. Mensaje Simple
```typescript
{
  config: {
    telefono: "{{telefono}}",
    mensaje: "¡Gracias por tu compra! Tu pedido está confirmado."
  }
}
```

#### 2. Mensaje con Variables
```typescript
{
  config: {
    telefono: "{{telefono}}",
    mensaje: "Hola {{nombre_contacto}}, encontré {{productos.length}} resultados para tu búsqueda."
  }
}
```

#### 3. Mensaje desde GPT
```typescript
{
  config: {
    telefono: "{{telefono}}",
    mensaje: "{{gpt-asistente.respuesta_gpt}}"
  }
}
```

---

## Nodo WooCommerce

### Propósito
Buscar productos en WooCommerce.

### Configuración

```typescript
{
  id: "woocommerce-search",
  type: "woocommerce",
  data: {
    label: "WooCommerce",
    config: {
      action: "search",
      searchTerm: "{{mensaje_usuario}}",
      maxResults: 10,
      fieldMappings: [
        { source: "name", target: "titulo" },
        { source: "price", target: "precio" },
        { source: "stock_quantity", target: "stock" }
      ]
    }
  }
}
```

### Campos de Configuración

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `action` | string | Acción a ejecutar | `"search"` |
| `searchTerm` | string | Término de búsqueda | `"{{mensaje_usuario}}"` |
| `maxResults` | number | Máximo de resultados | `10` |
| `fieldMappings` | array | Mapeo de campos | Ver abajo |

### Field Mappings

Permite simplificar los productos para GPT, reduciendo tokens:

```typescript
fieldMappings: [
  { source: "name", target: "titulo" },
  { source: "price", target: "precio" },
  { source: "stock_quantity", target: "stock" },
  { source: "permalink", target: "url" }
]
```

**Producto original de WooCommerce:**
```json
{
  "id": 123,
  "name": "Harry Potter y la Piedra Filosofal",
  "price": "2000",
  "regular_price": "2200",
  "sale_price": "2000",
  "stock_status": "instock",
  "stock_quantity": 10,
  "permalink": "https://...",
  "images": [...],
  "categories": [...],
  // ... muchos más campos
}
```

**Producto simplificado con fieldMappings:**
```json
{
  "titulo": "Harry Potter y la Piedra Filosofal",
  "precio": "2000",
  "stock": 10,
  "url": "https://..."
}
```

### Output

```json
{
  "productos": [
    {
      "titulo": "Harry Potter y la Piedra Filosofal",
      "precio": "2000",
      "stock": 10
    },
    {
      "titulo": "Harry Potter y la Cámara Secreta",
      "precio": "2200",
      "stock": 8
    }
  ]
}
```

---

## Nodo MercadoPago

### Propósito
Crear preferencia de pago en MercadoPago.

### Configuración

```typescript
{
  id: "mercadopago-crear-preference",
  type: "mercadopago",
  data: {
    label: "MercadoPago",
    config: {
      items: "{{carrito.items}}",
      total: "{{carrito.total}}",
      title: "Compra en {{topicos.empresa.nombre}}",
      description: "Pedido de {{nombre_contacto}}"
    }
  }
}
```

### Campos de Configuración

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `items` | array | Items del carrito | `"{{carrito.items}}"` |
| `total` | number | Total a pagar | `"{{carrito.total}}"` |
| `title` | string | Título de la compra | `"Compra en Librería"` |
| `description` | string | Descripción | `"Pedido de Juan"` |

### Input Esperado

```json
{
  "carrito": {
    "items": [
      {
        "id": 123,
        "title": "Harry Potter",
        "quantity": 2,
        "unit_price": 2000
      }
    ],
    "total": 4000
  }
}
```

### Output

```json
{
  "preference_id": "182716364-d527e92b-a70b-4ed1-86b1-2e77990a1bb3",
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/..."
}
```

---

## Nodo Webhook

### Propósito
Punto de entrada del flujo (trigger) o recepción de notificaciones.

### Tipos de Webhook

#### 1. Webhook de WhatsApp (Trigger)
```typescript
{
  id: "webhook-whatsapp",
  type: "webhook",
  category: "trigger",
  data: {
    label: "WhatsApp Business Cloud API",
    config: {
      webhookType: "whatsapp"
    }
  }
}
```

**Output:**
```json
{
  "telefono": "5493794946066",
  "mensaje_usuario": "Hola",
  "nombre_contacto": "Emiliano",
  "timestamp": "2026-01-17T02:00:00Z"
}
```

#### 2. Webhook de Notificación de Pago
```typescript
{
  id: "webhook-notificacion-pago",
  type: "webhook",
  category: "trigger",
  data: {
    label: "Webhook Notificación Pago",
    config: {
      webhookType: "mercadopago"
    }
  }
}
```

**Output:**
```json
{
  "payment_id": "123456",
  "status": "approved",
  "preference_id": "182716364-xxx",
  "external_reference": "pedido-123"
}
```

---

Continúa en: `03-SISTEMA-VARIABLES-TOPICOS.md`
