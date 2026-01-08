# ANÁLISIS COMPLETO DEL FLUJO WOOCOMMERCE

## 🔄 FLUJO PASO A PASO

### **PASO 1: WhatsApp Watch Events (Trigger)**
**Tipo:** Trigger/Webhook
**Color:** #25D366 (Verde)

**INPUT:**
- Webhook de Meta/WhatsApp
- Evento: mensaje entrante

**VARIABLES RECIBIDAS:**
```json
{
  "telefono": "5493794946066",
  "mensaje_usuario": "busco zapatillas nike",
  "nombre_contacto": "Juan Pérez",
  "timestamp": "2026-01-08T10:30:00Z",
  "message_id": "wamid.xxx"
}
```

**OUTPUT:**
```json
{
  "telefono": "5493794946066",
  "mensaje_usuario": "busco zapatillas nike",
  "nombre_contacto": "Juan Pérez"
}
```

**VARIABLES ACUMULADAS EN EL FLUJO:**
- `telefono`
- `mensaje_usuario`
- `nombre_contacto`

---

### **PASO 2: GPT Formateador**
**Tipo:** Procesador/Transformer
**Color:** #10a37f (Turquesa)

**INPUT ESPERADO:**
- `mensaje_usuario` (string)

**CONFIGURACIÓN:**
```json
{
  "tipo": "formateador",
  "modelo": "gpt-4",
  "temperatura": 0.3,
  "maxTokens": 200,
  "systemPrompt": "Extrae el término de búsqueda del mensaje del usuario...",
  "outputFormat": "json",
  "jsonSchema": "{\"search\": \"\"}",
  "variablesEntrada": ["mensaje_usuario"],
  "variablesSalida": ["search"]
}
```

**PROCESAMIENTO:**
1. Recibe: `mensaje_usuario = "busco zapatillas nike"`
2. Envía a GPT-4 con prompt de formateo
3. GPT-4 analiza y extrae término de búsqueda

**OUTPUT:**
```json
{
  "search": "zapatillas nike"
}
```

**VARIABLES ACUMULADAS EN EL FLUJO:**
- `telefono`
- `mensaje_usuario`
- `nombre_contacto`
- `search` ← NUEVA

---

### **PASO 3: Router (Validar Búsqueda)**
**Tipo:** Condicional/Router
**Color:** #f59e0b (Naranja)

**INPUT ESPERADO:**
- `search` (string)

**CONFIGURACIÓN:**
```json
{
  "conditions": [
    {
      "label": "Búsqueda válida",
      "condition": "search != \"\"",
      "outputHandle": "route-1",
      "nextNode": "woocommerce-search"
    },
    {
      "label": "Sin búsqueda",
      "condition": "search == \"\"",
      "outputHandle": "route-2",
      "nextNode": "whatsapp-sin-busqueda"
    }
  ]
}
```

**EVALUACIÓN:**
- Si `search = "zapatillas nike"` → `search != ""` → **RUTA 1** ✅
- Si `search = ""` → `search == ""` → **RUTA 2**

**OUTPUT (RUTA 1):**
- Todas las variables pasan a WooCommerce
- No agrega nuevas variables

**VARIABLES ACUMULADAS EN EL FLUJO:**
- `telefono`
- `mensaje_usuario`
- `nombre_contacto`
- `search`

---

### **PASO 4: WooCommerce Search Product**
**Tipo:** API Call
**Color:** #96588a (Morado)

**INPUT ESPERADO:**
- `search` (string)

**CONFIGURACIÓN:**
```json
{
  "module": "woo_search",
  "apiConfigId": "woocommerce-main",
  "endpointId": "search-products",
  "parametros": {
    "search": "{{search}}"
  },
  "responseConfig": {
    "arrayPath": "products",
    "idField": "id",
    "displayField": "name",
    "priceField": "price",
    "stockField": "stock_quantity"
  },
  "mensajeSinResultados": "No encontramos productos..."
}
```

**LLAMADA API:**
```http
GET https://tienda.com/wp-json/wc/v3/products?search=zapatillas+nike
Authorization: Basic base64(consumer_key:consumer_secret)
```

**RESPUESTA API:**
```json
{
  "products": [
    {
      "id": 123,
      "name": "Zapatillas Nike Air Max",
      "price": "15999",
      "stock_quantity": 5,
      "image": "https://..."
    },
    {
      "id": 124,
      "name": "Zapatillas Nike Revolution",
      "price": "8999",
      "stock_quantity": 12
    }
  ]
}
```

**OUTPUT:**
```json
{
  "products": [...],
  "total_productos": 2
}
```

**VARIABLES ACUMULADAS EN EL FLUJO:**
- `telefono`
- `mensaje_usuario`
- `nombre_contacto`
- `search`
- `products` ← NUEVA (array)
- `total_productos` ← NUEVA

---

### **PASO 5: WhatsApp Send (Resultados)**
**Tipo:** Action/Response
**Color:** #25D366 (Verde)

**INPUT ESPERADO:**
- `telefono` (string)
- `products` (array)

**CONFIGURACIÓN:**
```json
{
  "module": "send-message",
  "mensaje": "🛒 *Productos encontrados:*\n\n{{#each products}}\n{{add @index 1}}. *{{this.name}}*\n   💰 Precio: ${{this.price}}\n   📦 Stock: {{this.stock_quantity}} unidades\n   \n{{/each}}\n\n¿Te interesa alguno? Escribí el número del producto."
}
```

**PROCESAMIENTO:**
1. Renderiza template Handlebars con `products`
2. Genera mensaje formateado

**MENSAJE ENVIADO:**
```
🛒 *Productos encontrados:*

1. *Zapatillas Nike Air Max*
   💰 Precio: $15999
   📦 Stock: 5 unidades
   
2. *Zapatillas Nike Revolution*
   💰 Precio: $8999
   📦 Stock: 12 unidades
   
¿Te interesa alguno? Escribí el número del producto.
```

**OUTPUT:**
```json
{
  "message_sent": true,
  "message_id": "wamid.yyy"
}
```

**VARIABLES FINALES DEL FLUJO:**
- `telefono`
- `mensaje_usuario`
- `nombre_contacto`
- `search`
- `products`
- `total_productos`
- `message_sent`
- `message_id`

---

## 🎯 INFORMACIÓN QUE DEBE MOSTRARSE EN EL FRONT

### **1. EN CADA NODO:**

#### **Sección: INPUT**
- Variables que espera recibir
- Tipo de dato de cada variable
- Si es requerida u opcional

#### **Sección: CONFIGURACIÓN**
- Parámetros configurables
- Valores actuales
- Validaciones

#### **Sección: OUTPUT**
- Variables que genera/envía
- Tipo de dato de cada variable
- Descripción de cada variable

### **2. EN CADA EDGE (LÍNEA DE CONEXIÓN):**

#### **Para edges normales:**
- Mostrar qué variables pasan de un nodo a otro

#### **Para edges del Router:**
- Mostrar la condición/filtro
- Botón "Configurar filtro"
- Label de la ruta (ej: "Búsqueda válida")

### **3. PANEL LATERAL: VARIABLES DEL FLUJO**
- Lista de todas las variables acumuladas hasta el momento
- Valor actual (si está en ejecución)
- En qué paso se generó cada variable

---

## 🛠️ COMPONENTES A IMPLEMENTAR

### **1. EdgeConfigModal**
Modal para configurar filtros/condicionales en edges del Router

### **2. NodeConfigPanel (mejorado)**
Panel lateral que muestra:
- Input esperado
- Configuración actual
- Output generado

### **3. FlowVariablesPanel**
Panel que muestra todas las variables acumuladas en el flujo

### **4. EdgeLabel**
Componente que muestra la condición en edges del Router
