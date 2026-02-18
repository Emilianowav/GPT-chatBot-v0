# 🔍 ANÁLISIS DEL PROBLEMA: FLUJO DE COMPRA/VENTA INTERCAPITAL

## 📊 Estado Actual del Flujo

### Flujo Detectado en los Logs:
```
Usuario: "Holaa quiero comprar dos de ypfd"
   ↓
GPT Procesador (node-1768863064253)
   → Extrae: topico=COMPRA, symbol=YPFD, cantidad=2
   ↓
Router (node-1768863084705)
   → Detecta: NO existe precio_actual
   → Condición: (topico == COMPRA OR topico == VENTA) AND symbol exists AND cantidad exists AND NOT precio_actual exists
   ↓
HTTP Cotización (node-1768851290437)
   ❌ ERROR 502: "Request failed with status code 502"
   ↓
GPT Venta (node-1770855549271) ← ⚠️ PROBLEMA AQUÍ
   → Intenta leer: node-1770855471259.data (HTTP Venta)
   → ❌ Nodo HTTP Venta NO está en el contexto
   → ❌ Variables undefined
```

---

## 🐛 PROBLEMAS IDENTIFICADOS

### **Problema 1: Cotización falla con error 502**
**Nodo:** `node-1768851290437` (Obtener Cotización)

**Configuración actual:**
```json
{
  "url": "http://app1.intercapital.ar/api/market/cotizacion/{{symbol}}",
  "method": "GET",
  "headers": {},
  "timeout": 30000
}
```

**Error:**
```
"status": 500,
"statusText": "Internal Server Error",
"fullResponse": {
  "success": false,
  "error": "Request failed with status code 502"
}
```

**Causa probable:**
- La API de cotización está caída o no responde
- El endpoint `/api/market/cotizacion/YPFD` devuelve 502 Bad Gateway
- Falta autenticación (no tiene headers de API key)

---

### **Problema 2: Flujo incorrecto después de cotización**
**Flujo actual:**
```
Cotización (falla) → GPT Venta
```

**Flujo esperado para COMPRA:**
```
Cotización → HTTP Compra → GPT Compra → WhatsApp
```

**Flujo esperado para VENTA:**
```
Cotización → HTTP Venta → GPT Venta → WhatsApp
```

**Causa:**
El edge desde Cotización va **siempre** a GPT Venta, sin importar si era COMPRA o VENTA.

**Edge actual:**
```javascript
{
  source: "node-1768851290437", // Cotización
  target: "node-1770855549271", // GPT Venta
  condition: "Sin condición"
}
```

---

### **Problema 3: GPT Venta tiene systemPrompt incorrecto**
**Nodo:** `node-1770855549271` (GPT Venta)

**SystemPrompt actual:**
```
"Eres un asistente virtual amable y profesional. Tu objetivo es ayudar al cliente respondiendo sus preguntas y recopilando información necesaria."
```

**SystemPrompt que intenta usar (según logs):**
```
Eres el asistente virtual de Intercapital. Tu función es informar al cliente sobre el resultado de su orden de venta.

DATOS DEL CLIENTE:
- Nombre: Facundo Esquivel
- Comitente: 00000000000000000000

ORDEN SOLICITADA:
- Activo: YPFD
- Cantidad: 2 acciones
- Precio: ${{precio_actual}}

RESPUESTA DE LA API:
Accede a la respuesta del HTTP de venta usando: {{node-1770855471259.data}}

INSTRUCCIONES CRÍTICAS:
1. **PRIMERO verifica si hubo error:**
   - Si {{node-1770855471259.data.success}} es false
   - O si {{node-1770855471259.data.error}} existe
   ...
```

**Problema:**
- El systemPrompt en la BD es genérico
- El systemPrompt que aparece en los logs es diferente (probablemente hardcodeado en el código)
- Intenta acceder a `node-1770855471259` (HTTP Venta) que NO está en el contexto porque nunca se ejecutó

---

## 🎯 SOLUCIONES PROPUESTAS

### **Solución 1: Arreglar el endpoint de cotización**

**Opción A: Verificar si la API funciona**
```bash
curl -X GET "http://app1.intercapital.ar/api/market/cotizacion/YPFD" \
  -H "x-api-key: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a"
```

**Opción B: Agregar headers de autenticación al nodo de cotización**
Si la API requiere autenticación, agregar:
```json
{
  "headers": {
    "x-api-key": "2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a"
  }
}
```

---

### **Solución 2: Corregir el flujo después de cotización**

**Problema:** Cotización → GPT Venta (siempre)

**Solución:** Necesitamos que después de cotización vaya a:
- HTTP Compra (si topico = COMPRA)
- HTTP Venta (si topico = VENTA)

**Opciones:**

#### **Opción A: Agregar un Router después de Cotización**
```
Cotización → Router Tipo Operación
   ├─ (topico == COMPRA) → HTTP Compra → GPT Compra → WhatsApp
   └─ (topico == VENTA) → HTTP Venta → GPT Venta → WhatsApp
```

#### **Opción B: Crear 2 nodos de cotización separados**
```
Router Principal
   ├─ (COMPRA sin precio) → Cotización Compra → HTTP Compra → GPT Compra
   └─ (VENTA sin precio) → Cotización Venta → HTTP Venta → GPT Venta
```

---

### **Solución 3: Corregir el systemPrompt del GPT Venta**

**Problema:** El GPT intenta leer `node-1770855471259.data` pero ese nodo no está en el contexto.

**Causa:** El GPT Venta se ejecuta **antes** del HTTP Venta, no después.

**Solución:** El systemPrompt debe leer el nodo **anterior** en el flujo, que es Cotización:

```javascript
systemPrompt: `Eres el asistente virtual de Intercapital.

El usuario quiere realizar una {{topico_identificado}} de {{cantidad}} acciones de {{symbol}}.

COTIZACIÓN OBTENIDA:
- Activo: {{nombre_activo}}
- Precio actual: ${{precio_actual}}
- Variación: {{variacion}}%

Informa al usuario el precio actual y pregúntale si desea confirmar la operación.

Ejemplo:
"📊 Cotización de {{nombre_activo}}

💰 Precio actual: ${{precio_actual}}
📈 Variación del día: {{variacion}}%

¿Querés confirmar la {{topico_identificado}} de {{cantidad}} acciones al precio actual de mercado?

Respondé SI para confirmar o NO para cancelar."
`
```

---

## 🔧 FLUJO CORRECTO PROPUESTO

### **Escenario 1: Primera vez (sin precio)**
```
1. Usuario: "Quiero comprar 2 de YPFD"
2. GPT Procesador → extrae: topico=COMPRA, symbol=YPFD, cantidad=2
3. Router → detecta: NO existe precio_actual
4. Cotización → GET /api/market/cotizacion/YPFD
   → Guarda: precio_actual, nombre_activo, variacion, etc.
5. Router Tipo Operación → detecta: topico=COMPRA
6. HTTP Compra → POST /api/chatbot/ordenes (con precio_actual)
7. GPT Compra → lee respuesta del HTTP Compra
8. WhatsApp → envía mensaje final
```

### **Escenario 2: Segunda vez (con precio guardado)**
```
1. Usuario: "Confirmo"
2. GPT Procesador → extrae: topico=COMPRA, symbol=YPFD, cantidad=2
3. Router → detecta: SÍ existe precio_actual
4. HTTP Compra → POST /api/chatbot/ordenes (con precio_actual guardado)
5. GPT Compra → lee respuesta del HTTP Compra
6. WhatsApp → envía mensaje final
```

---

## 📝 RESUMEN EJECUTIVO

### Problemas encontrados:
1. ❌ API de cotización falla con error 502
2. ❌ Flujo va de Cotización → GPT Venta (siempre), debería ir a HTTP Compra/Venta según topico
3. ❌ GPT Venta intenta leer HTTP Venta que no está en el contexto

### Soluciones necesarias:
1. ✅ Verificar/arreglar endpoint de cotización
2. ✅ Agregar Router después de Cotización para distinguir COMPRA/VENTA
3. ✅ Corregir systemPrompt del GPT para leer datos de Cotización, no de HTTP Venta

### Prioridad:
1. **URGENTE:** Arreglar endpoint de cotización (sin esto nada funciona)
2. **ALTA:** Corregir flujo después de cotización
3. **MEDIA:** Actualizar systemPrompt del GPT
