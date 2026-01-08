# FLUJO CORRECTO - BÚSQUEDA DE PRODUCTOS WOOCOMMERCE

## 📋 DESCRIPCIÓN GENERAL

Este documento describe el flujo correcto para buscar productos en WooCommerce, validando que GPT extraiga correctamente toda la información del cliente antes de proceder.

---

## 🔄 FLUJO COMPLETO

```
1. WhatsApp Business Cloud (Watch Events)
   ↓
2. GPT (Formateador - Extrae JSON del mensaje)
   ↓
3. Router (¿JSON completo?)
   ├─ Ruta 1: JSON INCOMPLETO
   │  ↓
   │  WhatsApp Send (Pedir más información)
   │  ↓
   │  [LOOP: Vuelve al paso 1 para re-procesar]
   │
   └─ Ruta 2: JSON COMPLETO
      ↓
      WooCommerce (Buscar producto)
      ↓
      WhatsApp Send (Responder con/sin producto)
```

---

## ⚙️ CONFIGURACIÓN DE CADA NODO

### **1. WhatsApp Business Cloud (Watch Events)**

**Tipo:** `whatsapp`  
**Módulo:** `watch_events`

**Configuración:**
```json
{
  "tipo": "watch_events",
  "descripcion": "Escucha mensajes entrantes de WhatsApp"
}
```

**Variables de salida:**
- `mensaje_usuario`: Texto del mensaje recibido
- `telefono`: Número del remitente
- `nombre_contacto`: Nombre del contacto

---

### **2. GPT (Formateador - Extrae JSON)**

**Tipo:** `gpt`  
**Módulo:** `formateador`

**Configuración:**
```json
{
  "tipo": "formateador",
  "modelo": "gpt-4",
  "temperatura": 0.3,
  "maxTokens": 500,
  "systemPrompt": "Extrae del mensaje del usuario: nombre del producto, categoría (si la menciona), y precio máximo (si lo menciona). Devuelve SIEMPRE en formato JSON válido.",
  "outputFormat": "json",
  "jsonSchema": {
    "producto": "string (requerido)",
    "categoria": "string (opcional)",
    "precio_max": "number (opcional)"
  },
  "variablesEntrada": ["mensaje_usuario"],
  "variablesSalida": ["json_busqueda"]
}
```

**Ejemplo de salida:**
```json
{
  "producto": "remera nike",
  "categoria": "deportes",
  "precio_max": 5000
}
```

---

### **3. Router (¿JSON completo?)**

**Tipo:** `router`  
**Configuración:**

```json
{
  "routes": [
    {
      "id": "route-incomplete",
      "label": "JSON Incompleto",
      "condition": {
        "type": "json_validation",
        "variable": "json_busqueda",
        "requiredFields": ["producto"],
        "operator": "incomplete"
      }
    },
    {
      "id": "route-complete",
      "label": "JSON Completo",
      "condition": {
        "type": "json_validation",
        "variable": "json_busqueda",
        "requiredFields": ["producto"],
        "operator": "complete"
      }
    }
  ]
}
```

**Lógica de evaluación:**
- **Ruta 1 (Incompleto):** Se activa si `json_busqueda.producto` es `undefined`, `null`, o string vacío
- **Ruta 2 (Completo):** Se activa si `json_busqueda.producto` tiene un valor válido

---

### **4a. WhatsApp Send (Pedir más información) - Ruta 1**

**Tipo:** `whatsapp`  
**Módulo:** `send_message`

**Configuración:**
```json
{
  "tipo": "send_message",
  "mensaje": "Por favor, dime qué producto estás buscando. Ejemplo: 'Busco una remera Nike'",
  "variables": []
}
```

**Conexión:**
- Este nodo se conecta de vuelta al nodo inicial (Watch Events) para crear un loop
- El usuario responde → Se procesa de nuevo con GPT → Router evalúa nuevamente

---

### **4b. WooCommerce (Buscar producto) - Ruta 2**

**Tipo:** `woocommerce`  
**Módulo:** `search_products`

**Configuración:**
```json
{
  "tipo": "search_products",
  "endpoint": "GET /products",
  "parametros": {
    "search": "{{json_busqueda.producto}}",
    "category": "{{json_busqueda.categoria}}",
    "max_price": "{{json_busqueda.precio_max}}",
    "per_page": 5,
    "status": "publish"
  },
  "variablesEntrada": ["json_busqueda"],
  "variablesSalida": ["productos_encontrados"]
}
```

**Ejemplo de salida:**
```json
{
  "productos_encontrados": [
    {
      "id": 123,
      "name": "Remera Nike Dri-FIT",
      "price": "4500",
      "stock_quantity": 10,
      "permalink": "https://tienda.com/remera-nike"
    }
  ]
}
```

---

### **5. WhatsApp Send (Responder con resultado)**

**Tipo:** `whatsapp`  
**Módulo:** `send_message`

**Configuración:**
```json
{
  "tipo": "send_message",
  "mensaje": "{{#if productos_encontrados.length}}\n✅ Encontré estos productos:\n\n{{#each productos_encontrados}}\n📦 {{name}}\n💰 ${{price}}\n🔗 {{permalink}}\n\n{{/each}}\n{{else}}\n❌ No encontré productos que coincidan con \"{{json_busqueda.producto}}\". ¿Quieres buscar algo más?\n{{/if}}",
  "variables": ["productos_encontrados", "json_busqueda"]
}
```

---

## 🔧 IMPLEMENTACIÓN EN EL FRONTEND

### **Paso 1: Actualizar GPTConfigModal**

Agregar soporte para `outputFormat: 'json'` y `jsonSchema`:

```tsx
// En GPTConfigModal.tsx
{config.outputFormat === 'json' && (
  <div className={styles.formGroup}>
    <label>JSON Schema</label>
    <textarea
      value={config.jsonSchema}
      onChange={(e) => setConfig({ ...config, jsonSchema: e.target.value })}
      placeholder='{\n  "campo1": "string",\n  "campo2": "number"\n}'
      rows={8}
    />
    <small>Define la estructura del JSON que GPT debe devolver</small>
  </div>
)}
```

### **Paso 2: Configurar Router con validación JSON**

El router debe evaluar si el JSON tiene los campos requeridos:

```tsx
// Lógica de evaluación en el backend
function evaluateJsonComplete(jsonData: any, requiredFields: string[]): boolean {
  return requiredFields.every(field => {
    const value = jsonData[field];
    return value !== undefined && value !== null && value !== '';
  });
}
```

### **Paso 3: Crear conexión de loop**

El nodo "WhatsApp Send (Pedir más información)" debe conectarse de vuelta al nodo inicial para crear el loop.

---

## ✅ RESULTADO ESPERADO

1. Usuario envía: "Busco una remera"
2. GPT extrae: `{"producto": "remera"}`
3. Router evalúa: JSON completo ✅
4. WooCommerce busca productos con "remera"
5. WhatsApp responde con lista de productos

**Si el usuario envía mensaje ambiguo:**

1. Usuario envía: "Hola"
2. GPT extrae: `{"producto": null}`
3. Router evalúa: JSON incompleto ❌
4. WhatsApp responde: "Por favor, dime qué producto estás buscando"
5. Usuario responde → Vuelve al paso 1

---

## 🎯 PUNTOS CLAVE

- ✅ GPT tipo "formateador" con `outputFormat: 'json'`
- ✅ Router evalúa campos requeridos del JSON
- ✅ Loop de validación hasta obtener información completa
- ✅ WooCommerce solo se ejecuta con JSON válido
- ✅ Respuesta clara al usuario con productos o mensaje de error
